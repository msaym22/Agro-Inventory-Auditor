import api from './api';

export const getDriveAuthUrl = () => api.get('drive/auth-url');
export const authenticateDrive = (code) => api.post('drive/authenticate', { code });
export const syncDrive = () => api.post('drive/sync');