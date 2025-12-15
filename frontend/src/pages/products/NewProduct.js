// frontend/src/pages/products/NewProduct.js
import React, { useState, useEffect } from 'react';
import config from '../../config/config';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ProductForm from '../../components/products/ProductForm';
import { toast } from 'react-toastify';
import { createProduct } from '../../features/products/productSlice';

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

  // Auto-translate English name to Urdu in real-time when Urdu is empty
  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    const { name, nameUrdu } = productData;
    if (name && (!nameUrdu || nameUrdu.trim() === '')) {
      const timeoutId = setTimeout(async () => {
        try {
          // Call backend proxy to avoid CORS
          const base = (config.API_URL || '').replace(/\/$/, '');
          const res = await fetch(`${base}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: name, source: 'en', target: 'ur', format: 'text' }),
            signal: controller.signal
          });
          if (!res.ok) return;
          const json = await res.json();
          if (!abort && json && json.translatedText) {
            setProductData(prev => ({ ...prev, nameUrdu: json.translatedText }));
          }
        } catch (_) {
          // ignore translation errors silently
        }
      }, 400); // debounce
      return () => { abort = true; controller.abort(); clearTimeout(timeoutId); };
    }
  }, [productData.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...productData,
      sellingPrice: parseFloat(productData.sellingPrice),
      // Send 0 for empty numeric fields to satisfy backend allowNull: false
      purchasePrice: productData.purchasePrice !== '' ? parseFloat(productData.purchasePrice) : 0,
      minimumPrice: productData.minimumPrice !== '' ? parseFloat(productData.minimumPrice) : 0,
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

      await dispatch(createProduct(formData)).unwrap();
      toast.success('Product created successfully!');
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