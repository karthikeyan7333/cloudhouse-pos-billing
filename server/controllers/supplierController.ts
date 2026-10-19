import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const supplierController = {
  async getSuppliers(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const suppliers = await dataService.getAllSuppliers();
      res.status(200).json({ success: true, suppliers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
    }
  },

  async createSupplier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, code, contactPerson, email, phone, address, gstin, notes } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Supplier name and code are required.' });
        return;
      }

      const supplier = await dataService.createSupplier({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPerson: contactPerson?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        gstin: gstin?.trim().toUpperCase(),
        notes: notes?.trim(),
        isActive: true,
      });

      res.status(201).json({ success: true, message: 'Supplier created successfully', supplier });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create supplier' });
    }
  },

  async updateSupplier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await dataService.updateSupplier(id, updates);
      res.status(200).json({ success: true, message: 'Supplier updated successfully', supplier: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update supplier' });
    }
  },

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const supplier = await dataService.findSupplierById(id);
      if (!supplier) {
        res.status(404).json({ success: false, message: 'Supplier not found' });
        return;
      }
      const updated = await dataService.updateSupplier(id, { isActive: !supplier.isActive });
      res.status(200).json({
        success: true,
        message: `Supplier ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        supplier: updated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to toggle supplier' });
    }
  },
};
