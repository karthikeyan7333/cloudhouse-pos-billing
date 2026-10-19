import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessSetting extends Document {
  businessName: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  currencyCode: string;
  currencySymbol: string;
  defaultTaxRate: number; // e.g. 5%
  maxDiscountPercent: number; // e.g. 30%
  timezone: string; // 'Asia/Kolkata'
  receiptHeader: string;
  receiptFooter: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingSchema = new Schema<IBusinessSetting>(
  {
    businessName: { type: String, required: true, default: 'CloudHouse Silks & Apparels' },
    tagline: { type: String, default: 'Finest Handlooms, Textiles & Ready-to-Wear' },
    address: { type: String, required: true, default: 'Shop No. 42, Textile Market Road, T. Nagar' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    pincode: { type: String, default: '600017' },
    phone: { type: String, default: '+91 98401 23456' },
    email: { type: String, default: 'billing@cloudhousetextiles.com' },
    gstin: { type: String, default: '33AABCC1234F1Z8' },
    currencyCode: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    defaultTaxRate: { type: Number, default: 5 },
    maxDiscountPercent: { type: Number, default: 40 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    receiptHeader: { type: String, default: 'TAX INVOICE - CLOUDHOUSE TEXTILES' },
    receiptFooter: { type: String, default: 'Thank you for shopping with us! No cash refunds. Exchanges accepted within 7 days with original tag & receipt.' },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const BusinessSettingModel =
  mongoose.models.BusinessSetting ||
  mongoose.model<IBusinessSetting>('BusinessSetting', BusinessSettingSchema);
