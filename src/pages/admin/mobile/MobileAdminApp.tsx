import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  ShoppingCart,
  RotateCcw,
  Menu,
  Tags,
  Users,
  Truck,
  Receipt,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  Printer,
  X,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import { useNotification } from '../../../context/NotificationContext.js';
import { api } from '../../../services/api.js';
import { DashboardMetrics, Product, Bill } from '../../../types/index.js';
import { ReceiptModal } from '../../../components/common/ReceiptModal.js';
import { Modal } from '../../../components/common/Modal.js';

type MobileTab =
  | 'dashboard'
  | 'products'
  | 'returns'
  | 'transactions'
  | 'ledger'
  | 'categories'
  | 'staff'
  | 'suppliers'
  | 'reports'
  | 'settings'
  | 'more';

export const MobileAdminApp: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const [activeTab, setActiveTab] = useState<MobileTab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search in Mobile Products
  const [prodSearch, setProdSearch] = useState('');

  // Mobile Return lookup
  const [returnBillInput, setReturnBillInput] = useState('');
  const [mobileFoundBill, setMobileFoundBill] = useState<Bill | null>(null);

  // Reprint Receipt Modal
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  // Quick Add Product Sheet
  const [showAddProductSheet, setShowAddProductSheet] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdCategory, setNewProdCategory] = useState('');

  // Load Dashboard Data
  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [mRes, bRes, sRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/billing/bills?limit=10'),
        api.get('/settings'),
      ]);
      if (mRes.data.success) setMetrics(mRes.data.metrics);
      if (bRes.data.success) setBills(bRes.data.bills);
      if (sRes.data.success) setSettings(sRes.data.settings);
    } catch {
      console.warn('Dashboard load error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Products
  const loadProducts = async () => {
    try {
      const res = await api.get('/products?limit=50');
      if (res.data.success) setProducts(res.data.products);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Other Modules on demand
  const loadModuleData = async (tab: MobileTab) => {
    try {
      if (tab === 'categories') {
        const res = await api.get('/categories');
        if (res.data.success) setCategories(res.data.categories);
      } else if (tab === 'staff') {
        const res = await api.get('/staff');
        if (res.data.success) setStaffList(res.data.users);
      } else if (tab === 'suppliers') {
        const res = await api.get('/suppliers');
        if (res.data.success) setSuppliers(res.data.suppliers);
      } else if (tab === 'ledger') {
        const res = await api.get('/ledger?limit=30');
        if (res.data.success) setLedgerEntries(res.data.entries);
      } else if (tab === 'reports') {
        const res = await api.get('/reports/analytics?period=monthly');
        if (res.data.success) setReportData(res.data.reports);
      } else if (tab === 'transactions') {
        const res = await api.get('/billing/bills?limit=30');
        if (res.data.success) setBills(res.data.bills);
      }
    } catch (err) {
      console.warn('Error loading module data:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadProducts();
  }, []);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    loadModuleData(tab);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Quick Mobile Add Product
  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || !newProdPrice) {
      error('Please fill required product fields.');
      return;
    }

    try {
      const catId = newProdCategory || categories[0]?._id || products[0]?.category;
      const res = await api.post('/products', {
        name: newProdName.trim(),
        sku: newProdSku.trim().toUpperCase(),
        sellingPrice: parseFloat(newProdPrice),
        costPrice: parseFloat(newProdPrice) * 0.6,
        stockQuantity: parseInt(newProdStock) || 0,
        category: catId,
        categoryName: 'Textiles & Apparels',
        variants: [
          { size: 'Standard', color: 'Assorted', sku: `${newProdSku}-STD`, stock: parseInt(newProdStock) || 0 },
        ],
        taxRate: 5,
        reorderThreshold: 5,
      });

      if (res.data.success) {
        success('Product added via mobile portal!');
        setShowAddProductSheet(false);
        setNewProdName('');
        setNewProdSku('');
        setNewProdPrice('');
        loadProducts();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add product');
    }
  };

  // Mobile Return Search
  const handleMobileFindBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBillInput.trim()) return;

    try {
      const res = await api.get(`/returns/find-bill?billNumber=${encodeURIComponent(returnBillInput.trim())}`);
      if (res.data.success && res.data.bill) {
        setMobileFoundBill(res.data.bill);
      } else {
        error('Bill not found');
      }
    } catch {
      error('Invoice not found');
    }
  };

  // Quick Return First Item
  const handleQuickReturn = async (bill: Bill, billItem: any) => {
    try {
      const res = await api.post('/returns', {
        billId: bill._id,
        itemsToReturn: [
          {
            billItemId: billItem._id || billItem.productId,
            returnedQuantity: 1,
            disposition: 'RESTOCK',
            reason: 'Mobile customer return / exchange',
          },
        ],
        refundPaymentMethod: 'CASH',
        notes: 'Processed on Mobile Admin Web App',
      });

      if (res.data.success) {
        success('Return processed and stock added back to inventory!');
        setMobileFoundBill(null);
        setReturnBillInput('');
        loadDashboard();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to process return');
    }
  };

  // Filtered products on mobile
  const mobileFilteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="flex justify-center bg-slate-900 min-h-screen sm:p-4">
      {/* Mobile Smartphone Frame Container */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[92vh] sm:rounded-[36px] shadow-2xl flex flex-col overflow-hidden border border-slate-700 relative">
        {/* Mobile Status Bar */}
        <div className="bg-[#173C72] text-white px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold select-none shrink-0">
          <span>9:41 AM</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-blue-200">POS Server Live</span>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="bg-[#173C72] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            {activeTab !== 'dashboard' && activeTab !== 'more' ? (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                CH
              </div>
            )}
            <div>
              <h2 className="text-sm font-extrabold leading-tight text-white">
                {activeTab === 'dashboard'
                  ? 'CloudHouse Admin'
                  : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <span className="text-[10px] text-blue-200">{user?.name} (Admin)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-blue-100 hover:bg-white/20"
              title="Switch to Desktop Admin"
            >
              Desktop
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-blue-200 hover:text-white"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Body Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-20">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Quick Launch POS Banner */}
              <div
                onClick={() => navigate('/pos')}
                className="bg-radial from-[#173C72] to-[#0f274a] text-white p-4 rounded-2xl shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                    Quick Cashier Checkout
                  </div>
                  <div className="text-base font-extrabold mt-0.5">Launch POS Register</div>
                  <div className="text-xs text-blue-100 mt-0.5">Scan, cart, calculate GST & bill</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-inner">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Gross Sales
                  </span>
                  <span className="text-lg font-extrabold text-[#173C72] font-mono mt-0.5 block">
                    ₹{(metrics?.totalSalesGross || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {metrics?.completedBillsCount || 0} bills completed
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Net Revenue
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">
                    ₹{(metrics?.netSales || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">After refunds</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Catalog
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {metrics?.productCount || 0} items
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Garments & fabrics</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Low Stock Alerts
                  </span>
                  <span className="text-lg font-extrabold text-amber-600 font-mono mt-0.5 block">
                    {metrics?.lowStockCount || 0} items
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">Near reorder level</span>
                </div>
              </div>

              {/* Recent Bills List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Customer Invoices
                  </h3>
                  <button
                    onClick={() => handleTabChange('transactions')}
                    className="text-xs font-bold text-blue-600"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {bills.slice(0, 4).map((b) => (
                    <div
                      key={b._id}
                      onClick={() => setReceiptBill(b)}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer active:bg-slate-100"
                    >
                      <div>
                        <div className="font-bold text-[#173C72]">{b.billNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {b.customerName} • {b.paymentMethod}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900">₹{b.totalAmount.toFixed(2)}</div>
                        <div className="text-[9px] text-emerald-600 font-semibold">{b.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    placeholder="Search textile or SKU..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={() => setShowAddProductSheet(true)}
                  className="p-2 bg-[#2563EB] text-white rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {mobileFilteredProducts.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {p.sku} • {p.categoryName || 'Apparel'}
                      </div>
                      <div className="text-xs font-extrabold text-[#173C72] mt-1">
                        ₹{p.sellingPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.stockQuantity <= p.reorderThreshold
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.stockQuantity} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RETURNS */}
          {activeTab === 'returns' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Lookup Invoice for Return / Exchange
                </h3>
                <form onSubmit={handleMobileFindBill} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={returnBillInput}
                    onChange={(e) => setReturnBillInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CH-20261019-0001"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#173C72] text-white font-bold text-xs rounded-xl"
                  >
                    Find
                  </button>
                </form>
              </div>

              {mobileFoundBill && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        Invoice #{mobileFoundBill.billNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">{mobileFoundBill.customerName}</div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{mobileFoundBill.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tap an item to process 1-unit refund & restock:
                    </span>
                    {mobileFoundBill.items.map((it, idx) => {
                      const remaining = it.quantity - (it.returnedQuantity || 0);
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{it.productName}</div>
                            <div className="text-[10px] text-slate-500">
                              Returnable: {remaining} of {it.quantity}
                            </div>
                          </div>
                          {remaining > 0 ? (
                            <button
                              onClick={() => handleQuickReturn(mobileFoundBill, it)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg"
                            >
                              Refund Unit
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              All returned
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="space-y-2 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                All Completed Invoices ({bills.length})
              </h3>
              {bills.map((b) => (
                <div
                  key={b._id}
                  onClick={() => setReceiptBill(b)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs cursor-pointer active:bg-slate-50"
                >
                  <div>
                    <div className="font-bold text-[#173C72]">{b.billNumber}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(b.date).toLocaleDateString('en-IN')} • {b.cashierName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">₹{b.totalAmount.toFixed(2)}</div>
                    <div className="text-[9px] text-blue-600 font-semibold">Tap to view/print</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-2 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Financial Double-Entry Ledger
              </h3>
              {ledgerEntries.map((e) => (
                <div
                  key={e._id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{e.category}</div>
                    <div className="text-[10px] text-slate-500">{e.description}</div>
                  </div>
                  <div className="text-right font-mono">
                    {e.credit > 0 && (
                      <span className="text-emerald-700 font-bold block">+₹{e.credit.toFixed(2)}</span>
                    )}
                    {e.debit > 0 && (
                      <span className="text-red-600 font-bold block">-₹{e.debit.toFixed(2)}</span>
                    )}
                    <span className="text-[10px] text-slate-400">Bal: ₹{e.balance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-2 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Product Categories ({categories.length})
              </h3>
              {categories.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">CODE: {c.code}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: STAFF */}
          {activeTab === 'staff' && (
            <div className="space-y-2 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Cashiers & Staff ({staffList.length})
              </h3>
              {staffList.map((s) => (
                <div
                  key={s.id || s._id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.email}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-2 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Textile Suppliers & Mills ({suppliers.length})
              </h3>
              {suppliers.map((sup) => (
                <div
                  key={sup._id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900">{sup.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {sup.code} • Contact: {sup.contactPerson || 'Direct'}
                  </div>
                  <div className="text-[10px] text-slate-500">{sup.phone}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 9: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Analytics (Monthly)
              </h3>
              {reportData && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Sales:</span>
                      <span className="font-bold text-slate-900">
                        ₹{reportData.summary.grossSales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST Collected:</span>
                      <span className="font-bold text-blue-700">
                        ₹{reportData.summary.taxCollected.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discounts Given:</span>
                      <span className="font-bold text-emerald-700">
                        -₹{reportData.summary.discountsGiven.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm border-t pt-1.5 text-[#173C72]">
                      <span>Net Sales:</span>
                      <span>₹{reportData.summary.netSales.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs animate-in fade-in">
              <h3 className="font-bold text-slate-900 text-sm">Store Configuration</h3>
              <div>
                <span className="font-semibold text-slate-500 block text-[10px]">Store Name:</span>
                <span className="font-bold text-slate-800">{settings?.businessName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[10px]">GSTIN:</span>
                <span className="font-bold text-slate-800 font-mono">{settings?.gstin}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[10px]">Contact:</span>
                <span className="text-slate-700">{settings?.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[10px]">Address:</span>
                <span className="text-slate-700">{settings?.address}</span>
              </div>
            </div>
          )}

          {/* TAB 11: MORE (DRAWER OF ALL MODULES) */}
          {activeTab === 'more' && (
            <div className="space-y-2 animate-in fade-in text-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                All Admin Modules
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
                <button
                  onClick={() => handleTabChange('transactions')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-[#173C72]">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Sales Invoices & Reprint</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('ledger')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Financial Ledger</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('categories')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                      <Tags className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Textile Categories</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('staff')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Staff & Cashiers</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('suppliers')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Suppliers & Mills</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('reports')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Analytics Reports</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabChange('settings')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800">Business Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full p-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out of Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar (5 Touch Tabs) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/90 flex items-center justify-around px-2 z-30 select-none shadow-lg">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'dashboard' ? 'text-[#173C72] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => handleTabChange('products')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'products' ? 'text-[#173C72] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shirt className="w-5 h-5" />
            <span className="text-[10px]">Products</span>
          </button>

          <button
            onClick={() => navigate('/pos')}
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] mt-1">POS</span>
          </button>

          <button
            onClick={() => handleTabChange('returns')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'returns' ? 'text-[#173C72] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px]">Returns</span>
          </button>

          <button
            onClick={() => handleTabChange('more')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'more' ? 'text-[#173C72] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>

        {/* Quick Add Product Sheet Modal */}
        <Modal
          isOpen={showAddProductSheet}
          onClose={() => setShowAddProductSheet(false)}
          title="Quick Add Product (Mobile)"
          maxWidth="sm"
        >
          <form onSubmit={handleQuickAddProduct} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="e.g. Silk Dupatta"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">SKU *</label>
              <input
                type="text"
                required
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value.toUpperCase())}
                placeholder="e.g. SILK-DUP-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="999"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock Qty *</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#2563EB] text-white font-bold rounded-xl"
              >
                Add to Inventory
              </button>
            </div>
          </form>
        </Modal>

        {/* Reprint Receipt Modal */}
        <ReceiptModal
          isOpen={!!receiptBill}
          onClose={() => setReceiptBill(null)}
          bill={receiptBill}
          settings={settings}
        />
      </div>
    </div>
  );
};
