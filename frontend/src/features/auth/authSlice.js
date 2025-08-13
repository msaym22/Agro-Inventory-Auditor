// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; // Import createAsyncThunk
import * as authApi from '../../api/auth'; // Assuming your auth API calls are here

const user = JSON.parse(localStorage.getItem('user'));

// Define an async thunk for user login
export const loginUser = createAsyncThunk( // NEW THUNK DEFINITION
  'auth/loginUser', // Type prefix for the generated action types
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // Assuming authApi.login is your actual API call to log in the user
      const response = await authApi.login({ username, password });
      return response.data; // This data will be the action.payload for fulfilled state
    } catch (error) {
      // Use rejectWithValue to pass an error message to the rejected state
      return rejectWithValue(error.response.data.message || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user || null,
    isAuthenticated: user ? true : false,
    loading: false,
    error: null,
  },
  reducers: {
    // These reducers are now handled by extraReducers for async thunk,
    // but kept here if you have other synchronous actions.
    // loginStart: (state) => { /* ... */ },
    // loginSuccess: (state, action) => { /* ... */ },
    // loginFailure: (state, action) => { /* ... */ },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      state.analyticsAuthenticated = false; // Reset analytics auth on logout
      localStorage.removeItem('user');
      // If you persist analyticsAuthenticated in localStorage, clear it here too
      // localStorage.removeItem('analyticsAuthenticated');
    },
    // Reducer to explicitly set analytics authentication status
    setAnalyticsAuthenticated: (state, action) => {
      state.analyticsAuthenticated = action.payload;
      // If you want analytics authentication to persist across refreshes:
      // localStorage.setItem('analyticsAuthenticated', action.payload.toString());
    },
  },
  extraReducers: (builder) => { // NEW: Handle actions dispatched by loginUser thunk
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
        state.analyticsAuthenticated = true; // Keep analytics access granted by default
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
        localStorage.removeItem('user');
        state.analyticsAuthenticated = false;
      });
  },
});

// Export the newly defined thunk and any other synchronous actions
export const { logout, setAnalyticsAuthenticated } = authSlice.actions; 
export default authSlice.reducer;