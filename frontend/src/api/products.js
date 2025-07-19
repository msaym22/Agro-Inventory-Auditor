// src/api/products.js
import api from './api';

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params });
    return response.data; // CORRECTED: Ensure .data is returned here
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const bulkUpdateProducts = async (updates) => {
  try {
    const response = await api.put('/products/bulk', { updates });
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

export const checkLowStock = async (threshold = 10) => {
  try {
    const response = await api.get(`/products/low-stock?threshold=${threshold}`);
    return response.data; // Ensure .data is returned
  } catch (error) {
    throw error;
  }
};

// Export as default object (productsAPI)
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
