'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Cpu,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Spec Sheet Editor Modal state (FR-C2 & FR-C3)
  const [editingSpecProduct, setEditingSpecProduct] = useState<any | null>(null);
  const [specForm, setSpecForm] = useState({
    spec_text: '',
    display_specs: '',
    camera_specs: '',
    chipset_specs: '',
    battery_specs: '',
    thermal_specs: '',
  });
  const [specLoading, setSpecLoading] = useState(false);
  const [specSaving, setSpecSaving] = useState(false);
  const [specStatus, setSpecStatus] = useState<string | null>(null);

  // New Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProd, setNewProd] = useState({
    brand_id: 1,
    model_name: '',
    release_year: 2024,
    base_description: '',
    spec_text: '',
    display_specs: '',
    camera_specs: '',
    chipset_specs: '',
    battery_specs: '',
    thermal_specs: '',
  });

  // New SKU Modal state
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [selectedProductForSku, setSelectedProductForSku] = useState<any | null>(null);
  const [newSku, setNewSku] = useState({
    sku_code: '',
    ram_gb: 8,
    storage_gb: 256,
    color: 'Titanium Black',
    wholesale_price: 55000,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([fetch('/api/products').then((r) => r.json()), fetch('/api/brands').then((r) => r.json())])
      .then(([pData, bData]) => {
        if (pData.products) setProducts(pData.products);
        if (bData.brands) setBrands(bData.brands);
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

  const openSpecEditor = async (prod: any) => {
    setEditingSpecProduct(prod);
    setSpecLoading(true);
    setSpecStatus(null);
    try {
      const res = await fetch(`/api/products/${prod.product_id}/spec`);
      const data = await res.json();
      if (data.spec) {
        setSpecForm({
          spec_text: data.spec.spec_text || '',
          display_specs: data.spec.display_specs || '',
          camera_specs: data.spec.camera_specs || '',
          chipset_specs: data.spec.chipset_specs || '',
          battery_specs: data.spec.battery_specs || '',
          thermal_specs: data.spec.thermal_specs || '',
        });
      } else {
        setSpecForm({
          spec_text: '',
          display_specs: '',
          camera_specs: '',
          chipset_specs: '',
          battery_specs: '',
          thermal_specs: '',
        });
      }
    } catch {
      setSpecForm({
        spec_text: '',
        display_specs: '',
        camera_specs: '',
        chipset_specs: '',
        battery_specs: '',
        thermal_specs: '',
      });
    } finally {
      setSpecLoading(false);
    }
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpecSaving(true);
    setSpecStatus(null);

    try {
      const res = await fetch(`/api/products/${editingSpecProduct.product_id}/spec`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save spec');

      setSpecStatus(`✅ ${data.message}`);
      setTimeout(() => {
        setEditingSpecProduct(null);
        setSpecStatus(null);
      }, 1500);
    } catch (err: any) {
      setSpecStatus(`❌ Error: ${err.message}`);
    } finally {
      setSpecSaving(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
      if (res.ok) {
        setShowProductModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create product');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSku,
          product_id: selectedProductForSku.product_id,
        }),
      });
      if (res.ok) {
        setShowSkuModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create SKU');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.model_name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catalog & Spec Sheets Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain product lines, SKU variants, and AI-embedded hardware spec sheets (FR-C1 to FR-C3).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowProductModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product Model</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter models or brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Brand & Model</th>
                <th className="py-3 px-4 text-center">Release Year</th>
                <th className="py-3 px-4 text-center">Active SKUs</th>
                <th className="py-3 px-4 text-center">Network Stock</th>
                <th className="py-3 px-4 text-right">Wholesale Price Range</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {p.brand_name}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{p.model_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{p.release_year}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{p.sku_count}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-bold ${
                        Number(p.total_inventory) > 0 ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {p.total_inventory} units
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                    ₹{Number(p.min_price).toLocaleString('en-IN')} - ₹{Number(p.max_price).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProductForSku(p);
                          setNewSku({
                            ...newSku,
                            sku_code: `${p.brand_name.substring(0, 3).toUpperCase()}-${p.model_name.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-256G-BLK-${Date.now().toString().slice(-4)}`,
                          });
                          setShowSkuModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        + Add SKU
                      </button>
                      <button
                        onClick={() => openSpecEditor(p)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                        title="Edit spec sheet and trigger re-embedding"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Spec & Embed</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spec Sheet Editor Drawer / Modal (FR-C2 & FR-C3) */}
      {editingSpecProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Hardware Spec Sheet & Vector Embeddings
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSpecProduct.model_name}
                </h3>
              </div>
              <button
                onClick={() => setEditingSpecProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {specStatus && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-lg">
                {specStatus}
              </div>
            )}

            <form onSubmit={handleSaveSpec} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  General Specification Overview (120 - 200 Words):
                </label>
                <textarea
                  rows={4}
                  required
                  value={specForm.spec_text}
                  onChange={(e) => setSpecForm({ ...specForm, spec_text: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thermal & Heat Dissipation:</label>
                  <textarea
                    rows={2}
                    value={specForm.thermal_specs}
                    onChange={(e) => setSpecForm({ ...specForm, thermal_specs: e.target.value })}
                    placeholder="Vapor chamber, graphite diffusion..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Camera & Video Capabilities:</label>
                  <textarea
                    rows={2}
                    value={specForm.camera_specs}
                    onChange={(e) => setSpecForm({ ...specForm, camera_specs: e.target.value })}
                    placeholder="Sensors, telephoto, 4K/8K recording..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display & Refresh Rate:</label>
                  <textarea
                    rows={2}
                    value={specForm.display_specs}
                    onChange={(e) => setSpecForm({ ...specForm, display_specs: e.target.value })}
                    placeholder="AMOLED, 120Hz LTPO, peak nits..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Battery & Charging:</label>
                  <textarea
                    rows={2}
                    value={specForm.battery_specs}
                    onChange={(e) => setSpecForm({ ...specForm, battery_specs: e.target.value })}
                    placeholder="mAh capacity, wired/wireless charging wattage..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Saving deletes old chunks from spec_embedding and writes newly generated 384-dim vectors.
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingSpecProduct(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={specSaving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{specSaving ? 'Vectorizing...' : 'Save & Re-embed Chunks'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Phone Model</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand:</label>
                <select
                  value={newProd.brand_id}
                  onChange={(e) => setNewProd({ ...newProd, brand_id: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Model Name:</label>
                <input
                  type="text"
                  required
                  value={newProd.model_name}
                  onChange={(e) => setNewProd({ ...newProd, model_name: e.target.value })}
                  placeholder="e.g. Galaxy S25 Ultra"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Release Year:</label>
                <input
                  type="number"
                  required
                  value={newProd.release_year}
                  onChange={(e) => setNewProd({ ...newProd, release_year: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Base Description:</label>
                <textarea
                  rows={2}
                  value={newProd.base_description}
                  onChange={(e) => setNewProd({ ...newProd, base_description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {showSkuModal && selectedProductForSku && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add SKU Variant</h3>
            <p className="text-xs text-slate-500 mb-3">{selectedProductForSku.model_name}</p>
            <form onSubmit={handleCreateSku} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">SKU Code (Unique):</label>
                <input
                  type="text"
                  required
                  value={newSku.sku_code}
                  onChange={(e) => setNewSku({ ...newSku, sku_code: e.target.value })}
                  className="w-full p-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RAM (GB):</label>
                  <input
                    type="number"
                    required
                    value={newSku.ram_gb}
                    onChange={(e) => setNewSku({ ...newSku, ram_gb: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Storage (GB):</label>
                  <input
                    type="number"
                    required
                    value={newSku.storage_gb}
                    onChange={(e) => setNewSku({ ...newSku, storage_gb: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Variant:</label>
                  <input
                    type="text"
                    required
                    value={newSku.color}
                    onChange={(e) => setNewSku({ ...newSku, color: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wholesale Price (₹):</label>
                  <input
                    type="number"
                    required
                    value={newSku.wholesale_price}
                    onChange={(e) => setNewSku({ ...newSku, wholesale_price: parseFloat(e.target.value) })}
                    className="w-full p-2 font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSkuModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Add SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
