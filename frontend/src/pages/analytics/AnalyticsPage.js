import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal'; // Assuming you have this Modal component
import { formatCurrency } from '../../utils/helpers'; // For currency formatting
import { format } from 'date-fns'; // Import date-fns for date formatting

// Import all analytics thunks and actions
import {
  fetchOverallProfit,
  fetchProfitByProduct,
  fetchSalesByCustomerWithQuantity,
  fetchSalesAnalytics,
  fetchProductsByQuantitySold,
  fetchCustomerHistory,
  fetchProductHistory,
  clearDetailedHistory,
} from '../../features/sales/saleSlice';

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { analyticsAuthenticated } = useSelector(state => state.auth);

  const {
    salesAnalytics = {}, // Destructure with default empty object for robustness
  } = useSelector(state => state.sales);

  // Destructure with default values for rendering safety
  const {
    loading: analyticsLoading, // Specific loading state for analytics data
    error: analyticsError,   // Specific error state for analytics data
    customerHistory, // Detailed customer history fetched on click
    productHistory,  // Detailed product history fetched on click
    totalSales = 0,
    totalRevenue = '0.00',
    totalProfit = '0.00',
    salesByPeriod = [],
    profitByProduct = [],
    salesByCustomer = [],
    productsByQuantitySold = [],
  } = salesAnalytics;


  // State for active tab
  const [activeTab, setActiveTab] = useState('summary'); // Default to 'summary' tab

  // State for period filtering and custom date range
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // Default to monthly
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  // State for detailed history modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null); // Stores ID (or null for walk-in)
  const [selectedDetailName, setSelectedDetailName] = useState(null); // Stores name for display or fallback
  const [selectedDetailType, setSelectedDetailType] = useState(null); // 'customer' or 'product'


  // Filtered and Sorted data for display - DEFINED BEFORE USAGE
  const getFilteredAndSortedData = (data, searchKeys, sortKey, secondarySortKey = null) => {
    if (!Array.isArray(data)) {
        return []; // Return an empty array if data is not an array
    }
    let filteredData = data.filter(item => {
      const keysToSearch = Array.isArray(searchKeys) ? searchKeys : [searchKeys];
      return keysToSearch.some(key =>
        // Robust check: Ensure item[key] is not null/undefined before calling toLowerCase
        item[key] != null && String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (sortKey) {
      filteredData.sort((a, b) => {
        const valA = parseFloat(a[sortKey]) || 0;
        const valB = parseFloat(b[sortKey]) || 0;
        if (valB !== valA) {
          return valB - valA; // Descending order
        }
        // If primary sort values are equal, try secondary sort if provided
        if (secondarySortKey) {
            const secondaryValA = parseFloat(a[secondarySortKey]) || 0;
            const secondaryValB = parseFloat(b[secondarySortKey]) || 0;
            return secondaryValB - secondaryValA;
        }
        return 0;
      });
    }
    return filteredData;
  };


  useEffect(() => {
    if (analyticsAuthenticated) {
      const params = {};

      if (customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      } else {
        params.period = selectedPeriod;
      }

      // Dispatch all relevant fetch thunks with the current params
      dispatch(fetchOverallProfit(params));
      dispatch(fetchProfitByProduct(params));
      dispatch(fetchSalesByCustomerWithQuantity(params));
      dispatch(fetchSalesAnalytics(params));
      dispatch(fetchProductsByQuantitySold(params));
    } else {
      toast.warn('Please log in to analytics first.');
      navigate('/analytics-login');
    }
  }, [dispatch, navigate, analyticsAuthenticated, selectedPeriod, customStartDate, customEndDate]);


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
    // If both dates are selected, automatically set period to 'custom'
    if (customStartDate && customEndDate) {
        setSelectedPeriod('custom');
    }
  };

  // Function to open detailed history modal
  const openDetailModal = (id, name, type) => { // Added 'name' parameter
    setSelectedDetailId(id); // Can be null for walk-in customer
    setSelectedDetailName(name); // Store name for display
    setSelectedDetailType(type);
    setShowDetailModal(true);

    const params = {};
    if (customStartDate && customEndDate) {
      params.startDate = customStartDate;
      params.endDate = customEndDate;
    } else if (selectedPeriod && selectedPeriod !== 'custom' && selectedPeriod !== 'all') { // Pass period if not custom or all
      params.period = selectedPeriod;
    }

    if (type === 'customer') {
      // Pass customerId if available, otherwise pass customerName for backend resolution
      dispatch(fetchCustomerHistory({ customerId: id, customerName: name, params }));
    } else if (type === 'product') {
      // Pass productId if available, otherwise pass productName for backend resolution
      dispatch(fetchProductHistory({ productId: id, productName: name, params }));
    }
  };

  // Function to close detailed history modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDetailId(null);
    setSelectedDetailName(null);
    setSelectedDetailType(null);
    dispatch(clearDetailedHistory()); // Clear history from Redux state
  };


  // Apply filtering and sorting to the data rendered in tables
  const sortedAndFilteredProfitByProduct = getFilteredAndSortedData(profitByProduct, 'productName', 'profit');
  const sortedAndFilteredSalesByCustomer = getFilteredAndSortedData(salesByCustomer, ['customerName', 'productName'], 'totalRevenue', 'quantitySold');
  const sortedAndFilteredProductsByQuantitySold = getFilteredAndSortedData(productsByQuantitySold, 'productName', 'totalQuantitySold');

  // Helper function to generate the modal title cleanly
  const getModalTitle = () => {
    if (selectedDetailType === 'customer') {
      const name = customerHistory?.customerName || selectedDetailName || 'N/A';
      return `Customer History: ${name}`;
    }
    if (selectedDetailType === 'product') {
      const name = productHistory?.productName || selectedDetailName || 'N/A';
      return `Product History: ${name}`;
    }
    return 'Details'; // Fallback title
  };


  if (!analyticsAuthenticated) {
    return <Loading message="Authenticating analytics access..." />;
  }

  // AnalyticsPage specific loading (not modal loading)
  if (analyticsLoading && !showDetailModal) { // Only show full page loading if modal is not open
    return <Loading />;
  }

  if (analyticsError && !showDetailModal) { // Only show full page error if modal is not open
    return <div className="text-red-500 text-center py-4">Error: {analyticsError.details || analyticsError.message || 'Unknown error'}</div>;
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
          {(customStartDate || customEndDate) && <option value="custom">Custom Range</option>}
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
                  {sortedAndFilteredProfitByProduct.length > 0 ? (
                    sortedAndFilteredProfitByProduct.map((item, index) => (
                      <tr key={item.productId || item.productName || index} onClick={() => openDetailModal(item.productId, item.productName, 'product')} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.profit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {productsByQuantitySold.find(p => p.productName === item.productName)?.totalQuantitySold || '0'}
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
                  {sortedAndFilteredSalesByCustomer.length > 0 ? (
                    sortedAndFilteredSalesByCustomer.map((customerSale, index) => (
                      <tr key={customerSale.customerId || customerSale.customerName + customerSale.productName + index} onClick={() => openDetailModal(customerSale.customerId, customerSale.customerName, 'customer')} className="cursor-pointer hover:bg-gray-50">
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

      {/* Detailed History Modal */}
      {showDetailModal && (
        <Modal isOpen={showDetailModal} onClose={closeDetailModal} title={getModalTitle()} className="w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">

          {/* Loading/Error states for modal content */}
          {analyticsLoading && (
            <Loading message={`Fetching ${selectedDetailType} history...`} />
          )}
          {analyticsError && (
            <div className="text-red-500 text-center py-4">Error fetching history: {analyticsError.details || analyticsError.message || 'Unknown error'}</div>
          )}

          {/* Customer History Display */}
          {selectedDetailType === 'customer' && customerHistory && !analyticsLoading && !analyticsError && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer: {customerHistory.customerName || selectedDetailName || 'N/A'}</h3>
              <p className="text-md text-gray-700 mb-4">Total Sales: {formatCurrency(customerHistory.totalSalesToCustomer)} | Total Profit: {formatCurrency(customerHistory.totalProfitFromCustomer)}</p>

              <h4 className="text-md font-semibold mt-4 mb-2">Sales Records:</h4>
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                {customerHistory.customerHistory && customerHistory.customerHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerHistory.customerHistory.map((sale, saleIndex) => (
                        Array.isArray(sale.items) && sale.items.map((item, itemIndex) => (
                          <tr key={`${sale.saleId}-${item.productId || item.productName || itemIndex}`}>
                            {itemIndex === 0 && (
                              <>
                                <td rowSpan={sale.items.length} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {sale.saleId}
                                </td>
                                <td rowSpan={sale.items.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(sale.saleDate), 'PPP')}
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.itemProfit)}</td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No detailed sales records found for this customer in the selected period.</p>
                )}
              </div>
            </div>
          )}

          {/* Product History Display */}
          {selectedDetailType === 'product' && productHistory && !analyticsLoading && !analyticsError && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Product: {productHistory.productName || selectedDetailName || 'N/A'}</h3>
              <p className="text-md text-gray-700 mb-4">Total Quantity Sold: {productHistory.totalQuantitySold} | Total Revenue: {formatCurrency(productHistory.totalRevenueFromProduct)} | Total Profit: {formatCurrency(productHistory.totalProfitFromProduct)}</p>

              <h4 className="text-md font-semibold mt-4 mb-2">Sales Records:</h4>
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                {productHistory.productHistory && productHistory.productHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price At Sale</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productHistory.productHistory.map((item, index) => (
                        <tr key={item.saleId + '-' + index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.saleId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(item.saleDate), 'PPP')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantitySold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unitPriceAtSale)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.itemProfit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No detailed sales records found for this product in the selected period.</p>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AnalyticsPage;
