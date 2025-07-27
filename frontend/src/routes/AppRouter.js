// frontend/src/routes/AppRouter.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from '../layouts/MainLayout'; // This should be the minimal layout
import DashboardLayout from '../layouts/DashboardLayout'; // This is your main app layout

// Auth Pages
import Login from '../pages/auth/Login';

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard';

// Product Pages (All product-related imports)
import ProductListPage from '../pages/products/ProductListPage';
import NewProduct from '../pages/products/NewProduct';
import EditProduct from '../pages/products/EditProduct';
import ProductDetail from '../pages/products/ProductDetail';

// Customer Pages (All customer-related imports)
import CustomerListPage from '../pages/customers/CustomerListPage'; // ADDED IMPORT
import NewCustomer from '../pages/customers/NewCustomer';           // ADDED IMPORT
import EditCustomer from '../pages/customers/EditCustomer';         // ADDED IMPORT
import CustomerDetail from '../pages/customers/CustomerDetail';     // ADDED IMPORT

// Sales Pages (All sales-related imports)
import SalesListPage from '../pages/sales/SalesListPage';       // ADDED IMPORT
import NewSale from '../pages/sales/NewSale';                   // ADDED IMPORT
import SaleDetail from '../pages/sales/SaleDetail';             // ADDED IMPORT

// Backup & Restore Page (Import for this specific page)
import BackupRestore from '../pages/backup/BackupRestore';       // ADDED IMPORT

// Analytics Pages
import AnalyticsLoginPage from '../pages/analytics/AnalyticsLoginPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';

// 404 Page
import NotFound from '../pages/404';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  // THIS IS THE BYPASS YOU REQUESTED:
  const isAuthenticated = true; //

  // If not authenticated (and bypass is off), navigate to login
  // Changed /login to /dashboard here based on your direct dashboard access request
  return isAuthenticated ? children : <Navigate to="/dashboard" />; //
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - use MainLayout for these */}
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/analytics-login" element={<MainLayout><AnalyticsLoginPage /></MainLayout>} />

        {/* Protected Routes: These routes are wrapped by PrivateRoute */}
        {/* All routes within this <Route element={<PrivateRoute>...</PrivateRoute>}> will be protected */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          {/* Default redirect for the root path when authenticated */}
          <Route index element={<Navigate to="/dashboard" replace />} /> 
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Product Routes */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          {/* Customer Routes (Now correctly added) */}
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />

          {/* Sales/Orders Routes (Now correctly added) */}
          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/:id" element={<SaleDetail />} />

          {/* Backup & Restore Route (Now correctly added) */}
          <Route path="/backup-restore" element={<BackupRestore />} />
          
          {/* Analytics Page (already working) */}
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Catch-all Route for 404 Not Found (for any unmatched routes) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;