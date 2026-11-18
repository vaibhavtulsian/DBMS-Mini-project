'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle,
  Building2,
  RefreshCw,
  Plus,
  Filter,
  Search,
  Check,
  ShieldAlert,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Stock edit modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [newThreshold, setNewThreshold] = useState<number>(15);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [triggerNotice, setTriggerNotice] = useState<string | null>(null);

  // New warehouse modal
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [newWh, setNewWh] = useState({
    warehouse_name: '',
    city: '',
    region: 'North',
    capacity: 20000,
  });

  const loadAll = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedWarehouse) params.set('warehouseId', selectedWarehouse);
    if (lowStockOnly) params.set('lowStockOnly', 'true');

    Promise.all([
      fetch(`/api/inventory?${params.toString()}`).then((r) => r.json()),
      fetch('/api/warehouses').then((r) => r.json()),
      fetch('/api/alerts').then((r) => r.json()),
    ])
      .then(([invData, whData, alertData]) => {
        if (invData.inventory) setInventory(invData.inventory);
        if (whData.warehouses) setWarehouses(whData.warehouses);
        if (alertData.alerts) setAlerts(alertData.alerts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
  }, [selectedWarehouse, lowStockOnly]);

  const handleAlertStatus = async (alertId: number, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setUpdateLoading(true);
    setTriggerNotice(null);

    try {
      const res = await fetch(`/api/inventory/${editingItem.warehouse_id}/${editingItem.sku_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_on_hand: newQty,
          reorder_threshold: newThreshold,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (newQty <= newThreshold) {
        setTriggerNotice(
          `⚡ Database Trigger Fired: Quantity (${newQty}) is <= threshold (${newThreshold}). An OPEN low_stock_alert was generated!`
        );
      } else {
        setTriggerNotice('✅ Stock updated successfully.');
      }

      setTimeout(() => {
        setEditingItem(null);
        setTriggerNotice(null);
        loadAll();
      }, 1800);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWh),
      });
      if (res.ok) {
        setShowWarehouseModal(false);
        loadAll();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create warehouse');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredInv = inventory.filter(
    (item) =>
      item.model_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Warehouse Inventory & Low-Stock Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock levels, reorder thresholds, and trigger-generated alerts (FR-I1 to FR-I4).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWarehouseModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse Hub</span>
          </button>
        </div>
      </div>

      {/* Operational Low-Stock Alerts Panel (FR-I4) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Trigger-Generated Operational Alerts ({alerts.filter((a) => a.status === 'OPEN').length} Open)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Fired by fn_inventory_low_stock_alert() on inventory UPDATE
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>All warehouses operating with healthy stock levels above reorder thresholds.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((al) => {
              const isOpen = al.status === 'OPEN';
              return (
                <div
                  key={al.alert_id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                    isOpen
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{al.model_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOpen ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {al.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {al.warehouse_name} ({al.region})
                    </div>
                    <div className="mt-2 flex items-center space-x-3 text-[11px]">
                      <span>Current: <strong className="text-rose-600">{al.current_quantity}</strong></span>
                      <span>Threshold: <strong>{al.threshold_value}</strong></span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-2 border-t border-amber-200 flex items-center space-x-2">
                      <button
                        onClick={() => handleAlertStatus(al.alert_id, 'ACKNOWLEDGED')}
                        className="flex-1 py-1 bg-white text-slate-700 font-bold text-[11px] rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleAlertStatus(al.alert_id, 'RESOLVED')}
                        className="flex-1 py-1 bg-indigo-600 text-white font-bold text-[11px] rounded hover:bg-indigo-700"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search model or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.warehouse_name} ({w.city})
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
            <span className="font-semibold text-slate-700">Low Stock Only (≤ Threshold)</span>
          </label>
        </div>

        <button
          onClick={loadAll}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Refresh Grid"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Inventory Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Warehouse & Hub</th>
                <th className="py-3 px-4">SKU / Model</th>
                <th className="py-3 px-4 text-center">In-Stock Qty</th>
                <th className="py-3 px-4 text-center">Reorder Threshold</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInv.map((item, idx) => {
                const isLow = item.quantity_on_hand <= item.reorder_threshold;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.warehouse_name}</span>
                      <span className="text-[10px] text-slate-500">{item.city} ({item.region})</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{item.model_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.ram_gb}GB / {item.storage_gb}GB • {item.color} •{' '}
                        <span className="font-mono">{item.sku_code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-black text-sm ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                        {item.quantity_on_hand}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-600">
                      {item.reorder_threshold}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewQty(item.quantity_on_hand);
                          setNewThreshold(item.reorder_threshold);
                          setTriggerNotice(null);
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition"
                      >
                        Adjust / Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Adjust Inventory Level</h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingItem.model_name} at {editingItem.warehouse_name}
            </p>

            {triggerNotice && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-lg">
                {triggerNotice}
              </div>
            )}

            <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantity on Hand:</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tip: Setting quantity ≤ threshold triggers an OPEN low_stock_alert automatically!
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reorder Threshold:</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {updateLoading ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Regional Distribution Center</h3>
            <form onSubmit={handleCreateWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Warehouse Name:</label>
                <input
                  type="text"
                  required
                  value={newWh.warehouse_name}
                  onChange={(e) => setNewWh({ ...newWh, warehouse_name: e.target.value })}
                  placeholder="e.g. Pune Regional Logistics"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City:</label>
                  <input
                    type="text"
                    required
                    value={newWh.city}
                    onChange={(e) => setNewWh({ ...newWh, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region:</label>
                  <select
                    value={newWh.region}
                    onChange={(e) => setNewWh({ ...newWh, region: e.target.value })}
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
                <label className="font-bold text-slate-700 block mb-1">Max Unit Capacity:</label>
                <input
                  type="number"
                  required
                  value={newWh.capacity}
                  onChange={(e) => setNewWh({ ...newWh, capacity: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
