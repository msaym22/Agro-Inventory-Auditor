// frontend/src/pages/analytics/AnalyticsPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart'; // Reusing AnalyticsChart
import { Button } from '../../components/common/Button'; // Reusing Button
import { formatCurrency } from '../../utils/helpers'; // For currency formatting

// Import new analytics thunks
import {
  fetchOverallProfit,
  fetchProfitByProduct,
  fetchSalesByCustomerWithQuantity,
  fetchSalesAnalytics // For sales trend chart
} from '../../features/sales/saleSlice';

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Read analyticsAuthenticated directly from Redux auth slice
  const { analyticsAuthenticated } = useSelector(state => state.auth); // Get from auth slice

  // Get data from Redux sales slice (analytics part)
  const {
    salesAnalytics = { // Ensure salesAnalytics is an object with default nested properties
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      salesByPeriod: [],
      productSales: [],
      profitByProduct: [],
      salesByCustomer: [],
    },
    loading: analyticsLoading,
    error: analyticsError
  } = useSelector(state => state.sales);

  useEffect(() => {
    // THIS IS THE ONLY LOG RELATED TO AUTHENTICATION CHECK. It reads from Redux state.
    console.log('AnalyticsPage useEffect running. analyticsAuthenticated (Redux):', analyticsAuthenticated);

    if (analyticsAuthenticated) {
      console.log('AnalyticsPage: Analytics access IS authenticated via Redux, fetching data...');
      // Fetch all detailed analytics data
      dispatch(fetchOverallProfit());
      dispatch(fetchProfitByProduct());
      dispatch(fetchSalesByCustomerWithQuantity());
      dispatch(fetchSalesAnalytics('monthly'));
    } else {
      console.log('AnalyticsPage: Analytics access NOT authenticated via Redux, redirecting to login...');
      toast.warn('Please log in to analytics first.');
      navigate('/analytics-login');
    }
    // Dependency array updated to depend on analyticsAuthenticated from Redux
  }, [dispatch, navigate, analyticsAuthenticated]); 

  // Use analyticsAuthenticated from Redux for rendering decisions
  if (!analyticsAuthenticated) {
    // This return will show if Redux state is false, and then useEffect will navigate
    return <Loading message="Authenticating analytics access..." />;
  }

  if (analyticsLoading) {
    return <Loading />;
  }

  if (analyticsError) {
    return <div className="text-red-500 text-center py-4">Error: {analyticsError}</div>;
  }

  return (
    // Applied consistent dashboard content styling
    <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg"> 
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Detailed Analytics Dashboard</h1>

      {/* Overall Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(salesAnalytics.totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Profit</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(salesAnalytics.totalProfit)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Sales Count</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{salesAnalytics.totalSales}</p>
        </div>
      </div>

      {/* Sales Trend Chart (reusing existing data structure) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <AnalyticsChart
          title="Monthly Sales Trend"
          data={{
            labels: salesAnalytics.salesByPeriod.map(s => s.month),
            label: 'Sales (PKR)',
            values: salesAnalytics.salesByPeriod.map(s => s.total),
          }}
          type="line"
        />
      </div>

      {/* Profit by Product Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <AnalyticsChart
          title="Profit by Product"
          data={{
            labels: salesAnalytics.profitByProduct.map(p => p.productName),
            label: 'Profit (PKR)',
            values: salesAnalytics.profitByProduct.map(p => p.profit),
          }}
          type="bar"
        />
      </div>

      {/* Sales by Customer with Quantity Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales by Customer</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(salesAnalytics.salesByCustomer || []).map((customerSale, index) => (
                <tr key={customerSale.customerId || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customerSale.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customerSale.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customerSale.quantitySold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(customerSale.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;