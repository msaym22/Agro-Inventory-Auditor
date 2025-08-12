import api from './api';

// Analytics API calls
const analyticsAPI = {
  // Existing analytics calls, updated to accept params object for period/dates
  getSalesAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/sales', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getOverallProfit: async (params = {}) => {
    try {
      const response = await api.get('/analytics/profit/overall', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProfitByProduct: async (params = {}) => {
    try {
      const response = await api.get('/analytics/profit/by-product', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSalesByCustomerWithQuantity: async (params = {}) => {
    try {
      const response = await api.get('/analytics/sales/by-customer-quantity', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // NEW: API call to fetch products by quantity sold
  getProductsByQuantitySold: async (params = {}) => {
    try {
      const response = await api.get('/analytics/products/quantity-sold', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // NEW: API call to fetch detailed sales history for a specific customer
  getCustomerHistory: async (customerId, params = {}) => {
    try {
      const response = await api.get(`/analytics/customer-history/${customerId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // NEW: API call to fetch detailed sales history for a specific product
  getProductHistory: async (productId, params = {}) => {
    try {
      const response = await api.get(`/analytics/product-history/${productId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Existing additional analytics endpoints (if any) - ensure params are handled if they support filtering
  getInventoryValuation: async () => {
    // This endpoint currently does not support period/date filters based on your controller
    try {
      const response = await api.get('/analytics/inventory-valuation');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMonthlySalesReport: async (params = {}) => {
    try {
      const response = await api.get('/analytics/monthly-sales-report', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default analyticsAPI;