import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, removeCustomer } from '../../features/customers/customerSlice'; // Import removeCustomer thunk
import { Link, useNavigate } from 'react-router-dom';
import CustomerList from '../../components/customers/CustomerList';
import SearchInput from '../../components/common/SearchInput';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Import toast for notifications

const CustomerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customersState = useSelector(state => state.customers.customers);
  const loading = useSelector(state => state.customers.loading);
  const error = useSelector(state => state.customers.error);
  const pagination = useSelector(state => state.customers.pagination);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCustomers({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSelectCustomer = (customer) => {
    // This is the existing behavior, usually for viewing details on row click
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

  const handleDelete = async (customerId) => { // New handler for Delete button
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await dispatch(removeCustomer(customerId)).unwrap(); // Dispatch removeCustomer thunk
        toast.success('Customer deleted successfully!');
      } catch (error) {
        console.error('Customer deletion failed:', error);
        toast.error(`Failed to delete customer: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
        <Button
          onClick={handleAddNewCustomer}
          variant="primary"
          size="large"
        >
          Add New Customer
        </Button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
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
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <div className="text-gray-600 text-sm">
                  Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} customers
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="small"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">
                    {currentPage}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === pagination.totalPages}
                    variant="secondary"
                    size="small"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerListPage;