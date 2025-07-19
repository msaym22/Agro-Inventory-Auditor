// // src/api/customers.js
// import api from './api';

// export const createCustomer = async (customerData) => {
//   try {
//     const response = await api.post('/customers', customerData);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCustomers = async (params = {}) => {
//   try {
//     const response = await api.get('/customers', { params });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCustomerById = async (id) => {
//   try {
//     const response = await api.get(`/customers/${id}`);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const updateCustomer = async (id, customerData) => {
//   try {
//     const response = await api.put(`/customers/${id}`, customerData);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const updateCustomerBalance = async (id, balanceData) => {
//   try {
//     const response = await api.put(`/customers/${id}/balance`, balanceData);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const searchCustomers = async (query) => {
//   try {
//     const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const deleteCustomer = async (id) => {
//   try {
//     const response = await api.delete(`/customers/${id}`);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// // Add aliases for the expected function names
// export const fetchCustomers = getCustomers;
// export const fetchCustomerById = getCustomerById;


import api from './api';

export const getCustomers = (params) => api.get('/customers', { params }).then(res => res.data);
export const getCustomerById = (id) => api.get(`/customers/${id}`).then(res => res.data);
export const createCustomer = (customerData) => api.post('/customers', customerData).then(res => res.data);
export const updateCustomer = (id, customerData) => api.put(`/customers/${id}`, customerData).then(res => res.data);
export const updateCustomerBalance = (id, balanceData) => api.patch(`/customers/${id}/balance`, balanceData).then(res => res.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`).then(res => res.data); // New: deleteCustomer