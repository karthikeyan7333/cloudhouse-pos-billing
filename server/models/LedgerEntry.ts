import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  entryNumber: string;
  date: Date;
  type: 'SALE' | 'REFUND' | 'EXPENSE' | 'STOCK_PURCHASE' | 'OPENING_BALANCE';
  category: string;
  description: string;
  debit: number;   // Outflow / Refund / Expense
  credit: number;  // Inflow / Sales Revenue
  balance: number; // Running balance after this entry
  referenceType: 'BILL' | 'RETURN' | 'MANUAL';
  referenceId?: string;
  referenceNumber?: string;
  performedByUserId: string;
  performedByUserName: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    entryNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    type: {
      type: String,
      enum: ['SALE', 'REFUND', 'EXPENSE', 'STOCK_PURCHASE', 'OPENING_BALANCE'],
      required: true,
      index: true,
    },
    category: { type: String, required: true },
    description: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    referenceType: { type: String, enum: ['BILL', 'RETURN', 'MANUAL'], default: 'BILL' },
    referenceId: { type: String },
    referenceNumber: { type: String },
    performedByUserId: { type: String, required: true },
    performedByUserName: { type: String, required: true },
  },
  { timestamps: true }
);

export const LedgerEntryModel =
  mongoose.models.LedgerEntry || mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
