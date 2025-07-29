// frontend/src/pages/dashboard/Dashboard.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify'; // Keep toast for error display

// Components
import QuickStats from '../../components/dashboard/QuickStats';
import SalesSummary from '../../components/dashboard/SalesSummary';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import Loading from '../../components/common/Loading';

// Redux Thunks
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customers/customerSlice';
// CORRECTED IMPORT: fetchSales is a thunk exported directly from saleSlice
import { fetchSales } from '../../features/sales/saleSlice'; 

const Dashboard = () => {
  const dispatch = useDispatch();

  const { products = [], loading: productsLoading, error: productsError } = useSelector(state => state.products);
  const { customers = [], loading: customersLoading, error: customersError } = useSelector(state => state.customers);

  // Correctly access 'items' from state.sales and alias it to 'sales' for local use
  const {
    items: sales = [], // Access sales list (renamed to items in slice)
    loading: salesLoading, // Loading state for sales list
    error: salesError // Error state for sales list
  } = useSelector(state => state.sales); // state.sales is the entire sales slice object

  // --- DIAGNOSTIC LOGS (Keep during development, remove for production) ---
  useEffect(() => {
    console.log("Dashboard Redux State Check:");
    console.log("products.length:", products?.length);
    console.log("customers.length:", customers?.length);
    console.log("sales.length:", sales?.length);
    // console.log("salesAnalytics.totalProfit (from sales slice):", useSelector(state => state.sales.salesAnalytics.totalProfit)); // Example if needed for debugging analytics specific data
  }, [products, customers, sales]); // Depend on these states to re-log when they change
  // --- END DIAGNOSTIC LOGS ---

  useEffect(() => {
    const loadAllDashboardData = async () => {
      // Dispatch thunks to fetch necessary data for the dashboard
      await Promise.allSettled([
        dispatch(fetchProducts({ page: 1, limit: 100 })), // Fetch enough products
        dispatch(fetchCustomers({ page: 1, limit: 100 })), // Fetch enough customers
        dispatch(fetchSales({ page: 1, limit: 10, search: '' })), // Fetch sales for summary
      ]);
    };

    loadAllDashboardData();
  }, [dispatch]); // Dispatch only on component mount

  // Combine loading and error states for overall dashboard status
  const overallLoading = productsLoading || customersLoading || salesLoading;
  const overallError = productsError || customersError || salesError;

  const totalSalesCount = sales?.length || 0;
  const totalCustomersCount = customers?.length || 0;

  const lowStockProducts = Array.isArray(products) ? products.filter(p => p.stock < 10) : [];

  if (overallLoading) {
    return <Loading />;
  }

  if (overallError) {
    toast.error(overallError); // Display error using toast
    return <div className="text-red-500 text-center py-4">Error loading dashboard data.</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

      <QuickStats
        totalSales={totalSalesCount}
        totalCustomers={totalCustomersCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* SalesSummary now relies on the `sales` (items) array from Redux state */}
        <SalesSummary sales={sales} /> 
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
};

export default Dashboard;