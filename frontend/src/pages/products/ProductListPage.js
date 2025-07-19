import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProductList } from '../../components/products/ProductList';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { fetchProducts } from '../../features/products/productSlice'; // Import the thunk
import { removeProduct } from '../../features/products/productSlice'; // Import removeProduct thunk

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get products data, loading status, and error from Redux store
  const products = useSelector((state) => state.products.products);
  const loading = useSelector((state) => state.products.loading); // Correctly use 'loading' state
  const error = useSelector((state) => state.products.error);

  useEffect(() => {
    // Always dispatch fetchProducts when the component mounts.
    // This ensures the list is fresh, especially after navigating back from adding/editing a product.
    dispatch(fetchProducts());
  }, [dispatch]); // Dependency array ensures it runs only when dispatch changes (which is usually once)

  const handleEdit = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(removeProduct(productId)).unwrap(); // Dispatch the removeProduct thunk and unwrap to handle errors
        // No need to refetch here, as removeProduct updates the state directly
      } catch (error) {
        console.error('Deletion failed:', error);
        // Optionally show a toast notification for error
      }
    }
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  if (loading) return <Loading />; // Use 'loading' state
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Product Catalog</h1>
        <Button onClick={handleCreate} variant="primary" size="large">
          Add New Product
        </Button>
      </div>

      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />
    </div>
  );
};

export default ProductListPage;