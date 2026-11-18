import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/reports/financial - PRD FR-R1 (Uses v_monthly_financials SQL view)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    // 1. Month-by-month aggregated financial view
    const monthlySql = `
      SELECT 
        financial_month,
        COUNT(DISTINCT retailer_id) AS active_retailers_count,
        SUM(total_orders)::INT AS total_orders_count,
        SUM(total_order_value)::NUMERIC(14, 2) AS total_sales_volume,
        SUM(total_collected)::NUMERIC(14, 2) AS total_collections,
        SUM(net_pending_period)::NUMERIC(14, 2) AS net_pending
      FROM v_monthly_financials
      GROUP BY financial_month
      ORDER BY financial_month ASC;
    `;
    const monthlyRes = await query(monthlySql);

    // 2. High-level KPI summary cards
    const kpiSql = `
      SELECT 
        COALESCE(SUM(total_amount), 0)::NUMERIC(14, 2) AS lifetime_sales,
        COUNT(DISTINCT order_id)::INT AS total_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM payment)::NUMERIC(14, 2) AS lifetime_collections,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM retailer)::NUMERIC(14, 2) AS total_outstanding_debt,
        (SELECT COUNT(*) FROM low_stock_alert WHERE status = 'OPEN')::INT AS open_alerts_count
      FROM orders
      WHERE status != 'CANCELLED';
    `;
    const kpiRes = await query(kpiSql);

    return NextResponse.json({
      success: true,
      kpis: kpiRes.rows[0],
      monthlyData: monthlyRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
