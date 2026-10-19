import { dbStore, BaseDoc } from '../storage/store.js';
import { isConnected } from '../config/db.js';
import { UserModel, IUser } from '../models/User.js';
import { CategoryModel, ICategory } from '../models/Category.js';
import { SupplierModel, ISupplier } from '../models/Supplier.js';
import { ProductModel, IProduct } from '../models/Product.js';
import { BillModel, IBill, IBillItem } from '../models/Bill.js';
import { ReturnModel, IReturn, IReturnItem } from '../models/Return.js';
import { InventoryMovementModel, IInventoryMovement } from '../models/InventoryMovement.js';
import { LedgerEntryModel, ILedgerEntry } from '../models/LedgerEntry.js';
import { BusinessSettingModel, IBusinessSetting } from '../models/BusinessSetting.js';

export interface ProductQueryOptions {
  search?: string;
  category?: string;
  supplier?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const dataService = {
  // USER METHODS
  async findUserByEmail(email: string) {
    if (isConnected()) {
      return await UserModel.findOne({ email: email.toLowerCase() });
    }
    return dbStore.findOne<any>('users', u => u.email?.toLowerCase() === email.toLowerCase());
  },

  async findUserById(id: string) {
    if (isConnected()) {
      return await UserModel.findById(id).select('-password');
    }
    const user = dbStore.findById<any>('users', id);
    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  },

  async getAllUsers() {
    if (isConnected()) {
      return await UserModel.find().select('-password').sort({ createdAt: -1 });
    }
    const users = dbStore.find<any>('users');
    return users.map(({ password, ...rest }) => rest).reverse();
  },

  async countActiveAdmins() {
    if (isConnected()) {
      return await UserModel.countDocuments({ role: 'admin', isActive: true });
    }
    return dbStore.count('users', u => u.role === 'admin' && u.isActive === true);
  },

  async createUser(userData: any) {
    if (isConnected()) {
      const user = new UserModel(userData);
      return await user.save();
    }
    return dbStore.insert('users', userData);
  },

  async updateUser(id: string, updates: any) {
    if (isConnected()) {
      return await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    }
    return dbStore.updateById('users', id, updates);
  },

  // CATEGORY METHODS
  async getAllCategories() {
    if (isConnected()) {
      return await CategoryModel.find().sort({ name: 1 });
    }
    const cats = dbStore.find<any>('categories');
    return cats.sort((a, b) => a.name.localeCompare(b.name));
  },

  async findCategoryById(id: string) {
    if (isConnected()) {
      return await CategoryModel.findById(id);
    }
    return dbStore.findById<any>('categories', id);
  },

  async findCategoryByCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (isConnected()) {
      return await CategoryModel.findOne({ code: trimmed });
    }
    return dbStore.findOne<any>('categories', c => c.code?.toUpperCase() === trimmed);
  },

  async createCategory(catData: any) {
    if (isConnected()) {
      const cat = new CategoryModel(catData);
      return await cat.save();
    }
    return dbStore.insert('categories', catData);
  },

  async updateCategory(id: string, updates: any) {
    if (isConnected()) {
      return await CategoryModel.findByIdAndUpdate(id, updates, { new: true });
    }
    return dbStore.updateById('categories', id, updates);
  },

  async deleteCategory(id: string) {
    // Check if category is used by any product
    const isUsed = await this.isCategoryInUse(id);
    if (isUsed) {
      throw new Error('Cannot delete category: It is currently assigned to one or more products.');
    }
    if (isConnected()) {
      return await CategoryModel.findByIdAndDelete(id);
    }
    return dbStore.deleteById('categories', id);
  },

  async isCategoryInUse(categoryId: string) {
    if (isConnected()) {
      const count = await ProductModel.countDocuments({ category: categoryId });
      return count > 0;
    }
    const cat = dbStore.findById<any>('categories', categoryId);
    return dbStore.count('products', p => p.category === categoryId || (cat && p.categoryName === cat.name));
  },

  // SUPPLIER METHODS
  async getAllSuppliers() {
    if (isConnected()) {
      return await SupplierModel.find().sort({ name: 1 });
    }
    const suppliers = dbStore.find<any>('suppliers');
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  },

  async findSupplierById(id: string) {
    if (isConnected()) {
      return await SupplierModel.findById(id);
    }
    return dbStore.findById<any>('suppliers', id);
  },

  async findSupplierByCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (isConnected()) {
      return await SupplierModel.findOne({ code: trimmed });
    }
    return dbStore.findOne<any>('suppliers', s => s.code?.toUpperCase() === trimmed);
  },

  async createSupplier(data: any) {
    if (isConnected()) {
      const s = new SupplierModel(data);
      return await s.save();
    }
    return dbStore.insert('suppliers', data);
  },

  async updateSupplier(id: string, updates: any) {
    if (isConnected()) {
      return await SupplierModel.findByIdAndUpdate(id, updates, { new: true });
    }
    return dbStore.updateById('suppliers', id, updates);
  },

  // PRODUCT METHODS
  async getProducts(options: ProductQueryOptions = {}) {
    const {
      search = '',
      category = '',
      supplier = '',
      stockStatus = 'all',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    if (isConnected()) {
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
        ];
      }
      if (category) query.category = category;
      if (supplier) query.supplier = supplier;

      if (stockStatus === 'out_of_stock') {
        query.stockQuantity = 0;
      } else if (stockStatus === 'low_stock') {
        query.$expr = { $lte: ['$stockQuantity', '$reorderThreshold'] };
      } else if (stockStatus === 'in_stock') {
        query.stockQuantity = { $gt: 0 };
      }

      const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      const total = await ProductModel.countDocuments(query);
      const products = await ProductModel.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Local DB Engine
    let list = dbStore.find<any>('products');

    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        p =>
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      );
    }
    if (category) {
      list = list.filter(p => p.category === category || p.categoryName === category);
    }
    if (supplier) {
      list = list.filter(p => p.supplier === supplier || p.supplierName === supplier);
    }
    if (stockStatus === 'out_of_stock') {
      list = list.filter(p => (p.stockQuantity || 0) <= 0);
    } else if (stockStatus === 'low_stock') {
      list = list.filter(p => (p.stockQuantity || 0) <= (p.reorderThreshold || 5) && (p.stockQuantity || 0) > 0);
    } else if (stockStatus === 'in_stock') {
      list = list.filter(p => (p.stockQuantity || 0) > 0);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async findProductById(id: string) {
    if (isConnected()) {
      return await ProductModel.findById(id);
    }
    return dbStore.findById<any>('products', id);
  },

  async findProductBySkuOrBarcode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (isConnected()) {
      return await ProductModel.findOne({
        $or: [{ sku: trimmed }, { barcode: code.trim() }],
      });
    }
    return dbStore.findOne<any>(
      'products',
      p =>
        p.sku?.toUpperCase() === trimmed ||
        p.barcode?.toUpperCase() === code.trim().toUpperCase() ||
        p.variants?.some((v: any) => v.sku?.toUpperCase() === trimmed || v.barcode === code.trim())
    );
  },

  async createProduct(productData: any, user: { id: string; name: string }) {
    // Total stock from variants if provided
    let totalStock = Number(productData.stockQuantity || 0);
    if (Array.isArray(productData.variants) && productData.variants.length > 0) {
      totalStock = productData.variants.reduce(
        (sum: number, v: any) => sum + (Number(v.stock) || 0),
        0
      );
      productData.stockQuantity = totalStock;
    }

    let createdProduct: any;
    if (isConnected()) {
      const prod = new ProductModel(productData);
      createdProduct = await prod.save();
    } else {
      createdProduct = dbStore.insert('products', productData);
    }

    // Create Initial Inventory Movement
    await this.logInventoryMovement({
      productId: createdProduct._id.toString(),
      productName: createdProduct.name,
      sku: createdProduct.sku,
      type: 'RESTOCK',
      quantityChange: totalStock,
      previousStock: 0,
      newStock: totalStock,
      reason: 'Initial product stock creation',
      referenceType: 'AUDIT',
      performedByUserId: user.id,
      performedByUserName: user.name,
    });

    return createdProduct;
  },

  async updateProduct(id: string, updates: any) {
    if (Array.isArray(updates.variants) && updates.variants.length > 0) {
      updates.stockQuantity = updates.variants.reduce(
        (sum: number, v: any) => sum + (Number(v.stock) || 0),
        0
      );
    }

    if (isConnected()) {
      return await ProductModel.findByIdAndUpdate(id, updates, { new: true });
    }
    return dbStore.updateById('products', id, updates);
  },

  async adjustStock(
    productId: string,
    variantSku: string | null,
    newQuantity: number,
    reason: string,
    user: { id: string; name: string }
  ) {
    const product = await this.findProductById(productId);
    if (!product) throw new Error('Product not found');

    const previousStock = Number(product.stockQuantity || 0);
    let qtyChange = 0;
    let variantInfo = '';

    if (variantSku && Array.isArray(product.variants)) {
      const vIndex = product.variants.findIndex((v: any) => v.sku === variantSku);
      if (vIndex !== -1) {
        const prevVarStock = product.variants[vIndex].stock || 0;
        product.variants[vIndex].stock = newQuantity;
        variantInfo = `Size: ${product.variants[vIndex].size}, Color: ${product.variants[vIndex].color}`;
        const updatedTotal = product.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        qtyChange = updatedTotal - previousStock;
        product.stockQuantity = updatedTotal;
      }
    } else {
      qtyChange = newQuantity - previousStock;
      product.stockQuantity = newQuantity;
    }

    if (isConnected()) {
      await ProductModel.findByIdAndUpdate(productId, {
        stockQuantity: product.stockQuantity,
        variants: product.variants,
      });
    } else {
      dbStore.updateById('products', productId, {
        stockQuantity: product.stockQuantity,
        variants: product.variants,
      });
    }

    // Log Movement
    await this.logInventoryMovement({
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku,
      variantInfo,
      type: 'MANUAL_ADJUSTMENT',
      quantityChange: qtyChange,
      previousStock,
      newStock: product.stockQuantity,
      reason: reason || 'Manual inventory audit/correction',
      referenceType: 'AUDIT',
      performedByUserId: user.id,
      performedByUserName: user.name,
    });

    return product;
  },

  async toggleProductStatus(id: string) {
    const product = await this.findProductById(id);
    if (!product) throw new Error('Product not found');
    const newStatus = !product.isActive;
    return await this.updateProduct(id, { isActive: newStatus });
  },

  // INVENTORY MOVEMENTS
  async logInventoryMovement(movementData: any) {
    if (isConnected()) {
      const doc = new InventoryMovementModel(movementData);
      return await doc.save();
    }
    return dbStore.insert('inventoryMovements', movementData);
  },

  async getInventoryMovements(productId?: string) {
    if (isConnected()) {
      const q = productId ? { productId } : {};
      return await InventoryMovementModel.find(q).sort({ createdAt: -1 }).limit(100);
    }
    let list = dbStore.find<any>('inventoryMovements');
    if (productId) list = list.filter(m => m.productId === productId);
    return list.reverse().slice(0, 100);
  },

  // BILLING & CHECKOUT
  async generateBillNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    let count = 0;
    if (isConnected()) {
      count = await BillModel.countDocuments();
    } else {
      count = dbStore.count('bills');
    }
    const sequence = String(count + 1).padStart(4, '0');
    return `CH-${dateStr}-${sequence}`;
  },

  async checkout(checkoutPayload: {
    items: Array<{
      productId: string;
      variantSku?: string;
      quantity: number;
      discountPercentage?: number;
    }>;
    customerName?: string;
    customerPhone?: string;
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
    amountPaid: number;
    notes?: string;
    user: { id: string; name: string };
  }) {
    const { items, customerName, customerPhone, paymentMethod, amountPaid, notes, user } = checkoutPayload;

    if (!items || items.length === 0) {
      throw new Error('Cannot checkout an empty cart.');
    }

    // Step 1: Pre-validate all products, stock availability, and compute immutable price snapshots
    const billItems: IBillItem[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const settings = await this.getSettings();
    const storeTaxRate = settings?.defaultTaxRate ?? 5;

    // Check inventory and prepare line items
    for (const item of items) {
      const product = await this.findProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found (ID: ${item.productId})`);
      }
      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is deactivated and cannot be sold.`);
      }

      const reqQty = Number(item.quantity) || 1;
      let variantObj: any = null;

      if (item.variantSku && Array.isArray(product.variants)) {
        const v = product.variants.find((vr: any) => vr.sku === item.variantSku);
        if (!v) {
          throw new Error(`Variant "${item.variantSku}" not found for product "${product.name}".`);
        }
        if (v.stock < reqQty) {
          throw new Error(
            `Insufficient stock for "${product.name}" (${v.size} / ${v.color}). Requested: ${reqQty}, Available: ${v.stock}`
          );
        }
        variantObj = {
          size: v.size,
          color: v.color,
          sku: v.sku,
        };
      } else {
        if ((product.stockQuantity || 0) < reqQty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Requested: ${reqQty}, Available: ${product.stockQuantity}`
          );
        }
      }

      const unitPrice = Number(product.sellingPrice);
      const costPrice = Number(product.costPrice || 0);
      const lineBase = unitPrice * reqQty;
      const discountPct = Math.min(Math.max(Number(item.discountPercentage || 0), 0), 50);
      const discountAmt = Math.round((lineBase * (discountPct / 100)) * 100) / 100;
      const taxable = lineBase - discountAmt;
      const taxRate = Number(product.taxRate || storeTaxRate);
      const taxAmt = Math.round((taxable * (taxRate / 100)) * 100) / 100;
      const lineTotal = Math.round((taxable + taxAmt) * 100) / 100;

      subtotal += lineBase;
      discountTotal += discountAmt;
      taxTotal += taxAmt;

      billItems.push({
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        variant: variantObj,
        quantity: reqQty,
        unitPrice,
        costPrice,
        discountPercentage: discountPct,
        discountAmount: discountAmt,
        taxRate,
        taxAmount: taxAmt,
        lineTotal,
        returnedQuantity: 0,
      });
    }

    const totalAmount = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    if (amountPaid < totalAmount && paymentMethod === 'CASH') {
      throw new Error(`Amount paid (₹${amountPaid}) is less than total bill amount (₹${totalAmount}).`);
    }

    const changeGiven = paymentMethod === 'CASH' ? Math.max(0, amountPaid - totalAmount) : 0;
    const billNumber = await this.generateBillNumber();

    // Step 2: Safely update product stocks
    for (const bItem of billItems) {
      const product = await this.findProductById(bItem.productId);
      const prevStock = Number(product.stockQuantity || 0);
      const newStock = Math.max(0, prevStock - bItem.quantity);

      if (bItem.variant?.sku && Array.isArray(product.variants)) {
        const vIndex = product.variants.findIndex((v: any) => v.sku === bItem.variant!.sku);
        if (vIndex !== -1) {
          product.variants[vIndex].stock = Math.max(0, (product.variants[vIndex].stock || 0) - bItem.quantity);
        }
      }

      product.stockQuantity = newStock;

      if (isConnected()) {
        await ProductModel.findByIdAndUpdate(product._id, {
          stockQuantity: product.stockQuantity,
          variants: product.variants,
        });
      } else {
        dbStore.updateById('products', product._id, {
          stockQuantity: product.stockQuantity,
          variants: product.variants,
        });
      }

      // Log movement
      await this.logInventoryMovement({
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        variantInfo: bItem.variant ? `${bItem.variant.size} / ${bItem.variant.color}` : '',
        type: 'SALE',
        quantityChange: -bItem.quantity,
        previousStock: prevStock,
        newStock,
        reason: `Sold in Bill #${billNumber}`,
        referenceType: 'BILL',
        referenceNumber: billNumber,
        performedByUserId: user.id,
        performedByUserName: user.name,
      });
    }

    // Step 3: Record the Bill
    const billData: any = {
      billNumber,
      date: new Date(),
      cashierId: user.id,
      cashierName: user.name,
      customerName: customerName?.trim() || 'Walk-in Customer',
      customerPhone: customerPhone?.trim() || '',
      items: billItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount,
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? amountPaid : totalAmount,
      changeGiven: Math.round(changeGiven * 100) / 100,
      status: 'COMPLETED',
      notes,
    };

    let createdBill: any;
    if (isConnected()) {
      const b = new BillModel(billData);
      createdBill = await b.save();
    } else {
      createdBill = dbStore.insert('bills', billData);
    }

    // Step 4: Record in Financial Ledger (Credit = Inflow / Revenue)
    await this.recordLedgerEntry({
      type: 'SALE',
      category: 'Retail Sales Revenue',
      description: `Sales revenue from Bill #${billNumber} (${paymentMethod})`,
      debit: 0,
      credit: totalAmount,
      referenceType: 'BILL',
      referenceId: createdBill._id.toString(),
      referenceNumber: billNumber,
      performedByUserId: user.id,
      performedByUserName: user.name,
    });

    return createdBill;
  },

  // TRANSACTIONS / BILLS QUERY
  async getBills(filters: {
    search?: string;
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const {
      search = '',
      startDate,
      endDate,
      cashierId,
      paymentMethod,
      status,
      page = 1,
      limit = 20,
    } = filters;

    if (isConnected()) {
      const q: any = {};
      if (search) {
        q.$or = [
          { billNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
        ];
      }
      if (cashierId) q.cashierId = cashierId;
      if (paymentMethod) q.paymentMethod = paymentMethod;
      if (status) q.status = status;
      if (startDate || endDate) {
        q.date = {};
        if (startDate) q.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          q.date.$lte = end;
        }
      }

      const total = await BillModel.countDocuments(q);
      const bills = await BillModel.find(q)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        bills,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Local DB Engine
    let list = dbStore.find<any>('bills');

    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        b =>
          b.billNumber?.toLowerCase().includes(term) ||
          b.customerName?.toLowerCase().includes(term) ||
          b.customerPhone?.toLowerCase().includes(term)
      );
    }
    if (cashierId) list = list.filter(b => b.cashierId === cashierId);
    if (paymentMethod) list = list.filter(b => b.paymentMethod === paymentMethod);
    if (status) list = list.filter(b => b.status === status);
    if (startDate) {
      const start = new Date(startDate).getTime();
      list = list.filter(b => new Date(b.date).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      list = list.filter(b => new Date(b.date).getTime() <= endTime);
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      bills: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async findBillById(id: string) {
    if (isConnected()) {
      return await BillModel.findById(id);
    }
    return dbStore.findById<any>('bills', id);
  },

  async findBillByNumber(billNumber: string) {
    const trimmed = billNumber.trim().toUpperCase();
    if (isConnected()) {
      return await BillModel.findOne({ billNumber: trimmed });
    }
    return dbStore.findOne<any>('bills', b => b.billNumber?.toUpperCase() === trimmed);
  },

  // RETURNS & REFUNDS
  async processReturn(payload: {
    billId: string;
    itemsToReturn: Array<{
      billItemId: string;
      returnedQuantity: number;
      disposition: 'RESTOCK' | 'DAMAGED';
      reason: string;
    }>;
    refundPaymentMethod: 'CASH' | 'ORIGINAL_METHOD';
    notes?: string;
    user: { id: string; name: string };
  }) {
    const { billId, itemsToReturn, refundPaymentMethod, notes, user } = payload;

    const bill = await this.findBillById(billId);
    if (!bill) {
      throw new Error('Original bill not found.');
    }

    if (!itemsToReturn || itemsToReturn.length === 0) {
      throw new Error('No items specified for return.');
    }

    const returnRecords: IReturnItem[] = [];
    let totalRefund = 0;

    // Validate quantities against original bill line items
    for (const retItem of itemsToReturn) {
      const originalItemIndex = bill.items.findIndex(
        (it: any) => (it._id?.toString() === retItem.billItemId) || (it.productId === retItem.billItemId)
      );

      if (originalItemIndex === -1) {
        throw new Error(`Item not found in bill #${bill.billNumber}`);
      }

      const billItem = bill.items[originalItemIndex];
      const alreadyReturned = Number(billItem.returnedQuantity || 0);
      const remainingReturnable = billItem.quantity - alreadyReturned;

      if (retItem.returnedQuantity <= 0) {
        throw new Error('Returned quantity must be greater than zero.');
      }

      if (retItem.returnedQuantity > remainingReturnable) {
        throw new Error(
          `Cannot return ${retItem.returnedQuantity} units of "${billItem.productName}". Only ${remainingReturnable} remaining returnable.`
        );
      }

      // Calculate unit refund including net tax/discount
      const itemNetLineTotal = billItem.lineTotal;
      const unitRefund = Math.round((itemNetLineTotal / billItem.quantity) * 100) / 100;
      const lineRefundTotal = Math.round(unitRefund * retItem.returnedQuantity * 100) / 100;

      totalRefund += lineRefundTotal;

      // Update bill item returned count
      bill.items[originalItemIndex].returnedQuantity = alreadyReturned + retItem.returnedQuantity;

      returnRecords.push({
        billItemId: billItem._id?.toString() || retItem.billItemId,
        productId: billItem.productId,
        productName: billItem.productName,
        sku: billItem.sku,
        variant: billItem.variant,
        returnedQuantity: retItem.returnedQuantity,
        unitRefundAmount: unitRefund,
        refundLineTotal: lineRefundTotal,
        disposition: retItem.disposition || 'RESTOCK',
        reason: retItem.reason || 'Customer returned garment',
      });

      // Update stock if disposition is RESTOCK
      if (retItem.disposition === 'RESTOCK') {
        const product = await this.findProductById(billItem.productId);
        if (product) {
          const prevStock = Number(product.stockQuantity || 0);
          const newStock = prevStock + retItem.returnedQuantity;

          if (billItem.variant?.sku && Array.isArray(product.variants)) {
            const vIdx = product.variants.findIndex((v: any) => v.sku === billItem.variant!.sku);
            if (vIdx !== -1) {
              product.variants[vIdx].stock = (product.variants[vIdx].stock || 0) + retItem.returnedQuantity;
            }
          }

          product.stockQuantity = newStock;
          if (isConnected()) {
            await ProductModel.findByIdAndUpdate(product._id, {
              stockQuantity: product.stockQuantity,
              variants: product.variants,
            });
          } else {
            dbStore.updateById('products', product._id, {
              stockQuantity: product.stockQuantity,
              variants: product.variants,
            });
          }

          await this.logInventoryMovement({
            productId: product._id.toString(),
            productName: product.name,
            sku: product.sku,
            variantInfo: billItem.variant ? `${billItem.variant.size} / ${billItem.variant.color}` : '',
            type: 'RETURN_RESTOCK',
            quantityChange: retItem.returnedQuantity,
            previousStock: prevStock,
            newStock,
            reason: `Restocked from Return on Bill #${bill.billNumber}: ${retItem.reason}`,
            referenceType: 'RETURN',
            referenceNumber: bill.billNumber,
            performedByUserId: user.id,
            performedByUserName: user.name,
          });
        }
      } else {
        // Damaged disposition: Log writeoff
        const product = await this.findProductById(billItem.productId);
        if (product) {
          await this.logInventoryMovement({
            productId: product._id.toString(),
            productName: product.name,
            sku: product.sku,
            variantInfo: billItem.variant ? `${billItem.variant.size} / ${billItem.variant.color}` : '',
            type: 'DAMAGE_WRITEOFF',
            quantityChange: 0, // not added back to stock
            previousStock: product.stockQuantity,
            newStock: product.stockQuantity,
            reason: `Damaged item written off from Return on Bill #${bill.billNumber}: ${retItem.reason}`,
            referenceType: 'RETURN',
            referenceNumber: bill.billNumber,
            performedByUserId: user.id,
            performedByUserName: user.name,
          });
        }
      }
    }

    // Determine new bill status
    const allItemsReturned = bill.items.every((it: any) => it.returnedQuantity >= it.quantity);
    bill.status = allItemsReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

    if (isConnected()) {
      await BillModel.findByIdAndUpdate(bill._id, {
        items: bill.items,
        status: bill.status,
      });
    } else {
      dbStore.updateById('bills', bill._id, {
        items: bill.items,
        status: bill.status,
      });
    }

    // Generate Return Number
    let retCount = 0;
    if (isConnected()) {
      retCount = await ReturnModel.countDocuments();
    } else {
      retCount = dbStore.count('returns');
    }
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const returnNumber = `RET-${dateStr}-${String(retCount + 1).padStart(4, '0')}`;

    const returnData = {
      returnNumber,
      billId: bill._id.toString(),
      billNumber: bill.billNumber,
      processedByUserId: user.id,
      processedByUserName: user.name,
      items: returnRecords,
      totalRefundAmount: Math.round(totalRefund * 100) / 100,
      refundPaymentMethod,
      notes,
    };

    let createdReturn: any;
    if (isConnected()) {
      const retDoc = new ReturnModel(returnData);
      createdReturn = await retDoc.save();
    } else {
      createdReturn = dbStore.insert('returns', returnData);
    }

    // Record in Ledger (Debit = Outflow / Refund)
    await this.recordLedgerEntry({
      type: 'REFUND',
      category: 'Customer Refunds',
      description: `Refund processed for Return #${returnNumber} (Original Bill #${bill.billNumber})`,
      debit: totalRefund,
      credit: 0,
      referenceType: 'RETURN',
      referenceId: createdReturn._id.toString(),
      referenceNumber: returnNumber,
      performedByUserId: user.id,
      performedByUserName: user.name,
    });

    return createdReturn;
  },

  async getReturns(billId?: string) {
    if (isConnected()) {
      const q = billId ? { billId } : {};
      return await ReturnModel.find(q).sort({ createdAt: -1 });
    }
    let list = dbStore.find<any>('returns');
    if (billId) list = list.filter(r => r.billId === billId);
    return list.reverse();
  },

  // LEDGER METHODS
  async recordLedgerEntry(entryData: {
    type: 'SALE' | 'REFUND' | 'EXPENSE' | 'STOCK_PURCHASE' | 'OPENING_BALANCE';
    category: string;
    description: string;
    debit: number;
    credit: number;
    referenceType: 'BILL' | 'RETURN' | 'MANUAL';
    referenceId?: string;
    referenceNumber?: string;
    performedByUserId: string;
    performedByUserName: string;
  }) {
    // Calculate running balance: Previous balance + credit - debit
    let latestBalance = 0;
    if (isConnected()) {
      const lastEntry = await LedgerEntryModel.findOne().sort({ createdAt: -1 });
      if (lastEntry) latestBalance = lastEntry.balance;
    } else {
      const entries = dbStore.find<any>('ledgerEntries');
      if (entries.length > 0) {
        latestBalance = entries[entries.length - 1].balance || 0;
      }
    }

    const newBalance = Math.round((latestBalance + entryData.credit - entryData.debit) * 100) / 100;
    const count = isConnected() ? await LedgerEntryModel.countDocuments() : dbStore.count('ledgerEntries');
    const entryNumber = `LED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    const fullDoc = {
      entryNumber,
      date: new Date(),
      ...entryData,
      balance: newBalance,
    };

    if (isConnected()) {
      const l = new LedgerEntryModel(fullDoc);
      return await l.save();
    }
    return dbStore.insert('ledgerEntries', fullDoc);
  },

  async getLedgerEntries(filters: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { type, startDate, endDate, page = 1, limit = 50 } = filters;

    if (isConnected()) {
      const q: any = {};
      if (type) q.type = type;
      if (startDate || endDate) {
        q.date = {};
        if (startDate) q.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          q.date.$lte = end;
        }
      }

      const total = await LedgerEntryModel.countDocuments(q);
      const entries = await LedgerEntryModel.find(q)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        entries,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    let list = dbStore.find<any>('ledgerEntries');
    if (type) list = list.filter(e => e.type === type);
    if (startDate) {
      const start = new Date(startDate).getTime();
      list = list.filter(e => new Date(e.date).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(e => new Date(e.date).getTime() <= end.getTime());
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      entries: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  // SETTINGS
  async getSettings() {
    if (isConnected()) {
      let s = await BusinessSettingModel.findOne();
      if (!s) {
        s = new BusinessSettingModel({});
        await s.save();
      }
      return s;
    }
    const settings = dbStore.find<any>('settings');
    if (settings.length > 0) return settings[0];
    const defaultSettings = {
      businessName: 'CloudHouse Silks & Apparels',
      tagline: 'Finest Handlooms, Textiles & Ready-to-Wear',
      address: 'Shop No. 42, Textile Market Road, T. Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      phone: '+91 98401 23456',
      email: 'billing@cloudhousetextiles.com',
      gstin: '33AABCC1234F1Z8',
      currencyCode: 'INR',
      currencySymbol: '₹',
      defaultTaxRate: 5,
      maxDiscountPercent: 40,
      timezone: 'Asia/Kolkata',
      receiptHeader: 'TAX INVOICE - CLOUDHOUSE TEXTILES',
      receiptFooter: 'Thank you for shopping with us! No cash refunds. Exchanges accepted within 7 days with original tag & receipt.',
    };
    return dbStore.insert('settings', defaultSettings);
  },

  async updateSettings(updates: any, user: { id: string; name: string }) {
    if (isConnected()) {
      let s = await BusinessSettingModel.findOne();
      if (!s) {
        s = new BusinessSettingModel({ ...updates, updatedBy: user.name });
        return await s.save();
      }
      return await BusinessSettingModel.findByIdAndUpdate(
        s._id,
        { ...updates, updatedBy: user.name },
        { new: true }
      );
    }
    const settings = dbStore.find<any>('settings');
    if (settings.length > 0) {
      return dbStore.updateById('settings', settings[0]._id, { ...updates, updatedBy: user.name });
    }
    return dbStore.insert('settings', { ...updates, updatedBy: user.name });
  },

  // REPORTS & DASHBOARD METRICS
  async getDashboardMetrics() {
    // Bills
    const allBills = isConnected() ? await BillModel.find() : dbStore.find<any>('bills');
    const allReturns = isConnected() ? await ReturnModel.find() : dbStore.find<any>('returns');
    const allProducts = isConnected() ? await ProductModel.find() : dbStore.find<any>('products');

    const totalSalesGross = allBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalRefunds = allReturns.reduce((acc, r) => acc + (r.totalRefundAmount || 0), 0);
    const netSales = Math.round((totalSalesGross - totalRefunds) * 100) / 100;
    const completedBillsCount = allBills.length;
    const productCount = allProducts.filter(p => p.isActive).length;
    const lowStockCount = allProducts.filter(
      p => p.isActive && (p.stockQuantity || 0) <= (p.reorderThreshold || 5)
    ).length;

    // Recent 5 transactions
    const recentBills = [...allBills]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Sales trend (Last 7 days)
    const last7Days: { date: string; label: string; sales: number; bills: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayBills = allBills.filter(b => b.date && new Date(b.date).toISOString().slice(0, 10) === dateStr);
      const daySales = dayBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      last7Days.push({
        date: dateStr,
        label,
        sales: Math.round(daySales),
        bills: dayBills.length,
      });
    }

    return {
      totalSalesGross: Math.round(totalSalesGross * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      netSales,
      completedBillsCount,
      productCount,
      lowStockCount,
      returnsCount: allReturns.length,
      recentBills,
      salesTrend: last7Days,
    };
  },

  async getReports(period: 'daily' | 'weekly' | 'monthly' | 'custom', startDate?: string, endDate?: string) {
    const allBills = isConnected() ? await BillModel.find() : dbStore.find<any>('bills');
    const allReturns = isConnected() ? await ReturnModel.find() : dbStore.find<any>('returns');
    const allProducts = isConnected() ? await ProductModel.find() : dbStore.find<any>('products');

    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date();

    if (period === 'daily') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'weekly') {
      filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else {
      filterStart = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (endDate) {
        filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
      }
    }

    const filteredBills = allBills.filter(b => {
      const d = new Date(b.date).getTime();
      return d >= filterStart.getTime() && d <= filterEnd.getTime();
    });

    const filteredReturns = allReturns.filter(r => {
      const d = new Date(r.createdAt || r.date).getTime();
      return d >= filterStart.getTime() && d <= filterEnd.getTime();
    });

    const grossSales = Math.round(filteredBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0) * 100) / 100;
    const discountsGiven = Math.round(filteredBills.reduce((acc, b) => acc + (b.discountTotal || 0), 0) * 100) / 100;
    const taxCollected = Math.round(filteredBills.reduce((acc, b) => acc + (b.taxTotal || 0), 0) * 100) / 100;
    const refundsTotal = Math.round(filteredReturns.reduce((acc, r) => acc + (r.totalRefundAmount || 0), 0) * 100) / 100;
    const netSales = Math.round((grossSales - refundsTotal) * 100) / 100;
    const billCount = filteredBills.length;
    const averageBillValue = billCount > 0 ? Math.round((grossSales / billCount) * 100) / 100 : 0;

    // Payment method breakdown
    const paymentBreakdown: Record<string, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
    };
    for (const b of filteredBills) {
      const m = b.paymentMethod || 'CASH';
      if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 };
      paymentBreakdown[m].count += 1;
      paymentBreakdown[m].amount = Math.round((paymentBreakdown[m].amount + b.totalAmount) * 100) / 100;
    }

    // Staff sales breakdown
    const staffSales: Record<string, { cashierName: string; billCount: number; totalSales: number }> = {};
    for (const b of filteredBills) {
      const id = b.cashierId || 'unknown';
      if (!staffSales[id]) {
        staffSales[id] = { cashierName: b.cashierName || 'Staff', billCount: 0, totalSales: 0 };
      }
      staffSales[id].billCount += 1;
      staffSales[id].totalSales = Math.round((staffSales[id].totalSales + b.totalAmount) * 100) / 100;
    }

    // Best-selling products
    const productSoldMap: Record<string, { name: string; sku: string; quantitySold: number; revenue: number }> = {};
    for (const b of filteredBills) {
      for (const it of b.items || []) {
        if (!productSoldMap[it.productId]) {
          productSoldMap[it.productId] = {
            name: it.productName,
            sku: it.sku,
            quantitySold: 0,
            revenue: 0,
          };
        }
        productSoldMap[it.productId].quantitySold += it.quantity;
        productSoldMap[it.productId].revenue =
          Math.round((productSoldMap[it.productId].revenue + it.lineTotal) * 100) / 100;
      }
    }
    const bestSelling = Object.values(productSoldMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Low-stock products
    const lowStockProducts = allProducts
      .filter(p => p.isActive && (p.stockQuantity || 0) <= (p.reorderThreshold || 5))
      .map(p => ({
        id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        categoryName: p.categoryName || 'Textiles',
        stockQuantity: p.stockQuantity,
        reorderThreshold: p.reorderThreshold,
        sellingPrice: p.sellingPrice,
      }));

    return {
      period,
      filterStart: filterStart.toISOString(),
      filterEnd: filterEnd.toISOString(),
      summary: {
        grossSales,
        discountsGiven,
        taxCollected,
        refundsTotal,
        netSales,
        billCount,
        averageBillValue,
      },
      paymentBreakdown,
      staffSales: Object.values(staffSales),
      bestSelling,
      lowStockProducts,
    };
  },
};
