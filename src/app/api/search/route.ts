import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { generateEmbedding, formatVector } from '@/lib/embeddings';

const searchSchema = z.object({
  query: z.string().min(2),
  brand: z.string().optional().nullable(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  inStockOnly: z.boolean().optional().default(false),
  mode: z.enum(['vector', 'fulltext', 'hybrid']).optional().default('vector'),
  limit: z.number().int().min(1).max(50).optional().default(12),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { query: searchQuery, brand, minPrice, maxPrice, inStockOnly, mode, limit } = parsed.data;

    // 1. Generate 384-dimensional query embedding
    const queryVector = await generateEmbedding(searchQuery);
    const formattedVec = formatVector(queryVector);

    // Filter clauses for products
    const filterClauses: string[] = [];
    const filterParams: any[] = [];
    let pIdx = 2; // $1 is formattedVec

    if (brand) {
      filterClauses.push(`b.brand_name = $${pIdx++}`);
      filterParams.push(brand);
    }
    if (minPrice) {
      filterClauses.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.wholesale_price >= $${pIdx++})`);
      filterParams.push(minPrice);
    }
    if (maxPrice) {
      filterClauses.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.wholesale_price <= $${pIdx++})`);
      filterParams.push(maxPrice);
    }
    if (inStockOnly) {
      // Q9 EXISTS Correlated subquery
      filterClauses.push(`EXISTS (
        SELECT 1 FROM sku s
        JOIN inventory inv ON s.sku_id = inv.sku_id
        WHERE s.product_id = p.product_id AND inv.quantity_on_hand > 0
      )`);
    }

    const additionalWhere = filterClauses.length > 0 ? `AND ${filterClauses.join(' AND ')}` : '';

    // Q12 Vector similarity query using pgvector HNSW cosine distance (<=>)
    // Retrieves nearest spec and review chunks, joined to product and inventory, grouped by product
    const vectorSql = `
      WITH spec_matches AS (
        SELECT 
          se.spec_id,
          (se.metadata->>'product_id')::INT AS product_id,
          se.chunk_category,
          se.chunk_text,
          -- Cosine similarity: 1 - cosine distance
          (1 - (se.embedding <=> $1::vector)) AS similarity_score
        FROM spec_embedding se
        ORDER BY se.embedding <=> $1::vector ASC
        LIMIT 40
      ),
      review_matches AS (
        SELECT 
          r.product_id,
          re.region,
          re.chunk_text,
          (1 - (re.embedding <=> $1::vector)) AS similarity_score
        FROM review_embedding re
        JOIN review r ON re.review_id = r.review_id
        ORDER BY re.embedding <=> $1::vector ASC
        LIMIT 40
      ),
      combined_matches AS (
        SELECT product_id, 'spec' AS source_type, chunk_category AS category, chunk_text, similarity_score FROM spec_matches
        UNION ALL
        SELECT product_id, 'review' AS source_type, region AS category, chunk_text, similarity_score FROM review_matches
      ),
      ranked_per_product AS (
        SELECT 
          cm.*,
          ROW_NUMBER() OVER (PARTITION BY cm.product_id ORDER BY cm.similarity_score DESC) AS match_rank
        FROM combined_matches cm
      )
      SELECT 
        p.product_id,
        p.model_name,
        p.release_year,
        p.base_description,
        b.brand_name,
        b.country_of_origin,
        COALESCE(MIN(s.wholesale_price), 0) AS min_price,
        COALESCE(MAX(s.wholesale_price), 0) AS max_price,
        COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS total_stock,
        COALESCE(AVG(rev.rating), 0)::NUMERIC(3, 1) AS avg_rating,
        -- Best matching snippet and score
        rm.chunk_text AS best_matching_snippet,
        rm.source_type AS match_source,
        rm.category AS match_category,
        ROUND(rm.similarity_score::numeric, 4) AS best_similarity_score
      FROM ranked_per_product rm
      JOIN product p ON rm.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      LEFT JOIN sku s ON p.product_id = s.product_id AND s.is_active = TRUE
      LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
      LEFT JOIN review rev ON p.product_id = rev.product_id
      WHERE rm.match_rank = 1 ${additionalWhere}
      GROUP BY 
        p.product_id, p.model_name, p.release_year, p.base_description, 
        b.brand_name, b.country_of_origin, rm.chunk_text, rm.source_type, rm.category, rm.similarity_score
      ORDER BY rm.similarity_score DESC
      LIMIT ${limit};
    `;

    const vectorResults = await query(vectorSql, [formattedVec, ...filterParams]);

    // Q11 Full-text search (tsvector + GIN index) for side-by-side comparison (PRD Section 8 & Demo step 4)
    let fulltextResults: any[] = [];
    if (mode === 'hybrid' || mode === 'fulltext') {
      const ftsSql = `
        SELECT 
          p.product_id,
          p.model_name,
          b.brand_name,
          ts_rank_cd(to_tsvector('english', ss.spec_text), plainto_tsquery('english', $1)) AS rank_score,
          ts_headline('english', ss.spec_text, plainto_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35') AS snippet
        FROM spec_sheet ss
        JOIN product p ON ss.product_id = p.product_id
        JOIN brand b ON p.brand_id = b.brand_id
        WHERE to_tsvector('english', ss.spec_text) @@ plainto_tsquery('english', $1)
        ORDER BY rank_score DESC
        LIMIT 6;
      `;
      try {
        const ftsRes = await query(ftsSql, [searchQuery]);
        fulltextResults = ftsRes.rows;
      } catch (ftsErr) {
        console.warn('FTS query notice:', ftsErr);
      }
    }

    return NextResponse.json({
      success: true,
      query: searchQuery,
      mode,
      resultsCount: vectorResults.rows.length,
      products: vectorResults.rows,
      fulltextComparison: fulltextResults,
    });

  } catch (err: any) {
    console.error('Search error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
