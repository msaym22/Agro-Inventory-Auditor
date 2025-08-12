import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSync } from 'react-icons/fa';

// Components
import QuickStats from '../../components/dashboard/QuickStats';
import SalesSummary from '../../components/dashboard/SalesSummary';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import Loading from '../../components/common/Loading';

// Redux Thunks
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customers/customerSlice';
import { fetchSales } from '../../features/sales/saleSlice';
import { syncWithDrive } from '../../features/drive/driveSlice';

const Dashboard = () => {
  const dispatch = useDispatch();

  // Get data from Redux store
  const { 
    products = [], 
    loading: productsLoading, 
    error: productsError 
  } = useSelector(state => state.products);
  
  const { 
    customers = [], 
    loading: customersLoading, 
    error: customersError 
  } = useSelector(state => state.customers);
  
  const { 
    items: sales = [], 
    loading: salesLoading, 
    error: salesError 
  } = useSelector(state => state.sales);

  // Get drive sync state
  const { isSyncing, lastSync } = useSelector(state => state.drive);

  // Load data on component mount
  useEffect(() => {
    const loadAllDashboardData = async () => {
      try {
        await Promise.allSettled([
          dispatch(fetchProducts({ page: 1, limit: 100 })),
          dispatch(fetchCustomers({ page: 1, limit: 100 })),
          dispatch(fetchSales({ page: 1, limit: 10, search: '' })),
        ]);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      }
    };

    loadAllDashboardData();
  }, [dispatch]);

  // Check if any data is still loading
  const overallLoading = productsLoading || customersLoading || salesLoading;
  const overallError = productsError || customersError || salesError;

  // Compute stats
  const totalSalesCount = sales?.length || 0;
  const totalCustomersCount = customers?.length || 0;
  const lowStockProducts = Array.isArray(products) 
    ? products.filter(p => p.stock < 10) 
    : [];

  // Handle sync button click
  const handleSyncClick = () => {
    if (!isSyncing) {
      dispatch(syncWithDrive());
    }
  };

  if (overallLoading) {
    return <Loading />;
  }

  if (overallError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
        <p className="text-red-500">{overallError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Summary of your business activities</p>
        </div>
        
        {/* Sync with Drive button */}
        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isSyncing 
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          } transition-colors min-w-[200px] justify-center`}
        >
          <FaSync className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync with Drive'}
          {lastSync && !isSyncing && (
            <span className="ml-2 text-xs text-green-200">
              Last: {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6">
        <QuickStats
          totalSales={totalSalesCount}
          totalCustomers={totalCustomersCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SalesSummary sales={sales} />
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
};

export default Dashboard;