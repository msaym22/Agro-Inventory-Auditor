import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Import useDispatch and useSelector
import { ProductList } from '../../components/products/ProductList';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { fetchProducts } from '../../features/products/productSlice'; // Import the thunk

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get products data and loading status from Redux store
  const products = useSelector((state) => state.products.products);
  const productStatus = useSelector((state) => state.products.status);
  const error = useSelector((state) => state.products.error);

  useEffect(() => {
    // Dispatch the fetchProducts thunk when the component mounts
    if (productStatus === 'idle' || productStatus === 'failed') { // Only fetch if idle or failed previously
      dispatch(fetchProducts());
    }
  }, [productStatus, dispatch]);

  const handleEdit = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // You'll need to dispatch a removeProduct thunk here if you have one
        // For now, if you only have productsAPI.deleteProduct, ensure it's imported
        // For example: await productsAPI.deleteProduct(productId);
        // And then you might refetch products or remove from state manually
        // If you have a removeProduct thunk:
        // dispatch(removeProduct(productId));
        console.warn("Delete functionality needs to be implemented using removeProduct thunk or direct API call with state update.");
      } catch (error) {
        console.error('Deletion failed:', error);
      }
    }
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  if (productStatus === 'loading') return <Loading />;
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