import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  billItemId: string;
  productId: string;
  productName: string;
  sku: string;
  variant?: {
    size: string;
    color: string;
  };
  returnedQuantity: number;
  unitRefundAmount: number;
  refundLineTotal: number;
  disposition: 'RESTOCK' | 'DAMAGED'; // Restock adds back to inventory; Damaged is written off
  reason: string;
}

export interface IReturn extends Document {
  returnNumber: string;
  billId: string;
  billNumber: string;
  processedByUserId: string;
  processedByUserName: string;
  items: IReturnItem[];
  totalRefundAmount: number;
  refundPaymentMethod: 'CASH' | 'ORIGINAL_METHOD';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    billItemId: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    variant: {
      size: { type: String },
      color: { type: String },
    },
    returnedQuantity: { type: Number, required: true, min: 1 },
    unitRefundAmount: { type: Number, required: true, min: 0 },
    refundLineTotal: { type: Number, required: true, min: 0 },
    disposition: { type: String, enum: ['RESTOCK', 'DAMAGED'], default: 'RESTOCK' },
    reason: { type: String, required: true },
  },
  { _id: true }
);

const ReturnSchema = new Schema<IReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    billId: { type: String, required: true, index: true },
    billNumber: { type: String, required: true, index: true },
    processedByUserId: { type: String, required: true },
    processedByUserName: { type: String, required: true },
    items: [ReturnItemSchema],
    totalRefundAmount: { type: Number, required: true, min: 0 },
    refundPaymentMethod: { type: String, enum: ['CASH', 'ORIGINAL_METHOD'], default: 'CASH' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ReturnModel = mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);
