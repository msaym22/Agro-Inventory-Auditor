import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, removeCustomer } from '../../features/customers/customerSlice';
import { Link, useNavigate } from 'react-router-dom';
import CustomerList from '../../components/customers/CustomerList';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { importCustomers as importCustomersApi } from '../../api/customers';

const CustomerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customersState = useSelector(state => state.customers.customers);
  const loading = useSelector(state => state.customers.loading);
  const error = useSelector(state => state.customers.error);
  const pagination = useSelector(state => state.customers.pagination);

  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleSelectCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleAddNewCustomer = () => {
    navigate('/customers/new');
  };

  const handleView = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleEdit = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await dispatch(removeCustomer(customerId)).unwrap();
        toast.success('Customer deleted successfully!');
      } catch (error) {
        console.error('Customer deletion failed:', error);
        toast.error(`Failed to delete customer: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.warn('Please choose an Excel file (.xlsx or .xls)');
      return;
    }
    try {
      const res = await importCustomersApi(importFile);
      toast.success(`Import done. Created: ${res.results?.created || 0}, Updated: ${res.results?.updated || 0}, Skipped: ${res.results?.skipped || 0}`);
      setImportFile(null);
      dispatch(fetchCustomers());
    } catch (e) {
      console.error('Import customers failed', e);
      toast.error('Import failed');
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          <Button onClick={handleImport} variant="secondary" size="medium">Import Excel</Button>
          <Button
            onClick={handleAddNewCustomer}
            variant="primary"
            size="large"
          >
            Add New Customer
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-500 text-center py-8 text-lg">
          Error: {error}
        </div>
      ) : customersState && customersState.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <FaUsers className="text-blue-400 text-5xl mb-4 mx-auto" />
          <p className="text-lg mb-4">No customers found.</p>
          <Button
            onClick={handleAddNewCustomer}
            variant="secondary"
            size="medium"
          >
            Add Your First Customer
          </Button>
        </div>
      ) : (
        <>
          <CustomerList
            customers={customersState || []}
            onSelect={handleSelectCustomer}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete} 
          />

          {pagination && pagination.totalItems > 0 && (
            <div className="flex justify-center items-center mt-6 pt-4 border-t border-gray-100">
              <div className="text-gray-600 text-sm">
                Total: {pagination.totalItems} customers
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerListPage;