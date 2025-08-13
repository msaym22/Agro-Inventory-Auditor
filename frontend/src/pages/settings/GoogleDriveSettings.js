import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Typography, CircularProgress, Box } from '@mui/material';
import { 
  fetchAuthUrl, 
  authDrive, 
  fetchDriveStatus,
  pullFromDrive,
  pushToDrive,
} from '../../features/drive/driveSlice';

const GoogleDriveSettings = () => {
  const dispatch = useDispatch();
  const { authUrl, isAuthenticated, isSyncing, lastSync, error } = useSelector(state => state.drive);
  const [confirming, setConfirming] = useState(false);

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

  const handleConnect = () => {
    if (authUrl) window.location.href = authUrl;
  };

  const handlePull = () => dispatch(pullFromDrive()).then(() => dispatch(fetchDriveStatus()));
  const handlePush = () => dispatch(pushToDrive()).then(() => dispatch(fetchDriveStatus()));

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

      <Typography variant="body2" sx={{ mb: 2 }}>
        Status: {isAuthenticated ? 'Connected' : 'Not Connected'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
      </Typography>

      {isAuthenticated ? (
        <>
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