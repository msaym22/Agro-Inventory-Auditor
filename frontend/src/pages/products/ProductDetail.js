import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StockManagement } from '../../components/products/StockManagement';
import productsAPI from '../../api/products';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify'; // Add this import

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productsAPI.getProductById(id);
        setProduct(response);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Product not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleUpdateStock = async (productId, adjustment) => {
    try {
      const updatedProduct = { ...product, stock: product.stock + adjustment };
      const response = await productsAPI.updateProduct(productId, updatedProduct);
      setProduct(response);
      toast.success('Stock updated successfully!'); // 'toast' will now be defined
    } catch (error) {
      console.error('Stock update failed:', error);
      toast.error('Failed to update stock. Please try again.'); // 'toast' will now be defined
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="text-red-500 text-center py-12 text-lg">
        {error}
        <Link
          to="/products"
          className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) return (
    <div className="text-center py-12 text-gray-600">
      <p className="text-lg mb-4">Product not found.</p>
      <Link
        to="/products"
        className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Products
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6">
        <div className="flex">
          <div className="w-1/3">
            {product.image && (
              <img
                src={`/uploads/${product.image}`}
                alt={product.name}
                className="w-full rounded"
              />
            )}
            {!product.image && (
               <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                 No Image
               </div>
            )}
          </div>
          <div className="w-2/3 pl-6">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="mt-4">
              <p><span className="font-semibold">SKU:</span> {product.sku}</p>
              <p><span className="font-semibold">Category:</span> {product.category}</p>
              <p><span className="font-semibold">Selling Price:</span> PKR {product.sellingPrice}</p>
              <p><span className="font-semibold">Purchase Price:</span> PKR {product.purchasePrice || 'N/A'}</p>
              <p><span className="font-semibold">Stock:</span> {product.stock}</p>
              <p><span className="font-semibold">Storage:</span> {product.storageLocation}</p>
              {product.expiryDate && (
                <p><span className="font-semibold">Expiry:</span> {new Date(product.expiryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        <StockManagement
          product={product}
          onUpdateStock={handleUpdateStock}
        />
      </div>
    </div>
  );
};
export default ProductDetail;