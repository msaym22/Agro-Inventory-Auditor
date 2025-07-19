// frontend/src/pages/products/EditProduct.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductForm from '../../components/products/ProductForm';
import productsAPI from '../../api/products'; // Correctly import the API utility
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import { fetchProductById, updateExistingProduct } from '../../features/products/productSlice'; // Import thunks

export const EditProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, loading, error } = useSelector(state => state.products); // Get data from Redux store

  const [productData, setProductData] = useState(null); // State to hold product data for the form
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [formLoading, setFormLoading] = useState(false); // Loading state for form submission

  useEffect(() => {
    // Fetch product by ID when component mounts or ID changes
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProduct) {
      // Initialize form data when currentProduct is loaded from Redux
      setProductData({
        ...currentProduct,
        // Ensure that float/integer values are correctly parsed if necessary
        sellingPrice: parseFloat(currentProduct.sellingPrice),
        purchasePrice: currentProduct.purchasePrice !== null ? parseFloat(currentProduct.purchasePrice) : '',
        minimumPrice: currentProduct.minimumPrice !== null ? parseFloat(currentProduct.minimumPrice) : '',
        stock: parseInt(currentProduct.stock), // Use 'stock' from backend
        expiryDate: currentProduct.expiryDate ? new Date(currentProduct.expiryDate).toISOString().split('T')[0] : '', // Format date for input type="date"
      });
      // Set image preview if product has an image
      if (currentProduct.image) {
        setImagePreviewUrl(`/uploads/${currentProduct.image}`);
      } else {
        setImagePreviewUrl(null);
      }
    }
  }, [currentProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImagePreviewUrl(currentProduct?.image ? `/uploads/${currentProduct.image}` : null);
    }
  };

  const handleDescriptionChange = (html) => {
    setProductData(prev => ({ ...prev, description: html }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const dataToSubmit = {
      ...productData,
      sellingPrice: parseFloat(productData.sellingPrice),
      purchasePrice: productData.purchasePrice !== '' ? parseFloat(productData.purchasePrice) : null,
      minimumPrice: productData.minimumPrice !== '' ? parseFloat(productData.minimumPrice) : null,
      stock: parseInt(productData.stock), // Ensure 'stock' is sent as integer
      expiryDate: productData.expiryDate || null,
    };

    try {
      const formData = new FormData();
      for (const key in dataToSubmit) {
        if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
          formData.append(key, dataToSubmit[key]);
        }
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await dispatch(updateExistingProduct({ id, productData: formData })).unwrap();
      toast.success('Product updated successfully!');
      navigate('/products'); // Redirect to product list page after update
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !productData) { // Show loading until productData is initialized
    return <Loading />;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Product: {productData.name}</h1>
      <ProductForm
        product={productData}
        onChange={handleChange}
        onImageChange={handleImageChange}
        onDescriptionChange={handleDescriptionChange}
        onSubmit={handleSubmit}
        loading={formLoading} // Use formLoading for form submission
        imagePreviewUrl={imagePreviewUrl}
      />
    </div>
  );
};

export default EditProduct;