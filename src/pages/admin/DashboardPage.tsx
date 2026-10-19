import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Shirt,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  ShoppingCart,
  ChevronRight,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard.js';
import { DashboardMetrics } from '../../types/index.js';
import { api } from '../../services/api.js';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#173C72]/20 border-t-[#173C72] rounded-full animate-spin" />
      </div>
    );
  }

  // Max value for visual bar scaling in 7-day trend
  const maxSales = Math.max(...(metrics?.salesTrend.map((d) => d.sales) || [1000]), 1000);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Store Performance Overview
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Retail Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales totals, completed invoices, inventory health, and returns tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink
            to="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS Register</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Gross Sales"
          value={`₹${(metrics?.totalSalesGross || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5" />}
          color="navy"
          subtitle="Total revenue billed"
        />
        <StatCard
          title="Net Sales"
          value={`₹${(metrics?.netSales || 0).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          subtitle="After customer refunds"
        />
        <StatCard
          title="Completed Bills"
          value={metrics?.completedBillsCount || 0}
          icon={<Receipt className="w-5 h-5" />}
          color="blue"
          subtitle="Tax invoices issued"
        />
        <StatCard
          title="Active Products"
          value={metrics?.productCount || 0}
          icon={<Shirt className="w-5 h-5" />}
          color="purple"
          subtitle="Garments & fabrics catalog"
        />
        <StatCard
          title="Low Stock Alert"
          value={metrics?.lowStockCount || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={metrics?.lowStockCount ? 'amber' : 'blue'}
          subtitle="Items near threshold"
        />
        <StatCard
          title="Returns Processed"
          value={metrics?.returnsCount || 0}
          icon={<RotateCcw className="w-5 h-5" />}
          color="red"
          subtitle={`₹${(metrics?.totalRefunds || 0).toLocaleString('en-IN')} refunded`}
        />
      </div>

      {/* 7-Day Sales Trend & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">7-Day Sales Trend (Actual Records)</h3>
                <p className="text-xs text-slate-500">Daily revenue derived from completed database transactions</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Last 7 Days</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {metrics?.salesTrend.map((day) => {
                const heightPct = Math.max(Math.round((day.sales / maxSales) * 100), 8);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap shadow-md z-10">
                      ₹{day.sales.toLocaleString('en-IN')} ({day.bills} bills)
                    </div>

                    <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-[#173C72] group-hover:bg-[#2563EB] rounded-t-md transition-all duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                      {day.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
            <span>Aggregated directly from database sales records</span>
            <NavLink to="/admin/reports" className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Full Analytics Report <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Quick Retail Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for daily store operations</p>

            <div className="space-y-2.5">
              <NavLink
                to="/admin/products"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-[#173C72]">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Manage Products
                    </div>
                    <div className="text-[10px] text-slate-500">Add apparel, variants & stock</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </NavLink>

              <NavLink
                to="/admin/returns"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                      Process Return / Exchange
                    </div>
                    <div className="text-[10px] text-slate-500">Refund items and restock</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
              </NavLink>

              <NavLink
                to="/admin/ledger"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      View Financial Ledger
                    </div>
                    <div className="text-[10px] text-slate-500">Credits, debits & balance</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </NavLink>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">GST Ready:</span> All transactions generate immutable tax invoices with Asia/Kolkata timestamps.
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Sales Invoices</h3>
            <p className="text-xs text-slate-500">Latest completed point-of-sale customer bills</p>
          </div>
          <NavLink
            to="/admin/transactions"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View All Transactions <ChevronRight className="w-4 h-4" />
          </NavLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Bill Number</th>
                <th className="px-5 py-3">Date / Time</th>
                <th className="px-5 py-3">Cashier</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentBills.map((bill) => (
                <tr key={bill._id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-bold font-mono text-[#173C72]">{bill.billNumber}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(bill.date).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{bill.cashierName}</td>
                  <td className="px-5 py-3.5 text-slate-600">{bill.customerName || 'Walk-in Customer'}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                      {bill.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-slate-900">
                    ₹{bill.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        bill.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : bill.status === 'PARTIALLY_RETURNED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
