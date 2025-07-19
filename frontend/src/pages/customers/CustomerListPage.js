import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers } from '../../features/customers/customerSlice'; // CORRECTED IMPORT PATH
import { Link, useNavigate } from 'react-router-dom';
import CustomerList from '../../components/customers/CustomerList';
import SearchInput from '../../components/common/SearchInput';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';

const CustomerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Access the 'customers' and 'loading' properties from the customer slice state
  const customersState = useSelector(state => state.customers.customers);
  const loading = useSelector(state => state.customers.loading); // Use 'loading' directly from slice
  const error = useSelector(state => state.customers.error);
  const pagination = useSelector(state => state.customers.pagination); // Ensure pagination is managed in customerSlice if used

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Dispatch the Redux Thunk action
    dispatch(fetchCustomers({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleSelectCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleAddNewCustomer = () => {
    navigate('/customers/new');
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
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/2">
            <SearchInput
              placeholder="Search customers by name or contact..."
              onSearch={handleSearch}
              debounceMs={500}
            />
          </div>
        </div>

        {loading ? ( // Use the 'loading' state for conditional rendering
          <Loading />
        ) : error ? (
          <div className="text-red-500 text-center py-8 text-lg">
            Error: {error}
          </div>
        ) : (
          // Ensure customersState.customers is accessed correctly
          customersState && customersState.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
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
                customers={customersState || []} // Pass the customers array directly
                onSelect={handleSelectCustomer}
              />

              {/* Ensure pagination object exists before accessing its properties */}
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
          )
        )}
      </div>
    </div>
  );
};

export default CustomerListPage;