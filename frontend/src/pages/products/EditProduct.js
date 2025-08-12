import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductForm from '../../components/products/ProductForm';
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import { fetchProductById, updateExistingProduct } from '../../features/products/productSlice';

export const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, loading, error } = useSelector(state => state.products);

  const [productData, setProductData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProduct) {
      setProductData({
        ...currentProduct,
        nameUrdu: currentProduct.nameUrdu || '',
        sellingPrice: parseFloat(currentProduct.sellingPrice),
        purchasePrice: currentProduct.purchasePrice !== null ? parseFloat(currentProduct.purchasePrice) : '',
        minimumPrice: currentProduct.minimumPrice !== null ? parseFloat(currentProduct.minimumPrice) : '',
        stock: parseInt(currentProduct.stock),
        expiryDate: currentProduct.expiryDate ? new Date(currentProduct.expiryDate).toISOString().split('T')[0] : '',
      });
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

    // Create a copy without the id
    const { id: productId, ...dataWithoutId } = productData;
    
    const dataToSubmit = {
      ...dataWithoutId,
      sellingPrice: parseFloat(dataWithoutId.sellingPrice),
      purchasePrice: dataWithoutId.purchasePrice !== '' ? parseFloat(dataWithoutId.purchasePrice) : null,
      minimumPrice: dataWithoutId.minimumPrice !== '' ? parseFloat(dataWithoutId.minimumPrice) : null,
      stock: parseInt(dataWithoutId.stock),
      expiryDate: dataWithoutId.expiryDate || null,
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
      navigate(`/products/${id}`);
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !productData) {
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
        loading={formLoading}
        imagePreviewUrl={imagePreviewUrl}
      />
    </div>
  );
};

export default EditProduct;