import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const patchAlertSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED']),
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

    const alertId = parseInt(params.id, 10);
    const body = await request.json();
    const parsed = patchAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { status } = parsed.data;
    const resolvedAtSql = status === 'RESOLVED' ? 'CURRENT_TIMESTAMP' : 'NULL';

    const res = await query(
      `UPDATE low_stock_alert
       SET status = $1,
           resolved_at = ${resolvedAtSql}
       WHERE alert_id = $2
       RETURNING *`,
      [status, alertId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
