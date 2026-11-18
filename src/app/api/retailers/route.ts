import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, getClient } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// GET /api/retailers - Distributor only
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const sql = `
      SELECT 
        r.retailer_id,
        r.user_id,
        r.business_name,
        r.contact_person,
        r.gstin,
        r.phone,
        r.city,
        r.region,
        r.credit_limit,
        r.outstanding_balance,
        r.created_at,
        u.email,
        u.is_active,
        COUNT(DISTINCT o.order_id) AS total_orders_count,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_order_value,
        ROUND((r.outstanding_balance / NULLIF(r.credit_limit, 0) * 100), 1) AS credit_utilization_pct
      FROM retailer r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN orders o ON r.retailer_id = o.retailer_id AND o.status != 'CANCELLED'
      GROUP BY r.retailer_id, u.user_id, u.email, u.is_active
      ORDER BY r.outstanding_balance DESC, r.business_name ASC;
    `;

    const res = await query(sql);
    return NextResponse.json({ success: true, retailers: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const createRetailerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  business_name: z.string().min(2),
  contact_person: z.string().min(2),
  gstin: z.string().length(15),
  phone: z.string().min(8),
  city: z.string().min(2),
  region: z.string().min(2),
  credit_limit: z.number().min(0).default(500000),
});

// POST /api/retailers - FR-A4: Distributor creates retailer accounts
export async function POST(request: NextRequest) {
  const client = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createRetailerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { email, password, business_name, contact_person, gstin, phone, city, region, credit_limit } = parsed.data;

    await client.query('BEGIN');

    // Check duplicate email
    const emailCheck = await client.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // 1. Create User
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'RETAILER', TRUE) RETURNING user_id`,
      [email, passwordHash]
    );
    const newUserId = userRes.rows[0].user_id;

    // 2. Create Retailer Profile
    const retRes = await client.query(
      `INSERT INTO retailer (user_id, business_name, contact_person, gstin, phone, city, region, credit_limit, outstanding_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.00) RETURNING *`,
      [newUserId, business_name, contact_person, gstin.toUpperCase(), phone, city, region, credit_limit]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      retailer: retRes.rows[0],
      email,
    }, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
