// frontend/src/features/sales/saleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSales,
  createSale,
  getSaleById,
  generateInvoice,
} from '../../api/sales';

import * as analyticsAPI from '../../api/analytics';

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getSales(params);
      console.log('API getSales response:', response); // Adjusted debug log
      return response; // Corrected: Return the response directly
    } catch (err) {
      console.error('Error in fetchSales thunk:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data || 'Failed to fetch sales');
    }
  }
);

export const addNewSale = createAsyncThunk(
  'sales/addNewSale',
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await createSale(saleData);
      return response; // Corrected: Return the response directly
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to create sale');
    }
  }
);

export const fetchSaleById = createAsyncThunk(
  'sales/fetchSaleById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getSaleById(id);
      return response; // Corrected: Return the response directly
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch sale');
    }
  }
);

export const fetchInvoice = createAsyncThunk(
  'sales/fetchInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await generateInvoice(id);
      return response; // Corrected: Return the response directly
    }
    catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to generate invoice');
    }
  }
);

export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSalesAnalytics(period);
      return response; // Corrected: Return the response directly
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
      return response; // Corrected: Return the response directly
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch product analytics');
    }
  }
);


const saleSlice = createSlice({
  name: 'sales',
  initialState: {
    items: [],
    currentSale: null,
    invoice: null,
    analytics: {
      sales: null,
      products: null
    },
    status: 'idle',
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20
    }
  },
  reducers: {
    addSale: (state, action) => {
      state.items.unshift(action.payload);
    },
    setSales: (state, action) => {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log('fetchSales.fulfilled payload:', action.payload);
        if (action.payload && Array.isArray(action.payload.sales) && action.payload.pagination) {
          state.items = action.payload.sales;
          state.pagination = action.payload.pagination;
        } else {
          console.error('fetchSales.fulfilled: Unexpected payload structure', action.payload);
          state.error = 'Unexpected data structure from server.';
          state.items = [];
        }
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.error || action.error.message || 'Failed to fetch sales';
        console.error('fetchSales.rejected error:', state.error);
      })
      .addCase(addNewSale.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.currentSale = action.payload;
      })
      .addCase(fetchSaleById.pending, (state) => {
        state.currentSale = null;
        state.status = 'loading';
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentSale = action.payload;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.error || 'Failed to fetch sale';
      })
      .addCase(fetchInvoice.fulfilled, (state, action) => {
        state.invoice = action.payload;
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.analytics.sales = action.payload;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.analytics.products = action.payload;
      });
  }
});

export const { addSale, setSales } = saleSlice.actions;
export default saleSlice.reducer;