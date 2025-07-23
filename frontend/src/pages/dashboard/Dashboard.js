// frontend/src/pages/dashboard/Dashboard.js
import React, { useEffect } from 'react'; // Removed useState as it's not used directly here
import { useDispatch, useSelector } from 'react-redux';
// Import the thunks
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customers/customerSlice';
import { fetchSales, fetchSalesAnalytics, fetchProductAnalytics, fetchOverallProfit, fetchProfitByProduct, fetchSalesByCustomerWithQuantity } from '../../features/sales/saleSlice';

import QuickStats from '../../components/dashboard/QuickStats';
import SalesSummary from '../../components/dashboard/SalesSummary'; // Keep this import for the new analytics page functionality
import AnalyticsChart from '../../components/dashboard/AnalyticsChart'; // Keep this import for the new analytics page functionality
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import Loading from '../../components/common/Loading';

const Dashboard = () => {
  const dispatch = useDispatch();

  const { products = [], loading: productsLoading, error: productsError } = useSelector(state => state.products);
  const { customers = [], loading: customersLoading, error: customersError } = useSelector(state => state.customers);

  const {
    sales = [], // Assuming state.sales.sales is the array of sales objects
    salesAnalytics = { // Ensure salesAnalytics is an object with default nested properties
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      salesByPeriod: [],
      productSales: [],
      profitByProduct: [],
      salesByCustomer: [],
    },
    loading: salesLoading,
    error: salesError
  } = useSelector(state => state.sales);

  // --- DIAGNOSTIC LOGS ---
  console.log("Dashboard Redux State Check:");
  console.log("products:", products);
  console.log("customers:", customers);
  console.log("sales:", sales);
  console.log("salesAnalytics:", salesAnalytics);
  console.log("salesAnalytics.salesByPeriod:", salesAnalytics.salesByPeriod);
  console.log("salesAnalytics.productSales:", salesAnalytics.productSales);
  console.log("products.length:", products?.length);
  console.log("customers.length:", customers?.length);
  console.log("sales.length:", sales?.length);
  // --- END DIAGNOSTIC LOGS ---


  useEffect(() => {
    const loadAllDashboardData = async () => {
      await Promise.allSettled([
        dispatch(fetchProducts()),
        dispatch(fetchCustomers()),
        dispatch(fetchSales()),
        // Analytics specific to Dashboard, if any, could be fetched here too
        // For the main analytics tab, they are fetched on AnalyticsPage.js
        // dispatch(fetchSalesAnalytics('monthly')),
        // dispatch(fetchProductAnalytics()),
      ]);
    };

    loadAllDashboardData();
  }, [dispatch]);

  const loading = productsLoading || customersLoading || salesLoading;
  const error = productsError || customersError || salesError;

  const totalSalesCount = sales?.length || 0;
  const totalCustomersCount = customers?.length || 0;

  const lowStockProducts = Array.isArray(products) ? products.filter(p => p.stock < 10) : [];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>

      <QuickStats
        totalSales={totalSalesCount}
        totalCustomers={totalCustomersCount}
      />

      {/* SalesSummary and AnalyticsChart components are moved to AnalyticsPage.js */}
      {/* <SalesSummary salesByPeriod={salesAnalytics.salesByPeriod} /> */}
      {/* <AnalyticsChart data={salesAnalytics.productSales} /> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <LowStockAlert
          products={lowStockProducts}
        />
      </div>
    </div>
  );
};

export default Dashboard;