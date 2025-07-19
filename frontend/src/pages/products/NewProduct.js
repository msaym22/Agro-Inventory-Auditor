import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/products/ProductForm';
import productsAPI from '../../api/products';
import { toast } from 'react-toastify'; // Import toast for notifications

export const NewProduct = () => {
  const [productData, setProductData] = useState({
    name: '',
    sellingPrice: 0,
    purchasePrice: '', // Changed to empty string for initial state consistency
    minimumPrice: '',  // Changed to empty string
    description: '',
    applications: '', // Changed from usedIn to applications based on backend model
    category: '',
    comments: '',
    storageLocation: '', // Changed from storageLocation to location based on backend model
    stock: 0, // Changed from stockQuantity to stock based on backend model
    supplier: '',
    expiryDate: '' // Changed to empty string
  });
  const [imageFile, setImageFile] = useState(null); // Changed image to imageFile for clarity
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // For displaying image preview
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (file) => { // Expecting file object directly from FileUpload
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
    e.preventDefault(); // Prevent default form submission
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
      // Append fields from dataToSubmit
      for (const key in dataToSubmit) {
        if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
          formData.append(key, dataToSubmit[key]);
        }
      }
      if (imageFile) {
        formData.append('image', imageFile); // 'image' is the field name expected by multer
      }

      const response = await productsAPI.createProduct(formData);
      toast.success('Product created successfully!');
      navigate(`/products/${response.id}`); // Assuming response.id is directly available
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