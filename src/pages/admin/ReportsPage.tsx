import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw,
  Users,
  CreditCard,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { ReportData } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { StatCard } from '../../components/common/StatCard.js';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { success, error } = useNotification();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }

      const res = await api.get(`/reports/analytics?${params.toString()}`);
      if (res.data.success) {
        setReport(res.data.reports);
      }
    } catch {
      error('Failed to compute analytics reports');
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate, error]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }

      const res = await api.get(`/reports/export-csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudhouse_report_${period}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success('CSV report downloaded successfully');
    } catch {
      error('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Data Analytics & Audit
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & Retail Performance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Derives net sales, GST collections, cashier quotas, best sellers, and low-stock alerts from database records.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={isExporting || isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating CSV...' : 'Export Report (CSV)'}</span>
        </button>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                period === p
                  ? 'bg-[#173C72] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales"
          value={`₹${(report?.summary.grossSales || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5" />}
          color="navy"
          subtitle="Before discounts & refunds"
        />
        <StatCard
          title="Net Sales"
          value={`₹${(report?.summary.netSales || 0).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          subtitle="Net collected revenue"
        />
        <StatCard
          title="Tax Collected (GST)"
          value={`₹${(report?.summary.taxCollected || 0).toLocaleString('en-IN')}`}
          icon={<Percent className="w-5 h-5" />}
          color="blue"
          subtitle="Statutory tax breakdown"
        />
        <StatCard
          title="Discounts Given"
          value={`₹${(report?.summary.discountsGiven || 0).toLocaleString('en-IN')}`}
          icon={<RotateCcw className="w-5 h-5" />}
          color="purple"
          subtitle="Customer promotional savings"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Completed Invoices
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">
            {report?.summary.billCount || 0} bills
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Average Bill Value (ABV)
          </span>
          <span className="text-2xl font-extrabold text-[#173C72] font-mono">
            ₹{(report?.summary.averageBillValue || 0).toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Customer Refunds
          </span>
          <span className="text-2xl font-extrabold text-red-600 font-mono">
            ₹{(report?.summary.refundsTotal || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Best Sellers & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best-Selling Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">Best-Selling Textiles & Garments</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Garment / SKU</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!report?.bestSelling || report.bestSelling.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No sales data for this period
                    </td>
                  </tr>
                ) : (
                  report.bestSelling.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                        {p.quantitySold}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods & Staff Sales */}
        <div className="space-y-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Payment Method Breakdown</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Object.entries(report?.paymentBreakdown || {}).map(([method, data]) => (
                <div key={method} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {method}
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
                    ₹{data.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{data.count} transaction(s)</div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Sales Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-base">Cashier Sales Performance</h3>
            </div>

            <div className="space-y-2">
              {report?.staffSales.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#173C72] text-white font-bold flex items-center justify-center text-xs">
                      {s.cashierName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{s.cashierName}</div>
                      <div className="text-[10px] text-slate-400">{s.billCount} bills completed</div>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-slate-900 font-mono">
                    ₹{s.totalSales.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Table */}
      {report?.lowStockProducts && report.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Low Stock Procurement Alerts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/60 text-amber-900 font-semibold uppercase tracking-wider border-b border-amber-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Current Stock</th>
                  <th className="py-2.5 px-3 text-center">Reorder Threshold</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {report.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#173C72]">{p.sku}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.categoryName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-red-600 font-mono">
                      {p.stockQuantity} units
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{p.reorderThreshold}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{p.sellingPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
