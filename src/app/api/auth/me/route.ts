import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // If retailer, fetch live credit balance
  let retailerInfo = null;
  if (user.role === 'RETAILER' && user.retailerId) {
    const rRes = await query(
      `SELECT retailer_id, business_name, contact_person, gstin, city, region, credit_limit, outstanding_balance
       FROM retailer WHERE retailer_id = $1`,
      [user.retailerId]
    );
    if (rRes.rows.length > 0) {
      retailerInfo = rRes.rows[0];
    }
  }

  return NextResponse.json({
    authenticated: true,
    user,
    retailer: retailerInfo,
  });
}
