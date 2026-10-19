import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';

export const reportController = {
  async getDashboardMetrics(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const metrics = await dataService.getDashboardMetrics();
      res.status(200).json({ success: true, metrics });
    } catch (err: any) {
      console.error('Dashboard metrics error:', err);
      res.status(500).json({ success: false, message: 'Failed to compute dashboard metrics' });
    }
  },

  async getReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query;

      const reports = await dataService.getReports(
        (period as any) || 'monthly',
        startDate as string,
        endDate as string
      );

      res.status(200).json({ success: true, reports });
    } catch (err: any) {
      console.error('Reports error:', err);
      res.status(500).json({ success: false, message: 'Failed to generate reports' });
    }
  },

  async exportCsv(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query;
      const reports = await dataService.getReports(
        (period as any) || 'monthly',
        startDate as string,
        endDate as string
      );

      // Build CSV format
      let csv = 'CloudHouse POS - Business Performance Report\n';
      csv += `Period: ${reports.period} (${new Date(reports.filterStart).toLocaleDateString()} to ${new Date(reports.filterEnd).toLocaleDateString()})\n\n`;

      csv += '--- FINANCIAL SUMMARY ---\n';
      csv += `Metric,Amount (INR)\n`;
      csv += `Gross Sales,${reports.summary.grossSales}\n`;
      csv += `Discounts Given,${reports.summary.discountsGiven}\n`;
      csv += `Tax Collected (GST),${reports.summary.taxCollected}\n`;
      csv += `Refunds Issued,${reports.summary.refundsTotal}\n`;
      csv += `Net Sales,${reports.summary.netSales}\n`;
      csv += `Total Bills Completed,${reports.summary.billCount}\n`;
      csv += `Average Bill Value,${reports.summary.averageBillValue}\n\n`;

      csv += '--- BEST SELLING PRODUCTS ---\n';
      csv += 'Product Name,SKU,Units Sold,Revenue (INR)\n';
      for (const p of reports.bestSelling) {
        csv += `"${p.name}","${p.sku}",${p.quantitySold},${p.revenue}\n`;
      }
      csv += '\n';

      csv += '--- STAFF PERFORMANCE ---\n';
      csv += 'Staff / Cashier Name,Bills Handled,Total Sales (INR)\n';
      for (const s of reports.staffSales) {
        csv += `"${s.cashierName}",${s.billCount},${s.totalSales}\n`;
      }
      csv += '\n';

      csv += '--- PAYMENT METHODS ---\n';
      csv += 'Method,Transaction Count,Total Volume (INR)\n';
      for (const [method, data] of Object.entries(reports.paymentBreakdown)) {
        csv += `${method},${(data as any).count},${(data as any).amount}\n`;
      }
      csv += '\n';

      csv += '--- LOW STOCK WARNINGS ---\n';
      csv += 'Product Name,SKU,Category,Current Stock,Reorder Threshold,Price\n';
      for (const l of reports.lowStockProducts) {
        csv += `"${l.name}","${l.sku}","${l.categoryName}",${l.stockQuantity},${l.reorderThreshold},${l.sellingPrice}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cloudhouse_report_${Date.now()}.csv`);
      res.status(200).send(csv);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      res.status(500).json({ success: false, message: 'Failed to export CSV report' });
    }
  },
};
