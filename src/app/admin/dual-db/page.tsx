'use client';

import React, { useEffect, useState } from 'react';
import { Database, Server, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Activity, Terminal } from 'lucide-react';

export default function DualDbMonitorPage() {
  const [mysqlData, setMysqlData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditMessage, setAuditMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    fetch('/api/mysql')
      .then((r) => r.json())
      .then((d) => setMysqlData(d))
      .catch((e) => setMysqlData({ success: false, error: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditMessage) return;
    setSubmitting(true);
    try {
      await fetch('/api/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: 'manual_verification',
          actionType: 'INSERT',
          recordId: 'VERIFY-' + Date.now().toString().slice(-4),
          actionBy: 'DISTRIBUTOR_ADMIN',
          details: { message: auditMessage, time: new Date().toISOString() },
        }),
      });
      setAuditMessage('');
      fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dual-Database Architecture Monitor</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Polyglot Persistence: <strong>PostgreSQL 16</strong> (ACID Transactions & Inventory) + <strong>MySQL 8.0</strong> (Master Catalog & Audit Store)
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* Grid of 2 Databases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostgreSQL Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                  PG
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">PostgreSQL 16 Engine</h2>
                  <p className="text-xs text-slate-500 font-mono">Port 5432 &bull; Database: wholesale_db</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Active Transactional Engine
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Handles mission-critical order placement with pessimistic locking (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">SELECT ... FOR UPDATE</code>), 
              inventory deductions, automated low-stock alert triggers, financial ledger balances, and database views.
            </p>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Procedural Language</span>
                <span className="font-semibold text-slate-800">PL/pgSQL (Triggers & Stored Procs)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Concurrency Strategy</span>
                <span className="font-semibold text-slate-800">Pessimistic Row-Level Locking</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Financial Ledger</span>
                <span className="font-semibold text-slate-800">Immutable Double-Entry Journal</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Views Implemented</span>
                <span className="font-semibold text-slate-800">v_monthly_financials, v_stock_summary</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Focus</span>
            <span className="font-bold text-indigo-600">ACID Transactions & Supply Chain</span>
          </div>
        </div>

        {/* MySQL 8.0 Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  MY
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">MySQL 8.0 Engine</h2>
                  <p className="text-xs text-slate-500 font-mono">Port 3306 &bull; Database: wholesale_catalog</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                mysqlData?.status === 'Connected'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {mysqlData?.status === 'Connected' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                )}
                {mysqlData?.status || 'Connecting...'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Maintains the centralized enterprise master catalog (brands, models, SKU pricing, spec sheets), 
              user role identities, verified retailer reviews, and real-time operations audit logging via MySQL triggers.
            </p>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Storage Engine</span>
                <span className="font-semibold text-slate-800">InnoDB (utf8mb4_unicode_ci)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Search Strategy</span>
                <span className="font-semibold text-slate-800">MySQL FULLTEXT Natural Language Index</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Audit System</span>
                <span className="font-semibold text-slate-800">Triggers on product UPDATE into audit_log</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Audit Events</span>
                <span className="font-semibold text-slate-800">{mysqlData?.statistics?.totalAuditLogs ?? '...'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Focus</span>
            <span className="font-bold text-amber-600">Master Catalog & Identity Governance</span>
          </div>
        </div>
      </div>

      {/* MySQL Live Audit Log Viewer & Entry Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>MySQL 8.0 Enterprise Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time audit records stored in the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">audit_log</code> table in MySQL.
            </p>
          </div>

          <form onSubmit={handleCreateAudit} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Record test audit event..."
              value={auditMessage}
              onChange={(e) => setAuditMessage(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
            />
            <button
              type="submit"
              disabled={submitting || !auditMessage}
              className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Log to MySQL
            </button>
          </form>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Target Table</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Details (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mysqlData?.recentAuditLogs && mysqlData.recentAuditLogs.length > 0 ? (
                mysqlData.recentAuditLogs.map((log: any) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/70 font-mono text-[11px]">
                    <td className="py-2.5 px-3 font-bold text-slate-900">#{log.log_id}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">{log.table_name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action_type === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.action_type === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{log.action_by}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    {loading ? 'Querying MySQL server...' : 'No audit entries found. Ensure MySQL container is running.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
