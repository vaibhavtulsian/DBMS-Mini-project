import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/reports/regional-demand - Q5 (SUM, COUNT, AVG, GROUP BY)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const sql = `
      SELECT 
        r.region,
        COUNT(DISTINCT r.retailer_id) AS total_retailers,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0)::NUMERIC(14, 2) AS total_order_volume,
        COALESCE(AVG(o.total_amount), 0)::NUMERIC(10, 2) AS avg_order_value,
        COALESCE(SUM(r.outstanding_balance), 0)::NUMERIC(14, 2) AS regional_debt
      FROM retailer r
      LEFT JOIN orders o ON r.retailer_id = o.retailer_id AND o.status != 'CANCELLED'
      GROUP BY r.region
      ORDER BY total_order_volume DESC;
    `;

    const res = await query(sql);
    return NextResponse.json({ success: true, regionalDemand: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
