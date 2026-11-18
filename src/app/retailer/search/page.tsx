'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Cpu,
  Layers,
  Thermometer,
  Video,
  BatteryCharging,
  Zap,
  ArrowRight,
  Filter,
  CheckCircle2,
  Database,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function SemanticSearchPage() {
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState(
    'phones with excellent thermal management and high-end video capabilities'
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [ftsResults, setFtsResults] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Hybrid filters
  const [selectedBrand, setSelectedBrand] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'vector'>('hybrid');

  // Example prompt suggestions (PRD FR-S1)
  const promptSuggestions = [
    'phones with excellent thermal management and high-end video capabilities',
    'extreme battery life with 100W fast charging for logistics and field delivery',
    'compact flagship with durable titanium build and telephoto zoom',
    'gaming smartphones with vapor chamber cooling that hold high FPS without throttling',
    'budget 5G phone with high reliability and low wholesale return rate',
  ];

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => {
        if (d.brands) setBrands(d.brands);
      })
      .catch(() => {});

    // Run initial search
    executeSearch(searchQuery);
  }, []);

  const executeSearch = async (textToSearch: string) => {
    if (!textToSearch.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSearch,
          brand: selectedBrand || null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          inStockOnly,
          mode: searchMode,
        }),
      });

      const data = await res.json();
      if (data.products) setResults(data.products);
      if (data.fulltextComparison) setFtsResults(data.fulltextComparison);
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>pgvector Dense Retrieval • all-MiniLM-L6-v2 384-Dimensions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Natural Language Demand & Hardware Search
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl">
          Search hardware specifications and retailer reviews by concept and meaning rather than rigid keywords.
          Ranked by cosine similarity with instant hybrid inventory filters.
        </p>

        {/* Search input form */}
        <form onSubmit={handleFormSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Describe phone characteristics (thermal, camera, battery, durability)..."
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-slate-900/80 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Vectorizing...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Vectors</span>
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Try queries:</span>
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSearchQuery(prompt);
                executeSearch(prompt);
              }}
              className="px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 text-indigo-200 rounded-lg border border-white/10 transition truncate max-w-xs"
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Hybrid Filters Bar (FR-S3) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Hybrid Filters:</span>
          </span>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.brand_id} value={b.brand_name}>
                {b.brand_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Max Price (₹)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-32 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <label className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
            <span className="font-semibold text-slate-700">In Stock Only</span>
          </label>
        </div>

        <button
          onClick={() => executeSearch(searchQuery)}
          className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
        >
          Filter Results
        </button>
      </div>

      {/* Results Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Vector Results (2 Columns on Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Semantic Similarity Matches ({results.length})</span>
            </h2>
            <span className="text-xs text-slate-500">HNSW Index with vector_cosine_ops</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <p className="text-sm font-semibold text-slate-700">No matching phones found</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your search query or removing filters.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const similarityPct = Math.round(Number(item.best_similarity_score) * 100);
              return (
                <div
                  key={item.product_id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {item.brand_name}
                      </span>
                      {/* Similarity Badge */}
                      <span className="text-xs font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                        <span>{similarityPct}% Match</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.total_stock > 0 ? (
                          <span className="text-emerald-600 font-semibold">● {item.total_stock} in stock</span>
                        ) : (
                          'Out of stock'
                        )}
                      </span>
                    </div>

                    <Link
                      href={`/retailer/products/${item.product_id}`}
                      className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {item.model_name}
                    </Link>

                    {/* Matching Snippet (FR-S4) */}
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <div className="flex items-center space-x-1 font-bold text-[10px] uppercase text-indigo-600 mb-1">
                        <span>Matched in {item.match_source === 'spec' ? 'Specification Sheet' : 'Retailer Review'}</span>
                        <span>({item.match_category})</span>
                      </div>
                      <p className="italic text-slate-800 leading-relaxed">
                        "{item.best_matching_snippet}"
                      </p>
                    </div>

                    <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500">
                      <span>Rating: <strong className="text-amber-500">★ {item.avg_rating}</strong></span>
                      <span>Wholesale: <strong className="text-slate-900">₹{Number(item.min_price).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between sm:self-stretch pt-2 sm:pt-0">
                    <Link
                      href={`/retailer/products/${item.product_id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1"
                    >
                      <span>View Specs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar: Side-by-side Full-Text Search Comparison (Demo Step 4 / Q11) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-slate-500" />
              <span>Keyword FTS Comparison (Q11)</span>
            </h3>
            <span className="text-[10px] text-slate-400">GIN tsvector</span>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600 mb-3 font-medium">
              Notice how traditional keyword matching fails on semantic synonyms like "cooling" when the text uses "thermal dissipation" — pgvector semantic search finds it instantly!
            </div>

            {ftsResults.length === 0 ? (
              <div className="p-4 bg-white rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                Exact keyword query yielded 0 exact lexeme matches in spec sheets.
              </div>
            ) : (
              <div className="space-y-2">
                {ftsResults.map((r, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                    <div className="font-bold text-slate-800">{r.model_name}</div>
                    <div className="text-[10px] text-slate-500">{r.brand_name}</div>
                    <div
                      className="mt-1 text-[11px] text-slate-600"
                      dangerouslySetInnerHTML={{ __html: r.snippet }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
