import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const recordPaymentSchema = z.object({
  retailer_id: z.number().int().positive(),
  order_id: z.number().int().positive().optional().nullable(),
  amount: z.number().positive(),
  payment_method: z.enum(['BANK_TRANSFER', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'CASH']),
  reference_no: z.string().min(3),
  notes: z.string().optional().nullable(),
});

// POST /api/payments - Invokes stored function record_payment()
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required to record payments' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { retailer_id, order_id, amount, payment_method, reference_no, notes } = parsed.data;

    // Call PostgreSQL stored function: record_payment()
    const res = await query(
      `SELECT * FROM record_payment($1, $2, $3, $4, $5, $6)`,
      [retailer_id, order_id || null, amount, payment_method, reference_no, notes || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment recorded and applied to ledger',
      result: res.rows[0],
    }, { status: 201 });

  } catch (err: any) {
    console.error('Payment recording error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/payments - List recent payments with retailer and order joins
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const retailerId = searchParams.get('retailerId');

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (user.role === 'RETAILER') {
      conditions.push(`p.retailer_id = $${pIdx++}`);
      params.push(user.retailerId);
    } else if (retailerId) {
      conditions.push(`p.retailer_id = $${pIdx++}`);
      params.push(parseInt(retailerId, 10));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.*,
        r.business_name,
        r.region,
        o.total_amount AS order_total,
        o.status AS order_status,
        o.payment_status AS order_payment_status
      FROM payment p
      JOIN retailer r ON p.retailer_id = r.retailer_id
      LEFT JOIN orders o ON p.order_id = o.order_id
      ${where}
      ORDER BY p.payment_date DESC, p.payment_id DESC
      LIMIT 100;
    `;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, payments: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
