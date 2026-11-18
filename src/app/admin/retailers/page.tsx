'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  ShieldCheck,
  CreditCard,
  Building2,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Retailer Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRet, setNewRet] = useState({
    email: '',
    password: 'Retailer@12345',
    business_name: '',
    contact_person: '',
    gstin: '',
    phone: '',
    city: '',
    region: 'North',
    credit_limit: 1500000,
  });

  // Edit Credit Limit Modal
  const [editingRetailer, setEditingRetailer] = useState<any | null>(null);
  const [newLimit, setNewLimit] = useState<number>(0);
  const [editLoading, setEditLoading] = useState(false);

  const fetchRetailers = () => {
    setLoading(true);
    fetch('/api/retailers')
      .then((r) => r.json())
      .then((d) => {
        if (d.retailers) setRetailers(d.retailers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const handleCreateRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/retailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRet),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create retailer');

      setShowCreateModal(false);
      fetchRetailers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetailer) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/retailers/${editingRetailer.retailer_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credit_limit: newLimit }),
      });
      if (res.ok) {
        setEditingRetailer(null);
        fetchRetailers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update credit limit');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActive = async (retailerId: number, currentActive: boolean) => {
    if (!confirm(`Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this retailer account?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/retailers/${retailerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) fetchRetailers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = retailers.filter(
    (r) =>
      r.business_name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.gstin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Retailer Directory & Credit Controls
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorize accounts, monitor exposure limits, and inspect immutable ledger journals (FR-A4 & FR-P4).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Retailer</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search business name, GSTIN, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Retailers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Business & Account</th>
                <th className="py-3 px-4">Region / City</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding Debt</th>
                <th className="py-3 px-4 text-center">Utilization</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((ret) => {
                const util = Number(ret.credit_utilization_pct || 0);
                const isOverdueRisk = util >= 80;
                return (
                  <tr key={ret.retailer_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ret.business_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {ret.contact_person} • {ret.email} • GSTIN: <span className="font-mono">{ret.gstin}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{ret.city}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{ret.region} Region</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(ret.credit_limit).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 whitespace-nowrap">
                      ₹{Number(ret.outstanding_balance).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isOverdueRisk
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {util}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(ret.retailer_id, ret.is_active)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ret.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                        title="Click to toggle active state (FR-A4)"
                      >
                        {ret.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setEditingRetailer(ret);
                          setNewLimit(Number(ret.credit_limit));
                        }}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px]"
                      >
                        Adjust Limit
                      </button>
                      <Link
                        href={`/admin/statements?retailerId=${ret.retailer_id}`}
                        className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded font-bold text-[11px] inline-flex items-center space-x-0.5"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Ledger</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Credit Limit Modal */}
      {editingRetailer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Adjust Credit Limit</h3>
            <p className="text-xs text-slate-500 mb-4">{editingRetailer.business_name}</p>
            <form onSubmit={handleUpdateLimit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Approved Credit Limit (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRetailer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {editLoading ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Retailer Modal (FR-A4) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Register New Retailer Profile</h3>
            <form onSubmit={handleCreateRetailer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Store Name:</label>
                <input
                  type="text"
                  required
                  value={newRet.business_name}
                  onChange={(e) => setNewRet({ ...newRet, business_name: e.target.value })}
                  placeholder="e.g. Metro Mobile Hub"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person:</label>
                  <input
                    type="text"
                    required
                    value={newRet.contact_person}
                    onChange={(e) => setNewRet({ ...newRet, contact_person: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number:</label>
                  <input
                    type="text"
                    required
                    value={newRet.phone}
                    onChange={(e) => setNewRet({ ...newRet, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login Email:</label>
                  <input
                    type="email"
                    required
                    value={newRet.email}
                    onChange={(e) => setNewRet({ ...newRet, email: e.target.value })}
                    placeholder="shop@domain.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Password:</label>
                  <input
                    type="text"
                    required
                    value={newRet.password}
                    onChange={(e) => setNewRet({ ...newRet, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN (15 Chars):</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={newRet.gstin}
                    onChange={(e) => setNewRet({ ...newRet, gstin: e.target.value })}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full p-2 font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City:</label>
                  <input
                    type="text"
                    required
                    value={newRet.city}
                    onChange={(e) => setNewRet({ ...newRet, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region:</label>
                  <select
                    value={newRet.region}
                    onChange={(e) => setNewRet({ ...newRet, region: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newRet.credit_limit}
                  onChange={(e) => setNewRet({ ...newRet, credit_limit: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 font-bold bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
