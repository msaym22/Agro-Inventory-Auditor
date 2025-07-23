// frontend/src/routes/AppRouter.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  // Original line:
  // const { isAuthenticated } = useSelector((state) => state.auth); 
  
  // TEMPORARY BYPASS FOR DEVELOPMENT:
  // Set isAuthenticated to true always for testing purposes.
  // REMEMBER TO REVERT THIS LINE FOR PRODUCTION!
  const isAuthenticated = true; 

  // If not authenticated (and bypass is off), navigate to login
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    // BrowserRouter wraps the entire application's routing.
    // This is the only BrowserRouter instance in the entire app.
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        {/* The login page is accessible without authentication. */}
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />

        {/* Analytics Login Page: Publicly accessible, but leads to protected analytics content. */}
        {/* The actual password check for analytics is handled within AnalyticsLoginPage/AnalyticsPage components. */}
        <Route path="/analytics-login" element={<MainLayout><AnalyticsLoginPage /></MainLayout>} />

        {/* Protected Routes: These routes are wrapped by PrivateRoute, which checks for authentication. */}
        {/* DashboardLayout provides the common layout (sidebar, header) for all protected pages. */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          {/* Redirect from root path to dashboard if authenticated. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Dashboard Page */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Product Management Routes */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          {/* Customer Management Routes */}
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />

          {/* Sales/Order Management Routes */}
          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/:id" element={<SaleDetail />} />

          {/* Backup & Restore Page */}
          <Route path="/backup-restore" element={<BackupRestore />} />
          
          {/* Analytics Page: Protected by general authentication. */}
          <Route path="/analytics" element={<AnalyticsPage />} /> 

        </Route>

        {/* Catch-all Route for 404 Not Found */}
        {/* Any unmatched routes will render the NotFound component. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
