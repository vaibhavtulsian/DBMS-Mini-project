import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { retailerId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestedRetailerId = parseInt(params.retailerId, 10);
    if (isNaN(requestedRetailerId)) {
      return NextResponse.json({ error: 'Invalid retailer ID' }, { status: 400 });
    }

    // Strict boundary enforcement (T5 test)
    if (user.role === 'RETAILER' && user.retailerId !== requestedRetailerId) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another retailer’s financial ledger' }, { status: 403 });
    }

    // 1. Fetch Retailer Profile & Summary
    const retailerRes = await query(
      `SELECT retailer_id, business_name, contact_person, gstin, phone, city, region, credit_limit, outstanding_balance
       FROM retailer WHERE retailer_id = $1`,
      [requestedRetailerId]
    );

    if (retailerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
    }

    const retailer = retailerRes.rows[0];

    // 2. Fetch Ledger Entries with Q10 Window Function
    // Calculates verified running balance dynamically via window function
    // and compares with stored balance_after
    const ledgerSql = `
      SELECT 
        l.ledger_id,
        l.retailer_id,
        l.entry_type,
        l.amount,
        l.balance_after,
        l.reference_type,
        l.reference_id,
        l.notes,
        l.entry_date,
        -- SQL Window Function: Dynamic calculation of cumulative balance over time
        SUM(CASE WHEN l.entry_type = 'DEBIT' THEN l.amount ELSE -l.amount END) 
          OVER (
            PARTITION BY l.retailer_id 
            ORDER BY l.entry_date ASC, l.ledger_id ASC
          ) AS calculated_window_balance
      FROM ledger_entry l
      WHERE l.retailer_id = $1
      ORDER BY l.entry_date DESC, l.ledger_id DESC;
    `;

    const ledgerRes = await query(ledgerSql, [requestedRetailerId]);

    // Summary statistics
    const totalsRes = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END), 0) AS total_debited,
        COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credited,
        COUNT(*) AS total_entries
       FROM ledger_entry
       WHERE retailer_id = $1`,
      [requestedRetailerId]
    );

    return NextResponse.json({
      success: true,
      retailer,
      totals: totalsRes.rows[0],
      entries: ledgerRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
