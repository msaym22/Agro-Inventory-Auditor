// src/api/sales.js
import api from './api';

export const createSale = async (saleData) => {
  try {
    const response = await api.post('/sales', saleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSales = async (params = {}) => {
  try {
    const response = await api.get('/sales', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSaleById = async (id) => {
  try {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSale = async (id, saleData) => {
  try {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSale = async (id) => {
  try {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateInvoice = async (saleId) => {
  try {
    const response = await api.get(`/sales/${saleId}/invoice`); // REMOVED: responseType: 'blob'
    return response.data; // This will now be the parsed JSON object
  } catch (error) {
    throw error;
  }
};

// Add aliases for the expected function names
export const fetchSales = getSales;

// Export as default object (salesAPI)
const salesAPI = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  generateInvoice,
};

export default salesAPI;