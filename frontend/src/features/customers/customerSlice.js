import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, updateCustomerBalance, deleteCustomer } from '../../api/customers';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCustomers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCustomerById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addNewCustomer = createAsyncThunk(
  'customers/addNewCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
        const response = await createCustomer(customerData);
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
  }
);

export const updateExistingCustomer = createAsyncThunk(
  'customers/updateExistingCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
        const response = await updateCustomer(id, customerData);
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
  }
);

export const updateCustomerBalanceAction = createAsyncThunk(
  'customers/updateCustomerBalance',
  async ({ id, balanceData }, { rejectWithValue }) => {
    try {
        const response = await updateCustomerBalance(id, balanceData);
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
  }
);

export const removeCustomer = createAsyncThunk(
  'customers/removeCustomer',
  async (id, { rejectWithValue }) => {
    try {
        await deleteCustomer(id);
        return id;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    customers: [],
    pagination: {},
    currentCustomer: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload.customers) && action.payload.pagination) {
          state.customers = action.payload.customers;
          state.pagination = action.payload.pagination;
        } else {
          console.error('fetchCustomers.fulfilled: Unexpected payload structure', action.payload);
          state.error = 'Unexpected data structure from server.';
          state.customers = [];
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(addNewCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.unshift(action.payload);
      })
      .addCase(addNewCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(updateExistingCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer && state.currentCustomer.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateCustomerBalanceAction.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
         if (state.currentCustomer && state.currentCustomer.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(removeCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload);
      });
  },
});

export const { setCustomers, clearError, setCurrentCustomer } = customerSlice.actions;
export default customerSlice.reducer;