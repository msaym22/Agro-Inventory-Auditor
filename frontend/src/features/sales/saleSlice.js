// frontend/src/features/sales/saleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSales,
  createSale,
  getSaleById,
  generateInvoice,
} from '../../api/sales';

import * as analyticsAPI from '../../api/analytics'; // Import all functions from analyticsAPI

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getSales(params);
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
      const response = await createSale(saleData);
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
      const response = await getSaleById(id);
      return response.data;
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
      return response.data;
    }
    catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to generate invoice');
    }
  }
);

// Corrected: Call analyticsAPI.getSalesAnalytics which is exported
export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchSalesAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      // Corrected: Call analyticsAPI.getSalesAnalytics which is exported
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
      // This call to getProductAnalytics is already correct based on analyticsAPI export
      const response = await analyticsAPI.getProductAnalytics();
      return response.data;
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
        state.items = action.payload.sales;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.error || 'Failed to fetch sales';
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