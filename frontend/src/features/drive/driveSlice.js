import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDriveAuthUrl, authenticateDrive, syncDrive } from '../../api/drive';

// Create async thunks
export const fetchAuthUrl = createAsyncThunk(
  'drive/getAuthUrl',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDriveAuthUrl();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const authDrive = createAsyncThunk(
  'drive/authenticate',
  async (code, { rejectWithValue }) => {
    try {
      const response = await authenticateDrive(code);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const syncWithDrive = createAsyncThunk(
  'drive/sync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await syncDrive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  authUrl: '',
  isAuthenticated: false,
  isSyncing: false,
  lastSync: null,
  error: null
};

const driveSlice = createSlice({
  name: 'drive',
  initialState,
  reducers: {
    setAuthUrl: (state, action) => {
      state.authUrl = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAuthUrl actions
      .addCase(fetchAuthUrl.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAuthUrl.fulfilled, (state, action) => {
        state.authUrl = action.payload.authUrl;
      })
      .addCase(fetchAuthUrl.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to get auth URL';
      })
      
      // Handle authDrive actions
      .addCase(authDrive.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(authDrive.fulfilled, (state) => {
        state.isAuthenticated = true;
        state.isSyncing = false;
      })
      .addCase(authDrive.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload?.error || 'Authentication failed';
      })
      
      // Handle syncWithDrive actions
      .addCase(syncWithDrive.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncWithDrive.fulfilled, (state) => {
        state.isSyncing = false;
        state.lastSync = new Date().toISOString();
      })
      .addCase(syncWithDrive.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload?.error || 'Sync failed';
      });
  }
});

export const { setAuthUrl, clearError } = driveSlice.actions;
export default driveSlice.reducer;