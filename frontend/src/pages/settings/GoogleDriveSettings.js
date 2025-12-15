import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Typography, CircularProgress, Box } from '@mui/material';
import { 
  fetchAuthUrl, 
  authDrive, 
  fetchDriveStatus,
  pullFromDrive,
  pushToDrive,
  clearError,
} from '../../features/drive/driveSlice';
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customers/customerSlice';
import { fetchSales } from '../../features/sales/saleSlice';

const GoogleDriveSettings = () => {
  const dispatch = useDispatch();
  const { authUrl, isAuthenticated, isSyncing, lastSync, error } = useSelector(state => state.drive);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mergeMode, setMergeMode] = useState(false);
  const [showAccountSwitch, setShowAccountSwitch] = useState(false);

  useEffect(() => {
    dispatch(fetchDriveStatus());
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      dispatch(authDrive(code)).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        dispatch(fetchDriveStatus());
      });
    } else {
      dispatch(fetchAuthUrl());
    }
  }, [dispatch]);

  // Debug logging for error state
  useEffect(() => {
    console.log('Current error state:', error);
    console.log('Current isSyncing state:', isSyncing);
  }, [error, isSyncing]);

  const handleConnect = () => {
    if (authUrl) window.location.href = authUrl;
  };

  const handlePull = () => {
    dispatch(clearError()); // Clear any existing errors
    setSuccessMessage(''); // Clear success message
    
    // Use async/await for better error handling
    const performPull = async () => {
      try {
        const result = await dispatch(pullFromDrive(mergeMode)).unwrap();
        console.log('Pull completed successfully, result:', result);
        dispatch(fetchDriveStatus());
        // Refresh application data so UI reflects pulled DB
        try {
          await Promise.allSettled([
            dispatch(fetchProducts()),
            dispatch(fetchCustomers()),
            dispatch(fetchSales({ search: '' }))
          ]);
        } catch (_) {}
        setSuccessMessage(`Database ${mergeMode ? 'merged' : 'updated'} successfully from Drive!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Pull failed with error:', error);
        // Error is already handled by Redux slice
      }
    };
    
    performPull();
  };
  const handlePush = () => {
    console.log('Push button clicked, clearing errors...');
    dispatch(clearError()); // Clear any existing errors
    setSuccessMessage(''); // Clear success message
    
    // Use async/await for better error handling
    const performPush = async () => {
      try {
        const result = await dispatch(pushToDrive()).unwrap();
        console.log('Push completed successfully, result:', result);
        dispatch(fetchDriveStatus());
        setSuccessMessage('Database pushed to Drive successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Push failed with error:', error);
        // Error is already handled by Redux slice
      }
    };
    
    performPush();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Google Drive Sync
      </Typography>

      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">
            Push failed: {error}
          </Typography>
          <Button 
            size="small" 
            onClick={() => dispatch(clearError())}
            sx={{ mt: 1 }}
          >
            Clear Error
          </Button>
        </Box>
      )}

      {successMessage && (
        <Typography color="success.main" sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          {successMessage}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mb: 2 }}>
        Status: {isAuthenticated ? 'Connected' : 'Not Connected'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
      </Typography>

      {isAuthenticated ? (
        <>
          {/* Account Management */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Management
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setShowAccountSwitch(!showAccountSwitch)}
              sx={{ mb: 1 }}
            >
              {showAccountSwitch ? 'Hide' : 'Switch Google Account'}
            </Button>
            {showAccountSwitch && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  To switch accounts, disconnect and reconnect with a different Google account.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={() => {
                    // Clear current authentication
                    localStorage.removeItem('persist:drive');
                    window.location.reload();
                  }}
                >
                  Disconnect Current Account
                </Button>
              </Box>
            )}
          </Box>

          {/* Merge Mode Settings */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Database Update Mode
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="mergeMode"
                checked={mergeMode}
                onChange={(e) => setMergeMode(e.target.checked)}
              />
              <label htmlFor="mergeMode">
                <Typography variant="body2">
                  Merge Mode: When enabled, pulling from Drive will merge data instead of replacing the entire database
                </Typography>
              </label>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={handlePull}
              disabled={isSyncing}
              startIcon={isSyncing ? <CircularProgress size={20} /> : null}
            >
              Update Database (Pull)
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePush}
              disabled={isSyncing}
              startIcon={isSyncing ? <CircularProgress size={20} /> : null}
            >
              Update Drive (Push)
            </Button>
          </Box>
        </>
      ) : (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleConnect}
          disabled={!authUrl}
        >
          {authUrl ? 'Connect Google Drive' : 'Loading...'}
        </Button>
      )}
    </Box>
  );
};

export default GoogleDriveSettings;