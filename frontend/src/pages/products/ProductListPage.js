import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProductList } from '../../components/products/ProductList';
import { Button } from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { fetchProducts, removeProduct } from '../../features/products/productSlice';
import { FaBoxOpen } from 'react-icons/fa'; // Import an icon for empty state
import { toast } from 'react-toastify';
import productsAPI from '../../api/products';

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const products = useSelector((state) => state.products.products);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);

  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleEdit = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(removeProduct(productId)).unwrap();
        // State is updated by the removeProduct fulfilled action
      } catch (error) {
        console.error('Deletion failed:', error);
      }
    }
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.warn('Please choose an Excel file (.xlsx or .xls)');
      return;
    }
    try {
      const res = await productsAPI.importProducts(importFile);
      toast.success(`Import done. Created: ${res.results?.created || 0}, Updated: ${res.results?.updated || 0}, Skipped: ${res.results?.skipped || 0}`);
      setImportFile(null);
      dispatch(fetchProducts());
    } catch (e) {
      console.error('Import failed', e);
      toast.error('Import failed');
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Product Catalog</h1>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          <Button onClick={handleImport} variant="secondary" size="medium">Import Excel</Button>
          <Button onClick={handleCreate} variant="primary" size="large">
            Add New Product
          </Button>
        </div>
      </div>

      {products && products.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center py-12 text-gray-600">
          <FaBoxOpen className="text-blue-400 text-5xl mb-4 mx-auto" />
          <p className="text-lg mb-4">No products found.</p>
          <Button onClick={handleCreate} variant="secondary" size="medium">
            Add Your First Product
          </Button>
        </div>
      ) : (
        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}
    </div>
  );
};

export default ProductListPage;