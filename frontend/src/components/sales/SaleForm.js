import React, { useState, useEffect } from 'react';
import { SearchInput } from '../common/SearchInput';

export const SaleForm = ({ products, customers, onSubmit }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [downPayment, setDownPayment] = useState(0);
  const [discount, setDiscount] = useState(0);

  const handleAddProduct = (product) => {
    setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
  };

  const handleQuantityChange = (id, quantity) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === id ? { ...p, quantity } : p)
    );
  };

  const calculateTotal = () => {
    const subtotal = selectedProducts.reduce(
      (sum, item) => sum + (item.sellingPrice * item.quantity), 0
    );
    return subtotal - discount;
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Reset payment status and down payment based on method
    if (method === 'cash') {
      setPaymentStatus('paid');
      setDownPayment(0);
    } else if (method === 'credit') {
      setPaymentStatus('pending');
      setDownPayment(0);
    } else if (method === 'partial') {
      setPaymentStatus('partial');
      setDownPayment(0);
    }
  };

  const handleSubmit = () => {
    const totalAmount = calculateTotal();
    let finalPaymentStatus = paymentStatus;
    let finalDownPayment = 0;
    let creditAmount = 0;

    if (paymentMethod === 'cash') {
      finalPaymentStatus = 'paid';
      creditAmount = 0;
    } else if (paymentMethod === 'credit') {
      finalPaymentStatus = 'pending';
      creditAmount = totalAmount;
    } else if (paymentMethod === 'partial') {
      finalPaymentStatus = 'partial';
      finalDownPayment = parseFloat(downPayment) || 0;
      creditAmount = totalAmount - finalDownPayment;
    }

    const saleData = {
      customerId: selectedCustomer,
      items: selectedProducts.map(p => ({ productId: p.id, quantity: p.quantity })),
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      downPayment: finalDownPayment,
      creditAmount,
      discount,
      totalAmount
    };
    onSubmit(saleData);
  };

  const renderPaymentStatusSection = () => {
    if (paymentMethod === 'cash') {
      return null; // No payment status needed for cash
    }

    if (paymentMethod === 'credit') {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Credit Sale:</strong> The full amount of PKR {calculateTotal().toFixed(2)} will be added to the customer's credit balance.
          </p>
        </div>
      );
    }

    if (paymentMethod === 'partial') {
      const totalAmount = calculateTotal();
      const remainingAmount = totalAmount - (parseFloat(downPayment) || 0);
      
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-blue-800">Down Payment (PKR)</label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={downPayment}
                onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                className="w-full border border-blue-300 rounded p-2 mt-1"
                placeholder="Enter down payment amount"
              />
            </div>
            <div className="text-blue-800">
              <p><strong>Total Amount:</strong> PKR {totalAmount.toFixed(2)}</p>
              <p><strong>Down Payment:</strong> PKR {(parseFloat(downPayment) || 0).toFixed(2)}</p>
              <p><strong>Remaining Credit:</strong> PKR {remainingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-medium">Customer</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="partial">Partial Payment</option>
          </select>
        </div>
      </div>

      {/* Payment Status Section */}
      {renderPaymentStatusSection()}

      <div className="mb-4">
        <label className="block font-medium">Add Products</label>
        <SearchInput
          onSearch={(term) => {}}
          onSelect={handleAddProduct}
          data={products}
          placeholder="Search products..."
        />
      </div>

      <div className="mb-4">
        <h3 className="font-bold">Selected Products</h3>
        {selectedProducts.map(item => (
          <div key={item.id} className="flex justify-between items-center border-b py-2">
            <div>
              <span>{item.name}</span>
              <span className="ml-2 text-gray-500">(PKR {item.sellingPrice})</span>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                className="w-16 border rounded p-1 text-center"
              />
              <button
                onClick={() => setSelectedProducts(prev => prev.filter(p => p.id !== item.id))}
                className="ml-2 text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center border-t pt-4">
        <div>
          <label className="font-medium">Discount (PKR)</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value))}
            className="border rounded p-2 w-32 ml-2"
          />
        </div>
        <div className="text-xl font-bold">
          Total: PKR {calculateTotal().toFixed(2)}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white py-2 rounded mt-4"
        disabled={selectedProducts.length === 0}
      >
        Complete Sale
      </button>
    </div>
  );
};