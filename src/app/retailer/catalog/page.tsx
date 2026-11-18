'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Star,
  ChevronRight,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function RetailerCatalogPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Quick add modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productSkus, setProductSkus] = useState<any[]>([]);
  const [skuModalLoading, setSkuModalLoading] = useState(false);
  const [addQty, setAddQty] = useState<Record<number, number>>({});
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => {
        if (d.brands) setBrands(d.brands);
      })
      .catch(() => {});
  }, []);

  const loadProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (selectedRam) params.set('ram', selectedRam);
    if (selectedStorage) params.set('storage', selectedStorage);
    if (inStockOnly) params.set('inStock', 'true');

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.products) setProducts(d.products);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, [selectedBrand, selectedRam, selectedStorage, inStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const openQuickAdd = async (prod: any) => {
    setSelectedProduct(prod);
    setSkuModalLoading(true);
    setAddSuccess(false);
    try {
      const res = await fetch(`/api/products/${prod.product_id}`);
      const data = await res.json();
      if (data.skus) {
        setProductSkus(data.skus);
        const initialQtys: Record<number, number> = {};
        data.skus.forEach((s: any) => {
          initialQtys[s.sku_id] = 10;
        });
        setAddQty(initialQtys);
      }
    } finally {
      setSkuModalLoading(false);
    }
  };

  const handleAddSku = (sku: any) => {
    const qty = addQty[sku.sku_id] || 10;
    addToCart(
      {
        sku_id: sku.sku_id,
        product_id: selectedProduct.product_id,
        model_name: selectedProduct.model_name,
        brand_name: selectedProduct.brand_name,
        sku_code: sku.sku_code,
        ram_gb: sku.ram_gb,
        storage_gb: sku.storage_gb,
        color: sku.color,
        wholesale_price: Number(sku.wholesale_price),
      },
      qty
    );
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            Wholesale B2B Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Wholesale Mobile Inventory
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Direct distributor bulk pricing, real-time multi-warehouse availability, and strict ACID transaction guarantees.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            href="/retailer/search"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Semantic Search</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search model, brand, or specs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_name}>
                  {b.brand_name}
                </option>
              ))}
            </select>

            <select
              value={selectedRam}
              onChange={(e) => setSelectedRam(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Any RAM</option>
              <option value="6">6 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
            </select>

            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Any Storage</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB</option>
            </select>

            <label className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700">In Stock</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-64" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No phones matched your filters</h3>
          <p className="text-sm text-slate-500 mt-1">Try clearing some filter criteria to browse all models.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const hasStock = Number(p.total_inventory) > 0;
            return (
              <div
                key={p.product_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Brand & Stock Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {p.brand_name}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center space-x-1 ${
                        hasStock ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {hasStock ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span>{p.total_inventory} Units Available</span>
                        </>
                      ) : (
                        <span>Out of Stock</span>
                      )}
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    href={`/retailer/products/${p.product_id}`}
                    className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition"
                  >
                    {p.model_name}
                  </Link>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {p.base_description}
                  </p>

                  {/* Rating & SKU count */}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-slate-600">
                    <div className="flex items-center space-x-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(p.avg_rating) > 0 ? p.avg_rating : 'New'}</span>
                      <span className="text-slate-400 font-normal">({p.review_count} reviews)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">{p.sku_count}</span> variants
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        Wholesale From
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        ₹{Number(p.min_price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openQuickAdd(p)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add SKUs</span>
                      </button>
                      <Link
                        href={`/retailer/products/${p.product_id}`}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="View Full Specs"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {selectedProduct.brand_name}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedProduct.model_name}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {addSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Added to cart successfully! Check your cart to review and checkout.</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {skuModalLoading ? (
                <div className="text-center py-8 text-sm text-slate-500">Loading variant inventory...</div>
              ) : (
                productSkus.map((sku) => {
                  const qty = addQty[sku.sku_id] || 10;
                  const inStock = sku.total_stock > 0;
                  return (
                    <div
                      key={sku.sku_id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">
                            {sku.ram_gb}GB / {sku.storage_gb}GB • {sku.color}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {sku.sku_code}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-xs">
                          <span className="font-bold text-indigo-700 text-sm">
                            ₹{Number(sku.wholesale_price).toLocaleString('en-IN')}
                          </span>
                          <span className={inStock ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                            {inStock ? `${sku.total_stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={sku.total_stock || 100}
                          value={qty}
                          onChange={(e) =>
                            setAddQty({
                              ...addQty,
                              [sku.sku_id]: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-16 px-2 py-1.5 text-center text-sm font-semibold bg-white border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSku(sku)}
                          disabled={!inStock}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <Link
                href={`/retailer/products/${selectedProduct.product_id}`}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View technical specifications & reviews →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
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
