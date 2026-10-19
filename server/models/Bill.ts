import mongoose, { Schema, Document } from 'mongoose';

export interface IBillItem {
  _id?: string;
  productId: string;
  productName: string;
  sku: string;
  variant?: {
    size: string;
    color: string;
    sku?: string;
  };
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  returnedQuantity: number; // tracks how many units of this item have been returned
}

export interface IBill extends Document {
  billNumber: string;
  date: Date;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: IBillItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
  amountPaid: number;
  changeGiven: number;
  status: 'COMPLETED' | 'PARTIALLY_RETURNED' | 'RETURNED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    variant: {
      size: { type: String },
      color: { type: String },
      sku: { type: String },
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 5, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String },
    items: [BillItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI'], required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    changeGiven: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['COMPLETED', 'PARTIALLY_RETURNED', 'RETURNED'],
      default: 'COMPLETED',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const BillModel = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);
