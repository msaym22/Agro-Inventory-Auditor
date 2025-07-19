// frontend/src/pages/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Import the thunks
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customers/customerSlice';
import { fetchSales, fetchSalesAnalytics, fetchProductAnalytics } from '../../features/sales/saleSlice';

import QuickStats from '../../components/dashboard/QuickStats';
import SalesSummary from '../../components/dashboard/SalesSummary';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';
import Loading from '../../components/common/Loading';

const Dashboard = () => {
  const dispatch = useDispatch();

  const products = useSelector(state => state.products.products);
  const customers = useSelector(state => state.customers.customers);
  const sales = useSelector(state => state.sales.items);
  const analytics = useSelector(state => state.sales.analytics);

  // CORRECTED: Use .loading property from productSlice and customerSlice
  const productsLoading = useSelector(state => state.products.loading); //
  const customersLoading = useSelector(state => state.customers.loading); //
  const salesLoading = useSelector(state => state.sales.status === 'loading'); // saleSlice still uses 'status'

  useEffect(() => {
    const loadAllDashboardData = async () => {
      await Promise.allSettled([
        dispatch(fetchProducts()),
        dispatch(fetchCustomers()),
        dispatch(fetchSales()),
        dispatch(fetchSalesAnalytics('monthly')),
        dispatch(fetchProductAnalytics()),
      ]);
    };

    // This ensures data is always loaded when Dashboard mounts or updates
    loadAllDashboardData();
  }, [dispatch]);

  // Combined loading state
  const loading = productsLoading || customersLoading || salesLoading;

  const quickStatsData = {
    products: products?.length || 0,
    // Access the nested 'customers' array from the customers object received from Redux state
    customers: customers?.customers?.length || 0,
    sales: sales?.length || 0,
    revenue: sales?.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) || 0,
  };

  // Ensure products is an array before filtering
  const lowStockProducts = Array.isArray(products) ? products.filter(p => p.stock < 10) : [];

  if (loading) {
    return <Loading />;
  }

  // Once loading is false, check if data is empty for initial display,
  // although QuickStats, SalesSummary, LowStockAlert already handle empty states.
  // This helps ensure something renders if data fetching finishes but data is truly empty.
  const hasData = products.length > 0 || customers.customers?.length > 0 || sales.length > 0;

  // You might want to render a "No data available" message if hasData is false here
  // For now, assuming sub-components handle their own empty states.

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Overview</h1>

      <QuickStats stats={quickStatsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ensure analytics data exists before trying to map it */}
        {analytics.sales && Array.isArray(analytics.sales) && (
          <AnalyticsChart
            title="Monthly Sales Trend"
            data={{
              labels: analytics.sales.map(s => s.month),
              label: 'Sales (PKR)',
              values: analytics.sales.map(s => s.total),
            }}
            type="line"
          />
        )}
        {analytics.products && Array.isArray(analytics.products.productPerformance) && ( // Check for productPerformance array
          <AnalyticsChart
            title="Top 10 Products by Revenue"
            data={{
              labels: analytics.products.productPerformance.map(p => p.name), // Access productPerformance
              label: 'Revenue (PKR)',
              values: analytics.products.productPerformance.map(p => p.revenue), // Access productPerformance
            }}
            type="bar"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SalesSummary sales={sales.slice(0, 5)} />
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
};

export default Dashboard;