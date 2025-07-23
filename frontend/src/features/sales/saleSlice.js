import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesAPI from '../../api/sales';
import * as analyticsAPI from '../../api/analytics';

const initialState = {
  sales: [],
  currentSale: null,
  salesAnalytics: {
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0, // New state for overall profit
    salesByPeriod: [],
    productSales: [],
    profitByProduct: [], // New state for profit by product
    salesByCustomer: [], // New state for sales by customer with quantity
  },
  loading: false, // General loading for sales list/current sale
  error: null,
  // Separate loading/error for analytics if needed, or use salesAnalytics.loading/error
};

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSales(params);
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sales analytics');
    }
  }
);

export const fetchProductAnalytics = createAsyncThunk(
  'sales/fetchProductAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getProductAnalytics(); // This is for product sales performance
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      state.sales.unshift(action.payload);
    },
    removeSale: (state, action) => {
      state.sales = state.sales.filter((sale) => sale.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload.sales || []; // Ensure sales is an array
        state.pagination = action.payload.pagination || {}; // Ensure pagination is an object
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.sales = []; // Reset sales on error
        state.pagination = {};
      })
      // Handle addNewSale
      .addCase(addNewSale.pending, (state) => {
        state.loading = true;
      })
      .addCase(addNewSale.fulfilled, (state, action) => {
        state.loading = false;
        state.sales.unshift(action.payload);
      })
      .addCase(addNewSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle fetchSaleById
      .addCase(fetchSaleById.pending, (state) => {
        state.loading = true;
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
      })
      .addCase(updateExistingSale.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sales.findIndex(sale => sale.id === action.payload.id);
        if (index !== -1) {
          state.sales[index] = action.payload;
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
      })
      .addCase(deleteExistingSale.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = state.sales.filter((sale) => sale.id !== action.payload);
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
        state.salesAnalytics.loading = false;
        state.salesAnalytics.totalSales = action.payload.totalSales || 0;
        state.salesAnalytics.totalRevenue = action.payload.totalRevenue || 0;
        state.salesAnalytics.salesByPeriod = action.payload.salesByPeriod || [];
        state.salesAnalytics.productSales = action.payload.productSales || []; // Assuming productSales comes with this payload
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
        state.salesAnalytics.totalSales = 0;
        state.salesAnalytics.totalRevenue = 0;
        state.salesAnalytics.salesByPeriod = [];
        state.salesAnalytics.productSales = [];
      })
      // Handle fetchProductAnalytics (this thunk now specifically for product sales performance)
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.salesAnalytics.loading = true; // Still use this loading for all analytics fetches
        state.salesAnalytics.error = null;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.productSales = action.payload.productSales || [];
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
        state.salesAnalytics.loading = false;
        state.salesAnalytics.totalProfit = action.payload.totalProfit || 0;
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
        state.salesAnalytics.loading = false;
        state.salesAnalytics.profitByProduct = action.payload.profitByProduct || [];
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
        state.salesAnalytics.loading = false;
        state.salesAnalytics.salesByCustomer = action.payload.salesByCustomer || [];
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