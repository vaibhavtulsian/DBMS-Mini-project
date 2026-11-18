'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  CreditCard,
  Layers,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/financial')
      .then((r) => r.json())
      .then((d) => {
        setFinancialData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, monthlyData } = financialData || { kpis: {}, monthlyData: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Distributor Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial & Distribution Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time wholesale telemetry powered by PostgreSQL view <code className="bg-slate-100 text-indigo-700 font-mono px-1 rounded text-xs">v_monthly_financials</code>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition"
          >
            Inventory Grid
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            Order Fulfilment
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(kpis.lifetime_sales || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {kpis.total_orders || 0} bulk orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Collections</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{Number(kpis.lifetime_collections || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Applied to financial ledger</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Pending Receivables</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{Number(kpis.total_outstanding_debt || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Credit exposure across network</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Open Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {kpis.open_alerts_count || 0}
          </div>
          <Link href="/admin/inventory" className="text-[11px] text-indigo-600 hover:underline mt-1 block font-semibold">
            Review stock triggers →
          </Link>
        </div>
      </div>

      {/* Monthly Financial Telemetry from SQL View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Monthly Financial Telemetry (v_monthly_financials SQL View)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated orders, total volume, collections, and net pending period balances.
            </p>
          </div>
          <Link href="/admin/reports" className="text-xs font-bold text-indigo-600 hover:underline">
            View All Advanced SQL Reports →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Financial Month</th>
                <th className="py-3 px-4 text-center">Active Retailers</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Gross Order Volume</th>
                <th className="py-3 px-4 text-right">Collections Remitted</th>
                <th className="py-3 px-4 text-right">Period Pending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {monthlyData.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {new Date(m.financial_month).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{m.active_retailers_count}</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-800">{m.total_orders_count}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    ₹{Number(m.total_sales_volume).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    ₹{Number(m.total_collections).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                    ₹{Number(m.net_pending).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
