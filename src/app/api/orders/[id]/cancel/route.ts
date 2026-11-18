import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Lock and fetch order
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    // Enforce ownership
    if (user.role === 'RETAILER' && order.retailer_id !== user.retailerId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Forbidden: You can only cancel your own orders' }, { status: 403 });
    }

    // FR-O5: Check if already shipped or delivered
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      await client.query('ROLLBACK');
      return NextResponse.json({
        error: `Cannot cancel order #${orderId}: Order is already ${order.status.toLowerCase()}. Only pre-shipment orders can be cancelled.`,
      }, { status: 400 });
    }

    if (order.status === 'CANCELLED') {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    // 2. Mark order as CANCELLED
    await client.query(
      `UPDATE orders SET status = 'CANCELLED' WHERE order_id = $1`,
      [orderId]
    );

    // 3. Restore inventory for each line item
    const itemsRes = await client.query(
      `SELECT sku_id, warehouse_id, quantity FROM order_item WHERE order_id = $1`,
      [orderId]
    );

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE warehouse_id = $2 AND sku_id = $3`,
        [item.quantity, item.warehouse_id, item.sku_id]
      );
    }

    // 4. Update Retailer Outstanding Balance (reversing debit)
    const retailerRes = await client.query(
      `SELECT outstanding_balance FROM retailer WHERE retailer_id = $1 FOR UPDATE`,
      [order.retailer_id]
    );
    const currentBalance = Number(retailerRes.rows[0].outstanding_balance);
    const orderTotal = Number(order.total_amount);
    const newBalance = Math.max(0, currentBalance - orderTotal);

    await client.query(
      `UPDATE retailer SET outstanding_balance = $1 WHERE retailer_id = $2`,
      [newBalance, order.retailer_id]
    );

    // 5. Post reversing immutable CREDIT ledger entry
    await client.query(
      `INSERT INTO ledger_entry (retailer_id, entry_type, amount, balance_after, reference_type, reference_id, notes, entry_date)
       VALUES ($1, 'CREDIT', $2, $3, 'ORDER_CANCELLED', $4, $5, CURRENT_TIMESTAMP)`,
      [order.retailer_id, orderTotal, newBalance, orderId, `Reversing credit for cancelled order #${orderId}`]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} successfully cancelled. Stock has been restored and a reversing ledger entry posted.`,
      orderId,
      newBalance,
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
