// frontend/src/api/analytics.js
import api from './api';

export const getSalesAnalytics = async (period = 'monthly') => {
  try {
    const response = await api.get(`/analytics/sales?period=${period}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOverallProfit = async (period) => { // Accept period
  try {
    const response = await api.get(`/analytics/profit/overall${period ? `?period=${period}` : ''}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfitByProduct = async (period) => { // Accept period
  try {
    const response = await api.get(`/analytics/profit/by-product${period ? `?period=${period}` : ''}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSalesByCustomerWithQuantity = async (period) => { // Accept period
  try {
    const response = await api.get(`/analytics/sales/by-customer-quantity${period ? `?period=${period}` : ''}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductsByQuantitySold = async (period) => { // NEW FUNCTION
  try {
    const response = await api.get(`/analytics/products/by-quantity-sold${period ? `?period=${period}` : ''}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getInventoryValuation = async () => {
  try {
    const response = await api.get('/analytics/inventory-valuation');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMonthlySalesReport = async () => {
  try {
    const response = await api.get('/analytics/monthly-sales-report');
    return response.data;
  } catch (error) {
    throw error;
  }
};