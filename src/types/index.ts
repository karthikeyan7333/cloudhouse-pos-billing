export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  phone?: string;
  isActive?: boolean;
}

export interface ProductVariant {
  _id?: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  barcode?: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  categoryName?: string;
  description?: string;
  material?: string;
  variants: ProductVariant[];
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderThreshold: number;
  supplier?: string;
  supplierName?: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
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
  returnedQuantity: number;
}

export interface Bill {
  _id: string;
  billNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
  amountPaid: number;
  changeGiven: number;
  status: 'COMPLETED' | 'PARTIALLY_RETURNED' | 'RETURNED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  _id?: string;
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
  disposition: 'RESTOCK' | 'DAMAGED';
  reason: string;
}

export interface ReturnRecord {
  _id: string;
  returnNumber: string;
  billId: string;
  billNumber: string;
  processedByUserId: string;
  processedByUserName: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundPaymentMethod: 'CASH' | 'ORIGINAL_METHOD';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  _id: string;
  entryNumber: string;
  date: string;
  type: 'SALE' | 'REFUND' | 'EXPENSE' | 'STOCK_PURCHASE' | 'OPENING_BALANCE';
  category: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceType: 'BILL' | 'RETURN' | 'MANUAL';
  referenceId?: string;
  referenceNumber?: string;
  performedByUserId: string;
  performedByUserName: string;
  createdAt: string;
}

export interface BusinessSettings {
  _id?: string;
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
  defaultTaxRate: number;
  maxDiscountPercent: number;
  timezone: string;
  receiptHeader: string;
  receiptFooter: string;
}

export interface InventoryMovement {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  variantInfo?: string;
  type: 'SALE' | 'RETURN_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITEOFF' | 'RESTOCK';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceNumber?: string;
  performedByUserName: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalSalesGross: number;
  totalRefunds: number;
  netSales: number;
  completedBillsCount: number;
  productCount: number;
  lowStockCount: number;
  returnsCount: number;
  recentBills: Bill[];
  salesTrend: Array<{
    date: string;
    label: string;
    sales: number;
    bills: number;
  }>;
}

export interface ReportData {
  period: string;
  filterStart: string;
  filterEnd: string;
  summary: {
    grossSales: number;
    discountsGiven: number;
    taxCollected: number;
    refundsTotal: number;
    netSales: number;
    billCount: number;
    averageBillValue: number;
  };
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  staffSales: Array<{ cashierName: string; billCount: number; totalSales: number }>;
  bestSelling: Array<{ name: string; sku: string; quantitySold: number; revenue: number }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    categoryName: string;
    stockQuantity: number;
    reorderThreshold: number;
    sellingPrice: number;
  }>;
}
