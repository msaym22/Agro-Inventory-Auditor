// frontend/src/components/customers/CustomerForm.js
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';

// The `as` prop determines if the root element is a 'form' or 'div'
// The `onChange` prop is added to propagate changes to the parent
const CustomerForm = ({ customer: initialCustomer, onSubmit, loading, as: Component = 'form', onChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    creditLimit: 0, // Initialized to 0 for number input consistency
  });

  // Pre-fill the form if an existing customer is provided (for editing)
  useEffect(() => {
    // This ensures internal formData matches parent's initialCustomer data when prop changes
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.name || '',
        contact: initialCustomer.contact || '',
        address: initialCustomer.address || '',
        creditLimit: initialCustomer.creditLimit != null ? initialCustomer.creditLimit : 0,
      });
    } else {
      // For new customers, reset formData if initialCustomer becomes null (e.g., modal closes and reopens)
      setFormData({
        name: '',
        contact: '',
        address: '',
        creditLimit: 0,
      });
    }
  }, [initialCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target; // Destructure from event object for internal use
    // For creditLimit, ensure it's parsed as a number or defaults to 0
    const newValue = (name === 'creditLimit' ? parseFloat(value) || 0 : value);
    
    // Update internal state
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // IMPORTANT: Propagate the change up to the parent component via the onChange prop
    // The parent (NewSale.js) uses this to update its newUnsavedCustomerData state
    if (onChange) {
      onChange({ ...formData, [name]: newValue }); // Pass the updated formData object directly
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <Component onSubmit={Component === 'form' ? handleSubmit : undefined} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name} // Controlled input using internal state
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact</label>
        <input
          type="text"
          name="contact"
          id="contact"
          value={formData.contact} // Controlled input
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address} // Controlled input
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">Credit Limit</label>
        <input
          type="number"
          name="creditLimit"
          id="creditLimit"
          value={formData.creditLimit} // Controlled input
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      {/* Only show the submit button if the component is used as a standalone form */}
      {/* In NewSale.js modal, this button is NOT rendered because as="div" is passed */}
      {Component === 'form' && (
        <div className="text-right">
          <Button type="submit" loading={loading} disabled={loading}>
            {initialCustomer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      )}
    </Component>
  );
};

export default CustomerForm;