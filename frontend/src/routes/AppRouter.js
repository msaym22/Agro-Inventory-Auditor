import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';
import Login from '../pages/auth/Login';
import ProductListPage from '../pages/products/ProductListPage';
import NewProduct from '../pages/products/NewProduct';
import ProductDetail from '../pages/products/ProductDetail';
import EditProduct from '../pages/products/EditProduct';
import CustomerListPage from '../pages/customers/CustomerListPage';
import NewCustomer from '../pages/customers/NewCustomer';
import CustomerDetail from '../pages/customers/CustomerDetail';
import EditCustomer from '../pages/customers/EditCustomer'; // Import EditCustomer
import SalesListPage from '../pages/sales/SalesListPage';
import NewSale from '../pages/sales/NewSale';
import SaleDetail from '../pages/sales/SaleDetail';
import BackupRestore from '../pages/backup/BackupRestore';
import NotFound from '../pages/404';
import DashboardLayout from '../layouts/DashboardLayout';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../features/auth/authSlice';

const PrivateRoute = ({ element }) => {
  const token = useSelector(selectCurrentToken);
  return token ? element : <Navigate to="/login" replace />;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<PrivateRoute element={<Dashboard />} />} />

        <Route path="products">
          <Route index element={<PrivateRoute element={<ProductListPage />} />} />
          <Route path="new" element={<PrivateRoute element={<NewProduct />} />} />
          <Route path=":id" element={<PrivateRoute element={<ProductDetail />} />} />
          <Route path="edit/:id" element={<PrivateRoute element={<EditProduct />} />} />
        </Route>

        <Route path="customers">
          <Route index element={<PrivateRoute element={<CustomerListPage />} />} />
          <Route path="new" element={<PrivateRoute element={<NewCustomer />} />} />
          <Route path=":id" element={<PrivateRoute element={<CustomerDetail />} />} />
          <Route path="edit/:id" element={<PrivateRoute element={<EditCustomer />} />} /> {/* New: Edit Customer Route */}
        </Route>

        <Route path="sales">
          <Route index element={<PrivateRoute element={<SalesListPage />} />} />
          <Route path="new" element={<PrivateRoute element={<NewSale />} />} />
          <Route path=":id" element={<PrivateRoute element={<SaleDetail />} />} />
        </Route>

        <Route path="backup" element={<PrivateRoute element={<BackupRestore />} />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;