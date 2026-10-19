import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryMovement extends Document {
  productId: string;
  productName: string;
  sku: string;
  variantInfo?: string;
  type: 'SALE' | 'RETURN_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITEOFF' | 'RESTOCK';
  quantityChange: number; // e.g. -2 for sale, +1 for return, +50 for restock
  previousStock: number;
  newStock: number;
  reason: string;
  referenceType?: 'BILL' | 'RETURN' | 'AUDIT' | 'SUPPLIER_PURCHASE';
  referenceId?: string;
  referenceNumber?: string;
  performedByUserId: string;
  performedByUserName: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    variantInfo: { type: String },
    type: {
      type: String,
      enum: ['SALE', 'RETURN_RESTOCK', 'MANUAL_ADJUSTMENT', 'DAMAGE_WRITEOFF', 'RESTOCK'],
      required: true,
      index: true,
    },
    quantityChange: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    referenceType: { type: String, enum: ['BILL', 'RETURN', 'AUDIT', 'SUPPLIER_PURCHASE'] },
    referenceId: { type: String },
    referenceNumber: { type: String },
    performedByUserId: { type: String, required: true },
    performedByUserName: { type: String, required: true },
  },
  { timestamps: true }
);

export const InventoryMovementModel =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
