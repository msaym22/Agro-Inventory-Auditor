import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesAPI from '../../api/sales';
import * as analyticsAPI from '../../api/analytics'; // CORRECTED: Import all named exports as analyticsAPI

const initialState = {
  sales: [],
  currentSale: null,
  salesAnalytics: {
    totalSales: 0,
    totalRevenue: 0,
    salesByPeriod: [],
    productSales: [],
  },
  loading: false,
  error: null,
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

export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSalesAnalytics(period);
      return response.data; // Corrected to return response.data
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
      return response.data; // Corrected to return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch product analytics');
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
        state.sales = action.payload.sales;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.salesAnalytics.totalSales = action.payload.totalSales;
        state.salesAnalytics.totalRevenue = action.payload.totalRevenue;
        state.salesAnalytics.salesByPeriod = action.payload.salesByPeriod;
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
        state.salesAnalytics.loading = false;
        state.salesAnalytics.productSales = action.payload.productSales;
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.salesAnalytics.loading = false;
        state.salesAnalytics.error = action.payload;
      });
  },
});

export const { addSale, removeSale } = salesSlice.actions;

export default salesSlice.reducer;