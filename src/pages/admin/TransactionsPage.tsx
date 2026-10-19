import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Printer,
  Calendar,
  IndianRupee,
  Eye,
  RotateCcw,
  User,
} from 'lucide-react';
import { Bill, BusinessSettings } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Pagination } from '../../components/common/Pagination.js';
import { Modal } from '../../components/common/Modal.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';

export const TransactionsPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Inspection / Details Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billReturns, setBillReturns] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Reprint Receipt Modal
  const [reprintBill, setReprintBill] = useState<Bill | null>(null);

  const { error } = useNotification();

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        search,
        startDate,
        endDate,
        cashierId,
        paymentMethod,
        status,
      });

      const res = await api.get(`/billing/bills?${params.toString()}`);
      if (res.data.success) {
        setBills(res.data.bills);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch {
      error('Failed to load transaction bills');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, startDate, endDate, cashierId, paymentMethod, status, error]);

  const loadDependencies = async () => {
    try {
      const [setRes, staffRes] = await Promise.all([
        api.get('/settings'),
        api.get('/staff'),
      ]);
      if (setRes.data.success) setSettings(setRes.data.settings);
      if (staffRes.data.success) setStaffUsers(staffRes.data.users);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleInspectBill = async (bill: Bill) => {
    setSelectedBill(bill);
    setIsLoadingDetails(true);
    try {
      const res = await api.get(`/billing/bills/${bill._id}`);
      if (res.data.success) {
        setSelectedBill(res.data.bill);
        setBillReturns(res.data.returns || []);
      }
    } catch {
      console.error('Failed to load full bill details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Sales & Invoice Ledger
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transactions & Tax Invoices
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Audit completed sales, reprint tax receipts, inspect line items, and trace customer refunds.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Bill #, Customer Name, or Phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
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
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              title="End Date"
            />

            <select
              value={cashierId}
              onChange={(e) => {
                setCashierId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">All Cashiers</option>
              {staffUsers.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PARTIALLY_RETURNED">Partially Returned</option>
              <option value="RETURNED">Fully Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-[#173C72]">{bill.billNumber}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(bill.date).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{bill.cashierName}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {bill.customerName}
                      {bill.customerPhone && (
                        <span className="text-[10px] text-slate-400 block">{bill.customerPhone}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {bill.items?.reduce((s, it) => s + it.quantity, 0) || 0} unit(s)
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 text-sm">
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
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleInspectBill(bill)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                        title="Inspect Bill Line Items"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReprintBill(bill)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                        title="Reprint Tax Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
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
          itemsPerPage={15}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Bill Line Items Inspection Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Invoice Details: #${selectedBill.billNumber}`}
          subtitle={`Processed by ${selectedBill.cashierName} on ${new Date(
            selectedBill.date
          ).toLocaleString('en-IN')}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer</span>
                <span className="font-semibold text-slate-900">{selectedBill.customerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Phone</span>
                <span className="font-semibold text-slate-900">{selectedBill.customerPhone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Mode</span>
                <span className="font-semibold text-slate-900">{selectedBill.paymentMethod}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Grand Total</span>
                <span className="font-extrabold text-[#173C72] text-sm">
                  ₹{selectedBill.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Purchased Garments & Line Items
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Garment / SKU</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">GST Rate</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{it.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {it.sku} {it.variant && `(${it.variant.size} / ${it.variant.color})`}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{it.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-700">
                          {it.discountAmount > 0 ? `-₹${it.discountAmount.toFixed(2)}` : '—'}
                        </td>
                        <td className="p-3 text-right text-slate-500">{it.taxRate}%</td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          ₹{it.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund History if partially or fully returned */}
            {billReturns.length > 0 && (
              <div className="pt-2">
                <h4 className="font-bold text-red-700 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refund & Return Events on this Invoice
                </h4>
                <div className="space-y-2">
                  {billReturns.map((ret: any) => (
                    <div
                      key={ret._id}
                      className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-red-900">Return #{ret.returnNumber}</div>
                        <div className="text-[10px] text-red-600">
                          {new Date(ret.createdAt).toLocaleString('en-IN')} by {ret.processedByUserName}
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-red-700 font-mono text-sm">
                        -₹{ret.totalRefundAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedBill(null);
                  setReprintBill(selectedBill);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#173C72] text-white font-bold text-xs rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                Reprint Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reprint Receipt Modal */}
      <ReceiptModal
        isOpen={!!reprintBill}
        onClose={() => setReprintBill(null)}
        bill={reprintBill}
        settings={settings}
      />
    </div>
  );
};
