import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Bill, BusinessSettings } from '../../types/index.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  settings?: BusinessSettings | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = settings?.businessName || 'CloudHouse Silks & Retail Apparels';
  const tagline = settings?.tagline || 'Finest Handlooms, Sarees & Designer Apparels';
  const address = settings?.address || 'Shop No. 42, Textile Market Road, T. Nagar';
  const phone = settings?.phone || '+91 98401 23456';
  const gstin = settings?.gstin || '33AABCC1234F1Z8';
  const header = settings?.receiptHeader || 'TAX INVOICE - CLOUDHOUSE TEXTILES';
  const footer =
    settings?.receiptFooter ||
    'Thank you for shopping with us! No cash refunds. Exchanges accepted within 7 days with original tag & receipt.';

  const formattedDate = new Date(bill.date).toLocaleString('en-IN', {
    timeZone: settings?.timezone || 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-6 flex flex-col">
        {/* Modal Controls - Hidden when printing */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#173C72]" />
            <h3 className="text-sm font-bold text-slate-800">Print Tax Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#173C72] hover:bg-[#0f274a] rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Container - Printable */}
        <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-50 flex justify-center">
          <div
            ref={printRef}
            className="pos-printable-receipt w-full max-w-[340px] bg-white p-5 rounded-lg border border-slate-200 shadow-xs font-mono text-[12px] leading-relaxed text-slate-800"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
                {storeName}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">{tagline}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{address}</div>
              <div className="text-[10px] text-slate-600">Ph: {phone}</div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">GSTIN: {gstin}</div>
              <div className="mt-2 text-[10px] font-bold tracking-wider uppercase border border-slate-300 py-0.5 px-2 inline-block rounded">
                {header}
              </div>
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill No:</span>
                <span className="font-bold text-slate-900">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{bill.cashierName}</span>
              </div>
              {bill.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span>{bill.customerName}</span>
                </div>
              )}
              {bill.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span>{bill.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[10px] text-slate-600 uppercase border-b border-slate-200 pb-1 mb-1.5">
                <span className="w-1/2">Item / SKU</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Total</span>
              </div>

              <div className="space-y-2">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {item.productName}
                    </div>
                    <div className="text-[9px] text-slate-500 flex gap-2">
                      <span>SKU: {item.sku}</span>
                      {item.variant && (
                        <span>
                          ({item.variant.size} / {item.variant.color})
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-700 mt-0.5">
                      <span className="w-1/2 text-[10px] text-slate-500">
                        GST {item.taxRate}%{' '}
                        {item.discountPercentage > 0 && `(Disc -${item.discountPercentage}%)`}
                      </span>
                      <span className="w-1/6 text-center">{item.quantity}</span>
                      <span className="w-1/6 text-right">₹{item.unitPrice.toFixed(2)}</span>
                      <span className="w-1/6 text-right font-medium">₹{item.lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({bill.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>

              {bill.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Total Discount:</span>
                  <span>-₹{bill.discountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Tax (GST Breakdown):</span>
                <span>₹{bill.taxTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>₹{bill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Mode:</span>
                <span className="font-bold text-slate-900 uppercase">{bill.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount Tendered:</span>
                <span>₹{bill.amountPaid.toFixed(2)}</span>
              </div>
              {bill.paymentMethod === 'CASH' && (
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Change Given:</span>
                  <span>₹{bill.changeGiven.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Status:</span>
                <span className="font-semibold text-emerald-700">{bill.status}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 leading-tight">
              <p>{footer}</p>
              <p className="mt-2 text-[9px] font-sans text-slate-400">
                Powered by CloudHouse POS - Textile & Retail
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
