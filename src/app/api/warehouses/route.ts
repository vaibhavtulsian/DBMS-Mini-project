import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(`
      SELECT w.*,
             COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS current_stock_total,
             COUNT(DISTINCT inv.sku_id) AS distinct_skus_count
      FROM warehouse w
      LEFT JOIN inventory inv ON w.warehouse_id = inv.warehouse_id
      GROUP BY w.warehouse_id
      ORDER BY w.warehouse_id ASC
    `);
    return NextResponse.json({ success: true, warehouses: res.rows });
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

    const { warehouse_name, city, region, capacity } = await request.json();
    if (!warehouse_name || !city || !region || !capacity) {
      return NextResponse.json({ error: 'All warehouse fields are required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO warehouse (warehouse_name, city, region, capacity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [warehouse_name, city, region, capacity]
    );

    const newWarehouse = res.rows[0];

    // Seed empty inventory records for existing SKUs
    const skus = await query('SELECT sku_id FROM sku');
    for (const s of skus.rows) {
      await query(
        `INSERT INTO inventory (warehouse_id, sku_id, quantity_on_hand, reorder_threshold)
         VALUES ($1, $2, 0, 15) ON CONFLICT DO NOTHING`,
        [newWarehouse.warehouse_id, s.sku_id]
      );
    }

    return NextResponse.json({ success: true, warehouse: newWarehouse }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
