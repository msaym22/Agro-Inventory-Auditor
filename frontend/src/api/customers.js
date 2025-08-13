import api from './api';

export const getCustomers = (params) => 
  api.get('customers', { params }).then(res => res.data);

export const getCustomerById = (id) => 
  api.get(`customers/${id}`).then(res => res.data);

export const createCustomer = (customerData) => 
  api.post('customers', customerData).then(res => res.data);

export const updateCustomer = (id, customerData) => 
  api.put(`customers/${id}`, customerData).then(res => res.data);

export const updateCustomerBalance = (id, balanceData) => 
  api.patch(`customers/${id}/balance`, balanceData).then(res => res.data);

export const deleteCustomer = (id) => 
  api.delete(`customers/${id}`).then(res => res.data);

export const importCustomers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/customers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Aliases for consistency
export const fetchCustomers = getCustomers;
export const fetchCustomerById = getCustomerById;

// Default export for backward compatibility
const customersAPI = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerBalance,
  deleteCustomer,
  importCustomers,
  fetchCustomers,
  fetchCustomerById
};

export default customersAPI;