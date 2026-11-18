import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const skuCreateSchema = z.object({
  product_id: z.number().int().positive(),
  sku_code: z.string().min(3),
  ram_gb: z.number().int().positive(),
  storage_gb: z.number().int().positive(),
  color: z.string().min(2),
  wholesale_price: z.number().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const params: any[] = [];
    let where = '';
    if (productId) {
      where = 'WHERE s.product_id = $1';
      params.push(parseInt(productId, 10));
    }

    const sql = `
      SELECT s.*, p.model_name, b.brand_name,
             COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS total_stock
      FROM sku s
      JOIN product p ON s.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
      ${where}
      GROUP BY s.sku_id, p.model_name, b.brand_name
      ORDER BY s.sku_id DESC;
    `;
    const res = await query(sql, params);
    return NextResponse.json({ success: true, skus: res.rows });
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

    const body = await request.json();
    const parsed = skuCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { product_id, sku_code, ram_gb, storage_gb, color, wholesale_price } = parsed.data;

    const res = await query(
      `INSERT INTO sku (product_id, sku_code, ram_gb, storage_gb, color, wholesale_price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [product_id, sku_code, ram_gb, storage_gb, color, wholesale_price]
    );

    const newSku = res.rows[0];

    // Initialize inventory record with 0 in all warehouses
    const warehouses = await query('SELECT warehouse_id FROM warehouse');
    for (const w of warehouses.rows) {
      await query(
        `INSERT INTO inventory (warehouse_id, sku_id, quantity_on_hand, reorder_threshold)
         VALUES ($1, $2, 0, 15) ON CONFLICT DO NOTHING`,
        [w.warehouse_id, newSku.sku_id]
      );
    }

    return NextResponse.json({ success: true, sku: newSku }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/skus?id=X - Q3 DELETE with FK restrictions
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skuId = searchParams.get('id');
    if (!skuId) return NextResponse.json({ error: 'Missing sku id' }, { status: 400 });

    // Check if this SKU is in any order item
    const checkRes = await query('SELECT 1 FROM order_item WHERE sku_id = $1 LIMIT 1', [skuId]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete SKU: It has associated orders. Foreign key restriction active.'
      }, { status: 409 });
    }

    // Delete inventory entries first then SKU
    await query('DELETE FROM inventory WHERE sku_id = $1', [skuId]);
    await query('DELETE FROM sku WHERE sku_id = $1', [skuId]);

    return NextResponse.json({ success: true, message: 'SKU deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
