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

  // State for active tab
  const [activeTab, setActiveTab] = useState('summary'); // Default to 'summary' tab

  // State for period filtering and custom date range
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // Default to monthly
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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
      const params = {};

      if (customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      } else {
        params.period = selectedPeriod;
      }

      // Pass the selectedPeriod or date range to all relevant fetch thunks
      dispatch(fetchOverallProfit(params));
      dispatch(fetchProfitByProduct(params));
      dispatch(fetchSalesByCustomerWithQuantity(params));
      dispatch(fetchSalesAnalytics(params));
      dispatch(fetchProductsByQuantitySold(params)); // NEW FETCH
    } else {
      console.log('AnalyticsPage: Analytics access NOT authenticated via Redux, redirecting to login...');
      toast.warn('Please log in to analytics first.');
      navigate('/analytics-login');
    }
  }, [dispatch, navigate, analyticsAuthenticated, selectedPeriod, customStartDate, customEndDate]); // Add new dependencies


  // Handle period change, reset custom dates
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Handle custom date change, set period to custom
  const handleCustomDateChange = (type, date) => {
    if (type === 'start') {
      setCustomStartDate(date);
    } else {
      setCustomEndDate(date);
    }
    setSelectedPeriod('custom'); // Indicate custom selection
  };

  // Placeholder for detailed history modal/view
  const handleProductClick = (product) => {
    console.log('Clicked product for detailed history:', product);
    // Here you would typically dispatch an action to fetch detailed history
    // and open a modal with that data.
    // Example: dispatch(fetchProductHistory(product.productId, customStartDate, customEndDate));
    // setShowDetailModal(true);
  };

  const handleCustomerClick = (customer) => {
    console.log('Clicked customer for detailed history:', customer);
    // Here you would typically dispatch an action to fetch detailed history
    // and open a modal with that data.
    // Example: dispatch(fetchCustomerHistory(customer.customerId, customStartDate, customEndDate));
    // setShowDetailModal(true);
  };


  // Filtered data for search (frontend filtering for simplicity for now)
  const filteredProfitByProduct = profitByProduct.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSalesByCustomer = salesByCustomer.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Assuming you might want to search by product name within customer sales as well
    (item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            className={`${activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('summary')}
          >
            Overall Summary
          </button>
          <button
            className={`${activeTab === 'profitByProduct'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('profitByProduct')}
          >
            Profit by Product
          </button>
          <button
            className={`${activeTab === 'salesByCustomer'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('salesByCustomer')}
          >
            Sales by Customer
          </button>
        </nav>
      </div>

      {/* Period Filter and Date Range */}
      <div className="mb-6 flex flex-wrap items-center space-x-4">
        <label htmlFor="periodFilter" className="text-gray-700 font-medium">View by:</label>
        <select
          id="periodFilter"
          className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedPeriod}
          onChange={handlePeriodChange}
        >
          <option value="daily">Daily (Last 30 Days)</option>
          <option value="weekly">Weekly (Last 12 Weeks)</option>
          <option value="monthly">Monthly (Last 12 Months)</option>
          <option value="yearly">Yearly (Last 5 Years)</option>
          <option value="all">All Time</option>
          {customStartDate && customEndDate && <option value="custom">Custom Range</option>}
        </select>

        <span className="text-gray-700 font-medium ml-4">From:</span>
        <input
          type="date"
          className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={customStartDate}
          onChange={(e) => handleCustomDateChange('start', e.target.value)}
        />
        <span className="text-gray-700 font-medium">To:</span>
        <input
          type="date"
          className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={customEndDate}
          onChange={(e) => handleCustomDateChange('end', e.target.value)}
        />
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search by product or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'summary' && (
        <>
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

          {/* Sales Trend Table (Report View) */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend Report ({selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedPeriod})</h2>
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
                      <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No sales trend data available for selected period or date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'profitByProduct' && (
        <>
          {/* Profit by Product Table */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Products by Profit ({selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedPeriod})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProfitByProduct.length > 0 ? (
                    filteredProfitByProduct.map((item, index) => (
                      <tr key={item.productName || index} onClick={() => handleProductClick(item)} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.profit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {productsByQuantitySold.find(p => p.productName === item.productName)?.totalQuantitySold || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No profit data available for selected period or search term.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'salesByCustomer' && (
        <>
          {/* Sales by Customer with Quantity Table */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales by Customer ({selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedPeriod})</h2>
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
                      <tr key={customerSale.customerName + customerSale.productName + index} onClick={() => handleCustomerClick(customerSale)} className="cursor-pointer hover:bg-gray-50">
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
        </>
      )}


      {/* Optional: Add a refresh button */}
      <div className="text-center mt-8">
        <Button onClick={() => window.location.reload()}>Refresh Analytics</Button>
      </div>
    </div>
  );
};

export default AnalyticsPage;