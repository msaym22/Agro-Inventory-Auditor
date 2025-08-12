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
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default API;