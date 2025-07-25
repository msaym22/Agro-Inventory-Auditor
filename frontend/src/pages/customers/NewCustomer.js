import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addNewCustomer } from '../../features/customers/customerSlice';
import CustomerForm from '../../components/customers/CustomerForm';
import { toast } from 'react-toastify';
import { Button } from '../../components/common/Button';

const NewCustomer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // This function now receives the completed form data from the CustomerForm component
  const handleSubmit = async (customerData) => {
    setLoading(true);
    try {
      await dispatch(addNewCustomer(customerData)).unwrap();
      toast.success('Customer added successfully!');
      navigate('/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error(error.message || 'Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
          <Button
            as={Link}
            to="/customers"
            variant="secondary"
            size="medium"
          >
            Back to Customers
          </Button>
        </div>

        {/* - The CustomerForm now handles its own state.
          - We pass the handleSubmit function as the 'onSubmit' prop.
          - We do not pass any 'initialData', so the form knows to start empty.
        */}
        <CustomerForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default NewCustomer;
