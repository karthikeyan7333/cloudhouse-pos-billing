import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const settingsController = {
  async getSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await dataService.getSettings();
      res.status(200).json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve settings' });
    }
  },

  async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user || { id: 'admin', name: 'Administrator' };
      const updates = req.body;

      const updated = await dataService.updateSettings(updates, user);
      res.status(200).json({ success: true, message: 'Business settings updated successfully', settings: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update settings' });
    }
  },
};
