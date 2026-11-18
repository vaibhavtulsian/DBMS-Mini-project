import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/reports/overdue - PRD FR-R3 & Q6 (HAVING clause group filtering)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    // SQL query with HAVING clause: Retailers whose debt >= 80% of their credit limit
    const sql = `
      SELECT 
        r.retailer_id,
        r.business_name,
        r.contact_person,
        r.phone,
        r.city,
        r.region,
        r.credit_limit,
        r.outstanding_balance,
        ROUND((r.outstanding_balance / NULLIF(r.credit_limit, 0) * 100), 1) AS credit_utilization_pct,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_purchases
      FROM retailer r
      LEFT JOIN orders o ON r.retailer_id = o.retailer_id AND o.status != 'CANCELLED'
      GROUP BY r.retailer_id, r.business_name, r.contact_person, r.phone, r.city, r.region, r.credit_limit, r.outstanding_balance
      HAVING r.outstanding_balance >= (0.80 * r.credit_limit) AND r.outstanding_balance > 0
      ORDER BY credit_utilization_pct DESC, r.outstanding_balance DESC;
    `;

    const res = await query(sql);
    return NextResponse.json({ success: true, overdueRetailers: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
