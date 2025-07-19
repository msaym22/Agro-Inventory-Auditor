import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createSale } from '../../api/sales';
import { toast } from 'react-toastify';
import { addSale } from '../../features/sales/saleSlice';
import { Button } from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import ImagePreview from '../../components/common/ImagePreview';
import Loading from '../../components/common/Loading';
import config from '../../config/config';

// Import customer and product related thunks and components
import { fetchCustomers, addNewCustomer } from '../../features/customers/customerSlice';
import { fetchProducts } from '../../features/products/productSlice';
import CustomerForm from '../../components/customers/CustomerForm'; // Reusing CustomerForm
import SearchInput from '../../components/common/SearchInput'; // Reusing SearchInput for customer/product selection

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
  const [isNewCustomer, setIsNewCustomer] = useState(false); // State to toggle new customer form
  const [newCustomerData, setNewCustomerData] = useState({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  const [saleItems, setSaleItems] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [receiptImageFile, setReceiptImageFile] = useState(null);
  const [receiptImagePreviewUrl, setReceiptImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false); // For sale submission

  // Fetch customers and products on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contact.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name); // Set search term to selected customer's name
    setIsNewCustomer(false); // Ensure new customer form is hidden
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewCustomerSubmit = async (data) => {
    setLoading(true); // Use a separate loading for customer creation if needed, or combined
    try {
      const createdCustomer = await dispatch(addNewCustomer(data)).unwrap();
      toast.success('New customer created!');
      setSelectedCustomer(createdCustomer);
      setIsNewCustomer(false); // Hide new customer form
      setNewCustomerData({ name: '', contact: '', address: '', creditLimit: 0, outstandingBalance: 0 }); // Reset form
    } catch (error) {
      console.error('Failed to create new customer:', error);
      toast.error('Failed to create new customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addProductToSale = (product) => {
    const existingItemIndex = saleItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      setSaleItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          stock: product.stock,
        }
      ]);
    }
    setProductSearchTerm(''); // Clear product search after selection
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
    return Math.max(0, subtotal - discount);
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

    let customerIdToUse = selectedCustomer?.id;

    // If it's a new customer, ensure it's created first
    if (isNewCustomer) {
      if (!newCustomerData.name) {
        toast.error('New customer name is required.');
        return;
      }
      setLoading(true);
      try {
        const createdCustomer = await dispatch(addNewCustomer(newCustomerData)).unwrap();
        customerIdToUse = createdCustomer.id;
        toast.success('New customer created and selected for sale!');
      } catch (error) {
        console.error('Failed to create new customer for sale:', error);
        toast.error('Failed to create new customer. Sale not recorded.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!customerIdToUse) {
      toast.error('Please select an existing customer or create a new one.');
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one product to the sale.');
      return;
    }

    setLoading(true);

    const saleData = {
      customerId: customerIdToUse,
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: item.price // Include priceAtSale for backend
      })),
      discount: parseFloat(discount) || 0,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: calculateTotal(),
      notes: '' // Add a notes field if needed
    };

    const formData = new FormData();
    formData.append('saleData', JSON.stringify(saleData)); // Send saleData as a JSON string
    if (receiptImageFile) {
      formData.append('receiptImage', receiptImageFile);
    }

    try {
      const response = await createSale(formData);
      dispatch(addSale(response));
      toast.success('Sale recorded successfully!');
      navigate(`/sales/${response.id}`);
    } catch (error) {
      console.error('Failed to record sale:', error);
      toast.error('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
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
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setSelectedCustomer(null); // Clear selected customer on new search
                }}
                onSearch={() => {}} // Debounce handled internally by SearchInput if needed
              />

              {customerSearchTerm && filteredCustomers.length > 0 && (
                <ul className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white shadow-md">
                  {filteredCustomers.map(customer => (
                    <li
                      key={customer.id}
                      className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <p className="font-medium text-gray-800">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.contact}</p>
                    </li>
                  ))}
                </ul>
              )}

              {customerSearchTerm && filteredCustomers.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-center">
                  <p className="mb-2">No customer found with that name/contact.</p>
                  <Button
                    type="button"
                    onClick={() => setIsNewCustomer(true)}
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
                onChange={handleNewCustomerChange} // Pass onChange prop for controlled inputs
                onSubmit={handleNewCustomerSubmit} // This will be called if CustomerForm has its own submit
                loading={loading}
              />
              <Button
                type="button"
                onClick={() => setIsNewCustomer(false)}
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
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              onSearch={() => {}} // Debounce handled internally by SearchInput if needed
            />

            {productSearchTerm && filteredProducts.length > 0 && (
              <ul className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white shadow-md">
                {filteredProducts.map(product => (
                  <li
                    key={product.id}
                    className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    onClick={() => addProductToSale(product)}
                  >
                    <p className="font-medium text-gray-800">{product.name} ({product.sku})</p>
                    <p className="text-sm text-gray-500">{CURRENCY} {product.sellingPrice.toFixed(2)} - Stock: {product.stock}</p>
                  </li>
                ))}
              </ul>
            )}

            {productSearchTerm && filteredProducts.length === 0 && (
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
            disabled={loading || saleItems.length === 0 || (!selectedCustomer && !isNewCustomer)}
          >
            Record Sale
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewSale;
