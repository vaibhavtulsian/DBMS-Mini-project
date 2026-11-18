'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Eye,
  Filter,
  CheckCircle,
  Truck,
  Building2,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [retailerFilter, setRetailerFilter] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (warehouseFilter) params.set('warehouseId', warehouseFilter);
    if (retailerFilter) params.set('retailerId', retailerFilter);

    fetch(`/api/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) setOrders(d.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // Fetch filter lookups
    Promise.all([fetch('/api/warehouses').then((r) => r.json()), fetch('/api/retailers').then((r) => r.json())])
      .then(([whData, retData]) => {
        if (whData.warehouses) setWarehouses(whData.warehouses);
        if (retData.retailers) setRetailers(retData.retailers);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, warehouseFilter, retailerFilter]);

  const openOrder = async (order: any) => {
    setSelectedOrder(order);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      const data = await res.json();
      if (data.items) setOrderLines(data.items);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        fetchOrders();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">PLACED</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">CONFIRMED</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Fulfilment Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage bulk orders across distribution hubs and transition statuses through delivery (FR-F1 & FR-F2).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">All Statuses</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.warehouse_name} ({w.region})
            </option>
          ))}
        </select>

        <select
          value={retailerFilter}
          onChange={(e) => setRetailerFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">All Retailers</option>
          {retailers.map((r) => (
            <option key={r.retailer_id} value={r.retailer_id}>
              {r.business_name} ({r.city})
            </option>
          ))}
        </select>

        <button
          onClick={fetchOrders}
          className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition ml-auto"
        >
          Filter Orders
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Retailer Business</th>
                <th className="py-3 px-4">Dispatch Hub</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {orders.map((ord) => (
                <tr key={ord.order_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 block">#{ord.order_id}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ord.order_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div>{ord.business_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{ord.retailer_region} Region</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {ord.warehouse_name || 'Regional Depot'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(ord.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.payment_status === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                    ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openOrder(ord)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition"
                    >
                      Manage & Lines
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Pipeline Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 block">
                  ORDER #{selectedOrder.order_id} • {selectedOrder.business_name}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-xs text-slate-500 font-semibold">
                    Payment: {selectedOrder.payment_status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* State Transition Action Pipeline (FR-F2) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Move Order Through Status Pipeline (FR-F2):
              </span>
              <div className="flex flex-wrap gap-2">
                {['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={updatingStatus || selectedOrder.status === st}
                    onClick={() => handleUpdateStatus(selectedOrder.order_id, st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                      selectedOrder.status === st
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Line items list */}
            <div className="flex-1 overflow-y-auto py-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Consignment Line Items:
              </span>
              {modalLoading ? (
                <div className="text-center py-6 text-sm text-slate-500">Loading line items...</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase grid grid-cols-12 gap-2">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Model / Variant</span>
                    <span className="col-span-2 text-center">Dispatch Hub</span>
                    <span className="col-span-1 text-center">Qty</span>
                    <span className="col-span-3 text-right">Line Total</span>
                  </div>
                  {orderLines.map((line) => (
                    <div key={line.line_no} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 font-mono text-slate-400">{line.line_no}</span>
                      <div className="col-span-5">
                        <span className="font-bold text-slate-800 block">{line.model_name}</span>
                        <span className="text-[11px] text-slate-500">
                          {line.ram_gb}GB / {line.storage_gb}GB • {line.color}
                        </span>
                      </div>
                      <span className="col-span-2 text-center text-slate-600 text-[11px] truncate">
                        {line.warehouse_name}
                      </span>
                      <span className="col-span-1 text-center font-bold text-slate-900">{line.quantity}</span>
                      <span className="col-span-3 text-right font-black text-slate-900">
                        ₹{Number(line.line_total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block">Total Order Value:</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
