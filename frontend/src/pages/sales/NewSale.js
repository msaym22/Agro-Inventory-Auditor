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

// API calls directly (as per your current setup and to resolve previous import issues)
import { createSale as createSaleApi } from '../../api/sales'; // Alias to avoid conflict if a thunk also exists
import { createCustomer as createCustomerApi } from '../../api/customers'; // Alias to avoid conflict

// Redux Thunks and Actions
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers, addNewCustomer } from '../../features/customers/customerSlice'; // addNewCustomer is a plain action here
import { addSale } from '../../features/sales/saleSlice'; // addSale is a plain action here

import config from '../../config/config';

const { CURRENCY } = config;

const NewSale = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux states for data fetching and loading
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const { customers, loading: customersLoading, error: customersError } = useSelector((state) => state.customers);
  const { loading: saleCreating, error: saleError } = useSelector((state) => state.sales);
  
  // Local state for customer creation management during form submission
  const [customerCreating, setCustomerCreating] = useState(false); 
  const [customerCreateError, setCustomerCreateError] = useState(null);
  
  // Sale related states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // State to hold data for a *new* customer not yet saved to backend
  const [newUnsavedCustomerData, setNewUnsavedCustomerData] = useState({ name: '', contact: '', address: '', creditLimit: 0 });
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false); // Indicates if selectedCustomer is a new, unsaved one
  
  const [saleItems, setSaleItems] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState(''); 

  const [discount, setDiscount] = useState(''); 
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [receiptImageFile, setReceiptImageFile] = useState(null);
  const [receiptImagePreviewUrl, setReceiptImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false); // Overall loading state for form submission
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [newlyCreatedSaleData, setNewlyCreatedSaleData] = useState(null); 
  
  // State for new customer modal visibility
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState(''); 

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
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
    setIsNewCustomerMode(false); // Not in new customer mode if an existing one is selected
    setNewUnsavedCustomerData({ name: '', contact: '', address: '', creditLimit: 0 }); // Clear unsaved data
  };

  // This handler now correctly expects the updated form data object directly
  const handleNewUnsavedCustomerDataChange = (updatedFormData) => { 
    setNewUnsavedCustomerData(updatedFormData); // Set the entire updated object
  };

  // Function to "save" the new customer data temporarily from modal
  const handleSaveNewCustomerFromModal = () => {
    if (!newUnsavedCustomerData.name.trim()) { 
      toast.error('Customer name is required.');
      return;
    }
    // Set the new customer data to selectedCustomer for the sale, mark as new
    setSelectedCustomer({
      id: null, // No ID yet as not saved to backend
      name: newUnsavedCustomerData.name,
      contact: newUnsavedCustomerData.contact,
      address: newUnsavedCustomerData.address,
      creditLimit: newUnsavedCustomerData.creditLimit,
      outstandingBalance: 0, // Default for new customer
    });
    setIsNewCustomerMode(true); // Indicate that selectedCustomer is a new, unsaved one
    setCustomerSearchTerm(newUnsavedCustomerData.name); // Show new customer name in search input field
    setShowNewCustomerModal(false); // Close the modal
    toast.info('New customer details captured. Click "Record Sale" to save them along with the sale.');
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

  // Handles submission of the main sale form
  const handleSubmitSale = async (e) => {
    e.preventDefault();

    // FIX: Add this defensive check at the very top to prevent execution if already loading
    if (loading) {
      console.warn('Form already submitting, ignoring duplicate click.');
      return;
    }

    setLoading(true); // Start overall loading for the submission process

    let customerIdToUse = selectedCustomer?.id;
    let finalCustomerName = selectedCustomer?.name; 
    let finalCustomerContact = selectedCustomer?.contact;
    let finalCustomerAddress = selectedCustomer?.address;

    // Condition: Create new customer if in new customer mode and ID is null (not yet saved)
    if (isNewCustomerMode && selectedCustomer && selectedCustomer.id === null) {
      if (!selectedCustomer.name.trim()) { 
        toast.error('Customer name is required for a new customer.');
        setLoading(false); 
        return;
      }
      setCustomerCreating(true); // Indicate customer creation API call is starting
      setCustomerCreateError(null); 
      try {
        const createdCustomer = await createCustomerApi(selectedCustomer); // Call API directly
        
        // FIX: Update selectedCustomer with the newly created customer's ID and details
        setSelectedCustomer(createdCustomer); // <--- THIS IS THE CRUCIAL LINE FOR THE 409 FIX
        
        customerIdToUse = createdCustomer.id;
        finalCustomerName = createdCustomer.name;
        finalCustomerContact = createdCustomer.contact;
        finalCustomerAddress = createdCustomer.address;
        dispatch(addNewCustomer(createdCustomer)); // Update Redux state with new customer
        toast.success('New customer saved successfully!');
      } catch (error) {
        console.error('Failed to create new customer for sale:', error);
        setCustomerCreateError(error.message || 'Unknown error');
        toast.error('Failed to create new customer. Sale not recorded.');
        setLoading(false); // Stop loading if customer creation fails
        setCustomerCreating(false);
        return;
      } finally {
        setCustomerCreating(false); // Ensure customerCreating is reset
      }
    } else if (!customerIdToUse) { 
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
      saleDate: new Date().toISOString(), 
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.price 
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      notes: notes,
      totalAmount: grandTotal, 
      subTotal: subTotal, 
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
      const response = await createSaleApi(formData); // Directly call sale API
      
      if (response && response.id) {
        dispatch(addSale(response)); // Update Redux state with new sale
        setNewlyCreatedSaleData({ 
          ...response, 
          customerName: finalCustomerName, 
          customerPhone: finalCustomerContact,
          customerAddress: finalCustomerAddress,
          items: saleItems.map(item => ({ 
            ...item,
            total: item.price * item.quantity, 
            unitPrice: item.price 
          }))
        });
        setShowPrintPrompt(true); // This should now trigger the print prompt
        toast.success('Sale recorded successfully!');
      } else {
        toast.error('Sale recorded, but response missing ID. Please check backend.');
        console.error('Unexpected response from createSale:', response);
      }
    } catch (error) {
      console.error('Failed to record sale:', error);
      // Display a more specific message if it's the 409 Conflict
      if (error.response && error.response.status === 409) {
          toast.error('Error: Customer already exists. Sale not recorded.');
      } else {
          toast.error(`Failed to record sale: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false); // Ensure button is re-enabled whether success or fail
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
      setNotes('');
      setReceiptImageFile(null);
      setReceiptImagePreviewUrl(null);
      setNewlyCreatedSaleData(null); 
      navigate('/sales'); 
    }
  };

  if (customersLoading || productsLoading) {
    return <Loading />;
  }

  if (productsError || customersError) {
    return <div className="text-red-500 text-center py-4">Error: {productsError || customersError}</div>;
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
                      className="w-full p-2 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
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
            loading={loading} 
            disabled={loading || !selectedCustomer || saleItems.length === 0} 
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