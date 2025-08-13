import axios from 'axios';
import config from '../config/config';

// Ensure baseURL ends with /api
let baseURL = config.API_URL;
if (!baseURL.endsWith('/')) baseURL += '/';
if (!baseURL.endsWith('/api/')) baseURL += 'api/';

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// Add response interceptor
// Preserve the full Axios error object so callers can reliably access
// error.response.status and error.response.data across the app.
API.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export default API;