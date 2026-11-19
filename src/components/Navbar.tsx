'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Layers,
  Database,
  Search,
  FileText,
  BarChart3,
  CreditCard,
  Bell,
  Users,
  LogOut,
  Sparkles,
  Cpu,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalUnits } = useCart();
  const [user, setUser] = useState<any>(null);
  const [retailer, setRetailer] = useState<any>(null);
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(0);

  useEffect(() => {
    // Fetch auth status
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setUser(data.user);
          if (data.retailer) setRetailer(data.retailer);

          if (data.user.role === 'DISTRIBUTOR') {
            fetch('/api/alerts?status=OPEN')
              .then((r) => r.json())
              .then((alertsData) => {
                if (alertsData.alerts) setOpenAlertsCount(alertsData.alerts.length);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login' || pathname === '/unauthorized') {
    return null;
  }

  const isDistributor = user?.role === 'DISTRIBUTOR';
  const isRetailer = user?.role === 'RETAILER';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href={isDistributor ? '/admin/dashboard' : '/retailer/catalog'} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">NexusMobile</span>
                <span className="hidden sm:inline-block ml-1 text-xs px-2 py-0.5 font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {isDistributor ? 'DISTRIBUTOR HQ' : 'B2B RETAIL'}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center space-x-1">
            {isRetailer && (
              <>
                <Link
                  href="/retailer/catalog"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/retailer/catalog'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Store className="w-4 h-4" />
                    <span>Catalog</span>
                  </span>
                </Link>

                <Link
                  href="/retailer/search"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/retailer/search'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Semantic Search</span>
                  </span>
                </Link>

                <Link
                  href="/retailer/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/retailer/orders'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Package className="w-4 h-4" />
                    <span>My Orders</span>
                  </span>
                </Link>

                <Link
                  href="/retailer/ledger"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/retailer/ledger'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Financial Ledger</span>
                  </span>
                </Link>
              </>
            )}

            {isDistributor && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/dashboard'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </span>
                </Link>

                <Link
                  href="/admin/catalog"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/catalog')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Database className="w-4 h-4" />
                    <span>Catalog & Specs</span>
                  </span>
                </Link>

                <Link
                  href="/admin/inventory"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    pathname === '/admin/inventory'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Inventory</span>
                    {openAlertsCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                        {openAlertsCount}
                      </span>
                    )}
                  </span>
                </Link>

                <Link
                  href="/admin/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/orders'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Package className="w-4 h-4" />
                    <span>Fulfilment</span>
                  </span>
                </Link>

                <Link
                  href="/admin/retailers"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/retailers'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4" />
                    <span>Retailers</span>
                  </span>
                </Link>

                <Link
                  href="/admin/payments"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/payments'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Payments</span>
                  </span>
                </Link>

                <Link
                  href="/admin/insights"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/insights'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Demand Insights</span>
                  </span>
                </Link>

                <Link
                  href="/admin/reports"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/reports'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4" />
                    <span>SQL Reports</span>
                  </span>
                </Link>

                <Link
                  href="/admin/dual-db"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin/dual-db'
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Dual DB (MySQL)</span>
                  </span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center space-x-3">
            {isRetailer && (
              <>
                {/* Credit Limit Pill */}
                {retailer && (
                  <div className="hidden lg:flex flex-col text-right px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Available Credit</span>
                    <span className="text-xs font-bold text-emerald-600">
                      ₹{Math.max(0, Number(retailer.credit_limit) - Number(retailer.outstanding_balance)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Cart Icon */}
                <Link
                  href="/retailer/cart"
                  className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalUnits > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {totalUnits}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {retailer?.business_name || user.email}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
