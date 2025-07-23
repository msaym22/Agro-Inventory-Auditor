// frontend/src/pages/products/NewProduct.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ProductForm from '../../components/products/ProductForm';
import productsAPI from '../../api/products';
import { toast } from 'react-toastify';
import { fetchProducts } from '../../features/products/productSlice';

export const NewProduct = () => {
  const [productData, setProductData] = useState({
    name: '',
    nameUrdu: '', // Add initial state for nameUrdu
    sellingPrice: 0,
    purchasePrice: '',
    minimumPrice: '',
    description: '',
    applications: '',
    category: '',
    comments: '',
    storageLocation: '',
    stock: 0,
    supplier: '',
    expiryDate: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      setImagePreviewUrl(null);
    }
  };

  const handleDescriptionChange = (html) => {
    setProductData(prev => ({ ...prev, description: html }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...productData,
      sellingPrice: parseFloat(productData.sellingPrice),
      purchasePrice: productData.purchasePrice !== '' ? parseFloat(productData.purchasePrice) : null,
      minimumPrice: productData.minimumPrice !== '' ? parseFloat(productData.minimumPrice) : null,
      stock: parseInt(productData.stock),
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

      await productsAPI.createProduct(formData);
      toast.success('Product created successfully!');
      dispatch(fetchProducts());
      navigate('/products');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Product</h1>
      <ProductForm
        product={productData}
        onChange={handleChange}
        onImageChange={handleImageChange}
        onDescriptionChange={handleDescriptionChange}
        onSubmit={handleSubmit}
        loading={loading}
        imagePreviewUrl={imagePreviewUrl}
      />
    </div>
  );
};

export default NewProduct;