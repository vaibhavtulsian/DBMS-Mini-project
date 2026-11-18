import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/reports/above-average-low-stock - PRD FR-R4 & Q8 (Scalar & IN subquery)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    // Demonstrates Q8: Scalar Subquery calculating average sold units across all SKUs,
    // combined with correlated/subquery filtering SKUs whose total stock <= threshold
    const sql = `
      SELECT 
        s.sku_id,
        s.sku_code,
        s.wholesale_price,
        s.ram_gb,
        s.storage_gb,
        s.color,
        p.model_name,
        b.brand_name,
        sku_sales.total_units_sold,
        (SELECT ROUND(AVG(units), 1) FROM (
          SELECT SUM(quantity) as units 
          FROM order_item oi2 
          JOIN orders o2 ON oi2.order_id = o2.order_id 
          WHERE o2.status != 'CANCELLED' 
          GROUP BY oi2.sku_id
        ) sub) AS network_average_sku_sales,
        COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS current_stock,
        COALESCE(SUM(inv.reorder_threshold), 0)::INT AS total_reorder_threshold
      FROM sku s
      JOIN product p ON s.product_id = p.product_id
      JOIN brand b ON p.brand_id = b.brand_id
      JOIN (
        SELECT oi.sku_id, SUM(oi.quantity) AS total_units_sold
        FROM order_item oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'CANCELLED'
        GROUP BY oi.sku_id
      ) sku_sales ON s.sku_id = sku_sales.sku_id
      LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
      WHERE sku_sales.total_units_sold > (
        -- Scalar subquery for network average
        SELECT AVG(units) FROM (
          SELECT SUM(quantity) as units 
          FROM order_item oi3 
          JOIN orders o3 ON oi3.order_id = o3.order_id 
          WHERE o3.status != 'CANCELLED' 
          GROUP BY oi3.sku_id
        ) avg_sales_sub
      )
      GROUP BY s.sku_id, s.sku_code, s.wholesale_price, s.ram_gb, s.storage_gb, s.color, p.model_name, b.brand_name, sku_sales.total_units_sold
      -- Restock urgency condition: total stock at or below total threshold
      HAVING COALESCE(SUM(inv.quantity_on_hand), 0) <= COALESCE(SUM(inv.reorder_threshold), 0)
      ORDER BY sku_sales.total_units_sold DESC;
    `;

    const res = await query(sql);
    return NextResponse.json({ success: true, criticalRestockSkus: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
