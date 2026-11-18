'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payment Modal (FR-P1 / T11)
  const [showModal, setShowModal] = useState(false);
  const [selectedRetailerId, setSelectedRetailerId] = useState<number | ''>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<string>('NEFT_RTGS');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/payments').then((r) => r.json()),
      fetch('/api/retailers').then((r) => r.json()),
      fetch('/api/orders?status=DELIVERED').then((r) => r.json()),
    ])
      .then(([payData, retData, ordData]) => {
        if (payData.payments) setPayments(payData.payments);
        if (retData.retailers) setRetailers(retData.retailers);
        if (ordData.orders) setOrders(ordData.orders);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId || !referenceNo) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setSuccessResult(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: Number(selectedRetailerId),
          order_id: selectedOrderId ? parseInt(selectedOrderId, 10) : null,
          amount: Number(amount),
          payment_method: paymentMethod,
          reference_no: referenceNo,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setSuccessResult(data);
      loadData();
      setTimeout(() => {
        setShowModal(false);
        setSuccessResult(null);
        setReferenceNo('');
        setNotes('');
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter orders for selected retailer
  const retailerOrders = selectedRetailerId
    ? orders.filter((o) => o.retailer_id === Number(selectedRetailerId))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record partial or full remittances against wholesale orders via stored function <code className="bg-slate-100 text-indigo-700 font-mono px-1 rounded text-xs">record_payment()</code> (FR-P1).
          </p>
        </div>

        <button
          onClick={() => {
            setReferenceNo(`TXN-BANK-${Date.now().toString().slice(-6)}`);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Record Remittance</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Retailer Business</th>
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transaction / Ref No</th>
                <th className="py-3 px-4 text-right">Amount Remitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <tr key={p.payment_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {new Date(p.payment_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div>{p.business_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{p.region} Region</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.order_id ? (
                      <span className="font-mono text-indigo-700 font-semibold">Order #{p.order_id}</span>
                    ) : (
                      <span className="text-slate-400 italic">Account Credit</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                    {p.reference_no}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 whitespace-nowrap">
                    + ₹{Number(p.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Wholesale Remittance</h3>
            <p className="text-xs text-slate-500 mb-4">
              Executes stored function <code className="text-indigo-700 font-mono">record_payment(...)</code>, updating balance and appending CREDIT to the financial ledger.
            </p>

            {successResult && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Payment applied! New debt balance: ₹{Number(successResult.result?.new_balance || 0).toLocaleString('en-IN')}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Retailer Account:</label>
                <select
                  required
                  value={selectedRetailerId}
                  onChange={(e) => setSelectedRetailerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Select Retailer</option>
                  {retailers.map((r) => (
                    <option key={r.retailer_id} value={r.retailer_id}>
                      {r.business_name} (Bal: ₹{Number(r.outstanding_balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Apply to Specific Order (Optional):</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">General Account Credit</option>
                  {retailerOrders.map((o) => (
                    <option key={o.order_id} value={o.order_id}>
                      Order #{o.order_id} - ₹{Number(o.total_amount).toLocaleString('en-IN')} ({o.payment_status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="NEFT_RTGS">NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction / UTR Reference No:</label>
                <input
                  type="text"
                  required
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className="w-full p-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Applying...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
