// frontend/src/features/sales/saleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesAPI from '../../api/sales'; // Your existing sales API functions
import * as analyticsApi from '../../api/analytics'; // All analytics API functions

const initialState = {
  items: [], // For sales list (renamed from 'sales' for clarity)
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
    salesByPeriod: [], // For sales trend
    productSales: [],  // For top products by revenue
    profitByProduct: [], // For profit by product
    salesByCustomer: [], // For sales by customer
    productsByQuantitySold: [], // NEW: For products sorted by quantity sold
  },
  loading: false, // General loading for sales list/current sale
  analyticsLoading: false, // Specific loading for analytics section
  error: null,
  analyticsError: null, // Specific error for analytics section
};

// --- CRUD Operations for Sales (Thunks) ---

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSales(params);
      return response; // API returns { sales: [], pagination: {} }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sales');
    }
  }
);

export const addNewSale = createAsyncThunk(
  'sales/addNewSale',
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await salesAPI.createSale(saleData);
      return response; // API returns the new sale object
    } catch (err) {
      // Check if it's a 409 Conflict error specifically
      if (err.response && err.response.status === 409) {
        return rejectWithValue('Customer already exists. Please select them or use a different name.');
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to create sale');
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
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sale');
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
      return rejectWithValue(err.response?.data?.message || 'Failed to update sale');
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
      return rejectWithValue(err.response?.data?.message || 'Failed to delete sale');
    }
  }
);


// --- Analytics Thunks ---

export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getSalesAnalytics(period);
      return response; // Backend returns { totalSales, totalRevenue, salesByPeriod, productSales }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch sales analytics';
      return rejectWithValue(message);
    }
  }
);

export const fetchOverallProfit = createAsyncThunk(
  'sales/fetchOverallProfit',
  async (period, { rejectWithValue }) => { // Pass period
    try {
      const response = await analyticsApi.getOverallProfit(period);
      return response; // Backend returns { totalProfit }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch overall profit';
      return rejectWithValue(message);
    }
  }
);

export const fetchProfitByProduct = createAsyncThunk(
  'sales/fetchProfitByProduct',
  async (period, { rejectWithValue }) => { // Pass period
    try {
      const response = await analyticsApi.getProfitByProduct(period);
      return response; // Backend returns { profitByProduct: [] }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch profit by product';
      return rejectWithValue(message);
    }
  }
);

export const fetchSalesByCustomerWithQuantity = createAsyncThunk(
  'sales/fetchSalesByCustomerWithQuantity',
  async (period, { rejectWithValue }) => { // Pass period
    try {
      const response = await analyticsApi.getSalesByCustomerWithQuantity(period);
      return response; // Backend returns { salesByCustomer: [] }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch sales by customer';
      return rejectWithValue(message);
    }
  }
);

export const fetchProductsByQuantitySold = createAsyncThunk( // NEW THUNK
  'sales/fetchProductsByQuantitySold',
  async (period, { rejectWithValue }) => { // Pass period
    try {
      const response = await analyticsApi.getProductsByQuantitySold(period);
      return response; // Backend returns { productsByQuantitySold: [] }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch products by quantity sold';
      return rejectWithValue(message);
    }
  }
);


const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    // These are plain Redux actions
    addSale: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      state.items.unshift(action.payload);
      state.pagination.totalItems += 1;
    },
    removeSale: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      state.items = state.items.filter((sale) => sale.id !== action.payload);
      state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Handle fetchSales (for sales list) ---
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
      // --- Handle addNewSale ---
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
        state.pagination.totalItems += 1;
      })
      .addCase(addNewSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Handle fetchSaleById ---
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
      // --- Handle updateExistingSale ---
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
      // --- Handle deleteExistingSale ---
      .addCase(deleteExistingSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExistingSale.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.items)) {
          state.items = state.items.filter((sale) => sale.id !== action.payload);
        }
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
      })
      .addCase(deleteExistingSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Analytics Thunks Handling ---
      // fetchSalesAnalytics
      .addCase(fetchSalesAnalytics.pending, (state) => {
        state.analyticsLoading = true; // Use specific analytics loading state
        state.analyticsError = null;
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.analyticsLoading = false;
        state.salesAnalytics.totalSales = payload.totalSales ?? 0;
        state.salesAnalytics.totalRevenue = payload.totalRevenue ?? '0.00';
        state.salesAnalytics.salesByPeriod = payload.salesByPeriod ?? [];
        state.salesAnalytics.productSales = payload.productSales ?? [];
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        state.salesAnalytics.totalSales = 0;
        state.salesAnalytics.totalRevenue = '0.00';
        state.salesAnalytics.salesByPeriod = [];
        state.salesAnalytics.productSales = [];
      })
      // fetchOverallProfit
      .addCase(fetchOverallProfit.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchOverallProfit.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.analyticsLoading = false;
        state.salesAnalytics.totalProfit = payload.totalProfit ?? '0.00';
      })
      .addCase(fetchOverallProfit.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        state.salesAnalytics.totalProfit = '0.00';
      })
      // fetchProfitByProduct
      .addCase(fetchProfitByProduct.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchProfitByProduct.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.analyticsLoading = false;
        state.salesAnalytics.profitByProduct = payload.profitByProduct ?? [];
      })
      .addCase(fetchProfitByProduct.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        state.salesAnalytics.profitByProduct = [];
      })
      // fetchSalesByCustomerWithQuantity
      .addCase(fetchSalesByCustomerWithQuantity.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchSalesByCustomerWithQuantity.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.analyticsLoading = false;
        state.salesAnalytics.salesByCustomer = payload.salesByCustomer ?? [];
      })
      .addCase(fetchSalesByCustomerWithQuantity.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        state.salesAnalytics.salesByCustomer = [];
      })
      // NEW: fetchProductsByQuantitySold
      .addCase(fetchProductsByQuantitySold.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchProductsByQuantitySold.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.analyticsLoading = false;
        state.salesAnalytics.productsByQuantitySold = payload.productsByQuantitySold ?? [];
      })
      .addCase(fetchProductsByQuantitySold.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        state.salesAnalytics.productsByQuantitySold = [];
      });
  },
});

export const { addSale, removeSale } = salesSlice.actions; // Export original reducers

export default salesSlice.reducer;