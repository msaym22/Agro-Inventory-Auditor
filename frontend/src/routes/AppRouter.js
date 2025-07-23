// frontend/src/routes/AppRouter.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // BrowserRouter is here
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard';

// Product Pages
import ProductListPage from '../pages/products/ProductListPage';
import NewProduct from '../pages/products/NewProduct';
import EditProduct from '../pages/products/EditProduct';
import ProductDetail from '../pages/products/ProductDetail';

// Customer Pages
import CustomerListPage from '../pages/customers/CustomerListPage';
import NewCustomer from '../pages/customers/NewCustomer';
import EditCustomer from '../pages/customers/EditCustomer';
import CustomerDetail from '../pages/customers/CustomerDetail';

// Sales Pages
import SalesListPage from '../pages/sales/SalesListPage';
import NewSale from '../pages/sales/NewSale';
import SaleDetail from '../pages/sales/SaleDetail';

// Backup & Restore Page
import BackupRestore from '../pages/backup/BackupRestore';

// Analytics Pages
import AnalyticsLoginPage from '../pages/analytics/AnalyticsLoginPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';

// 404 Page
import NotFound from '../pages/404';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    // THIS IS THE ONLY BrowserRouter IN THE ENTIRE APP
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />

        {/* Analytics Login (Public, but leads to protected content) */}
        <Route path="/analytics-login" element={<MainLayout><AnalyticsLoginPage /></MainLayout>} />

        {/* Protected Routes (require general authentication) */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />

          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/:id" element={<SaleDetail />} />

          <Route path="/backup-restore" element={<BackupRestore />} />
          
          {/* Analytics Page (Protected by AnalyticsLoginPage, but also requires general auth) */}
          {/* The actual password check for analytics is done inside AnalyticsPage/AnalyticsLoginPage */}
          <Route path="/analytics" element={<AnalyticsPage />} /> 

        </Route>

        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;