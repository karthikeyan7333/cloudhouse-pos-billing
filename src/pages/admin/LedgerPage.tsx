import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  IndianRupee,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { LedgerEntry } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Pagination } from '../../components/common/Pagination.js';
import { Modal } from '../../components/common/Modal.js';

export const LedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Manual Expense / Adjustment Entry Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'STOCK_PURCHASE' | 'SALE' | 'OPENING_BALANCE',
    category: 'Store Utility & Packaging',
    description: '',
    amount: 0,
    isCredit: false,
  });

  const { success, error } = useNotification();

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        type: typeFilter,
        startDate,
        endDate,
      });

      const res = await api.get(`/ledger?${params.toString()}`);
      if (res.data.success) {
        setEntries(res.data.entries);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch {
      error('Failed to load ledger records');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, startDate, endDate, error]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.description.trim() || manualForm.amount <= 0) {
      error('Please enter description and valid amount.');
      return;
    }

    try {
      const res = await api.post('/ledger/manual', {
        type: manualForm.type,
        category: manualForm.category,
        description: manualForm.description.trim(),
        amount: manualForm.amount,
        isCredit: manualForm.isCredit,
      });

      if (res.data.success) {
        success('Financial entry added to ledger successfully');
        setIsManualModalOpen(false);
        setManualForm({
          type: 'EXPENSE',
          category: 'Store Utility & Packaging',
          description: '',
          amount: 0,
          isCredit: false,
        });
        fetchLedger();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to record entry');
    }
  };

  // Compute summary totals for current view
  const currentTotalCredits = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const currentTotalDebits = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const latestBalance = entries[0]?.balance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            Real Financial Double-Entry
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            General Accounting Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable financial records linked to sales invoices, customer refunds, and store expenses.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#173C72] hover:bg-[#0f274a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Store Expense</span>
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>TOTAL CREDITS (INFLOWS)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{currentTotalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Retail sales revenue and capital inflows</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>TOTAL DEBITS (OUTFLOWS)</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono">
            ₹{currentTotalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Customer refunds and operating expenses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>REGISTER RUNNING BALANCE</span>
            <div className="p-2 rounded-lg bg-blue-50 text-[#173C72]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#173C72] font-mono">
            ₹{latestBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Real-time net cash position in register</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">All Entry Types</option>
            <option value="SALE">Sales Revenue (Inflow)</option>
            <option value="REFUND">Customer Refunds (Outflow)</option>
            <option value="EXPENSE">Operating Expenses (Outflow)</option>
            <option value="STOCK_PURCHASE">Stock Purchases (Outflow)</option>
            <option value="OPENING_BALANCE">Opening Capital</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            title="Start Date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            title="End Date"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Entry #</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Category & Description</th>
                <th className="px-5 py-3.5">Source Reference</th>
                <th className="px-5 py-3.5 text-right">Debit (Out)</th>
                <th className="px-5 py-3.5 text-right">Credit (In)</th>
                <th className="px-5 py-3.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading ledger records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-700">
                      {entry.entryNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(entry.date).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{entry.category}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{entry.description}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#173C72] font-semibold">
                      {entry.referenceNumber || entry.referenceType}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-red-600">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-extrabold text-slate-900">
                      ₹{entry.balance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={25}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Manual Expense Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Record Store Expense / Financial Entry"
        subtitle="Log operational overheads, packaging supplies, or vendor payments"
        maxWidth="md"
      >
        <form onSubmit={handleManualEntrySubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Entry Nature *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setManualForm({ ...manualForm, isCredit: false, type: 'EXPENSE' })}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                  !manualForm.isCredit
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Expense (Outflow / Debit)
              </button>
              <button
                type="button"
                onClick={() => setManualForm({ ...manualForm, isCredit: true, type: 'OPENING_BALANCE' })}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                  manualForm.isCredit
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Inflow (Credit)
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Accounting Category *</label>
            <select
              value={manualForm.category}
              onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="Store Utility & Packaging">Store Utility & Carry Bags</option>
              <option value="Staff Refreshment & Welfare">Staff Refreshments & Tea</option>
              <option value="Equipment Maintenance">POS Printer Rolls & Hardware</option>
              <option value="Textile Freight & Logistics">Textile Transport & Freight</option>
              <option value="Owner Capital Contribution">Owner Capital Addition</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={manualForm.amount || ''}
              onChange={(e) => setManualForm({ ...manualForm, amount: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 750.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description / Memo *</label>
            <textarea
              required
              rows={2}
              value={manualForm.description}
              onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
              placeholder="Details of expense voucher or reason"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#173C72] hover:bg-[#0f274a] rounded-xl shadow-xs"
            >
              Save Ledger Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
