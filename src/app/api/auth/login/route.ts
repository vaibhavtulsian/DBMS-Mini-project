import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Parameterized lookup
    const userRes = await query(
      `SELECT u.user_id, u.email, u.password_hash, u.role, u.is_active,
              r.retailer_id, r.business_name
       FROM users u
       LEFT JOIN retailer r ON u.user_id = r.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'This account has been deactivated' }, { status: 403 });
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const authUser = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      retailerId: user.retailer_id || null,
      businessName: user.business_name || null,
    };

    const token = signToken(authUser);
    const response = NextResponse.json({
      success: true,
      user: authUser,
      redirect: user.role === 'DISTRIBUTOR' ? '/admin/dashboard' : '/retailer/catalog',
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
