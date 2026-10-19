import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const returnController = {
  async findBill(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { billNumber } = req.query;
      if (!billNumber) {
        res.status(400).json({ success: false, message: 'Bill number is required to search.' });
        return;
      }

      const bill = await dataService.findBillByNumber(billNumber as string);
      if (!bill) {
        res.status(404).json({ success: false, message: `Bill #${billNumber} not found.` });
        return;
      }

      const returns = await dataService.getReturns(bill._id.toString());
      res.status(200).json({ success: true, bill, returns });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to search bill' });
    }
  },

  async processReturn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { billId, itemsToReturn, refundPaymentMethod, notes } = req.body;

      if (!billId || !itemsToReturn || !Array.isArray(itemsToReturn) || itemsToReturn.length === 0) {
        res.status(400).json({ success: false, message: 'Bill ID and items to return are required.' });
        return;
      }

      const user = req.user || { id: 'admin', name: 'Administrator' };
      const returnDoc = await dataService.processReturn({
        billId,
        itemsToReturn,
        refundPaymentMethod: refundPaymentMethod || 'CASH',
        notes,
        user: { id: user.id, name: user.name },
      });

      res.status(201).json({
        success: true,
        message: `Return processed successfully! Return #${returnDoc.returnNumber}`,
        returnRecord: returnDoc,
      });
    } catch (err: any) {
      console.error('Process return error:', err);
      res.status(400).json({ success: false, message: err.message || 'Failed to process return' });
    }
  },

  async getReturnsList(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const returns = await dataService.getReturns();
      res.status(200).json({ success: true, returns });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve returns' });
    }
  },
};
