// frontend/src/pages/customers/EditCustomer.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CustomerForm from '../../components/customers/CustomerForm'; // Re-use CustomerForm
import { toast } from 'react-toastify';
import Loading from '../../components/common/Loading';
import { fetchCustomerById, updateExistingCustomer } from '../../features/customers/customerSlice';

export const EditCustomer = () => {
  const { id } = useParams(); // Get customer ID from URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCustomer, loading, error } = useSelector(state => state.customers); // Get data from Redux store

  const [customerData, setCustomerData] = useState(null); // State to hold customer data for the form
  const [formLoading, setFormLoading] = useState(false); // Loading state for form submission

  useEffect(() => {
    // Fetch customer by ID when component mounts or ID changes
    dispatch(fetchCustomerById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentCustomer) {
      // Initialize form data when currentCustomer is loaded from Redux
      setCustomerData({
        ...currentCustomer,
        // Ensure numerical values are correctly parsed if necessary
        creditLimit: parseFloat(currentCustomer.creditLimit),
        outstandingBalance: parseFloat(currentCustomer.outstandingBalance),
      });
    }
  }, [currentCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const dataToSubmit = {
      ...customerData,
      creditLimit: parseFloat(customerData.creditLimit),
      outstandingBalance: parseFloat(customerData.outstandingBalance),
    };

    try {
      await dispatch(updateExistingCustomer({ id, customerData: dataToSubmit })).unwrap();
      toast.success('Customer updated successfully!');
      navigate('/customers'); // Redirect to customer list page after update
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error(`Failed to update customer: ${error.message || 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !customerData) { // Show loading until customerData is initialized
    return <Loading />;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Customer: {customerData.name}</h1>
      <CustomerForm
        customer={customerData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={formLoading} // Use formLoading for form submission
      />
    </div>
  );
};

export default EditCustomer;