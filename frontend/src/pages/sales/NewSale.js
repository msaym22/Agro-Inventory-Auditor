// frontend/src/pages/sales/NewSale.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createSale } from '../../api/sales'; // Assuming this is your API call to create a sale
import { toast } from 'react-toastify';
import { addSale } from '../../features/sales/saleSlice'; // Action to add sale to Redux state
import { Button } from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import ImagePreview from '../../components/common/ImagePreview';
import Loading from '../../components/common/Loading';
import config from '../../config/config';

// Import customer and product related thunks and components
import { fetchCustomers, addNewCustomer } from '../../features/customers/customerSlice';
import { fetchProducts } from '../../features/products/productSlice';
import CustomerForm from '../../components/customers/CustomerForm'; // This form is used for new customer details
import SearchInput from '../../components/common/SearchInput';
import InvoiceGenerator from '../../components/sales/InvoiceGenerator'; // Import for print functionality

const { CURRENCY } = config;

const NewSale = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux states for customers and products
  const customers = useSelector(state => state.customers.customers);
  const customersLoading = useSelector(state => state.customers.loading);
  const products = useSelector(state => state.products.products);
  const productsLoading = useSelector(state => state.products.loading);

  // Sale related states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  const [saleItems, setSaleItems] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [discount, setDiscount] = useState(''); // Changed to string for display flexibility
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [receiptImageFile, setReceiptImageFile] = useState(null);
  const [receiptImagePreviewUrl, setReceiptImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false); // For sale submission
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [newlyCreatedSaleData, setNewlyCreatedSaleData] = useState(null); // Store full sale data for InvoiceGenerator

  // Fetch customers and products on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer ? customer.name : '');
    setIsNewCustomer(false);
    setNewCustomerData({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 }); // Clear new customer data
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const addProductToSale = (product) => {
    const existingItemIndex = saleItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      setSaleItems(prev => prev.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + 1;
          if (newQuantity > product.stock) {
            toast.warn(`Cannot add more than ${product.stock} for ${item.name}.`);
            return { ...item, quantity: product.stock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          stock: product.stock,
          nameUrdu: product.nameUrdu // Include nameUrdu for invoice generation
        }
      ]);
    }
    setProductSearchTerm('');
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
          const originalProduct = products.find(p => p.id === productId);
          if (originalProduct && quantity > originalProduct.stock) {
            toast.warn(`Cannot add more than ${originalProduct.stock} for ${item.name}.`);
            return { ...item, quantity: originalProduct.stock };
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
    const parsedDiscount = parseFloat(discount) || 0;
    return {
      subTotal: subtotal,
      grandTotal: Math.max(0, subtotal - parsedDiscount)
    };
  };

  const handleReceiptFileSelect = (file) => {
    setReceiptImageFile(file);
    if (file) {
      setReceiptImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setReceiptImagePreviewUrl(null);
    }
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading for the entire submission process

    let customerIdToUse = selectedCustomer?.id;
    let finalCustomerName = selectedCustomer?.name; // For invoice display
    let finalCustomerContact = selectedCustomer?.contact;
    let finalCustomerAddress = selectedCustomer?.address;

    // Problem 1 & 3 Solution: Handle new customer creation within sale submission
    if (isNewCustomer) {
      if (!newCustomerData.name.trim()) { // Validate new customer name
        toast.error('Customer name is required to create a new customer.');
        setLoading(false);
        return;
      }
      try {
        const createdCustomer = await dispatch(addNewCustomer(newCustomerData)).unwrap();
        customerIdToUse = createdCustomer.id;
        finalCustomerName = createdCustomer.name;
        finalCustomerContact = createdCustomer.contact;
        finalCustomerAddress = createdCustomer.address;
        toast.success('New customer created!');
      } catch (error) {
        console.error('Failed to create new customer for sale:', error);
        toast.error('Failed to create new customer. Sale not recorded.');
        setLoading(false);
        return;
      }
    } else if (!customerIdToUse) { // If not new customer, but no existing customer selected
      toast.error('Please select an existing customer or create a new one.');
      setLoading(false);
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one product to the sale.');
      setLoading(false);
      return;
    }

    const { subTotal, grandTotal } = calculateTotal();

    const saleData = {
      customerId: customerIdToUse,
      saleDate: new Date().toISOString(), // Add saleDate
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.price // priceAtSale should be the unit price at the time of sale
      })),
      discount: parseFloat(discount) || 0, // Ensure discount is a number when sending
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: grandTotal, // Use grandTotal for totalAmount
      subTotal: subTotal, // Add subTotal to saleData
      notes: notes,
      // For InvoiceGenerator, include customer and product details directly if needed
      customerName: finalCustomerName,
      customerPhone: finalCustomerContact,
      customerAddress: finalCustomerAddress,
    };

    const formData = new FormData();
    formData.append('saleData', JSON.stringify(saleData));
    if (receiptImageFile) {
      formData.append('receiptImage', receiptImageFile);
    }

    try {
      // Problem 1 & 2 Solution: Ensure createSale returns the full sale object
      // and add it to Redux state correctly.
      const response = await createSale(formData); // This should return the created sale object from backend
      
      // Ensure the response from createSale is the full sale object with ID
      if (response && response.id) {
        dispatch(addSale(response)); // Add the newly created sale to Redux state
        setNewlyCreatedSaleData({ // Set full sale data for invoice generator
          ...response, // Use the response from backend which should have all details including ID
          customerName: finalCustomerName, // Use the final customer name (new or existing)
          customerPhone: finalCustomerContact, // Add phone
          customerAddress: finalCustomerAddress, // Add address
          items: saleItems.map(item => ({ // Ensure items array is structured for InvoiceGenerator
            ...item,
            total: item.price * item.quantity, // Calculate total for each item
            unitPrice: item.price // Ensure unitPrice is available
          }))
        });
        setShowPrintPrompt(true);
        toast.success('Sale recorded successfully!');
      } else {
        // Fallback if backend response is not as expected
        toast.error('Sale recorded, but response missing ID. Please check backend.');
        console.error('Unexpected response from createSale:', response);
      }
    } catch (error) {
      console.error('Failed to record sale:', error);
      toast.error(`Failed to record sale: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintConfirmation = (confirm) => {
    setShowPrintPrompt(false);
    if (confirm && newlyCreatedSaleData) {
      // Navigate to SaleDetail page which will render InvoiceGenerator
      navigate(`/sales/${newlyCreatedSaleData.id}`); 
    } else {
      // Problem 4 Solution: Redirect to sales list when 'No, Thank You' is clicked
      // Reset all form states
      setSelectedCustomer(null);
      setIsNewCustomer(false);
      setNewCustomerData({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 }); // Clear new customer data
      setCustomerSearchTerm(''); // Clear search term
      setSaleItems([]);
      setProductSearchTerm('');
      setDiscount(''); // Reset to empty string
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      setNotes('');
      setReceiptImageFile(null);
      setReceiptImagePreviewUrl(null);
      setNewlyCreatedSaleData(null); // Clear newly created sale data
      navigate('/sales'); // Redirect to sales list
    }
  };

  if (customersLoading || productsLoading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Record New Sale</h1>

      <form onSubmit={handleSubmitSale} className="space-y-8">
        {/* Customer Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Customer Information</h2>

          {!isNewCustomer ? (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Existing Customer</label>
              <SearchInput
                placeholder="Search customers by name or contact..."
                data={customers}
                searchKeys={['name', 'contact']}
                onSelectResult={handleCustomerSelect}
                renderResult={(customer) => (
                  <div>
                    <p className="font-medium text-gray-800">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.contact}</p>
                  </div>
                )}
                value={customerSearchTerm}
                onSearch={setCustomerSearchTerm}
              />

              {customerSearchTerm && !selectedCustomer && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-center">
                  <p className="mb-2">No customer found matching "{customerSearchTerm}".</p>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsNewCustomer(true);
                      setSelectedCustomer(null); // Ensure selectedCustomer is null when creating new
                    }}
                    variant="secondary"
                    size="small"
                  >
                    Create New Customer
                  </Button>
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
                  <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                  <p className="text-sm">{selectedCustomer.contact}</p>
                  <p className="text-sm">Outstanding Balance: <span className="font-semibold">{CURRENCY} {selectedCustomer.outstandingBalance?.toFixed(2) || '0.00'}</span></p>
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchTerm('');
                    }}
                    variant="outline"
                    size="small"
                    className="mt-2"
                  >
                    Change Customer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">New Customer Details</h3>
              <CustomerForm
                customer={newCustomerData}
                onChange={handleNewCustomerChange}
                loading={loading}
              />
              <Button
                type="button"
                onClick={() => {
                  setIsNewCustomer(false);
                  setNewCustomerData({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 }); // Clear new customer data
                  setCustomerSearchTerm(''); // Clear search term
                }}
                variant="secondary"
                size="small"
                className="mt-4"
              >
                Select Existing Customer
              </Button>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Products</h2>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
            <SearchInput
              placeholder="Search products by name or SKU..."
              data={products}
              searchKeys={['name', 'sku']}
              onSelectResult={addProductToSale}
              renderResult={(product) => (
                <div>
                  <p className="font-medium text-gray-800">{product.name} ({product.sku})</p>
                  <p className="text-sm text-gray-500">
                    {CURRENCY} {product.sellingPrice.toFixed(2)} |
                    Stock: {product.stock} |
                    Location: {product.storageLocation || 'N/A'}
                  </p>
                </div>
              )}
              value={productSearchTerm}
              onSearch={setProductSearchTerm}
            />

            {productSearchTerm && !productsLoading && products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-center">
                No product found matching "{productSearchTerm}".
              </div>
            )}
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
                  Subtotal: {CURRENCY} {calculateTotal().subTotal.toFixed(2)}
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
                type="text"
                id="discount"
                value={discount}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (rawValue === '' || /^-?\d*\.?\d*$/.test(rawValue)) {
                    setDiscount(rawValue);
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  setDiscount(isNaN(value) || value < 0 ? 0 : value);
                }}
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
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="Add any specific notes for this sale..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Image</label>
              <FileUpload
                onFileSelect={handleReceiptFileSelect}
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
              Grand Total: {CURRENCY} {calculateTotal().grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading || saleItems.length === 0 || (!selectedCustomer && !isNewCustomer)}
          >
            Record Sale
          </Button>
        </div>
      </form>

      {/* Print Bill Prompt Modal/Dialog */}
      {showPrintPrompt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-xl font-semibold mb-4">Sale Recorded Successfully!</h3>
            <p className="mb-6">Do you want to print the bill?</p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => handlePrintConfirmation(true)}
                variant="success"
                size="medium"
              >
                Yes, Print Bill
              </Button>
              <Button
                onClick={() => handlePrintConfirmation(false)}
                variant="secondary"
                size="medium"
              >
                No, Thank You
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
