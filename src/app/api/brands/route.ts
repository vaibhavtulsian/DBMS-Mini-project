import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(`
      SELECT b.*, COUNT(p.product_id) AS product_count
      FROM brand b
      LEFT JOIN product p ON b.brand_id = p.brand_id
      GROUP BY b.brand_id
      ORDER BY b.brand_name ASC
    `);
    return NextResponse.json({ success: true, brands: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const { brand_name, country_of_origin } = await request.json();
    if (!brand_name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO brand (brand_name, country_of_origin)
       VALUES ($1, $2) RETURNING *`,
      [brand_name, country_of_origin || null]
    );

    return NextResponse.json({ success: true, brand: res.rows[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
