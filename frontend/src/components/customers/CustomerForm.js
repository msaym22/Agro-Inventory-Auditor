import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';

// The `as` prop determines if the root element is a 'form' or 'div'
const CustomerForm = ({ customer: initialCustomer, onSubmit, loading, as: Component = 'form' }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    creditLimit: '',
  });

  // Pre-fill the form if an existing customer is provided (for editing)
  useEffect(() => {
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.name || '',
        contact: initialCustomer.contact || '',
        address: initialCustomer.address || '',
        creditLimit: initialCustomer.creditLimit || '',
      });
    }
  }, [initialCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          value={formData.name}
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
          value={formData.contact}
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
          value={formData.address}
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
          value={formData.creditLimit}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      {/* Only show the submit button if the component is used as a standalone form */}
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
