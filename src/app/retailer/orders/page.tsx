'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react';

export default function RetailerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Order Details Modal
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Cancellation state (FR-O5 / T10)
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    const url = selectedStatus ? `/api/orders?status=${selectedStatus}` : '/api/orders';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) setOrders(d.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const openOrderDetails = async (order: any) => {
    setActiveOrder(order);
    setItemsLoading(true);
    setCancelMessage(null);
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      const data = await res.json();
      if (data.items) setOrderItems(data.items);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored to warehouse inventory and a reversing credit entry posted to your ledger.')) {
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to cancel order');
        setCancelLoading(false);
        return;
      }

      setCancelMessage(data.message);
      fetchOrders();
      // Refresh current active order status
      setActiveOrder((prev: any) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelLoading(false);
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
            My Wholesale Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track order fulfillment pipelines, review consignment lines, and manage cancellations.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No orders found</h3>
          <p className="text-sm text-slate-500 mt-1">You haven't placed any bulk requisitions with this status filter.</p>
          <Link
            href="/retailer/catalog"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-xs"
          >
            Browse Wholesale Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const canCancel = ord.status === 'PLACED' || ord.status === 'CONFIRMED';
            return (
              <div
                key={ord.order_id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-base text-slate-900">
                      Order #{ord.order_id}
                    </span>
                    {getStatusBadge(ord.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(ord.order_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      Lines: <strong className="text-slate-800">{ord.item_lines_count}</strong> ({ord.total_units_count} units)
                    </span>
                    <span>
                      Hub: <strong className="text-slate-800">{ord.warehouse_name || 'Regional Depot'}</strong>
                    </span>
                    <span>
                      Payment: <strong className="text-slate-800">{ord.payment_status}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Total Value</span>
                    <span className="text-lg font-black text-slate-900">
                      ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => openOrderDetails(ord)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Lines</span>
                  </button>

                  {canCancel && (
                    <button
                      onClick={() => handleCancelOrder(ord.order_id)}
                      disabled={cancelLoading}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                      title="Cancel order before shipment (FR-O5)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Lines Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-lg text-slate-900">Order #{activeOrder.order_id}</span>
                {getStatusBadge(activeOrder.status)}
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {cancelMessage && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{cancelMessage}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {itemsLoading ? (
                <div className="text-center py-8 text-sm text-slate-500">Loading line items...</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Model & Spec</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Unit Price</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {orderItems.map((item) => (
                    <div key={item.line_no} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 font-mono text-slate-400">{item.line_no}</span>
                      <div className="col-span-5">
                        <span className="font-bold text-slate-900 block">{item.model_name}</span>
                        <span className="text-[11px] text-slate-500">
                          {item.ram_gb}GB / {item.storage_gb}GB • {item.color} • ({item.warehouse_name})
                        </span>
                      </div>
                      <span className="col-span-2 text-center font-bold text-slate-800">{item.quantity}</span>
                      <span className="col-span-2 text-right text-slate-600 font-semibold">
                        ₹{Number(item.unit_price).toLocaleString('en-IN')}
                      </span>
                      <span className="col-span-2 text-right font-black text-slate-900">
                        ₹{Number(item.line_total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Total Consignment Value:</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{Number(activeOrder.total_amount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {(activeOrder.status === 'PLACED' || activeOrder.status === 'CONFIRMED') && (
                  <button
                    onClick={() => handleCancelOrder(activeOrder.order_id)}
                    disabled={cancelLoading}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel Order & Restore Stock</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
