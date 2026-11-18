import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const updateInventorySchema = z.object({
  quantity_on_hand: z.number().int().min(0).optional(),
  reorder_threshold: z.number().int().min(0).optional(),
  restock_quantity: z.number().int().min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { wid: string; sid: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const warehouseId = parseInt(params.wid, 10);
    const skuId = parseInt(params.sid, 10);

    const body = await request.json();
    const parsed = updateInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { quantity_on_hand, reorder_threshold, restock_quantity } = parsed.data;

    let updateSql = '';
    const queryParams: any[] = [];
    let pIdx = 1;

    if (restock_quantity !== undefined) {
      // Increment stock
      updateSql = `
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand + $${pIdx++},
            last_restocked_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE warehouse_id = $${pIdx++} AND sku_id = $${pIdx++}
        RETURNING *;
      `;
      queryParams.push(restock_quantity, warehouseId, skuId);
    } else {
      // Set exact values (trigger fires if quantity falls below threshold)
      const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      if (quantity_on_hand !== undefined) {
        sets.push(`quantity_on_hand = $${pIdx++}`);
        queryParams.push(quantity_on_hand);
      }
      if (reorder_threshold !== undefined) {
        sets.push(`reorder_threshold = $${pIdx++}`);
        queryParams.push(reorder_threshold);
      }

      updateSql = `
        UPDATE inventory
        SET ${sets.join(', ')}
        WHERE warehouse_id = $${pIdx++} AND sku_id = $${pIdx++}
        RETURNING *;
      `;
      queryParams.push(warehouseId, skuId);
    }

    const res = await query(updateSql, queryParams);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    // Check if an alert was generated or exists
    const alertRes = await query(
      `SELECT * FROM low_stock_alert
       WHERE warehouse_id = $1 AND sku_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [warehouseId, skuId]
    );

    return NextResponse.json({
      success: true,
      inventory: res.rows[0],
      latestAlert: alertRes.rows[0] || null,
    });
  } catch (err: any) {
    console.error('Inventory update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
