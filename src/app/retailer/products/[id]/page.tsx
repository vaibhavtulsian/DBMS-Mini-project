'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Cpu,
  Layers,
  Thermometer,
  Video,
  BatteryCharging,
  Zap,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected SKU for adding
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [addedNotice, setAddedNotice] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProductData(data);
        if (data.skus && data.skus.length > 0) {
          setSelectedSkuId(data.skus[0].sku_id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!productData || !selectedSkuId) return;
    const sku = productData.skus.find((s: any) => s.sku_id === selectedSkuId);
    if (!sku) return;

    addToCart(
      {
        sku_id: sku.sku_id,
        product_id: productData.product.product_id,
        model_name: productData.product.model_name,
        brand_name: productData.product.brand_name,
        sku_code: sku.sku_code,
        ram_gb: sku.ram_gb,
        storage_gb: sku.storage_gb,
        color: sku.color,
        wholesale_price: Number(sku.wholesale_price),
      },
      orderQuantity
    );

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productData.product.product_id,
          rating: reviewRating,
          review_text: reviewText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to submit review');
        setReviewSubmitting(false);
        return;
      }

      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
        setReviewText('');
        loadData();
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <Link href="/retailer/catalog" className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block">
          ← Return to catalog
        </Link>
      </div>
    );
  }

  const { product, specSheet, skus, inventory, reviews } = productData;
  const currentSku = skus.find((s: any) => s.sku_id === selectedSkuId) || skus[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/retailer/catalog"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Wholesale Catalog</span>
      </Link>

      {/* Main Product Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {product.brand_name} ({product.country_of_origin})
              </span>
              <span className="text-xs text-slate-400 font-medium">Model Year: {product.release_year}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.model_name}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {product.base_description}
            </p>

            {/* Variant configuration selector */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Select Configuration & Storage:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {skus.map((s: any) => {
                  const isSelected = s.sku_id === currentSku?.sku_id;
                  return (
                    <button
                      key={s.sku_id}
                      type="button"
                      onClick={() => setSelectedSkuId(s.sku_id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">
                        {s.ram_gb}GB / {s.storage_gb}GB
                      </div>
                      <div className="text-[11px] text-slate-500">{s.color}</div>
                      <div className="font-extrabold text-xs text-indigo-700 mt-1">
                        ₹{Number(s.wholesale_price).toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pricing & Bulk Order Box */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Wholesale Unit Price
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                ₹{Number(currentSku?.wholesale_price || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Excluding GST • Bulk Tier Pricing</div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Selected SKU Code:</span>
                  <span className="font-mono font-semibold text-slate-900">{currentSku?.sku_code}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Total Network Stock:</span>
                  <span className="font-bold text-emerald-600">{currentSku?.total_stock} units</span>
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mt-6">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Order Quantity (Units):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={currentSku?.total_stock || 100}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 px-3 py-2 text-center text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="text-xs text-slate-500">
                    Est. Total: <strong className="text-slate-900">₹{(orderQuantity * Number(currentSku?.wholesale_price || 0)).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
              {addedNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Added {orderQuantity} units to cart!</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!currentSku?.total_stock}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add SKU to Bulk Order Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Warehouse Breakdown Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Spec Sheet Chunks (FR-C2 / FR-S1) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>Technical Specification Sheet</span>
          </h2>

          {specSheet ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  General Overview
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{specSheet.spec_text}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Thermal Performance & Cooling</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{specSheet.thermal_specs || 'N/A'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <Video className="w-3.5 h-3.5" />
                    <span>Camera & Video Optics</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{specSheet.camera_specs || 'N/A'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Chipset & Processing Silicon</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{specSheet.chipset_specs || 'N/A'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span>Battery Capacity & Charging</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{specSheet.battery_specs || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No detailed specification sheet available for this model.</p>
          )}
        </div>

        {/* Warehouse Level Stock Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Stock by Distribution Hub</span>
          </h3>

          <div className="space-y-3">
            {inventory
              .filter((inv: any) => inv.sku_id === currentSku?.sku_id)
              .map((inv: any) => (
                <div
                  key={inv.warehouse_id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{inv.warehouse_name}</div>
                    <div className="text-[10px] text-slate-500">{inv.city} • {inv.region} Region</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900">{inv.quantity_on_hand}</span>
                    <span className="text-[10px] text-slate-500 block">units</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Retailer Reviews Section (FR-V1 & FR-V2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" />
              <span>Retailer Field Reviews ({reviews.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Field observations from authorized retailers vectorized for semantic search
            </p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-lg transition"
          >
            + Write a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No retailer reviews recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r: any) => (
              <div key={r.review_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800">{r.business_name}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {r.region} Region
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-amber-500 text-xs mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{r.review_text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Write Product Feedback</h3>
            <p className="text-xs text-slate-500 mb-4">
              Per PRD Section 5.7b, reviews are vectorized with pgvector for natural language demand search.
            </p>

            {reviewError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Review submitted & vectorized into pgvector!</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating (1 to 5 Stars):</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1 ${star <= reviewRating ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Field Feedback & Performance:</label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe heat dissipation, camera autofocus in low light, battery drain, or wholesale retail sell-through..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Embedding & Saving...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
