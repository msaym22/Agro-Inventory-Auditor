import api from './api';

export const getDriveAuthUrl = () => api.get('drive/auth-url');
export const authenticateDrive = (code) => api.post('drive/authenticate', { code });
export const syncDrive = (force = false) => api.post(`drive/sync${force ? '?force=true' : ''}`);
export const getDriveStatus = () => api.get('drive/status');
export const updateDatabaseFromDrive = (mergeMode = false) => api.post('drive/update-database', { mergeMode });
export const updateDriveFromDatabase = () => api.post('drive/update-drive');