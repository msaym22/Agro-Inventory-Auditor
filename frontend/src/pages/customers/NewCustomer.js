import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addNewCustomer } from '../../features/customers/customerSlice';
import CustomerForm from '../../components/customers/CustomerForm'; // Import CustomerForm
import { toast } from 'react-toastify'; // Import toast for notifications
import { Button } from '../../components/common/Button'; // Import Button

const NewCustomer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Add email field as it's common for customers
    phone: '', // Changed from contact to phone for consistency
    address: '',
    creditLimit: 0,
    outstandingBalance: 0, // Added initial outstanding balance
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (customerData) => { // Receive data from CustomerForm
    setLoading(true);
    try {
      await dispatch(addNewCustomer(customerData)).unwrap();
      toast.success('Customer added successfully!');
      navigate('/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer. Please try again.');
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
            as={Link} // Use Button component as a Link
            to="/customers"
            variant="secondary"
            size="medium"
          >
            Back to Customers
          </Button>
        </div>

        <CustomerForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default NewCustomer;