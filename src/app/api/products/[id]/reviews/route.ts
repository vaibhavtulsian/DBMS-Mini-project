import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10);
    const res = await query(
      `SELECT r.*, ret.business_name, ret.city, ret.region
       FROM review r
       JOIN retailer ret ON r.retailer_id = ret.retailer_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    return NextResponse.json({ success: true, reviews: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
