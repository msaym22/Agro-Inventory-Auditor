import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Typography, CircularProgress, Box } from '@mui/material';
import { 
  fetchAuthUrl, 
  authDrive, 
  syncWithDrive 
} from '../../features/drive/driveSlice';

const GoogleDriveSettings = () => {
  const dispatch = useDispatch();
  const { authUrl, isAuthenticated, isSyncing, lastSync, error } = useSelector(state => state.drive);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      dispatch(authDrive(code)).then(() => {
        // Remove code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else {
      dispatch(fetchAuthUrl());
    }
  }, [dispatch]);

  const handleConnect = () => {
    window.location.href = authUrl;
  };

  const handleSync = () => {
    dispatch(syncWithDrive());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Google Drive Sync
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {isAuthenticated ? (
        <>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSync}
            disabled={isSyncing}
            startIcon={isSyncing ? <CircularProgress size={20} /> : null}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          {lastSync && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Last synced: {new Date(lastSync).toLocaleString()}
            </Typography>
          )}
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