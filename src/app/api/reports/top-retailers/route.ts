import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/reports/top-retailers - PRD FR-R2 & Q7 (ORDER BY and LIMIT, GROUP BY, aggregates)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    // 1. Top 10 Retailers by order volume & revenue (Q7)
    const topRetailersSql = `
      SELECT 
        r.retailer_id,
        r.business_name,
        r.city,
        r.region,
        r.credit_limit,
        r.outstanding_balance,
        COUNT(o.order_id) AS total_orders_placed,
        COALESCE(SUM(o.total_amount), 0)::NUMERIC(14, 2) AS total_order_value,
        COALESCE(AVG(o.total_amount), 0)::NUMERIC(10, 2) AS avg_order_ticket
      FROM retailer r
      JOIN orders o ON r.retailer_id = o.retailer_id AND o.status != 'CANCELLED'
      GROUP BY r.retailer_id, r.business_name, r.city, r.region, r.credit_limit, r.outstanding_balance
      ORDER BY total_order_value DESC
      LIMIT 10;
    `;
    const topRetailersRes = await query(topRetailersSql);

    // 2. Best-selling SKUs across the network (Q7)
    const bestSellingSkusSql = `
      SELECT 
        s.sku_id,
        s.sku_code,
        s.wholesale_price,
        s.ram_gb,
        s.storage_gb,
        s.color,
        p.model_name,
        b.brand_name,
        COUNT(DISTINCT oi.order_id) AS order_occurrences,
        SUM(oi.quantity)::INT AS total_units_sold,
        SUM(oi.line_total)::NUMERIC(14, 2) AS total_revenue_generated
      FROM order_item oi
      JOIN orders o ON oi.order_id = o.order_id AND o.status != 'CANCELLED'
      JOIN sku s ON oi.sku_id = s.sku_id
      JOIN product p ON s.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      GROUP BY s.sku_id, s.sku_code, s.wholesale_price, s.ram_gb, s.storage_gb, s.color, p.model_name, b.brand_name
      ORDER BY total_units_sold DESC
      LIMIT 10;
    `;
    const bestSellingSkusRes = await query(bestSellingSkusSql);

    return NextResponse.json({
      success: true,
      topRetailers: topRetailersRes.rows,
      bestSellingSkus: bestSellingSkusRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
