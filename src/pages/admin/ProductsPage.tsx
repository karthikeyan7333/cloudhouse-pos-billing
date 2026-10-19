import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  History,
  AlertTriangle,
  RotateCcw,
  Shirt,
  X,
  Package,
} from 'lucide-react';
import { Product, ProductVariant, Category, Supplier, InventoryMovement } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { Pagination } from '../../components/common/Pagination.js';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    barcode: string;
    category: string;
    categoryName: string;
    description: string;
    material: string;
    variants: ProductVariant[];
    costPrice: number;
    sellingPrice: number;
    stockQuantity: number;
    reorderThreshold: number;
    supplier: string;
    supplierName: string;
    taxRate: number;
    isActive: boolean;
  }>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    categoryName: '',
    description: '',
    material: '',
    variants: [],
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    reorderThreshold: 5,
    supplier: '',
    supplierName: '',
    taxRate: 5,
    isActive: true,
  });

  // Stock Adjustment Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustVariantSku, setAdjustVariantSku] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Movements Audit History Modal
  const [movementModalProduct, setMovementModalProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Status Toggle Confirm
  const [toggleProduct, setToggleProduct] = useState<Product | null>(null);

  const { success, error } = useNotification();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        search,
        category: categoryFilter,
        supplier: supplierFilter,
        stockStatus: stockStatusFilter,
      });

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch {
      error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, categoryFilter, supplierFilter, stockStatusFilter, error]);

  const fetchDependencies = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.categories);
      if (supsRes.data.success) setSuppliers(supsRes.data.suppliers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Add Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0]?._id || '',
      categoryName: categories[0]?.name || '',
      description: '',
      material: '',
      variants: [
        { size: 'M', color: 'Navy Blue', sku: `SKU-${Date.now().toString().slice(-4)}-M`, stock: 10 },
      ],
      costPrice: 500,
      sellingPrice: 1200,
      stockQuantity: 10,
      reorderThreshold: 5,
      supplier: suppliers[0]?._id || '',
      supplierName: suppliers[0]?.name || '',
      taxRate: 5,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      categoryName: p.categoryName || '',
      description: p.description || '',
      material: p.material || '',
      variants: p.variants && p.variants.length > 0 ? [...p.variants] : [],
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stockQuantity: p.stockQuantity,
      reorderThreshold: p.reorderThreshold,
      supplier: p.supplier || '',
      supplierName: p.supplierName || '',
      taxRate: p.taxRate,
      isActive: p.isActive,
    });
    setIsModalOpen(true);
  };

  // Variant Rows Management
  const addVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: 'L',
          color: 'White',
          sku: `${prev.sku || 'SKU'}-${prev.variants.length + 1}`,
          stock: 5,
        },
      ],
    }));
  };

  const removeVariantRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariantRow = (index: number, field: keyof ProductVariant, val: any) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, variants: updated };
    });
  };

  // Submit Product Create / Edit
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.category || !formData.sellingPrice) {
      error('Please fill all required product fields.');
      return;
    }

    try {
      const payload = {
        ...formData,
        categoryName: categories.find((c) => c._id === formData.category)?.name || formData.categoryName,
        supplierName: suppliers.find((s) => s._id === formData.supplier)?.name || formData.supplierName,
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.data.success) {
          success('Product updated successfully.');
          setIsModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data.success) {
          success('Product created successfully.');
          setIsModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save product.');
    }
  };

  // Handle Toggle Active/Inactive
  const handleConfirmToggle = async () => {
    if (!toggleProduct) return;
    try {
      const res = await api.patch(`/products/${toggleProduct._id}/toggle-status`);
      if (res.data.success) {
        success(res.data.message);
        setToggleProduct(null);
        fetchProducts();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Open Stock Adjust
  const handleOpenAdjust = (p: Product) => {
    setAdjustModalProduct(p);
    setAdjustVariantSku(p.variants?.[0]?.sku || '');
    setAdjustQuantity(p.variants?.[0]?.stock ?? p.stockQuantity);
    setAdjustReason('Physical stock audit count');
  };

  const handleSaveStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    try {
      const res = await api.post(`/products/${adjustModalProduct._id}/adjust-stock`, {
        variantSku: adjustVariantSku || null,
        newQuantity: Number(adjustQuantity),
        reason: adjustReason.trim(),
      });

      if (res.data.success) {
        success('Stock adjusted and audit record logged.');
        setAdjustModalProduct(null);
        fetchProducts();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to adjust stock.');
    }
  };

  // View Stock Audit Movements
  const handleViewMovements = async (p: Product) => {
    setMovementModalProduct(p);
    setIsLoadingMovements(true);
    try {
      const res = await api.get(`/products/${p._id}/movements`);
      if (res.data.success) {
        setMovements(res.data.movements);
      }
    } catch {
      error('Failed to load inventory movements');
    } finally {
      setIsLoadingMovements(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Catalog & Inventory Control
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Textile & Garment Products
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage fabrics, apparel, multi-size/color variants, pricing, barcodes, and stock audit trails.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, SKU, or barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="low_stock">Low Stock (≤ Threshold)</option>
            <option value="out_of_stock">Out of Stock (=0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Cost Price</th>
                <th className="px-5 py-3.5">Selling Price</th>
                <th className="px-5 py-3.5">Stock & Variants</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#173C72] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No products match your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try resetting filters or adding a new product</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stockQuantity <= p.reorderThreshold && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      {/* Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 leading-snug">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-[#173C72]">SKU: {p.sku}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {p.categoryName || 'Textiles'}
                      </td>

                      {/* Cost Price */}
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        ₹{p.costPrice.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900 text-sm">
                        ₹{p.sellingPrice.toFixed(2)}
                        <span className="text-[10px] text-slate-400 block font-sans font-normal">
                          GST {p.taxRate}%
                        </span>
                      </td>

                      {/* Stock & Variants */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isOut
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {p.stockQuantity} units
                          </span>
                        </div>
                        {p.variants && p.variants.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            {p.variants.length} variant(s): {p.variants.map((v) => `${v.size}/${v.color}`).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                          title="Audit Stock Adjustment"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleViewMovements(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="View Inventory Movements"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setToggleProduct(p)}
                          className={`p-1.5 rounded-lg transition ${
                            p.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={p.isActive ? 'Deactivate Product' : 'Activate Product'}
                        >
                          {p.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={15}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Textile Product'}
        subtitle="Specify product attributes, pricing, and size/color variant combinations"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kanchipuram Pure Silk Saree"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary SKU *</label>
              <input
                type="text"
                required
                disabled={!!editingProduct}
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. SILK-KNC-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Barcode (Optional)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 890123400001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Material / Fabric</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g. 100% Pure Mulberry Silk"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Cost Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">GST Tax Rate (%)</label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% (Standard Textiles &lt; ₹1000)</option>
                <option value={12}>12% (Textiles &gt; ₹1000)</option>
                <option value={18}>18% (Luxury Fabrics & Accessories)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reorder Alert Threshold</label>
              <input
                type="number"
                min="0"
                value={formData.reorderThreshold}
                onChange={(e) => setFormData({ ...formData, reorderThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Garment weave details, wash care instructions, etc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Textile Variants Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Textile Size & Color Variants
                </label>
                <p className="text-[11px] text-slate-500">
                  Total product stock will automatically calculate from variant sums.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl text-xs">
                  <input
                    type="text"
                    placeholder="Size (e.g. 38, M, Free Size)"
                    value={v.size}
                    onChange={(e) => updateVariantRow(idx, 'size', e.target.value)}
                    className="w-1/4 px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Color (e.g. Royal Red)"
                    value={v.color}
                    onChange={(e) => updateVariantRow(idx, 'color', e.target.value)}
                    className="w-1/4 px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Variant SKU"
                    value={v.sku}
                    onChange={(e) => updateVariantRow(idx, 'sku', e.target.value.toUpperCase())}
                    className="w-1/4 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={v.stock}
                    onChange={(e) => updateVariantRow(idx, 'stock', parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariantRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <Modal
          isOpen={!!adjustModalProduct}
          onClose={() => setAdjustModalProduct(null)}
          title={`Stock Audit Adjustment: ${adjustModalProduct.name}`}
          subtitle="Record manual inventory correction with compulsory audit reason"
          maxWidth="md"
        >
          <form onSubmit={handleSaveStockAdjust} className="space-y-4 text-xs">
            {adjustModalProduct.variants && adjustModalProduct.variants.length > 0 && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Variant</label>
                <select
                  value={adjustVariantSku}
                  onChange={(e) => {
                    setAdjustVariantSku(e.target.value);
                    const v = adjustModalProduct.variants.find((vr) => vr.sku === e.target.value);
                    if (v) setAdjustQuantity(v.stock);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {adjustModalProduct.variants.map((v) => (
                    <option key={v.sku} value={v.sku}>
                      {v.size} / {v.color} (Current stock: {v.stock})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">New Actual Physical Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Adjustment Reason (Audit Required) *</label>
              <textarea
                required
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Periodic stock audit physical count discrepancy correction"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Confirm Stock Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Movement Audit History Modal */}
      {movementModalProduct && (
        <Modal
          isOpen={!!movementModalProduct}
          onClose={() => setMovementModalProduct(null)}
          title={`Inventory Audit Trail: ${movementModalProduct.name}`}
          subtitle={`SKU: ${movementModalProduct.sku}`}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            {isLoadingMovements ? (
              <div className="py-8 text-center text-slate-400">Loading audit log...</div>
            ) : movements.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No stock movements recorded yet.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {movements.map((m) => (
                  <div key={m._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">{m.type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(m.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{m.reason}</span>
                      <span
                        className={`font-mono font-bold ${
                          m.quantityChange > 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} units
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Stock: {m.previousStock} → {m.newStock}</span>
                      <span>By: {m.performedByUserName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={!!toggleProduct}
        onClose={() => setToggleProduct(null)}
        onConfirm={handleConfirmToggle}
        title={toggleProduct?.isActive ? 'Deactivate Product?' : 'Activate Product?'}
        message={
          toggleProduct?.isActive
            ? `Are you sure you want to deactivate "${toggleProduct?.name}"? It will no longer be available for sale in the POS terminal, but historical bills will remain intact.`
            : `Are you sure you want to re-activate "${toggleProduct?.name}"?`
        }
        confirmLabel={toggleProduct?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={toggleProduct?.isActive}
      />
    </div>
  );
};
