'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Search,
} from 'lucide-react';

function StatementsContent() {
  const searchParams = useSearchParams();
  const initialRetailerId = searchParams.get('retailerId');

  const [retailers, setRetailers] = useState<any[]>([]);
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(initialRetailerId || '');
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/retailers')
      .then((r) => r.json())
      .then((d) => {
        if (d.retailers) {
          setRetailers(d.retailers);
          if (!selectedRetailerId && d.retailers.length > 0) {
            setSelectedRetailerId(String(d.retailers[0].retailer_id));
          }
        }
      });
  }, []);

  const fetchStatement = (id: string) => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/ledger/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setStatement(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedRetailerId) {
      fetchStatement(selectedRetailerId);
    }
  }, [selectedRetailerId]);

  const { retailer, totals, entries } = statement || { entries: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Retailer Financial Ledger Statements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Distributor audit viewer for any retailer account with dynamic window function calculations (FR-P3 & Q10).
          </p>
        </div>

        {/* Retailer Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Select Retailer:</span>
          <select
            value={selectedRetailerId}
            onChange={(e) => setSelectedRetailerId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-600"
          >
            {retailers.map((r) => (
              <option key={r.retailer_id} value={r.retailer_id}>
                {r.business_name} ({r.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 animate-pulse h-64" />
      ) : !retailer ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Select a retailer above to load their financial journal.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Retailer Profile</span>
              <div className="text-lg font-black text-slate-900 mt-1 truncate">{retailer.business_name}</div>
              <span className="text-xs text-slate-500">{retailer.city} • GSTIN: {retailer.gstin}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Sanctioned Limit</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{Number(retailer.credit_limit).toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-500">Approved Credit Ceiling</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block">Outstanding Balance</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                ₹{Number(retailer.outstanding_balance).toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-500">Current Debt Exposure</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">Available Ordering Headroom</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ₹{Math.max(0, Number(retailer.credit_limit) - Number(retailer.outstanding_balance)).toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-500">Within Credit Limit</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Credit</th>
                    <th className="py-3 px-4 text-right">Window Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {entries.map((entry: any) => {
                    const isDebit = entry.entry_type === 'DEBIT';
                    return (
                      <tr key={entry.ledger_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(entry.entry_date).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDebit ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {entry.reference_type}
                          <span className="text-slate-400 font-normal block text-[11px]">{entry.notes}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          {isDebit ? `+ ₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {!isDebit ? `- ₹${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{Number(entry.calculated_window_balance).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminStatementsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading statements...</div>}>
      <StatementsContent />
    </Suspense>
  );
}
