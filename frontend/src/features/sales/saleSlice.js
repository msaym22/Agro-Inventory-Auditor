import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesAPI from '../../api/sales';
import analyticsAPI from '../../api/analytics'; // Corrected: Direct import of default export

const initialState = {
  items: [], // Renamed from 'sales' to 'items' for clarity in lists
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 1,
  },
  currentSale: null,
  salesAnalytics: {
    totalSales: 0,
    totalRevenue: '0.00', // Initialize as string to match formatCurrency output
    totalProfit: '0.00', // Initialize as string
    salesByPeriod: [],
    productSales: [], // This is top products by revenue (already existed)
    profitByProduct: [],
    salesByCustomer: [],
    productsByQuantitySold: [], // NEW state for products by quantity sold
    customerHistory: null, // NEW state for detailed customer history
    productHistory: null, // NEW state for detailed product history
    loading: false, // Loading state for analytics data specifically
    error: null, // Error state for analytics data
  },
  loading: false, // General loading for sales list/current sale
  error: null,
};

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSales(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales');
    }
  }
);

export const addNewSale = createAsyncThunk(
  'sales/addNewSale',
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await salesAPI.createSale(saleData);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to create sale');
    }
  }
);

export const fetchSaleById = createAsyncThunk(
  'sales/fetchSaleById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSaleById(id);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sale');
    }
  }
);

export const updateExistingSale = createAsyncThunk(
  'sales/updateExistingSale',
  async ({ id, saleData }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.updateSale(id, saleData);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to update sale');
    }
  }
);

export const deleteExistingSale = createAsyncThunk(
  'sales/deleteExistingSale',
  async (id, { rejectWithValue }) => {
    try {
      await salesAPI.deleteSale(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to delete sale');
    }
  }
);

// Analytics Thunks - now correctly calling analyticsAPI methods directly
export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (params = {}, { rejectWithValue }) => { // Accept params object
    try {
      const response = await analyticsAPI.getSalesAnalytics(params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales analytics');
    }
  }
);

export const fetchOverallProfit = createAsyncThunk(
  'sales/fetchOverallProfit',
  async (params = {}, { rejectWithValue }) => { // Accept params object
    try {
      const response = await analyticsAPI.getOverallProfit(params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch overall profit');
    }
  }
);

export const fetchProfitByProduct = createAsyncThunk(
  'sales/fetchProfitByProduct',
  async (params = {}, { rejectWithValue }) => { // Accept params object
    try {
      const response = await analyticsAPI.getProfitByProduct(params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch profit by product');
    }
  }
);

export const fetchSalesByCustomerWithQuantity = createAsyncThunk(
  'sales/fetchSalesByCustomerWithQuantity',
  async (params = {}, { rejectWithValue }) => { // Accept params object
    try {
      const response = await analyticsAPI.getSalesByCustomerWithQuantity(params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales by customer');
    }
  }
);

// NEW: Thunk to fetch products by quantity sold
export const fetchProductsByQuantitySold = createAsyncThunk(
  'sales/fetchProductsByQuantitySold',
  async (params = {}, { rejectWithValue }) => { // Accept params object
    try {
      const response = await analyticsAPI.getProductsByQuantitySold(params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch products by quantity sold');
    }
  }
);

// NEW: Thunk to fetch detailed customer history
export const fetchCustomerHistory = createAsyncThunk(
  'sales/fetchCustomerHistory',
  async ({ customerId, params = {} }, { rejectWithValue }) => { // Accepts customerId and optional params
    try {
      const response = await analyticsAPI.getCustomerHistory(customerId, params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch customer history');
    }
  }
);

// NEW: Thunk to fetch detailed product history
export const fetchProductHistory = createAsyncThunk(
  'sales/fetchProductHistory',
  async ({ productId, params = {} }, { rejectWithValue }) => { // Accepts productId and optional params
    try {
      const response = await analyticsAPI.getProductHistory(productId, params);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch product history');
    }
  }
);


const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    addSale: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      state.items.unshift(action.payload);
    },
    removeSale: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      state.items = state.items.filter((sale) => sale.id !== action.payload);
    },
    // Reducer to clear detailed history when modal is closed or not needed
    clearDetailedHistory: (state) => {
      state.salesAnalytics.customerHistory = null;
      state.salesAnalytics.productHistory = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        const { sales = [], pagination = initialState.pagination } = action.payload || {};
        state.items = sales;
        state.pagination = pagination;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
        state.pagination = initialState.pagination;
      })
      // Handle addNewSale
      .addCase(addNewSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewSale.fulfilled, (state, action) => {
        state.loading = false;
        if (!Array.isArray(state.items)) {
          state.items = [];
        }
        state.items.unshift(action.payload);
      })
      .addCase(addNewSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle fetchSaleById
      .addCase(fetchSaleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSale = action.payload;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentSale = null;
      })
      // Handle updateExistingSale
      .addCase(updateExistingSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingSale.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.items)) {
          const index = state.items.findIndex(sale => sale.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
        if (state.currentSale && state.currentSale.id === action.payload.id) {
          state.currentSale = action.payload;
        }
      })
      .addCase(updateExistingSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle fetchSalesAnalytics
      .addCase(fetchSalesAnalytics.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.totalSales = payload.totalSales ?? 0;
        state.salesAnalytics.totalRevenue = payload.totalRevenue ?? '0.00';
        state.salesAnalytics.salesByPeriod = payload.salesByPeriod ?? [];
        state.salesAnalytics.productSales = payload.productSales ?? [];
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        // Reset affected analytics data on error
        state.salesAnalytics.totalSales = 0;
        state.salesAnalytics.totalRevenue = '0.00';
        state.salesAnalytics.salesByPeriod = [];
        state.salesAnalytics.productSales = [];
      })
      // Handle fetchOverallProfit
      .addCase(fetchOverallProfit.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchOverallProfit.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.totalProfit = payload.totalProfit ?? '0.00';
      })
      .addCase(fetchOverallProfit.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.totalProfit = '0.00';
      })
      // Handle fetchProfitByProduct
      .addCase(fetchProfitByProduct.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchProfitByProduct.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.profitByProduct = payload.profitByProduct ?? [];
      })
      .addCase(fetchProfitByProduct.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.profitByProduct = [];
      })
      // Handle fetchSalesByCustomerWithQuantity
      .addCase(fetchSalesByCustomerWithQuantity.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchSalesByCustomerWithQuantity.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.salesByCustomer = payload.salesByCustomer ?? [];
      })
      .addCase(fetchSalesByCustomerWithQuantity.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.salesByCustomer = [];
      })
      // NEW: Handle fetchProductsByQuantitySold
      .addCase(fetchProductsByQuantitySold.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchProductsByQuantitySold.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.productsByQuantitySold = payload.productsByQuantitySold ?? [];
      })
      .addCase(fetchProductsByQuantitySold.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.productsByQuantitySold = [];
      })
      // NEW: Handle fetchCustomerHistory
      .addCase(fetchCustomerHistory.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
        state.salesAnalytics.customerHistory = null; // Clear previous history
      })
      .addCase(fetchCustomerHistory.fulfilled, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.customerHistory = action.payload;
      })
      .addCase(fetchCustomerHistory.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.customerHistory = null;
      })
      // NEW: Handle fetchProductHistory
      .addCase(fetchProductHistory.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
        state.salesAnalytics.productHistory = null; // Clear previous history
      })
      .addCase(fetchProductHistory.fulfilled, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.productHistory = action.payload;
      })
      .addCase(fetchProductHistory.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.productHistory = null;
      });
  },
});

export const { addSale, removeSale, clearDetailedHistory } = salesSlice.actions;

export default salesSlice.reducer;