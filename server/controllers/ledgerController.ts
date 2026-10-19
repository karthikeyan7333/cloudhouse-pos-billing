import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const ledgerController = {
  async getEntries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, page, limit } = req.query;

      const result = await dataService.getLedgerEntries({
        type: type as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('Fetch ledger entries error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve ledger entries' });
    }
  },

  async addManualEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, category, description, amount, isCredit } = req.body;

      if (!type || !category || !description || amount === undefined || Number(amount) <= 0) {
        res.status(400).json({ success: false, message: 'Type, category, description, and valid positive amount are required.' });
        return;
      }

      const user = req.user || { id: 'admin', name: 'Administrator' };
      const numAmount = Number(amount);

      const entry = await dataService.recordLedgerEntry({
        type,
        category: category.trim(),
        description: description.trim(),
        debit: isCredit ? 0 : numAmount,
        credit: isCredit ? numAmount : 0,
        referenceType: 'MANUAL',
        performedByUserId: user.id,
        performedByUserName: user.name,
      });

      res.status(201).json({ success: true, message: 'Ledger entry recorded successfully', entry });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to record ledger entry' });
    }
  },
};
