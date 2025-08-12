import api from './api';

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('Create product error:', error.response?.data || error.message);
    throw error;
  }
};

export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Get products error:', error.response?.data || error.message);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get product by ID error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error('Update product error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete product error:', error.response?.data || error.message);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Search products error:', error.response?.data || error.message);
    throw error;
  }
};

export const bulkUpdateProducts = async (updates) => {
  try {
    const response = await api.put('/products/bulk', { updates });
    return response.data;
  } catch (error) {
    console.error('Bulk update products error:', error.response?.data || error.message);
    throw error;
  }
};

export const checkLowStock = async (threshold = 10) => {
  try {
    const response = await api.get(`/products/low-stock?threshold=${threshold}`);
    return response.data;
  } catch (error) {
    console.error('Check low stock error:', error.response?.data || error.message);
    throw error;
  }
};

const productsAPI = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  bulkUpdateProducts,
  checkLowStock,
};

export default productsAPI;