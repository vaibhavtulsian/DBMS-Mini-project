import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Q4 SELECT with JOIN (Order details: orders, order_item, sku, product, brand, warehouse)
    const orderRes = await query(
      `SELECT 
        o.*,
        r.business_name,
        r.contact_person,
        r.gstin,
        r.phone,
        r.city AS retailer_city,
        r.region AS retailer_region,
        w.warehouse_name AS shipping_warehouse_name,
        w.city AS shipping_warehouse_city
       FROM orders o
       JOIN retailer r ON o.retailer_id = r.retailer_id
       LEFT JOIN warehouse w ON o.shipping_warehouse_id = w.warehouse_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    // Enforce Retailer boundary: Retailer can ONLY view their own orders
    if (user.role === 'RETAILER' && order.retailer_id !== user.retailerId) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another retailer’s order' }, { status: 403 });
    }

    // Fetch Line Items
    const itemsRes = await query(
      `SELECT 
        oi.line_no,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        s.sku_id,
        s.sku_code,
        s.ram_gb,
        s.storage_gb,
        s.color,
        p.product_id,
        p.model_name,
        b.brand_name,
        w.warehouse_id,
        w.warehouse_name,
        w.city AS warehouse_city
       FROM order_item oi
       JOIN sku s ON oi.sku_id = s.sku_id
       JOIN product p ON s.product_id = p.product_id
       JOIN brand b ON p.brand_id = b.brand_id
       JOIN warehouse w ON oi.warehouse_id = w.warehouse_id
       WHERE oi.order_id = $1
       ORDER BY oi.line_no ASC`,
      [orderId]
    );

    // Fetch Payments linked to this order
    const paymentsRes = await query(
      `SELECT * FROM payment WHERE order_id = $1 ORDER BY payment_date DESC`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order,
      items: itemsRes.rows,
      payments: paymentsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
