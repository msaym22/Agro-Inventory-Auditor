import React, { useState, useEffect } from 'react';
// No <form> tag here. The parent component (NewSale) will wrap this in its own form.

const CustomerForm = ({ customer, onChange, loading }) => {
  // Internal state to manage form data, initialized with props
  // This allows the form to be controlled by its parent, but also manage its own input values
  const [formData, setFormData] = useState(customer);

  // Update internal state when 'customer' prop changes (e.g., when parent resets it)
  useEffect(() => {
    setFormData(customer);
  }, [customer]);

  // Handle changes in form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // IMPORTANT: Propagate the change up to the parent component's state
    if (onChange) {
      onChange(e); 
    }
  };

  return (
    <div className="space-y-4"> {/* This div replaces the <form> tag to prevent nesting issues */}
      <div>
        <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="customer-name" // Unique ID for accessibility
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required // HTML5 validation for frontend
        />
      </div>
      <div>
        <label htmlFor="customer-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
        <input
          type="text"
          id="customer-contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          id="customer-address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="customer-credit-limit" className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
        <input
          type="number"
          id="customer-credit-limit"
          name="creditLimit"
          value={formData.creditLimit}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {/* No submit button here. Parent form handles submission. */}
    </div>
  );
};

export default CustomerForm;
