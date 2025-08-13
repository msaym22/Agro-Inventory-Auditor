import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customersAPI from '../../api/customers';

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await customersAPI.getCustomers(params);
      return response;
    } catch (error) {
      let errorMessage = 'Failed to fetch customers';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await customersAPI.getCustomerById(id);
      return response;
    } catch (error) {
      let errorMessage = 'Failed to fetch customer';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await customersAPI.createCustomer(customerData);
      return response;
    } catch (error) {
      let errorMessage = 'Failed to create customer';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await customersAPI.updateCustomer(id, customerData);
      return response;
    } catch (error) {
      let errorMessage = 'Failed to update customer';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCustomerBalance = createAsyncThunk(
  'customers/updateCustomerBalance',
  async ({ id, outstandingBalance }, { rejectWithValue }) => {
    try {
      const response = await customersAPI.updateCustomerBalance(id, { outstandingBalance });
      return response;
    } catch (error) {
      let errorMessage = 'Failed to update customer balance';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeCustomer = createAsyncThunk(
  'customers/removeCustomer',
  async (id, { rejectWithValue }) => {
    try {
      await customersAPI.deleteCustomer(id);
      return id;
    } catch (error) {
      let errorMessage = 'Failed to delete customer';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const bulkDeleteCustomers = createAsyncThunk(
  'customers/bulkDeleteCustomers',
  async (customerIds, { rejectWithValue }) => {
    try {
      const results = [];
      const successfulDeletes = [];
      const failedDeletes = [];

      for (const id of customerIds) {
        try {
          await customersAPI.deleteCustomer(id);
          successfulDeletes.push(id);
          results.push({ id, success: true });
        } catch (error) {
          // Extract error message from the response
          let errorMessage = 'Unknown error';
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.details) {
            errorMessage = error.response.data.details;
          } else if (error.message) {
            errorMessage = error.message;
          }
          failedDeletes.push({ id, error: errorMessage });
          results.push({ id, success: false, error: errorMessage });
        }
      }

      // Always return structured results so the UI can surface
      // per-item errors even when all deletions fail.
      return {
        successfulIds: successfulDeletes,
        failedResults: failedDeletes,
        results
      };
    } catch (error) {
      // Extract error message from the response
      let errorMessage = 'Failed to delete customers';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  customers: [],
  currentCustomer: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    },
    clearCustomers: (state) => {
      state.customers = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.customers) {
          state.customers = action.payload.customers;
          state.pagination = action.payload.pagination;
        } else {
          state.customers = action.payload;
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch customer by ID
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
        state.error = action.payload;
      })
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.unshift(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer && state.currentCustomer.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update customer balance
      .addCase(updateCustomerBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerBalance.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer && state.currentCustomer.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateCustomerBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove customer
      .addCase(removeCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(c => c.id !== action.payload);
        if (state.currentCustomer && state.currentCustomer.id === action.payload) {
          state.currentCustomer = null;
        }
      })
      .addCase(removeCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Bulk delete customers
      .addCase(bulkDeleteCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteCustomers.fulfilled, (state, action) => {
        state.loading = false;
        // Remove successfully deleted customers from state
        state.customers = state.customers.filter(c => !action.payload.successfulIds.includes(c.id));
        // Clear currentCustomer if it was deleted
        if (state.currentCustomer && action.payload.successfulIds.includes(state.currentCustomer.id)) {
          state.currentCustomer = null;
        }
      })
      .addCase(bulkDeleteCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentCustomer, clearCustomers } = customerSlice.actions;
export default customerSlice.reducer;