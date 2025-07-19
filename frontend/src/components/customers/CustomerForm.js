import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button'; // Import Button component
import config from '../../config/config';

const { CURRENCY } = config;

const CustomerForm = ({ customer, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: customer || {
      name: '',
      contact: '', // Assuming contact is still the field name from backend
      address: '',
      creditLimit: 0,
      outstandingBalance: 0
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
        <input
          id="name"
          {...register('name', { required: 'Customer name is required' })}
          className={`w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Enter customer name"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
        <input
          id="contact"
          type="tel"
          {...register('contact')}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          placeholder="e.g., +923001234567 or 03001234567"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea
          id="address"
          {...register('address')}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          rows="4"
          placeholder="Enter customer address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-2">Credit Limit ({CURRENCY})</label>
          <input
            id="creditLimit"
            type="number"
            step="0.01"
            min="0"
            {...register('creditLimit', { valueAsNumber: true })}
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="outstandingBalance" className="block text-sm font-medium text-gray-700 mb-2">Initial Balance ({CURRENCY})</label>
          <input
            id="outstandingBalance"
            type="number"
            step="0.01"
            {...register('outstandingBalance', { valueAsNumber: true })}
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">Positive for credit, negative for advance payment</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading}
        >
          {customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;