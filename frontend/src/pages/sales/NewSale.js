// frontend/src/pages/sales/NewSale.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// Components
import { Button } from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import ImagePreview from '../../components/common/ImagePreview';
import Loading from '../../components/common/Loading';
import CustomerForm from '../../components/customers/CustomerForm';
import SearchInput from '../../components/common/SearchInput';
import InvoiceGenerator from '../../components/sales/InvoiceGenerator';
import Modal from '../../components/common/Modal'; // Ensure this Modal.js file exists

// API calls directly
import { createSale as createSaleApi } from '../../api/sales';
import { createCustomer as createCustomerApi } from '../../api/customers';

// Redux Thunks and Actions
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers, addCustomer } from '../../features/customers/customerSlice'; // Corrected import for addNewCustomer as a plain action
// CORRECTED IMPORT: addNewSale as a thunk, addSale as a plain action
import { addNewSale as addNewSaleThunk, addSale } from '../../features/sales/saleSlice';

import config from '../../config/config';

const { CURRENCY } = config;

const NewSale = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux states for data fetching and loading
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const { customers, loading: customersLoading, error: customersError } = useSelector((state) => state.customers);
  const { loading: salesLoading, error: salesError } = useSelector((state) => state.sales); // Use salesLoading to avoid conflict with local 'loading'

  // Local state for customer creation management during form submission
  const [customerCreating, setCustomerCreating] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState(null);

  // Sale related states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newUnsavedCustomerData, setNewUnsavedCustomerData] = useState({ name: '', contact: '', address: '', creditLimit: 0 });
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

  const [saleItems, setSaleItems] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [downPayment, setDownPayment] = useState(0);
  const [notes, setNotes] = useState('');
  const [receiptImageFile, setReceiptImageFile] = useState(null);
  const [receiptImagePreviewUrl, setReceiptImagePreviewUrl] = useState(null);
  const [localLoading, setLocalLoading] = useState(false); // Local loading state for form submission
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [newlyCreatedSaleData, setNewlyCreatedSaleData] = useState(null);

  // State for new customer modal visibility
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, limit: 100 }));
    dispatch(fetchProducts({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Handle new customer creation error (if it happens during direct API call in handleSubmitSale)
  useEffect(() => {
    if (customerCreateError) {
      toast.error(`Error creating new customer: ${customerCreateError}`);
    }
  }, [customerCreateError]);


  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer ? customer.name : '');
    setIsNewCustomerMode(false);
    setNewUnsavedCustomerData({ name: '', contact: '', address: '', creditLimit: 0 });
  };

  const handleNewUnsavedCustomerDataChange = (updatedFormData) => {
    setNewUnsavedCustomerData(updatedFormData);
  };

  const handleSaveNewCustomerFromModal = async () => {
    if (!newUnsavedCustomerData.name.trim()) {
      toast.error('Customer name is required.');
      return;
    }

    setCustomerCreating(true);
    setCustomerCreateError(null);
    try {
      const createdCustomer = await createCustomerApi(newUnsavedCustomerData);

      setSelectedCustomer(createdCustomer);
      setIsNewCustomerMode(false); // Customer is now saved, so not "new unsaved" anymore
      setCustomerSearchTerm(createdCustomer.name);
      dispatch(addCustomer(createdCustomer)); // Update Redux state with new customer
      toast.success('New customer saved successfully!');
      setShowNewCustomerModal(false); // Close the modal
    } catch (error) {
      console.error('Failed to create new customer from modal:', error);
      setCustomerCreateError(error.message || 'Unknown error');
      toast.error('Failed to create new customer. Please try again.');
    } finally {
      setCustomerCreating(false);
    }
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
          nameUrdu: product.nameUrdu
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

  const renderPaymentStatusSection = () => {
    if (paymentMethod === 'cash') {
      return null; // No payment status needed for cash
    }

    if (paymentMethod === 'credit') {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Credit Sale:</strong> The full amount of PKR {calculateTotal().grandTotal.toFixed(2)} will be added to the customer's credit balance.
          </p>
        </div>
      );
    }

    if (paymentMethod === 'partial') {
      const totalAmount = calculateTotal().grandTotal;
      const remainingAmount = totalAmount - (parseFloat(downPayment) || 0);
      
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-800 text-sm">
                <strong>Down Payment:</strong> PKR {(parseFloat(downPayment) || 0).toFixed(2)}
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Remaining Credit:</strong> PKR {remainingAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-blue-800 text-sm">
              <p><strong>Total Amount:</strong> PKR {totalAmount.toFixed(2)}</p>
              <p><strong>Status:</strong> Partial Payment</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();

    if (localLoading || salesLoading || customerCreating) { // Check all relevant loading states
      console.warn('Form already submitting, ignoring duplicate click.');
      return;
    }

    setLocalLoading(true);

    if (!selectedCustomer) {
      toast.error('Please select an existing customer or add a new one.');
      setLocalLoading(false);
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one product to the sale.');
      setLocalLoading(false);
      return;
    }

    const { subTotal, grandTotal } = calculateTotal();

    const saleData = {
      customerId: selectedCustomer.id, // Use ID from selectedCustomer
      saleDate: new Date().toISOString(),
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.price
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      downPayment: parseFloat(downPayment) || 0,
      notes: notes,
      totalAmount: grandTotal,
      subTotal: subTotal,
      customerName: selectedCustomer.name, // Pass actual customer details for the sale record
      customerContact: selectedCustomer.contact,
      customerAddress: selectedCustomer.address,
      // Pass these if they are part of your Sale model for consistency
      customerCreditLimit: selectedCustomer.creditLimit,
      customerOutstandingBalance: selectedCustomer.outstandingBalance
    };

    const formData = new FormData();
    formData.append('saleData', JSON.stringify(saleData));
    if (receiptImageFile) {
      formData.append('receiptImage', receiptImageFile);
    }

    try {
      const resultAction = await dispatch(addNewSaleThunk(formData)); // Dispatch the thunk
      if (addNewSaleThunk.fulfilled.match(resultAction)) {
        toast.success('Sale recorded successfully!');
        setNewlyCreatedSaleData(resultAction.payload);
        setShowPrintPrompt(true);
      } else {
        // Error message already handled by toast in the thunk's rejectWithValue
        console.error('Failed to record sale:', resultAction.payload);
      }
    } catch (error) {
      console.error('An unexpected error occurred during sale submission:', error);
      toast.error('An unexpected error occurred during sale submission.');
    } finally {
      setLocalLoading(false);
    }
  };


  const handlePrintConfirmation = (confirm) => {
    setShowPrintPrompt(false);
    if (confirm && newlyCreatedSaleData) {
      navigate(`/sales/${newlyCreatedSaleData.id}`);
    } else {
      // Reset all relevant form states
      setSelectedCustomer(null);
      setNewUnsavedCustomerData({ name: '', contact: '', address: '', creditLimit: 0 });
      setIsNewCustomerMode(false);
      setCustomerSearchTerm('');
      setSaleItems([]);
      setDiscount('');
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      setDownPayment(0);
      setNotes('');
      setReceiptImageFile(null);
      setReceiptImagePreviewUrl(null);
      setNewlyCreatedSaleData(null);
      navigate('/sales');
    }
  };

  // Combine loading states
  const overallLoading = customersLoading || productsLoading || localLoading || salesLoading;
  const overallError = customersError || productsError || salesError;

  if (overallLoading) {
    return <Loading />;
  }

  if (overallError) {
    return <div className="text-red-500 text-center py-4">Error: {overallError}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Record New Sale</h1>

      <form onSubmit={handleSubmitSale} className="space-y-8">
        {/* Customer Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Customer Information</h2>

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

            {/* Display selected customer info or prompt to create new */}
            {selectedCustomer ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
                <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                <p className="text-sm">{selectedCustomer.contact}</p>
                <p className="text-sm">Outstanding Balance: <span className="font-semibold">{CURRENCY} {selectedCustomer.outstandingBalance?.toFixed(2) || '0.00'}</span></p>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchTerm('');
                    setIsNewCustomerMode(false);
                    setNewUnsavedCustomerData({ name: '', contact: '', address: '', creditLimit: 0 });
                  }}
                  variant="outline"
                  size="small"
                  className="mt-2"
                >
                  Change Customer
                </Button>
              </div>
            ) : (
              customerSearchTerm && !customersLoading && customers.filter(c =>
                c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                c.contact.toLowerCase().includes(customerSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-center">
                  <p className="mb-2">No customer found matching "{customerSearchTerm}".</p>
                  <Button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)} // Open modal to create new
                    variant="secondary"
                    size="small"
                  >
                    Create New Customer
                  </Button>
                </div>
              )
            )}
          </div>
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

            {productSearchTerm && !productsLoading && products.filter(p =>
              p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
              p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
            ).length === 0 && (
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
                <div className="col-span-2 flex justify-center">Action</div>
              </div>

              {saleItems.map(item => (
                <div key={item.productId} className="grid grid-cols-12 items-center gap-4 p-4 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 font-medium text-gray-800">{item.name}</div>
                  <div className="col-span-2 text-right text-gray-600">PKR {item.price.toFixed(2)}</div>
                  <div className="col-span-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 text-right font-semibold text-gray-800">PKR {(item.price * item.quantity).toFixed(2)}</div>
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
                  Subtotal: PKR {calculateTotal().subTotal.toFixed(2)}
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
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">Discount (PKR)</label>
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
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>

            {renderPaymentStatusSection()}

            {paymentMethod !== 'cash' && paymentMethod !== 'credit' && (
              <div>
                <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-2">Down Payment (PKR)</label>
                <input
                  type="text"
                  id="downPayment"
                  value={downPayment}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === '' || /^-?\d*\.?\d*$/.test(rawValue)) {
                      setDownPayment(rawValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    setDownPayment(isNaN(value) || value < 0 ? 0 : value);
                  }}
                  className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="0.00"
                />
              </div>
            )}

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
                  <ImagePreview url={receiptImagePreviewUrl} alt="Sale Receipt" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-right pt-6 border-t border-gray-200">
            <div className="text-2xl font-extrabold text-gray-900">
              Grand Total: PKR {calculateTotal().grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={localLoading || customerCreating || salesLoading} // Show loading if any is active
            disabled={localLoading || customerCreating || salesLoading || !selectedCustomer || saleItems.length === 0}
          >
            Record Sale
          </Button>
        </div>
      </form>

      {/* Modal for creating a new customer */}
      {showNewCustomerModal && (
        <Modal title="Create New Customer" onClose={() => setShowNewCustomerModal(false)}>
          <CustomerForm
            as="div"
            customer={newUnsavedCustomerData}
            onChange={handleNewUnsavedCustomerDataChange}
            loading={customerCreating}
          />
          <div className="mt-4 text-right">
              <Button
                  type="button"
                  onClick={handleSaveNewCustomerFromModal}
                  disabled={!newUnsavedCustomerData.name.trim() || customerCreating}
              >
                  Add Customer to Sale
              </Button>
          </div>
        </Modal>
      )}

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