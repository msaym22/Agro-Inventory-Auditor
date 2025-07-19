import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProductList } from '../../components/products/ProductList';
import { Button } from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { fetchProducts, removeProduct } from '../../features/products/productSlice';
import { FaBoxOpen } from 'react-icons/fa'; // Import an icon for empty state

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const products = useSelector((state) => state.products.products);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);

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
        // Optionally show a toast notification for error
      }
    }
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Product Catalog</h1>
        <Button onClick={handleCreate} variant="primary" size="large">
          Add New Product
        </Button>
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