import api from './api';

export const createSale = async (saleData) => {
  const response = await api.post('sales', saleData);
  return response.data;
};

export const getSales = async (params = {}) => {
  const response = await api.get('sales', { params });
  return response.data;
};

export const getSaleById = async (id) => {
  const response = await api.get(`sales/${id}`);
  return response.data;
};

export const updateSale = async (id, saleData) => {
  const response = await api.put(`sales/${id}`, saleData);
  return response.data;
};

export const deleteSale = async (id) => {
  const response = await api.delete(`sales/${id}`);
  return response.data;
};

export const generateInvoice = async (saleId) => {
  const response = await api.get(`sales/${saleId}/invoice`);
  return response.data;
};

// Aliases for consistency
export const fetchSales = getSales;

const salesAPI = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  generateInvoice,
};

export default salesAPI;