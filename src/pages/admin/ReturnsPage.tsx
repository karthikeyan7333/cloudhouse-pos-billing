import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  IndianRupee,
  Package,
} from 'lucide-react';
import { Bill, BillItem, ReturnRecord } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

interface ReturnItemSelection {
  billItemId: string;
  returnedQuantity: number;
  disposition: 'RESTOCK' | 'DAMAGED';
  reason: string;
}

export const ReturnsPage: React.FC = () => {
  const [searchBillNumber, setSearchBillNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBill, setFoundBill] = useState<Bill | null>(null);
  const [billReturns, setBillReturns] = useState<ReturnRecord[]>([]);

  // Selected return items map: billItemId -> ReturnItemSelection
  const [returnSelections, setReturnSelections] = useState<Record<string, ReturnItemSelection>>({});
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<'CASH' | 'ORIGINAL_METHOD'>('CASH');
  const [returnNotes, setReturnNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Recent returns list
  const [allReturns, setAllReturns] = useState<ReturnRecord[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);

  const { success, error } = useNotification();

  const fetchRecentReturns = async () => {
    setIsLoadingReturns(true);
    try {
      const res = await api.get('/returns');
      if (res.data.success) {
        setAllReturns(res.data.returns);
      }
    } catch {
      console.warn('Failed to fetch returns history');
    } finally {
      setIsLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchRecentReturns();
  }, []);

  const handleSearchBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBillNumber.trim()) return;

    setIsSearching(true);
    setFoundBill(null);
    setReturnSelections({});

    try {
      const res = await api.get(`/returns/find-bill?billNumber=${encodeURIComponent(searchBillNumber.trim())}`);
      if (res.data.success && res.data.bill) {
        setFoundBill(res.data.bill);
        setBillReturns(res.data.returns || []);
        success(`Found Bill #${res.data.bill.billNumber}`);
      } else {
        error(res.data.message || 'Bill not found');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Bill not found with this number.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleItemForReturn = (item: BillItem) => {
    const key = item._id || item.productId;
    const remaining = item.quantity - (item.returnedQuantity || 0);

    if (remaining <= 0) return;

    setReturnSelections((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = {
          billItemId: key,
          returnedQuantity: 1,
          disposition: 'RESTOCK',
          reason: 'Customer requested size exchange / return',
        };
      }
      return updated;
    });
  };

  const updateItemReturnQty = (key: string, qty: number, maxQty: number) => {
    const validQty = Math.max(1, Math.min(qty, maxQty));
    setReturnSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        returnedQuantity: validQty,
      },
    }));
  };

  const updateItemDisposition = (key: string, disposition: 'RESTOCK' | 'DAMAGED') => {
    setReturnSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        disposition,
      },
    }));
  };

  const updateItemReason = (key: string, reason: string) => {
    setReturnSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        reason,
      },
    }));
  };

  // Compute calculated refund total
  const calculatedRefundTotal = Object.values(returnSelections).reduce((sum, sel) => {
    if (!foundBill) return sum;
    const billItem = foundBill.items.find(
      (it) => it._id === sel.billItemId || it.productId === sel.billItemId
    );
    if (!billItem) return sum;
    const unitRefund = billItem.lineTotal / billItem.quantity;
    return sum + unitRefund * sel.returnedQuantity;
  }, 0);

  const handleSubmitReturn = async () => {
    const itemsToReturn = Object.values(returnSelections);
    if (itemsToReturn.length === 0) {
      error('Please select at least one item to return.');
      return;
    }

    if (!foundBill) return;

    setIsProcessing(true);
    try {
      const res = await api.post('/returns', {
        billId: foundBill._id,
        itemsToReturn,
        refundPaymentMethod,
        notes: returnNotes.trim() || 'Customer store return processed',
      });

      if (res.data.success && res.data.returnRecord) {
        success(`Return #${res.data.returnRecord.returnNumber} processed successfully!`);
        setFoundBill(null);
        setReturnSelections({});
        setSearchBillNumber('');
        fetchRecentReturns();
      } else {
        error(res.data.message || 'Failed to process return');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Error processing return');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            Customer Exchanges & Refunds
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Returns Management & Stock Disposition
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Locate original tax invoices, validate returnable quantities, restock garments, and log ledger debit entries.
          </p>
        </div>
      </div>

      {/* Bill Search Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Step 1: Lookup Original Sales Invoice</h3>
        <form onSubmit={handleSearchBill} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={searchBillNumber}
              onChange={(e) => setSearchBillNumber(e.target.value.toUpperCase())}
              placeholder="Enter Bill # (e.g. CH-20261019-0001)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#173C72] hover:bg-[#0f274a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? 'Searching...' : 'Find Invoice'}
          </button>
        </form>
      </div>

      {/* Found Bill & Return Items Selector */}
      {foundBill && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#173C72]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Original Invoice #{foundBill.billNumber}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    foundBill.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {foundBill.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4">
                <span>Date: {new Date(foundBill.date).toLocaleString('en-IN')}</span>
                <span>Customer: {foundBill.customerName}</span>
                <span>Payment: {foundBill.paymentMethod}</span>
                <span>Original Total: ₹{foundBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bill Items Selection Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Garments to Return / Exchange:
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">Select</th>
                    <th className="px-4 py-3">Garment / SKU</th>
                    <th className="px-4 py-3 text-center">Billed Qty</th>
                    <th className="px-4 py-3 text-center">Already Returned</th>
                    <th className="px-4 py-3 text-center">Returnable</th>
                    <th className="px-4 py-3">Return Qty</th>
                    <th className="px-4 py-3">Inventory Disposition</th>
                    <th className="px-4 py-3">Return Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {foundBill.items.map((item) => {
                    const key = item._id || item.productId;
                    const alreadyRet = item.returnedQuantity || 0;
                    const remaining = item.quantity - alreadyRet;
                    const isSelected = !!returnSelections[key];
                    const sel = returnSelections[key];

                    return (
                      <tr
                        key={key}
                        className={`transition ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            disabled={remaining <= 0}
                            checked={isSelected}
                            onChange={() => handleToggleItemForReturn(item)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-40"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            SKU: {item.sku} {item.variant && `(${item.variant.size} / ${item.variant.color})`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{alreadyRet}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${remaining > 0 ? 'text-emerald-700' : 'text-slate-400'}`}
                          >
                            {remaining}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <input
                              type="number"
                              min="1"
                              max={remaining}
                              value={sel.returnedQuantity}
                              onChange={(e) =>
                                updateItemReturnQty(key, parseInt(e.target.value) || 1, remaining)
                              }
                              className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded"
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <select
                              value={sel.disposition}
                              onChange={(e) =>
                                updateItemDisposition(key, e.target.value as 'RESTOCK' | 'DAMAGED')
                              }
                              className="px-2 py-1 bg-white border border-slate-300 rounded font-medium text-[11px]"
                            >
                              <option value="RESTOCK">Restock (Add back to stock)</option>
                              <option value="DAMAGED">Damaged / Write-off (Do not restock)</option>
                            </select>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <input
                              type="text"
                              value={sel.reason}
                              onChange={(e) => updateItemReason(key, e.target.value)}
                              placeholder="Reason for return..."
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Method & Process Button */}
          {Object.keys(returnSelections).length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Refund Payment Mode:</span>
                  <select
                    value={refundPaymentMethod}
                    onChange={(e) => setRefundPaymentMethod(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="ORIGINAL_METHOD">Original Method ({foundBill.paymentMethod})</option>
                  </select>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Return Notes:</span>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Internal audit notes..."
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg w-56 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Total Refund Due</div>
                  <div className="text-xl font-extrabold text-red-600 font-mono">
                    ₹{calculatedRefundTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={handleSubmitReturn}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing Return...' : 'Authorize & Process Return'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Processed Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Historical Returns & Exchanges</h3>
            <p className="text-xs text-slate-500">Audit trail of completed product refunds and dispositions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Return #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Original Bill #</th>
                <th className="px-5 py-3.5">Authorized By</th>
                <th className="px-5 py-3.5">Items Returned</th>
                <th className="px-5 py-3.5">Refund Total</th>
                <th className="px-5 py-3.5">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingReturns ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading returns...
                  </td>
                </tr>
              ) : allReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No returns processed yet.
                  </td>
                </tr>
              ) : (
                allReturns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-red-600">{ret.returnNumber}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(ret.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#173C72] font-semibold">{ret.billNumber}</td>
                    <td className="px-5 py-3.5 text-slate-700">{ret.processedByUserName}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {ret.items.map((it, idx) => (
                        <div key={idx} className="text-[11px]">
                          {it.returnedQuantity}x {it.productName}{' '}
                          <span className="font-semibold text-slate-400">({it.disposition})</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-red-600 text-sm">
                      ₹{ret.totalRefundAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                        {ret.refundPaymentMethod}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
