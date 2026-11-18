import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateEmbedding, formatVector } from '@/lib/embeddings';

const reviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(5),
});

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'RETAILER' || !user.retailerId) {
      return NextResponse.json({ error: 'Forbidden: Only authenticated retailers can submit reviews' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { product_id, rating, review_text } = parsed.data;

    // FR-V1: Verify that the retailer has actually ordered this product in past
    const orderCheck = await query(
      `SELECT 1
       FROM orders o
       JOIN order_item oi ON o.order_id = oi.order_id
       JOIN sku s ON oi.sku_id = s.sku_id
       WHERE o.retailer_id = $1 AND s.product_id = $2 AND o.status != 'CANCELLED'
       LIMIT 1`,
      [user.retailerId, product_id]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({
        error: 'Eligibility error: You can only review products that you have previously ordered.',
      }, { status: 400 });
    }

    // Insert Review (enforced by UNIQUE constraint uk_review_retailer_product)
    let reviewId: number;
    try {
      const insertRes = await query(
        `INSERT INTO review (retailer_id, product_id, rating, review_text)
         VALUES ($1, $2, $3, $4)
         RETURNING review_id`,
        [user.retailerId, product_id, rating, review_text]
      );
      reviewId = insertRes.rows[0].review_id;
    } catch (dbErr: any) {
      if (dbErr.code === '23505' || dbErr.message.includes('uk_review_retailer_product')) {
        return NextResponse.json({ error: 'You have already reviewed this product. Only one review per retailer is permitted.' }, { status: 409 });
      }
      throw dbErr;
    }

    // FR-V2: Saving a review generates and stores its embedding in review_embedding
    const retInfo = await query('SELECT region FROM retailer WHERE retailer_id = $1', [user.retailerId]);
    const region = retInfo.rows[0]?.region || 'Unknown';

    const prodInfo = await query('SELECT model_name FROM product WHERE product_id = $1', [product_id]);
    const modelName = prodInfo.rows[0]?.model_name || '';

    const fullReviewText = `${modelName} Review [${region} Region]: ${review_text}`;
    const embedding = await generateEmbedding(fullReviewText);

    await query(
      `INSERT INTO review_embedding (review_id, chunk_text, embedding, region)
       VALUES ($1, $2, $3::vector, $4)
       ON CONFLICT (review_id) DO UPDATE SET
          chunk_text = EXCLUDED.chunk_text,
          embedding = EXCLUDED.embedding,
          region = EXCLUDED.region`,
      [reviewId, fullReviewText, formatVector(embedding), region]
    );

    return NextResponse.json({
      success: true,
      message: 'Review submitted and vectorized into pgvector intelligence database',
      reviewId,
    }, { status: 201 });

  } catch (err: any) {
    console.error('Review submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
