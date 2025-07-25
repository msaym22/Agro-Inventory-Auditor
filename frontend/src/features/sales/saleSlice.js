import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesAPI from '../../api/sales';
import * as analyticsAPI from '../../api/analytics';

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
    totalRevenue: 0,
    totalProfit: 0,
    salesByPeriod: [],
    productSales: [],
    profitByProduct: [],
    salesByCustomer: [],
  },
  loading: false, // General loading for sales list/current sale
  error: null,
};

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSales(params);
      // The API response is already the data object with `sales` and `pagination` keys
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
      // The API returns the new sale object directly
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

// Analytics Thunks
export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSalesAnalytics(period);
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales analytics');
    }
  }
);

export const fetchProductAnalytics = createAsyncThunk(
  'sales/fetchProductAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getProductAnalytics();
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch product analytics');
    }
  }
);

export const fetchOverallProfit = createAsyncThunk(
  'sales/fetchOverallProfit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getOverallProfit();
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch overall profit');
    }
  }
);

export const fetchProfitByProduct = createAsyncThunk(
  'sales/fetchProfitByProduct',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getProfitByProduct();
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch profit by product');
    }
  }
);

export const fetchSalesByCustomerWithQuantity = createAsyncThunk(
  'sales/fetchSalesByCustomerWithQuantity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSalesByCustomerWithQuantity();
      return response || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales by customer');
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
      // Handle deleteExistingSale
      .addCase(deleteExistingSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExistingSale.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.items)) {
          state.items = state.items.filter((sale) => sale.id !== action.payload);
        }
      })
      .addCase(deleteExistingSale.rejected, (state, action) => {
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
        state.salesAnalytics.totalRevenue = payload.totalRevenue ?? 0;
        state.salesAnalytics.totalProfit = payload.totalProfit ?? 0;
        state.salesAnalytics.salesByPeriod = payload.salesByPeriod ?? [];
        state.salesAnalytics.productSales = payload.productSales ?? [];
        state.salesAnalytics.profitByProduct = payload.profitByProduct ?? [];
        state.salesAnalytics.salesByCustomer = payload.salesByCustomer ?? [];
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
      })
      // Handle fetchProductAnalytics
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.salesAnalytics.loading = true;
        state.salesAnalytics.error = null;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.salesAnalytics.loading = false;
        state.salesAnalytics.productSales = payload.productSales ?? [];
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
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
        state.salesAnalytics.totalProfit = payload.totalProfit ?? 0;
      })
      .addCase(fetchOverallProfit.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.totalProfit = 0;
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
      });
  },
});

export const { addSale, removeSale } = salesSlice.actions;

export default salesSlice.reducer;
