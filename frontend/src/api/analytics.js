// src/api/analytics.js
import api from './api';

export const getSalesAnalytics = async (period = 'monthly') => {
  try {
    const response = await api.get(`/analytics/sales?period=${period}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOverallProfit = async () => {
  try {
    const response = await api.get('/analytics/profit/overall');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfitByProduct = async () => {
  try {
    const response = await api.get('/analytics/profit/by-product');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSalesByCustomerWithQuantity = async () => {
  try {
    const response = await api.get('/analytics/sales/by-customer-quantity');
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

// ADD THIS FUNCTION: getProductAnalytics (missing from your current exports list)
export const getProductAnalytics = async () => {
  try {
    const response = await api.get('/analytics/products'); // Assuming this route exists and returns product analytics
    return response.data;
  } catch (error) {
    throw error;
  }
};