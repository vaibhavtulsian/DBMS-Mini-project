import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/alerts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where = '';
    const params: any[] = [];
    if (status) {
      where = 'WHERE a.status = $1';
      params.push(status);
    }

    // Join with warehouse, sku, product, and brand
    const sql = `
      SELECT 
        a.alert_id,
        a.warehouse_id,
        a.sku_id,
        a.threshold_value,
        a.current_quantity,
        a.status,
        a.created_at,
        a.resolved_at,
        w.warehouse_name,
        w.city,
        w.region,
        s.sku_code,
        s.wholesale_price,
        s.ram_gb,
        s.storage_gb,
        s.color,
        p.model_name,
        b.brand_name
      FROM low_stock_alert a
      JOIN warehouse w ON a.warehouse_id = w.warehouse_id
      JOIN sku s ON a.sku_id = s.sku_id
      JOIN product p ON s.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      ${where}
      ORDER BY 
        CASE WHEN a.status = 'OPEN' THEN 1 WHEN a.status = 'ACKNOWLEDGED' THEN 2 ELSE 3 END,
        a.created_at DESC;
    `;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, alerts: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
