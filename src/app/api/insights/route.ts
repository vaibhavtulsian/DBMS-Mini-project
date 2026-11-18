import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateEmbedding, formatVector } from '@/lib/embeddings';

// GET /api/insights?theme=xyz - Demand Intelligence for Distributors (FR-S5)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme') || 'thermal management and gaming performance';

    // Generate query embedding
    const themeVector = await generateEmbedding(theme);
    const formattedVec = formatVector(themeVector);

    // 1. Top matching products for this theme with stock and order velocity
    const productsSql = `
      WITH theme_spec_matches AS (
        SELECT 
          (se.metadata->>'product_id')::INT AS product_id,
          se.chunk_category,
          se.chunk_text,
          (1 - (se.embedding <=> $1::vector)) AS similarity
        FROM spec_embedding se
        ORDER BY se.embedding <=> $1::vector ASC
        LIMIT 25
      ),
      ranked_prods AS (
        SELECT 
          product_id,
          MAX(similarity) AS max_similarity,
          MIN(chunk_text) AS spec_highlight
        FROM theme_spec_matches
        GROUP BY product_id
      )
      SELECT 
        p.product_id,
        p.model_name,
        b.brand_name,
        ROUND(rp.max_similarity::numeric, 4) AS theme_relevance_score,
        rp.spec_highlight,
        COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS current_network_stock,
        COALESCE(recent_orders.units_sold_90d, 0)::INT AS order_velocity_90d,
        COALESCE(recent_orders.revenue_90d, 0)::NUMERIC(12, 2) AS revenue_90d
      FROM ranked_prods rp
      JOIN product p ON rp.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      LEFT JOIN sku s ON p.product_id = s.product_id
      LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
      LEFT JOIN (
        SELECT 
          s2.product_id,
          SUM(oi.quantity) AS units_sold_90d,
          SUM(oi.line_total) AS revenue_90d
        FROM order_item oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN sku s2 ON oi.sku_id = s2.sku_id
        WHERE o.order_date >= CURRENT_TIMESTAMP - INTERVAL '90 days' AND o.status != 'CANCELLED'
        GROUP BY s2.product_id
      ) recent_orders ON p.product_id = recent_orders.product_id
      GROUP BY p.product_id, p.model_name, b.brand_name, rp.max_similarity, rp.spec_highlight, recent_orders.units_sold_90d, recent_orders.revenue_90d
      ORDER BY rp.max_similarity DESC
      LIMIT 8;
    `;

    const topProductsRes = await query(productsSql, [formattedVec]);

    // 2. Regional sentiment & review matches for this theme
    const regionalReviewsSql = `
      SELECT 
        re.region,
        p.model_name,
        b.brand_name,
        r.rating,
        r.review_text,
        ROUND((1 - (re.embedding <=> $1::vector))::numeric, 4) AS similarity_score
      FROM review_embedding re
      JOIN review r ON re.review_id = r.review_id
      JOIN product p ON r.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      WHERE re.region IS NOT NULL
      ORDER BY re.embedding <=> $1::vector ASC
      LIMIT 12;
    `;

    const regionalReviewsRes = await query(regionalReviewsSql, [formattedVec]);

    // 3. Regional demand summary (Aggregates demand and stock per region)
    const regionalAggSql = `
      SELECT 
        w.region,
        COUNT(DISTINCT w.warehouse_id) AS warehouse_count,
        COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS total_regional_stock,
        COALESCE(SUM(CASE WHEN inv.quantity_on_hand <= inv.reorder_threshold THEN 1 ELSE 0 END), 0)::INT AS low_stock_alerts_count,
        COALESCE(recent_reg_sales.order_count_90d, 0)::INT AS regional_orders_90d,
        COALESCE(recent_reg_sales.total_volume_90d, 0)::NUMERIC(12, 2) AS regional_revenue_90d
      FROM warehouse w
      LEFT JOIN inventory inv ON w.warehouse_id = inv.warehouse_id
      LEFT JOIN (
        SELECT 
          r.region,
          COUNT(DISTINCT o.order_id) AS order_count_90d,
          SUM(o.total_amount) AS total_volume_90d
        FROM orders o
        JOIN retailer r ON o.retailer_id = r.retailer_id
        WHERE o.order_date >= CURRENT_TIMESTAMP - INTERVAL '90 days' AND o.status != 'CANCELLED'
        GROUP BY r.region
      ) recent_reg_sales ON w.region = recent_reg_sales.region
      GROUP BY w.region, recent_reg_sales.order_count_90d, recent_reg_sales.total_volume_90d
      ORDER BY regional_revenue_90d DESC;
    `;

    const regionalAggRes = await query(regionalAggSql);

    return NextResponse.json({
      success: true,
      theme,
      topProducts: topProductsRes.rows,
      regionalReviews: regionalReviewsRes.rows,
      regionalAggregates: regionalAggRes.rows,
    });
  } catch (err: any) {
    console.error('Insights error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
