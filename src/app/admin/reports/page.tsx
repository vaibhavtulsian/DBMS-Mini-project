'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'top' | 'regional' | 'overdue' | 'subquery'>('top');
  const [topData, setTopData] = useState<any | null>(null);
  const [regionalData, setRegionalData] = useState<any[]>([]);
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [subqueryData, setSubqueryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/reports/top-retailers').then((r) => r.json()),
      fetch('/api/reports/regional-demand').then((r) => r.json()),
      fetch('/api/reports/overdue').then((r) => r.json()),
      fetch('/api/reports/above-average-low-stock').then((r) => r.json()),
    ])
      .then(([top, reg, over, sub]) => {
        if (top.topRetailers) setTopData(top);
        if (reg.regionalDemand) setRegionalData(reg.regionalDemand);
        if (over.overdueRetailers) setOverdueData(over.overdueRetailers);
        if (sub.criticalRestockSkus) setSubqueryData(sub.criticalRestockSkus);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Advanced SQL Query & Reporting Engine
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Demonstration of Level 3 advanced database operations: GROUP BY, HAVING, subqueries, aggregates, and ranking (PRD Section 8.2).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'top'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Top Volume & SKUs (Q7)
        </button>
        <button
          onClick={() => setActiveTab('regional')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'regional'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Regional Demand Aggregates (Q5)
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overdue Credit (Q6 HAVING)
        </button>
        <button
          onClick={() => setActiveTab('subquery')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'subquery'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Above Avg Sales with Low Stock (Q8 Subquery)
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 animate-pulse h-64" />
      ) : (
        <>
          {/* TAB 1: Top Retailers & Best SKUs (Q7) */}
          {activeTab === 'top' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Retailers */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Top 10 Retailers by Order Volume (Q7)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SQL: <code className="bg-slate-100 font-mono text-[10px] px-1 rounded">GROUP BY retailer_id ORDER BY total_order_value DESC LIMIT 10</code>
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {topData?.topRetailers?.map((r: any, idx: number) => (
                    <div key={r.retailer_id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {idx + 1}. {r.business_name}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {r.city} ({r.region}) • {r.total_orders_placed} orders
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">
                          ₹{Number(r.total_order_value).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Avg: ₹{Number(r.avg_order_ticket).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Selling SKUs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span>Top 10 Best-Selling SKUs by Units (Q7)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SQL: <code className="bg-slate-100 font-mono text-[10px] px-1 rounded">GROUP BY sku_id ORDER BY total_units_sold DESC LIMIT 10</code>
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {topData?.bestSellingSkus?.map((sku: any, idx: number) => (
                    <div key={sku.sku_id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {idx + 1}. {sku.model_name}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {sku.ram_gb}GB / {sku.storage_gb}GB • {sku.color}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 block">
                          {sku.total_units_sold} units
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ₹{Number(sku.total_revenue_generated).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Regional Demand (Q5) */}
          {activeTab === 'regional' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Regional Demand & Aggregates (Q5)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQL: <code className="bg-slate-100 font-mono text-[10px] px-1 rounded">SELECT region, SUM(amount), COUNT(order_id), AVG(amount) GROUP BY region</code>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Territory / Region</th>
                      <th className="py-3 px-4 text-center">Retailers Count</th>
                      <th className="py-3 px-4 text-center">Orders Count</th>
                      <th className="py-3 px-4 text-right">Total Order Volume</th>
                      <th className="py-3 px-4 text-right">Average Order Ticket</th>
                      <th className="py-3 px-4 text-right">Regional Credit Debt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regionalData.map((reg) => (
                      <tr key={reg.region} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{reg.region} Region</td>
                        <td className="py-3.5 px-4 text-center text-slate-700">{reg.total_retailers}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">{reg.total_orders}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{Number(reg.total_order_volume).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-semibold">
                          ₹{Number(reg.avg_order_value).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          ₹{Number(reg.regional_debt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Overdue Retailers (Q6 HAVING) */}
          {activeTab === 'overdue' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Retailers with Exposure Exceeding 80% Credit Limit (Q6)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQL Group Filtering: <code className="bg-slate-100 font-mono text-[10px] px-1 rounded">GROUP BY retailer_id HAVING outstanding_balance &gt;= (0.80 * credit_limit)</code>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Retailer Business</th>
                      <th className="py-3 px-4">Region</th>
                      <th className="py-3 px-4 text-right">Credit Limit</th>
                      <th className="py-3 px-4 text-right">Outstanding Debt</th>
                      <th className="py-3 px-4 text-center">Credit Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueData.map((od) => (
                      <tr key={od.retailer_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{od.business_name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{od.contact_person} • {od.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{od.region}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          ₹{Number(od.credit_limit).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                          ₹{Number(od.outstanding_balance).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                            {od.credit_utilization_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Subquery (Q8) */}
          {activeTab === 'subquery' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>SKUs Selling Above Network Average with Depleted Stock (Q8)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQL Subquery: <code className="bg-slate-100 font-mono text-[10px] px-1 rounded">WHERE sku_sales.units &gt; (SELECT AVG(units) FROM ...) HAVING stock &lt;= threshold</code>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">SKU / Model</th>
                      <th className="py-3 px-4 text-center">Units Sold</th>
                      <th className="py-3 px-4 text-center">Network Average</th>
                      <th className="py-3 px-4 text-center">Current Total Stock</th>
                      <th className="py-3 px-4 text-center">Reorder Threshold</th>
                      <th className="py-3 px-4 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subqueryData.map((sq) => (
                      <tr key={sq.sku_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{sq.model_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sq.sku_code} • {sq.color}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-600 text-sm">
                          {sq.total_units_sold} units
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                          {sq.network_average_sku_sales} units
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-rose-600 text-sm">
                          {sq.current_stock}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {sq.total_reorder_threshold}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            URGENT RESTOCK
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
