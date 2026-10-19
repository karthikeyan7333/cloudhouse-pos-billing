import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  AlertCircle,
  Receipt,
  User,
  Phone,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Product, ProductVariant, Bill, BusinessSettings } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';
import { Modal } from '../../components/common/Modal.js';

interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  discountPercentage: number;
}

export const PosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Variant Selection Modal
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [chosenVariant, setChosenVariant] = useState<ProductVariant | null>(null);

  // Checkout Status & Receipt Modal
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const { success, error, info } = useNotification();

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, setRes] = await Promise.all([
        api.get('/products?limit=100&stockStatus=in_stock'),
        api.get('/categories'),
        api.get('/settings'),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
      }
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
      if (setRes.data.success) {
        setSettings(setRes.data.settings);
      }
    } catch (err) {
      error('Failed to load catalog data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    searchInputRef.current?.focus();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        p.categoryName === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(q) || v.barcode?.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle Barcode enter key instant add
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const res = await api.get(`/products/lookup/${encodeURIComponent(searchQuery.trim())}`);
        if (res.data.success && res.data.product) {
          handleSelectProduct(res.data.product);
          setSearchQuery('');
        }
      } catch {
        info(`No direct barcode match for "${searchQuery}". Showing search results.`);
      }
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (!product.isActive) {
      error('This product is inactive.');
      return;
    }

    if (product.variants && product.variants.length > 0) {
      setVariantModalProduct(product);
      setChosenVariant(product.variants[0]);
    } else {
      addToCart(product, undefined);
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const maxStock = variant ? variant.stock : product.stockQuantity;

    if (maxStock <= 0) {
      error(`"${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product._id === product._id &&
          ((!item.selectedVariant && !variant) ||
            item.selectedVariant?.sku === variant?.sku)
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty + 1 > maxStock) {
          error(`Stock limit reached! Only ${maxStock} units available.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { product, selectedVariant: variant, quantity: 1, discountPercentage: 0 }];
      }
    });

    setVariantModalProduct(null);
  };

  const updateQuantity = (index: number, newQty: number) => {
    const item = cart[index];
    const maxStock = item.selectedVariant ? item.selectedVariant.stock : item.product.stockQuantity;

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (newQty > maxStock) {
      error(`Cannot add more than ${maxStock} units of this item.`);
      return;
    }

    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const updateItemDiscount = (index: number, discount: number) => {
    const validDiscount = Math.min(Math.max(Number(discount) || 0, 0), settings?.maxDiscountPercent || 30);
    setCart((prev) => {
      const updated = [...prev];
      updated[index].discountPercentage = validDiscount;
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered('');
    setCustomerName('');
    setCustomerPhone('');
  };

  // Cart Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const defaultTaxRate = settings?.defaultTaxRate ?? 5;

    for (const item of cart) {
      const unitPrice = item.product.sellingPrice;
      const base = unitPrice * item.quantity;
      const discount = (base * (item.discountPercentage / 100));
      const taxable = base - discount;
      const taxRate = item.product.taxRate || defaultTaxRate;
      const tax = (taxable * (taxRate / 100));

      subtotal += base;
      discountTotal += discount;
      taxTotal += tax;
    }

    const finalAmount = Math.max(0, subtotal - discountTotal + taxTotal);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      totalUnits: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart, settings]);

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === 'CASH' ? Math.max(0, tenderedNum - totals.finalAmount) : 0;

  // Checkout Action
  const handleCheckout = async () => {
    if (cart.length === 0) {
      error('Cart is empty. Add products to generate a bill.');
      return;
    }

    if (paymentMethod === 'CASH' && tenderedNum < totals.finalAmount) {
      error(`Tendered amount (₹${tenderedNum}) is less than total (₹${totals.finalAmount}).`);
      return;
    }

    setIsCheckingOut(true);

    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.product._id,
          variantSku: i.selectedVariant?.sku,
          quantity: i.quantity,
          discountPercentage: i.discountPercentage,
        })),
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? tenderedNum : totals.finalAmount,
        notes: `POS Register checkout - ${paymentMethod}`,
      };

      const res = await api.post('/billing/checkout', payload);

      if (res.data.success && res.data.bill) {
        success(`Bill #${res.data.bill.billNumber} created successfully!`);
        setLastBill(res.data.bill);
        setShowReceiptModal(true);
        clearCart();
        loadData(); // refresh stocks
      } else {
        error(res.data.message || 'Checkout failed.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Checkout failed. Please check product stock.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* LEFT: Product Catalog & Search (65% width) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search textile name, SKU, or scan barcode..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition"
            />
            <Barcode className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:block" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#173C72] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat._id
                    ? 'bg-[#173C72] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#173C72] mb-2" />
              <p className="text-xs font-medium">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try another keyword or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const hasVariants = p.variants && p.variants.length > 0;
                const isOutOfStock = p.stockQuantity <= 0;

                return (
                  <div
                    key={p._id}
                    onClick={() => !isOutOfStock && handleSelectProduct(p)}
                    className={`bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-between transition-all select-none ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-slate-50'
                        : 'hover:shadow-md hover:border-blue-400 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-600'
                              : p.stockQuantity <= p.reorderThreshold
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${p.stockQuantity} in stock`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      {p.material && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.material}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-[#173C72]">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[9px] text-slate-400">GST {p.taxRate}% incl.</div>
                      </div>

                      <span
                        className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          hasVariants
                            ? 'bg-blue-50 text-[#2563EB] hover:bg-blue-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {hasVariants ? 'Options' : <Plus className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Bill Cart & Instant Checkout (35% width) */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col h-full shrink-0 shadow-lg border-l border-slate-200">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#173C72]" />
            <h3 className="text-sm font-bold text-slate-800">Current Bill Register</h3>
            <span className="text-xs font-bold bg-[#173C72] text-white px-2 py-0.5 rounded-full">
              {totals.totalUnits} items
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Details Strip */}
        <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Mobile Number"
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">Cart is empty</p>
              <p className="text-[11px] text-slate-400">Click products or scan barcode to add</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="font-bold text-slate-800 leading-tight">{item.product.name}</h5>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>SKU: {item.selectedVariant?.sku || item.product.sku}</span>
                      {item.selectedVariant && (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-1 rounded">
                          {item.selectedVariant.size} • {item.selectedVariant.color}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{(item.product.sellingPrice * item.quantity).toFixed(2)}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      ₹{item.product.sellingPrice} each
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-0.5">
                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line discount */}
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      max={settings?.maxDiscountPercent || 30}
                      value={item.discountPercentage || ''}
                      onChange={(e) => updateItemDiscount(idx, parseFloat(e.target.value))}
                      placeholder="Disc %"
                      className="w-14 px-1.5 py-0.5 text-[11px] bg-white border border-slate-200 rounded text-center focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500">% off</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Checkout Dock */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
          {/* Subtotal, Tax, Discount */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Total:</span>
                <span>-₹{totals.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST (Taxes Collected):</span>
              <span>₹{totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[#173C72] pt-1.5 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>₹{totals.finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Payment Method
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-[#173C72] text-white border-[#173C72]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-[#173C72] text-white border-[#173C72]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#173C72] text-white border-[#173C72]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered & Change Due (When Cash is Selected) */}
          {paymentMethod === 'CASH' && (
            <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Cash Received (₹):</span>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={`Min ₹${totals.finalAmount}`}
                  className="w-28 px-2 py-1 text-right text-xs font-bold border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Change Due:</span>
                <span className="text-emerald-700">₹{changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0}
            className="w-full py-3 bg-[#16A34A] hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Bill & Print Receipt (₹{totals.finalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Textile Variant Selection Modal */}
      {variantModalProduct && (
        <Modal
          isOpen={!!variantModalProduct}
          onClose={() => setVariantModalProduct(null)}
          title={`Select Variant - ${variantModalProduct.name}`}
          subtitle="Choose size & color option to add to bill"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Price: <span className="font-bold text-slate-900">₹{variantModalProduct.sellingPrice}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Available Variant Options:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {variantModalProduct.variants.map((v) => {
                  const isSelected = chosenVariant?.sku === v.sku;
                  const isOut = v.stock <= 0;

                  return (
                    <button
                      key={v.sku}
                      type="button"
                      disabled={isOut}
                      onClick={() => setChosenVariant(v)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : isOut
                          ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">
                          Size: {v.size} • Color: {v.color}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {v.sku}</div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOut ? 'Out of stock' : `${v.stock} in stock`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!chosenVariant || chosenVariant.stock <= 0}
                onClick={() => chosenVariant && addToCart(variantModalProduct, chosenVariant)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl disabled:opacity-50"
              >
                Add Variant to Bill
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        bill={lastBill}
        settings={settings}
      />
    </div>
  );
};
