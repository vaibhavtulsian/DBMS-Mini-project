import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const patchRetailerSchema = z.object({
  credit_limit: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const retailerId = parseInt(params.id, 10);
    const body = await request.json();
    const parsed = patchRetailerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { credit_limit, is_active } = parsed.data;

    if (credit_limit !== undefined) {
      await query(
        'UPDATE retailer SET credit_limit = $1 WHERE retailer_id = $2',
        [credit_limit, retailerId]
      );
    }

    if (is_active !== undefined) {
      await query(
        `UPDATE users
         SET is_active = $1
         WHERE user_id = (SELECT user_id FROM retailer WHERE retailer_id = $2)`,
        [is_active, retailerId]
      );
    }

    const updatedRes = await query(
      `SELECT r.*, u.is_active, u.email
       FROM retailer r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.retailer_id = $1`,
      [retailerId]
    );

    return NextResponse.json({ success: true, retailer: updatedRes.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
