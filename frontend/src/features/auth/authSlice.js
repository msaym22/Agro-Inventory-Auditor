// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authAPI from '../../api/auth'; // Import all named exports as authAPI
import { storeAuthToken, removeAuthToken } from '../../utils/auth'; // Corrected storeAuthToken

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  analyticsAuthenticated: false, // State for analytics specific authentication
};

// Async thunk for user login
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials); // Correct usage: authAPI.login
    storeAuthToken(response.token); // Save token
    return response.user;
  } catch (error) {
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    return rejectWithValue(errorMessage);
  }
});

// Async thunk for user logout
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // Removed: await authAPI.logout(); // THIS LINE WAS CAUSING THE ERROR
    removeAuthToken(); // Remove token from storage - this is enough for client-side logout
    // No return value needed for logout fulfillment, just success
  } catch (error) {
    let errorMessage = 'Logout failed.'; // This error path will now only trigger if removeAuthToken() somehow fails
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    return rejectWithValue(errorMessage);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer to set analytics authentication status
    setAnalyticsAuthenticated: (state, action) => {
      state.analyticsAuthenticated = action.payload;
    },
    // Reducer to initialize auth state from token if user refreshes
    initializeAuth: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.status = 'succeeded';
      state.error = null;
    },
    resetAuthStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
        state.analyticsAuthenticated = false; // Also clear analytics auth on general logout
      })
      .addCase(logout.rejected, (state, action) => {
        // Even if logout action is rejected (e.g., if you added backend call that failed),
        // clear client-side auth state for security
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'failed';
        state.error = action.payload;
        state.analyticsAuthenticated = false;
      });
  },
});

export const { setAnalyticsAuthenticated, initializeAuth, resetAuthStatus } = authSlice.actions;

export default authSlice.reducer;