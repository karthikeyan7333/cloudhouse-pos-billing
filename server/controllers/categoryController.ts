import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const categoryController = {
  async getCategories(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await dataService.getAllCategories();
      res.status(200).json({ success: true, categories });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  },

  async createCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, code, description } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Category name and code are required.' });
        return;
      }

      const category = await dataService.createCategory({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || '',
        isActive: true,
      });

      res.status(201).json({ success: true, message: 'Category created successfully', category });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create category' });
    }
  },

  async updateCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, description, isActive } = req.body;

      const updated = await dataService.updateCategory(id, {
        name: name?.trim(),
        code: code?.trim().toUpperCase(),
        description: description?.trim(),
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(200).json({ success: true, message: 'Category updated successfully', category: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update category' });
    }
  },

  async deleteCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await dataService.deleteCategory(id);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to delete category' });
    }
  },
};
