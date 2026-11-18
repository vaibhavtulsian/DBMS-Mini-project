import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'wholesale_b2b_secret_key_super_secure_2026_level3_jwt';
const COOKIE_NAME = 'b2b_auth_token';

export interface AuthUser {
  userId: number;
  email: string;
  role: 'DISTRIBUTOR' | 'RETAILER';
  retailerId?: number | null;
  businessName?: string | null;
}

/**
 * Hash a password using bcrypt with cost factor 10+
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token for the authenticated user
 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      retailerId: user.retailerId || null,
      businessName: user.businessName || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (err) {
    return null;
  }
}

/**
 * Extract authenticated user from cookies (works in Next.js Server Components and Route Handlers)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Set HTTP-only secure cookie for auth token
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the auth cookie on logout
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Helper to fetch complete user + retailer details from DB
 */
export async function fetchUserById(userId: number): Promise<AuthUser | null> {
  const res = await query(
    `SELECT u.user_id, u.email, u.role, u.is_active, r.retailer_id, r.business_name
     FROM users u
     LEFT JOIN retailer r ON u.user_id = r.user_id
     WHERE u.user_id = $1 AND u.is_active = TRUE`,
    [userId]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    retailerId: row.retailer_id,
    businessName: row.business_name,
  };
}
