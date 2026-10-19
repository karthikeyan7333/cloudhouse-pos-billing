import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  size: string;
  color: string;
  sku: string;
  stock: number;
  barcode?: string;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  category: mongoose.Types.ObjectId | string;
  categoryName?: string;
  description?: string;
  material?: string;
  variants: IProductVariant[];
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderThreshold: number;
  supplier?: mongoose.Types.ObjectId | string;
  supplierName?: string;
  taxRate: number; // percentage, e.g., 5 or 12
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    barcode: { type: String, trim: true },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String },
    description: { type: String, trim: true },
    material: { type: String, trim: true },
    variants: [ProductVariantSchema],
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, default: 5, min: 0 },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    taxRate: { type: Number, default: 5, min: 0 }, // 5% GST standard for textiles under ₹1000, 12% above
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
