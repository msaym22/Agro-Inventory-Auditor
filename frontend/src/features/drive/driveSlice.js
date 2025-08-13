import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDriveAuthUrl, authenticateDrive, syncDrive, getDriveStatus, updateDatabaseFromDrive, updateDriveFromDatabase } from '../../api/drive';

// Create async thunks
export const fetchAuthUrl = createAsyncThunk(
  'drive/getAuthUrl',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDriveAuthUrl();
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to get auth URL';
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

export const authDrive = createAsyncThunk(
  'drive/authenticate',
  async (code, { rejectWithValue }) => {
    try {
      const response = await authenticateDrive(code);
      return response.data;
    } catch (error) {
      let errorMessage = 'Authentication failed';
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

export const syncWithDrive = createAsyncThunk(
  'drive/syncWithDrive',
  async (type, { rejectWithValue }) => {
    try {
      let response;
      if (type === 'pull') {
        response = await updateDatabaseFromDrive();
      } else if (type === 'push') {
        response = await updateDriveFromDatabase();
      } else {
        response = await syncDrive();
      }
      return response.data;
    } catch (error) {
      let errorMessage = 'Drive sync failed';
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

export const fetchDriveStatus = createAsyncThunk(
  'drive/status',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDriveStatus();
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to get drive status';
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

export const pullFromDrive = createAsyncThunk(
  'drive/pullFromDrive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await updateDatabaseFromDrive();
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to pull from drive';
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

export const pushToDrive = createAsyncThunk(
  'drive/pushToDrive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await updateDriveFromDatabase();
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to push to drive';
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
        state.error = action.payload || 'Failed to get auth URL';
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
        state.error = action.payload || 'Authentication failed';
      })
      
      // Handle syncWithDrive actions
      .addCase(syncWithDrive.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncWithDrive.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSync = new Date().toISOString();
        state.error = null;
      })
      .addCase(syncWithDrive.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload || 'Sync failed';
      })
      // Pull & Push actions
      .addCase(pullFromDrive.pending, (state) => { 
        state.isSyncing = true; 
        state.error = null; 
      })
      .addCase(pullFromDrive.fulfilled, (state, action) => { 
        state.isSyncing = false; 
        state.lastSync = new Date().toISOString();
        state.error = null;
      })
      .addCase(pullFromDrive.rejected, (state, action) => { 
        state.isSyncing = false; 
        state.error = action.payload || 'Pull failed'; 
      })
      .addCase(pushToDrive.pending, (state) => { 
        state.isSyncing = true; 
        state.error = null; 
      })
      .addCase(pushToDrive.fulfilled, (state, action) => { 
        state.isSyncing = false; 
        state.lastSync = new Date().toISOString();
        state.error = null;
      })
      .addCase(pushToDrive.rejected, (state, action) => { 
        state.isSyncing = false; 
        state.error = action.payload || 'Push failed'; 
      })
      
      // Handle fetchDriveStatus
      .addCase(fetchDriveStatus.fulfilled, (state, action) => {
        state.isAuthenticated = !!action.payload?.isAuthenticated;
        state.lastSync = action.payload?.lastSync || state.lastSync;
      })
      .addCase(fetchDriveStatus.rejected, (state, action) => {
        state.error = action.payload || 'Failed to get drive status';
      });
  }
});

export const { setAuthUrl, clearError } = driveSlice.actions;
export default driveSlice.reducer;