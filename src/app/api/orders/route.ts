import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, getClient } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const orderItemSchema = z.object({
  sku_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  warehouse_id: z.number().int().positive().optional(),
});

const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  retailer_id: z.number().int().positive().optional(), // Allowed only if Distributor ordering on behalf
});

// GET /api/orders - Filtered by role
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const retailerIdParam = searchParams.get('retailerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // Strict boundary enforcement: Retailer can ONLY view their own orders
    if (user.role === 'RETAILER') {
      conditions.push(`o.retailer_id = $${pIdx++}`);
      params.push(user.retailerId);
    } else if (retailerIdParam) {
      conditions.push(`o.retailer_id = $${pIdx++}`);
      params.push(parseInt(retailerIdParam, 10));
    }

    if (status) {
      conditions.push(`o.status = $${pIdx++}`);
      params.push(status);
    }
    if (warehouseId) {
      conditions.push(`o.shipping_warehouse_id = $${pIdx++}`);
      params.push(parseInt(warehouseId, 10));
    }
    if (startDate) {
      conditions.push(`o.order_date >= $${pIdx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`o.order_date <= $${pIdx++}`);
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        o.order_id,
        o.retailer_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.payment_status,
        o.notes,
        r.business_name,
        r.region AS retailer_region,
        w.warehouse_name,
        COUNT(oi.line_no) AS item_lines_count,
        COALESCE(SUM(oi.quantity), 0)::INT AS total_units_count
      FROM orders o
      JOIN retailer r ON o.retailer_id = r.retailer_id
      LEFT JOIN warehouse w ON o.shipping_warehouse_id = w.warehouse_id
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      ${where}
      GROUP BY o.order_id, r.retailer_id, r.business_name, r.region, w.warehouse_name
      ORDER BY o.order_date DESC, o.order_id DESC;
    `;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, orders: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/orders - Atomic bulk order transaction with row-level locks
export async function POST(request: NextRequest) {
  const client = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = placeOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { items, notes } = parsed.data;

    // Identify target retailer ID
    let targetRetailerId = user.retailerId;
    if (user.role === 'DISTRIBUTOR') {
      if (!parsed.data.retailer_id) {
        return NextResponse.json({ error: 'retailer_id is required for distributor orders' }, { status: 400 });
      }
      targetRetailerId = parsed.data.retailer_id;
    }

    if (!targetRetailerId) {
      return NextResponse.json({ error: 'Retailer profile not associated with this account' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Lock retailer row and check credit limit
    const retailerRes = await client.query(
      `SELECT retailer_id, credit_limit, outstanding_balance, region
       FROM retailer
       WHERE retailer_id = $1
       FOR UPDATE`,
      [targetRetailerId]
    );

    if (retailerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
    }

    const retailer = retailerRes.rows[0];
    const creditLimit = Number(retailer.credit_limit);
    const currentBalance = Number(retailer.outstanding_balance);

    // 2. Resolve warehouse per line if not explicitly selected
    // Strategy: Prefer warehouse in retailer's region with sufficient stock, else highest stock warehouse
    const resolvedItems: Array<{ sku_id: number; warehouse_id: number; quantity: number; unit_price: number }> = [];
    let calculatedOrderTotal = 0;

    for (const item of items) {
      let chosenWarehouseId = item.warehouse_id;

      if (!chosenWarehouseId) {
        // Warehouse selection rule (PRD Section 23): Nearest to retailer region or highest stock
        const whSearchRes = await client.query(
          `SELECT inv.warehouse_id, inv.quantity_on_hand, w.region
           FROM inventory inv
           JOIN warehouse w ON inv.warehouse_id = w.warehouse_id
           WHERE inv.sku_id = $1 AND inv.quantity_on_hand >= $2
           ORDER BY (CASE WHEN w.region = $3 THEN 0 ELSE 1 END), inv.quantity_on_hand DESC
           LIMIT 1`,
          [item.sku_id, item.quantity, retailer.region]
        );

        if (whSearchRes.rows.length === 0) {
          // Check total available stock across all warehouses
          const totalStockRes = await client.query(
            'SELECT COALESCE(SUM(quantity_on_hand), 0) AS total FROM inventory WHERE sku_id = $1',
            [item.sku_id]
          );
          await client.query('ROLLBACK');
          return NextResponse.json({
            error: `Insufficient stock for SKU #${item.sku_id}. Requested: ${item.quantity}, Total Across Network: ${totalStockRes.rows[0].total}`,
          }, { status: 400 });
        }
        chosenWarehouseId = whSearchRes.rows[0].warehouse_id;
      }

      // Fetch current wholesale price
      const skuRes = await client.query('SELECT wholesale_price FROM sku WHERE sku_id = $1', [item.sku_id]);
      if (skuRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `SKU #${item.sku_id} not found` }, { status: 404 });
      }

      const unitPrice = Number(skuRes.rows[0].wholesale_price);
      calculatedOrderTotal += unitPrice * item.quantity;

      resolvedItems.push({
        sku_id: item.sku_id,
        warehouse_id: chosenWarehouseId,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    // 3. FR-P4: Credit limit validation
    if (currentBalance + calculatedOrderTotal > creditLimit) {
      await client.query('ROLLBACK');
      return NextResponse.json({
        error: `Order rejected: Total ₹${calculatedOrderTotal.toLocaleString()} exceeds available credit limit. Current debt: ₹${currentBalance.toLocaleString()}, Limit: ₹${creditLimit.toLocaleString()}`,
        creditLimit,
        currentBalance,
        calculatedOrderTotal,
      }, { status: 400 });
    }

    // 4. Create Order Header
    const primaryWarehouseId = resolvedItems[0].warehouse_id;
    const orderInsertRes = await client.query(
      `INSERT INTO orders (retailer_id, order_date, status, total_amount, payment_status, shipping_warehouse_id, notes)
       VALUES ($1, CURRENT_TIMESTAMP, 'PLACED', $2, 'UNPAID', $3, $4)
       RETURNING order_id`,
      [targetRetailerId, calculatedOrderTotal, primaryWarehouseId, notes || null]
    );
    const createdOrderId = orderInsertRes.rows[0].order_id;

    // 5. Lock inventory in deterministic sorted order (warehouse_id, sku_id) to prevent deadlocks (PRD Section 8 & 21)
    const sortedItems = [...resolvedItems].sort((a, b) => {
      if (a.warehouse_id !== b.warehouse_id) return a.warehouse_id - b.warehouse_id;
      return a.sku_id - b.sku_id;
    });

    let lineNo = 1;
    for (const item of sortedItems) {
      // Row lock on inventory
      const invCheck = await client.query(
        `SELECT quantity_on_hand, reorder_threshold
         FROM inventory
         WHERE warehouse_id = $1 AND sku_id = $2
         FOR UPDATE`,
        [item.warehouse_id, item.sku_id]
      );

      if (invCheck.rows.length === 0 || invCheck.rows[0].quantity_on_hand < item.quantity) {
        await client.query('ROLLBACK');
        const available = invCheck.rows.length > 0 ? invCheck.rows[0].quantity_on_hand : 0;
        return NextResponse.json({
          error: `Stock depleted for SKU #${item.sku_id} at warehouse #${item.warehouse_id}. Available: ${available}, Requested: ${item.quantity}`,
        }, { status: 400 });
      }

      // Decrement stock (this will fire trg_check_low_stock if below threshold)
      await client.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE warehouse_id = $2 AND sku_id = $3`,
        [item.quantity, item.warehouse_id, item.sku_id]
      );

      // Insert Order Line
      await client.query(
        `INSERT INTO order_item (order_id, line_no, sku_id, warehouse_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [createdOrderId, lineNo++, item.sku_id, item.warehouse_id, item.quantity, item.unit_price]
      );
    }

    // 6. Update Retailer Outstanding Balance
    const newBalance = currentBalance + calculatedOrderTotal;
    await client.query(
      `UPDATE retailer
       SET outstanding_balance = $1
       WHERE retailer_id = $2`,
      [newBalance, targetRetailerId]
    );

    // 7. FR-P2: Append immutable DEBIT ledger entry
    await client.query(
      `INSERT INTO ledger_entry (retailer_id, entry_type, amount, balance_after, reference_type, reference_id, notes, entry_date)
       VALUES ($1, 'DEBIT', $2, $3, 'ORDER_PLACED', $4, $5, CURRENT_TIMESTAMP)`,
      [targetRetailerId, calculatedOrderTotal, newBalance, createdOrderId, `Order placed #${createdOrderId}`]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Order placed atomically and confirmed',
      orderId: createdOrderId,
      totalAmount: calculatedOrderTotal,
      newBalance,
    }, { status: 201 });

  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Order placement transaction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
