import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const billingController = {
  async checkout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items, customerName, customerPhone, paymentMethod, amountPaid, notes } = req.body;

      if (!req.user) {
        res.status(401).json({ success: false, message: 'Cashier authentication required.' });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Cannot checkout with an empty cart.' });
        return;
      }

      if (!paymentMethod || !['CASH', 'CARD', 'UPI'].includes(paymentMethod)) {
        res.status(400).json({ success: false, message: 'Valid payment method (CASH, CARD, UPI) required.' });
        return;
      }

      const bill = await dataService.checkout({
        items,
        customerName,
        customerPhone,
        paymentMethod,
        amountPaid: Number(amountPaid) || 0,
        notes,
        user: { id: req.user.id, name: req.user.name },
      });

      res.status(201).json({
        success: true,
        message: `Transaction completed successfully! Bill #${bill.billNumber}`,
        bill,
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(400).json({ success: false, message: err.message || 'Checkout failed.' });
    }
  },

  async getBills(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, startDate, endDate, cashierId, paymentMethod, status, page, limit } = req.query;

      // If user is staff, allow viewing bills (can see transactions for receipt reprint & history)
      const queryCashierId = req.user?.role === 'staff' ? (cashierId as string) : (cashierId as string);

      const result = await dataService.getBills({
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        cashierId: queryCashierId,
        paymentMethod: paymentMethod as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('Fetch bills error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve transactions' });
    }
  },

  async getBillById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bill = await dataService.findBillById(id);
      if (!bill) {
        res.status(404).json({ success: false, message: 'Bill not found' });
        return;
      }

      // Also get any returns associated with this bill
      const returns = await dataService.getReturns(bill._id.toString());

      res.status(200).json({ success: true, bill, returns });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Error retrieving bill details' });
    }
  },

  async getBillByNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { billNumber } = req.params;
      const bill = await dataService.findBillByNumber(billNumber);
      if (!bill) {
        res.status(404).json({ success: false, message: `No bill found with number "${billNumber}"` });
        return;
      }
      const returns = await dataService.getReturns(bill._id.toString());
      res.status(200).json({ success: true, bill, returns });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Error searching bill' });
    }
  },
};
