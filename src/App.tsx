import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { AdminLayout } from './components/layout/AdminLayout.js';
import { PosLayout } from './components/layout/PosLayout.js';

// Pages
import { LoginPage } from './pages/LoginPage.js';
import { PosPage } from './pages/pos/PosPage.js';
import { DashboardPage } from './pages/admin/DashboardPage.js';
import { ProductsPage } from './pages/admin/ProductsPage.js';
import { CategoriesPage } from './pages/admin/CategoriesPage.js';
import { StaffPage } from './pages/admin/StaffPage.js';
import { SuppliersPage } from './pages/admin/SuppliersPage.js';
import { ReturnsPage } from './pages/admin/ReturnsPage.js';
import { TransactionsPage } from './pages/admin/TransactionsPage.js';
import { LedgerPage } from './pages/admin/LedgerPage.js';
import { ReportsPage } from './pages/admin/ReportsPage.js';
import { SettingsPage } from './pages/admin/SettingsPage.js';
import { MobileAdminApp } from './pages/admin/mobile/MobileAdminApp.js';

const RootRedirect: React.FC = () => {
  const { user, token } = useAuth();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'staff') {
    return <Navigate to="/pos" replace />;
  }
  return <Navigate to="/admin" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root Dispatcher */}
            <Route path="/" element={<RootRedirect />} />

            {/* Staff & Admin POS Billing Register */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <PosLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PosPage />} />
            </Route>

            {/* Dedicated Mobile Admin Web App (/admin/mobile) */}
            <Route
              path="/admin/mobile"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MobileAdminApp />
                </ProtectedRoute>
              }
            />

            {/* Desktop Admin Portal (/admin/*) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
