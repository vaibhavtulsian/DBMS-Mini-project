import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/inventory - View stock by warehouse, by SKU, or aggregated via v_stock_summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'summary' or 'grid'
    const warehouseId = searchParams.get('warehouseId');
    const skuId = searchParams.get('skuId');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    if (view === 'summary') {
      let sql = 'SELECT * FROM v_stock_summary';
      if (lowStockOnly) {
        sql += ' WHERE is_low_stock_overall = TRUE';
      }
      sql += ' ORDER BY model_name, storage_gb, color';
      const res = await query(sql);
      return NextResponse.json({ success: true, stockSummary: res.rows });
    }

    // Default: Granular warehouse-level inventory grid
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (warehouseId) {
      conditions.push(`inv.warehouse_id = $${pIdx++}`);
      params.push(parseInt(warehouseId, 10));
    }
    if (skuId) {
      conditions.push(`inv.sku_id = $${pIdx++}`);
      params.push(parseInt(skuId, 10));
    }
    if (lowStockOnly) {
      conditions.push(`inv.quantity_on_hand <= inv.reorder_threshold`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        inv.warehouse_id,
        inv.sku_id,
        inv.quantity_on_hand,
        inv.reorder_threshold,
        inv.last_restocked_at,
        inv.updated_at,
        w.warehouse_name,
        w.city,
        w.region,
        s.sku_code,
        s.wholesale_price,
        s.ram_gb,
        s.storage_gb,
        s.color,
        p.product_id,
        p.model_name,
        b.brand_name,
        (inv.quantity_on_hand <= inv.reorder_threshold) AS is_low_stock
      FROM inventory inv
      JOIN warehouse w ON inv.warehouse_id = w.warehouse_id
      JOIN sku s ON inv.sku_id = s.sku_id
      JOIN product p ON s.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      ${where}
      ORDER BY w.warehouse_id ASC, p.model_name ASC, s.sku_id ASC;
    `;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, inventory: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
