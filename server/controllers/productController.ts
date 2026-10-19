import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const productController = {
  async getProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, category, supplier, stockStatus, page, limit, sortBy, sortOrder } = req.query;

      const result = await dataService.getProducts({
        search: search as string,
        category: category as string,
        supplier: supplier as string,
        stockStatus: stockStatus as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as any) || 'desc',
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
  },

  async getProductById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await dataService.findProductById(id);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.status(200).json({ success: true, product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Error retrieving product' });
    }
  },

  async lookupCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      if (!code) {
        res.status(400).json({ success: false, message: 'Code required' });
        return;
      }
      const product = await dataService.findProductBySkuOrBarcode(code);
      if (!product) {
        res.status(404).json({ success: false, message: `No product found for SKU / Barcode: "${code}"` });
        return;
      }
      res.status(200).json({ success: true, product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Error looking up product code' });
    }
  },

  async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, sku, barcode, category, categoryName, description, material, variants, costPrice, sellingPrice, stockQuantity, reorderThreshold, supplier, supplierName, taxRate } = req.body;

      if (!name || !sku || !category || sellingPrice === undefined) {
        res.status(400).json({ success: false, message: 'Name, SKU, category, and selling price are required.' });
        return;
      }

      // Check unique SKU
      const existing = await dataService.findProductBySkuOrBarcode(sku);
      if (existing) {
        res.status(400).json({ success: false, message: `Product with SKU "${sku}" already exists.` });
        return;
      }

      const user = req.user || { id: 'admin', name: 'Administrator' };
      const product = await dataService.createProduct(
        {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          barcode: barcode?.trim() || '',
          category,
          categoryName,
          description: description?.trim() || '',
          material: material?.trim() || '',
          variants: Array.isArray(variants) ? variants : [],
          costPrice: Number(costPrice || 0),
          sellingPrice: Number(sellingPrice),
          stockQuantity: Number(stockQuantity || 0),
          reorderThreshold: Number(reorderThreshold ?? 5),
          supplier,
          supplierName,
          taxRate: Number(taxRate ?? 5),
          isActive: true,
        },
        user
      );

      res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (err: any) {
      console.error('Create product error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to create product' });
    }
  },

  async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existing = await dataService.findProductById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      const updated = await dataService.updateProduct(id, updates);
      res.status(200).json({ success: true, message: 'Product updated successfully', product: updated });
    } catch (err: any) {
      console.error('Update product error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to update product' });
    }
  },

  async adjustStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { variantSku, newQuantity, reason } = req.body;

      if (newQuantity === undefined || newQuantity < 0) {
        res.status(400).json({ success: false, message: 'Valid non-negative new quantity is required.' });
        return;
      }

      if (!reason || !reason.trim()) {
        res.status(400).json({ success: false, message: 'Audit reason is required for stock adjustment.' });
        return;
      }

      const user = req.user || { id: 'admin', name: 'Administrator' };
      const product = await dataService.adjustStock(
        id,
        variantSku || null,
        Number(newQuantity),
        reason.trim(),
        user
      );

      res.status(200).json({ success: true, message: 'Stock adjusted and audit movement logged', product });
    } catch (err: any) {
      console.error('Adjust stock error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to adjust stock' });
    }
  },

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await dataService.toggleProductStatus(id);
      res.status(200).json({
        success: true,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
        product,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to toggle product status' });
    }
  },

  async getMovements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const movements = await dataService.getInventoryMovements(id === 'all' ? undefined : id);
      res.status(200).json({ success: true, movements });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve inventory movements' });
    }
  },
};
