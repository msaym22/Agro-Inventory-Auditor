// frontend/src/pages/analytics/AnalyticsPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/helpers'; // For currency formatting
import SearchInput from '../../components/common/SearchInput'; // Assuming you have this component

// Import new analytics thunks
import {
  fetchOverallProfit,
  fetchProfitByProduct,
  fetchSalesByCustomerWithQuantity,
  fetchSalesAnalytics,
  fetchProductsByQuantitySold // NEW THUNK IMPORT
} from '../../features/sales/saleSlice';

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { analyticsAuthenticated } = useSelector(state => state.auth);

  const {
    salesAnalytics = {}, // Destructure with default empty object for robustness
    loading: analyticsLoading,
    error: analyticsError
  } = useSelector(state => state.sales);

  // State for period filtering and search
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // Default to monthly
  const [searchTerm, setSearchTerm] = useState('');

  // Destructure with default values for rendering safety
  const {
    totalSales = 0,
    totalRevenue = '0.00',
    totalProfit = '0.00',
    salesByPeriod = [],
    profitByProduct = [],
    salesByCustomer = [],
    productsByQuantitySold = [], // NEW state from Redux
  } = salesAnalytics;


  useEffect(() => {
    console.log('AnalyticsPage useEffect running. analyticsAuthenticated (Redux):', analyticsAuthenticated);

    if (analyticsAuthenticated) {
      console.log('AnalyticsPage: Analytics access IS authenticated via Redux, fetching data...');
      // Pass the selectedPeriod to all relevant fetch thunks
      dispatch(fetchOverallProfit(selectedPeriod));
      dispatch(fetchProfitByProduct(selectedPeriod));
      dispatch(fetchSalesByCustomerWithQuantity(selectedPeriod));
      dispatch(fetchSalesAnalytics(selectedPeriod));
      dispatch(fetchProductsByQuantitySold(selectedPeriod)); // NEW FETCH
    } else {
      console.log('AnalyticsPage: Analytics access NOT authenticated via Redux, redirecting to login...');
      toast.warn('Please log in to analytics first.');
      navigate('/analytics-login');
    }
  }, [dispatch, navigate, analyticsAuthenticated, selectedPeriod]); // Add selectedPeriod to dependencies

  // Filtered data for search (frontend filtering for simplicity for now)
  const filteredProfitByProduct = profitByProduct.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSalesByCustomer = salesByCustomer.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProductsByQuantitySold = productsByQuantitySold.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (!analyticsAuthenticated) {
    return <Loading message="Authenticating analytics access..." />;
  }

  if (analyticsLoading) {
    return <Loading />;
  }

  if (analyticsError) {
    return <div className="text-red-500 text-center py-4">Error: {analyticsError}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Detailed Analytics Dashboard</h1>

      {/* Period Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <label htmlFor="periodFilter" className="text-gray-700 font-medium">View by:</label>
        <select
          id="periodFilter"
          className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="daily">Daily (Last 30 Days)</option>
          <option value="weekly">Weekly (Last 12 Weeks)</option>
          <option value="monthly">Monthly (Last 12 Months)</option>
          <option value="yearly">Yearly (Last 5 Years)</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Overall Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Profit</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalProfit)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Sales Count</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totalSales}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search by product or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>


      {/* Profit by Product Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 10 Products by Profit</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfitByProduct.length > 0 ? (
                filteredProfitByProduct.map((item, index) => (
                  <tr key={item.productName || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.profit)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No profit data available for selected period or search term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales by Customer with Quantity Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
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
              {filteredSalesByCustomer.length > 0 ? (
                filteredSalesByCustomer.map((customerSale, index) => (
                  <tr key={customerSale.customerName + customerSale.productName + index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customerSale.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customerSale.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customerSale.quantitySold}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(customerSale.totalRevenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No sales data available for selected period or search term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Products by Quantity Sold Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Products by Quantity Sold</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity Sold</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductsByQuantitySold.length > 0 ? (
                filteredProductsByQuantitySold.map((item, index) => (
                  <tr key={item.productName || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalQuantitySold}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No quantity sold data available for selected period or search term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Trend Table (Report View) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend Report ({selectedPeriod})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesByPeriod.length > 0 ? (
                salesByPeriod.map((item, index) => (
                  <tr key={item.period || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No sales trend data available for selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional: Add a refresh button */}
      <div className="text-center mt-8">
        <Button onClick={() => window.location.reload()}>Refresh Analytics</Button>
      </div>
    </div>
  );
};

export default AnalyticsPage;