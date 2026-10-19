import { Router } from 'express';
import { authenticateToken, requireAdmin, requireStaffOrAdmin, rateLimitAuth } from '../middleware/auth.js';
import { authController } from '../controllers/authController.js';
import { productController } from '../controllers/productController.js';
import { categoryController } from '../controllers/categoryController.js';
import { supplierController } from '../controllers/supplierController.js';
import { staffController } from '../controllers/staffController.js';
import { billingController } from '../controllers/billingController.js';
import { returnController } from '../controllers/returnController.js';
import { ledgerController } from '../controllers/ledgerController.js';
import { reportController } from '../controllers/reportController.js';
import { settingsController } from '../controllers/settingsController.js';
import { isConnected } from '../config/db.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isConnected() ? 'MongoDB Atlas (Connected)' : 'Persistent Storage Engine (Active)',
  });
});

// Authentication
apiRouter.post('/auth/login', rateLimitAuth, authController.login);
apiRouter.get('/auth/me', authenticateToken, authController.getCurrentUser);
apiRouter.post('/auth/logout', authenticateToken, authController.logout);

// Products
apiRouter.get('/products', authenticateToken, productController.getProducts);
apiRouter.get('/products/lookup/:code', authenticateToken, productController.lookupCode);
apiRouter.get('/products/:id', authenticateToken, productController.getProductById);
apiRouter.post('/products', authenticateToken, requireAdmin, productController.createProduct);
apiRouter.put('/products/:id', authenticateToken, requireAdmin, productController.updateProduct);
apiRouter.post('/products/:id/adjust-stock', authenticateToken, requireAdmin, productController.adjustStock);
apiRouter.patch('/products/:id/toggle-status', authenticateToken, requireAdmin, productController.toggleStatus);
apiRouter.get('/products/:id/movements', authenticateToken, requireAdmin, productController.getMovements);

// Categories
apiRouter.get('/categories', authenticateToken, categoryController.getCategories);
apiRouter.post('/categories', authenticateToken, requireAdmin, categoryController.createCategory);
apiRouter.put('/categories/:id', authenticateToken, requireAdmin, categoryController.updateCategory);
apiRouter.delete('/categories/:id', authenticateToken, requireAdmin, categoryController.deleteCategory);

// Suppliers
apiRouter.get('/suppliers', authenticateToken, supplierController.getSuppliers);
apiRouter.post('/suppliers', authenticateToken, requireAdmin, supplierController.createSupplier);
apiRouter.put('/suppliers/:id', authenticateToken, requireAdmin, supplierController.updateSupplier);
apiRouter.patch('/suppliers/:id/toggle-status', authenticateToken, requireAdmin, supplierController.toggleStatus);

// Staff Management
apiRouter.get('/staff', authenticateToken, requireAdmin, staffController.getStaffList);
apiRouter.post('/staff', authenticateToken, requireAdmin, staffController.createStaff);
apiRouter.put('/staff/:id', authenticateToken, requireAdmin, staffController.updateStaff);
apiRouter.patch('/staff/:id/toggle-status', authenticateToken, requireAdmin, staffController.toggleStatus);
apiRouter.post('/staff/:id/reset-password', authenticateToken, requireAdmin, staffController.resetPassword);

// Billing & Checkout
apiRouter.post('/billing/checkout', authenticateToken, requireStaffOrAdmin, billingController.checkout);
apiRouter.get('/billing/bills', authenticateToken, billingController.getBills);
apiRouter.get('/billing/bills/lookup/:billNumber', authenticateToken, billingController.getBillByNumber);
apiRouter.get('/billing/bills/:id', authenticateToken, billingController.getBillById);

// Returns & Refunds
apiRouter.get('/returns/find-bill', authenticateToken, requireAdmin, returnController.findBill);
apiRouter.post('/returns', authenticateToken, requireAdmin, returnController.processReturn);
apiRouter.get('/returns', authenticateToken, requireAdmin, returnController.getReturnsList);

// Ledger
apiRouter.get('/ledger', authenticateToken, requireAdmin, ledgerController.getEntries);
apiRouter.post('/ledger/manual', authenticateToken, requireAdmin, ledgerController.addManualEntry);

// Reports & Dashboard
apiRouter.get('/reports/dashboard', authenticateToken, requireAdmin, reportController.getDashboardMetrics);
apiRouter.get('/reports/analytics', authenticateToken, requireAdmin, reportController.getReports);
apiRouter.get('/reports/export-csv', authenticateToken, requireAdmin, reportController.exportCsv);

// Settings
apiRouter.get('/settings', authenticateToken, settingsController.getSettings);
apiRouter.put('/settings', authenticateToken, requireAdmin, settingsController.updateSettings);
