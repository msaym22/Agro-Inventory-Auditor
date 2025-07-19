// src/api/api.js
import axios from 'axios';
import config from '../config/config'; // Import the config

const API = axios.create({
  baseURL: config.API_URL, // Use the API_URL from config.js
  withCredentials: true,
});

export default API;