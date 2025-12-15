import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import ProductListPage from '../pages/products/ProductListPage';
import LowStockProductsPage from '../pages/products/LowStockProductsPage';
import NewProduct from '../pages/products/NewProduct';
import EditProduct from '../pages/products/EditProduct';
import ProductDetail from '../pages/products/ProductDetail';
import CustomerListPage from '../pages/customers/CustomerListPage';
import NewCustomer from '../pages/customers/NewCustomer';
import EditCustomer from '../pages/customers/EditCustomer';
import CustomerDetail from '../pages/customers/CustomerDetail';
import SalesListPage from '../pages/sales/SalesListPage';
import NewSale from '../pages/sales/NewSale';
import SaleDetail from '../pages/sales/SaleDetail';
import BackupRestore from '../pages/backup/BackupRestore';
import AnalyticsLoginPage from '../pages/analytics/AnalyticsLoginPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import GoogleDriveSettings from '../pages/settings/GoogleDriveSettings';
import NotFound from '../pages/404';
import AccountantPage from '../pages/accounting/AccountantPage';
import CameraDetection from '../pages/ai/CameraDetection';
import Training from '../pages/ai/Training';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Protect analytics page with password
const AnalyticsProtectedRoute = ({ children }) => {
  const analyticsAuthenticated = useSelector(state => state.auth.analyticsAuthenticated);
  return analyticsAuthenticated ? children : <Navigate to="/analytics-login" replace />;
};

// Protect accountant page with separate password path but same password
const AccountantProtectedRoute = ({ children }) => {
  const accountantAuthenticated = useSelector(state => state.auth.accountantAuthenticated);
  return accountantAuthenticated ? children : <Navigate to="/accountant-login" replace />;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/analytics-login" element={<AnalyticsLoginPage />} />
        <Route path="/accountant-login" element={<AnalyticsLoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Product Routes */}
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/low-stock" element={<LowStockProductsPage />} />
        <Route path="/products/new" element={<NewProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        
        {/* Customer Routes */}
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/new" element={<NewCustomer />} />
        <Route path="/customers/edit/:id" element={<EditCustomer />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        
        {/* Sales Routes */}
        <Route path="/sales" element={<SalesListPage />} />
        <Route path="/sales/new" element={<NewSale />} />
        <Route path="/sales/:id" element={<SaleDetail />} />
        
        {/* Backup, Analytics, Accounting */}
        <Route path="/backup-restore" element={<BackupRestore />} />
        <Route path="/analytics" element={<AnalyticsProtectedRoute><AnalyticsPage /></AnalyticsProtectedRoute>} />
        <Route path="/accounting" element={<AccountantProtectedRoute><AccountantPage /></AccountantProtectedRoute>} />
        
        {/* AI Detection and Training */}
        <Route path="/ai/detect" element={<CameraDetection />} />
        <Route path="/ai/training" element={<Training />} />
        
        {/* Settings Route */}
        <Route path="/settings/drive" element={<GoogleDriveSettings />} />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;