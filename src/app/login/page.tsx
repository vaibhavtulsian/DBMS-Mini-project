'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Shield, Store, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please check credentials.');
        setLoading(false);
        return;
      }

      router.push(data.redirect || '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'distributor' | 'retailer') => {
    if (role === 'distributor') {
      setEmail('distributor@wholesale.com');
      setPassword('Admin@12345');
    } else {
      setEmail('retailer1@shop.com');
      setPassword('Retailer@12345');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-xl shadow-indigo-200 mb-4">
          <Cpu className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          NexusMobile Network
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          B2B Wholesale Distribution & Demand Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {/* Demo Quick Logins */}
          <div className="mb-6 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>1-Click Demo Profiles (PRD Sec 16.1)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('distributor')}
                className="py-2 px-3 text-xs font-semibold bg-white text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition shadow-xs flex items-center justify-center space-x-1"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Distributor Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('retailer')}
                className="py-2 px-3 text-xs font-semibold bg-white text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition shadow-xs flex items-center justify-center space-x-1"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Retailer Shop</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
            PostgreSQL ACID Security • Row-Level Locks • pgvector Semantic AI
          </div>
        </div>
      </div>
    </div>
  );
}
