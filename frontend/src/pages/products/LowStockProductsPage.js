import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProductList } from '../../components/products/ProductList';
import { Button } from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { fetchProducts } from '../../features/products/productSlice';
import { FaExclamationTriangle, FaArrowLeft, FaBoxOpen } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { checkLowStock } from '../../api/products';

export const LowStockProductsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const products = useSelector((state) => state.products.products);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);
  
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    // Get threshold from URL params or use default
    const urlThreshold = searchParams.get('threshold');
    if (urlThreshold) {
      setThreshold(parseInt(urlThreshold));
    }
    
    // Fetch low stock products
    fetchLowStockProducts(parseInt(urlThreshold) || 10);
  }, [searchParams]);

  const fetchLowStockProducts = async (stockThreshold = 10) => {
    setLowStockLoading(true);
    try {
      const response = await checkLowStock(stockThreshold);
      setLowStockProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      toast.error('Failed to fetch low stock products');
    } finally {
      setLowStockLoading(false);
    }
  };

  const handleEdit = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = async (product) => {
    // This would typically open a confirmation dialog
    // For now, just navigate to edit page where deletion can be handled
    navigate(`/products/edit/${product.id}`);
  };

  const handleBack = () => {
    navigate('/products');
  };

  const handleThresholdChange = (newThreshold) => {
    setThreshold(newThreshold);
    fetchLowStockProducts(newThreshold);
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('threshold', newThreshold.toString());
    navigate(`/products/low-stock?${newSearchParams.toString()}`, { replace: true });
  };

  if (loading || lowStockLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 text-center py-8">
          <FaExclamationTriangle className="text-5xl mx-auto mb-4" />
          <p className="text-xl">Error: {error}</p>
          <Button onClick={handleBack} variant="secondary" className="mt-4">
            <FaArrowLeft className="mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center py-12">
          <FaBoxOpen className="text-green-400 text-5xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Low Stock Products Found
          </h2>
          <p className="text-gray-600 mb-6">
            All products have stock above {threshold} units.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleBack} variant="secondary">
              <FaArrowLeft className="mr-2" />
              Back to Products
            </Button>
            <Button onClick={() => handleThresholdChange(threshold + 5)} variant="primary">
              Increase Threshold to {threshold + 5}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleBack} 
            variant="secondary" 
            size="medium"
          >
            <FaArrowLeft className="mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
              <FaExclamationTriangle className="text-red-600" />
              Low Stock Products
            </h1>
            <p className="text-gray-600 mt-1">
              {lowStockProducts.length} products with stock below {threshold} units
            </p>
          </div>
        </div>
        
        {/* Threshold Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Stock Threshold:
          </label>
          <select
            value={threshold}
            onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value={5}>5 units</option>
            <option value={10}>10 units</option>
            <option value={15}>15 units</option>
            <option value={20}>20 units</option>
            <option value={25}>25 units</option>
            <option value={50}>50 units</option>
          </select>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-600 mr-3 text-xl" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Stock Alert
            </h3>
            <p className="text-red-700">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need{lowStockProducts.length === 1 ? 's' : ''} immediate attention. 
              Consider restocking these items to avoid stockouts.
            </p>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <ProductList
          products={lowStockProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          showLowStockHighlight={true}
        />
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            <div className="text-sm text-gray-600">Low Stock Products</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {lowStockProducts.filter(p => (p.stock || 0) <= 5).length}
            </div>
            <div className="text-sm text-gray-600">Critical Stock (≤5)</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockProducts.filter(p => (p.stock || 0) > 5 && (p.stock || 0) <= threshold).length}
            </div>
            <div className="text-sm text-gray-600">Warning Stock (6-{threshold})</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockProductsPage;
