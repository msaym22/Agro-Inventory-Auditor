import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createSale } from '../../api/sales'; // Ensure correct import
import { toast } from 'react-toastify';
import CustomerSearch from '../../components/customers/CustomerSearch';
import ProductSearch from '../../components/products/ProductSearch'; // Ensure this is correctly imported
import FileUpload from '../../components/common/FileUpload';
import { addSale } from '../../features/sales/saleSlice';
import { Button } from '../../components/common/Button'; // Import Button
import config from '../../config/config'; // Import config for currency
import ImagePreview from '../../components/common/ImagePreview';

const { CURRENCY } = config;

const NewSale = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [receiptImageFile, setReceiptImageFile] = useState(null); // Changed for clarity
  const [receiptImagePreviewUrl, setReceiptImagePreviewUrl] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const addProductToSale = (product) => {
    // Check if product is already in the sale items
    const existingItemIndex = saleItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      // If product exists, update its quantity
      setSaleItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // If product is new, add it to the list
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          stock: product.stock, // Keep track of original stock for validation
        }
      ]);
    }
  };


  const removeItem = (productId) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;

    setSaleItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          // Prevent adding more than available stock
          if (quantity > item.stock) {
            toast.warn(`Cannot add more than ${item.stock} for ${item.name}.`);
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    const subtotal = saleItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    return Math.max(0, subtotal - discount); // Ensure total doesn't go below zero
  };

  const handleFileSelect = (file) => {
    setReceiptImageFile(file);
    if (file) {
      setReceiptImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setReceiptImagePreviewUrl(null);
    }
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer.');
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one product to the sale.');
      return;
    }

    setLoading(true);

    const saleData = {
      customerId: selectedCustomer.id,
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: calculateTotal(), // Ensure totalAmount is passed
    };

    const formData = new FormData();
    // Append JSON data as a string
    formData.append('data', JSON.stringify(saleData));
    // Append the file if selected
    if (receiptImageFile) {
      formData.append('receiptImage', receiptImageFile); // 'receiptImage' should match multer fieldname
    }

    try {
      const response = await createSale(formData); // Send FormData
      dispatch(addSale(response)); // Assuming response from API is directly the sale object
      toast.success('Sale recorded successfully!');
      navigate(`/sales/${response.id}`);
    } catch (error) {
      console.error('Failed to record sale:', error);
      toast.error('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Record New Sale</h1>

      <form onSubmit={handleSubmitSale} className="space-y-8">
        {/* Customer Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Customer Information</h2>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
            <CustomerSearch
              onSelect={setSelectedCustomer}
              value={selectedCustomer?.name || ''}
            />

            {selectedCustomer && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
                <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                <p className="text-sm">{selectedCustomer.contact}</p>
                <p className="text-sm">Outstanding Balance: <span className="font-semibold">{CURRENCY} {selectedCustomer.outstandingBalance.toFixed(2)}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Products</h2>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
            <ProductSearch onSelect={addProductToSale} />
          </div>

          {saleItems.length > 0 && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-semibold text-gray-700 text-sm uppercase">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-center">Action</div>
              </div>

              {saleItems.map(item => (
                <div key={item.productId} className="grid grid-cols-12 items-center gap-4 p-4 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 font-medium text-gray-800">{item.name}</div>
                  <div className="col-span-2 text-right text-gray-600">{CURRENCY} {item.price.toFixed(2)}</div>
                  <div className="col-span-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 text-right font-semibold text-gray-800">{CURRENCY} {(item.price * item.quantity).toFixed(2)}</div>
                  <div className="col-span-2 flex justify-center">
                    <Button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      variant="danger"
                      size="small"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="p-4 border-t border-gray-200 text-right">
                <div className="text-xl font-bold text-gray-900">
                  Subtotal: {CURRENCY} {calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Payment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">Discount ({CURRENCY})</label>
              <input
                type="number"
                id="discount"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                id="paymentStatus"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Image</label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/*"
                buttonText="Upload Receipt"
              />
              {receiptImagePreviewUrl && (
                <div className="mt-4">
                  <ImagePreview url={receiptImagePreviewUrl} alt="Receipt Image" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-right pt-6 border-t border-gray-200">
            <div className="text-2xl font-extrabold text-gray-900">
              Grand Total: {CURRENCY} {calculateTotal().toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading || saleItems.length === 0 || !selectedCustomer}
          >
            Record Sale
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewSale;