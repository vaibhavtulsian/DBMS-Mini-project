'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Truck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartCheckoutPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, updateWarehouse, clearCart, totalUnits, totalPrice } = useCart();

  const [retailer, setRetailer] = useState<any | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    // Fetch Retailer profile for live credit limit check
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.retailer) setRetailer(d.retailer);
      })
      .catch(() => {});

    // Fetch Warehouses
    fetch('/api/warehouses')
      .then((r) => r.json())
      .then((d) => {
        if (d.warehouses) setWarehouses(d.warehouses);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const creditLimit = Number(retailer?.credit_limit || 0);
  const currentDebt = Number(retailer?.outstanding_balance || 0);
  const availableCredit = Math.max(0, creditLimit - currentDebt);
  const projectedDebt = currentDebt + totalPrice;
  const isCreditExceeded = projectedDebt > creditLimit;

  const handlePlaceOrder = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        items: items.map((item) => ({
          sku_id: item.sku_id,
          quantity: item.quantity,
          warehouse_id: item.warehouse_id || undefined,
        })),
        notes: orderNotes || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Transaction rolled back by database.');
        setSubmitting(false);
        return;
      }

      setSuccessOrder(data);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error executing order transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Order Confirmed!</h1>
        <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
          Order <strong>#{successOrder.orderId}</strong> has been atomically committed into PostgreSQL. Stock was locked, decremented, and DEBIT ledger posted.
        </p>

        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto text-left space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Order Total:</span>
            <span className="font-bold text-slate-900">₹{Number(successOrder.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>New Outstanding Balance:</span>
            <span className="font-bold text-indigo-700">₹{Number(successOrder.newBalance).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Status:</span>
            <span className="font-bold text-amber-600">PLACED</span>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/retailer/orders"
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition"
          >
            View My Orders
          </Link>
          <Link
            href="/retailer/catalog"
            className="px-6 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition"
          >
            Continue Ordering
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Your bulk cart is empty</h2>
        <p className="text-sm text-slate-500 mt-2">Browse the catalog to add SKUs for wholesale purchase.</p>
        <Link
          href="/retailer/catalog"
          className="mt-6 inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Phone Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bulk Order Cart & Checkout
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review consignments, assign dispatch hubs, and commit your wholesale requisition.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm">Database Transaction Rolled Back:</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Consignment Lines ({items.length})</span>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.sku_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {item.brand_name}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{item.model_name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.ram_gb}GB / {item.storage_gb}GB • {item.color}
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.sku_code}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center space-x-3">
                      <span className="text-xs font-bold text-indigo-700">
                        ₹{item.wholesale_price.toLocaleString('en-IN')} / unit
                      </span>

                      {/* Warehouse Selector per line (FR-O3) */}
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={item.warehouse_id || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            const whName = warehouses.find((w) => w.warehouse_id === val)?.warehouse_name;
                            updateWarehouse(item.sku_id, val || 0, whName);
                          }}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Auto Warehouse (Nearest Region)</option>
                          {warehouses.map((w) => (
                            <option key={w.warehouse_id} value={w.warehouse_id}>
                              {w.warehouse_name} ({w.region})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.sku_id, parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1 text-center font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="font-extrabold text-sm text-slate-900 block">
                        ₹{(item.wholesale_price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.sku_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Special Shipping / Delivery Instructions:
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Expedited surface transit; gate entry between 10am - 4pm..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Financial Pre-flight & Credit Validation Box (FR-P4) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>Credit & Financial Summary</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
              <div className="flex justify-between">
                <span>Total Units:</span>
                <span className="font-bold text-slate-900">{totalUnits} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700">Order Subtotal:</span>
                <span className="font-black text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Credit Limit Verification */}
            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Approved Credit Limit:</span>
                <span className="font-semibold text-slate-900">₹{creditLimit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Current Outstanding Debt:</span>
                <span className="font-semibold text-rose-600">₹{currentDebt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Available Before Order:</span>
                <span className="font-semibold text-emerald-600">₹{availableCredit.toLocaleString('en-IN')}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 pt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Projected Credit Utilization</span>
                  <span className={isCreditExceeded ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                    {creditLimit > 0 ? Math.round((projectedDebt / creditLimit) * 100) : 100}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isCreditExceeded ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (projectedDebt / (creditLimit || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {isCreditExceeded && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2 mt-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Credit Limit Exceeded:</span>
                    <span>
                      Order exceeds your credit ceiling by ₹{(projectedDebt - creditLimit).toLocaleString('en-IN')}. Reduce quantity or make a ledger payment first.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || isCreditExceeded}
              className="w-full mt-4 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span>Executing Atomic SQL Transaction...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Commit Wholesale Bulk Order</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-400 text-center block mt-2">
              Row-locked atomic SELECT FOR UPDATE prevents overselling
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
