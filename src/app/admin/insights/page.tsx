'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  TrendingUp,
  Layers,
  Star,
  Cpu,
  BarChart2,
  Building2,
  Package,
} from 'lucide-react';

export default function AdminInsightsPage() {
  const [themeQuery, setThemeQuery] = useState('thermal cooling and gaming performance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);

  const sampleThemes = [
    'thermal cooling and gaming performance',
    'extreme battery life for delivery and logistics',
    'telephoto zoom camera and video stabilization for creators',
    'budget 5G phone for high wholesale turnover',
  ];

  const fetchInsights = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?theme=${encodeURIComponent(queryText)}`);
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(themeQuery);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInsights(themeQuery);
  };

  const { topProducts = [], regionalReviews = [], regionalAggregates = [] } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Demand Intelligence • Vector Theme Analytics (FR-S5)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Semantic Demand Intelligence Engine
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl">
          Enter a feature theme or emerging customer demand pattern. NexusMobile vectorizes the theme to identify matching phone lines, cross-references regional retailer sentiment, and correlates 90-day wholesale sales velocity with inventory levels.
        </p>

        {/* Theme Search Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={themeQuery}
              onChange={(e) => setThemeQuery(e.target.value)}
              placeholder="e.g. vapor chamber heat management in hot humid climates..."
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Demand Theme</span>
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Themes:</span>
          {sampleThemes.map((st, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setThemeQuery(st);
                fetchInsights(st);
              }}
              className="px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 text-indigo-200 rounded-lg border border-white/10 transition"
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Products Matching Theme with Stock & 90-Day Velocity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <span>Matching Hardware Models & Restock Velocity</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semantic match score vs 90-day wholesale order velocity and current network inventory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topProducts.map((p: any) => {
                const matchPct = Math.round(Number(p.theme_relevance_score) * 100);
                return (
                  <div key={p.product_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {p.brand_name}
                        </span>
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {matchPct}% Match
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{p.model_name}</h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                        "{p.spec_highlight}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <span className="font-black text-slate-800">{p.current_network_stock} units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">90d Volume</span>
                        <span className="font-black text-emerald-600">{p.order_velocity_90d} units</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional Review Sentiment for this Theme */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <span>Regional Retailer Feedback for Theme</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Field experiences submitted by retail store owners matching your query.
              </p>

              <div className="space-y-3">
                {regionalReviews.map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{r.model_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {r.region} Region
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <p className="text-slate-700 italic">"{r.review_text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Network Demand Aggregates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Regional Network Wholesale Demand</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Stock vs 90-day wholesale requisitions across the 5 distribution territories.
              </p>

              <div className="space-y-3">
                {regionalAggregates.map((ra: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{ra.region} Territory</span>
                      <span className="text-slate-500 text-[11px]">
                        {ra.warehouse_count} Hubs • {ra.low_stock_alerts_count} Active Alerts
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        ₹{Number(ra.regional_revenue_90d).toLocaleString('en-IN')}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {ra.total_regional_stock} units on hand
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
