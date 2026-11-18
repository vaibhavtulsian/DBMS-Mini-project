'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function RetailerLedgerPage() {
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get current logged in user profile
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((meData) => {
        if (meData?.retailer?.retailer_id) {
          return fetch(`/api/ledger/${meData.retailer.retailer_id}`);
        }
        throw new Error('Retailer profile not found');
      })
      .then((r) => r.json())
      .then((d) => {
        setStatement(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!statement || !statement.retailer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Unable to load financial ledger statement.
      </div>
    );
  }

  const { retailer, totals, entries } = statement;
  const creditLimit = Number(retailer.credit_limit);
  const currentDebt = Number(retailer.outstanding_balance);
  const availableCredit = Math.max(0, creditLimit - currentDebt);
  const utilizationPct = creditLimit > 0 ? Math.round((currentDebt / creditLimit) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>PostgreSQL Append-Only Financial Journal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Financial Statement
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete verified audit log of bulk debits, payments, and running ledger balances computed with SQL Window Functions (Q10).
        </p>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Approved Credit Limit
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{creditLimit.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Sanctioned distributor credit</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block">
            Current Outstanding Balance
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ₹{currentDebt.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${utilizationPct > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{utilizationPct}% credit utilized</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
            Available Credit for Orders
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{availableCredit.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Immediate ordering headroom</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Total Payments Remitted
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{Number(totals?.total_credited || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Over {totals?.total_entries || 0} ledger transactions</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Immutable Ledger Journal Entries</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified with dynamic window function: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[11px]">SUM(...) OVER (PARTITION BY retailer_id ORDER BY entry_date)</code>
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            GSTIN: {retailer.gstin}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Event Reference</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4 text-right">Cumulative Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {entries.map((entry: any) => {
                const isDebit = entry.entry_type === 'DEBIT';
                return (
                  <tr key={entry.ledger_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(entry.entry_date).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDebit ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>DEBIT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>CREDIT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div className="font-semibold">{entry.reference_type}</div>
                      <div className="text-[11px] text-slate-500">{entry.notes}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                      {isDebit ? `+ ₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {!isDebit ? `- ₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      ₹{Number(entry.calculated_window_balance).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
