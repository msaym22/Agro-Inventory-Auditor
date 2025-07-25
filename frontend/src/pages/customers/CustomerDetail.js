// frontend/src/pages/customers/CustomerDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerById } from '../../features/customers/customerSlice';
import customersAPI from '../../api/customers'; // Assuming you have this for payments
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaArrowLeft, FaPlus, FaFileInvoice } from 'react-icons/fa';
import { Button } from '../../components/common/Button';

// Placeholder for your API functions - you'll need to create these
const paymentsAPI = {
    getPaymentsByCustomerId: async (customerId) => {
        // In a real app, this would be: return api.get(`/payments/customer/${customerId}`);
        console.log(`Fetching payments for customer ${customerId}`);
        return []; // Return empty array for now
    },
    createPayment: async (paymentData) => {
        // In a real app, this would be: return api.post('/payments', paymentData);
        console.log('Creating payment:', paymentData);
        return { id: Math.random(), ...paymentData }; // Return a mock payment
    }
};

// --- PaymentHistory Component ---
const PaymentHistory = ({ customerId, onPaymentAdded }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newPayment, setNewPayment] = useState({ amount: '', paymentMethod: 'cash', notes: '' });

    const fetchPayments = async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            const response = await paymentsAPI.getPaymentsByCustomerId(customerId);
            setPayments(response);
        } catch (error) {
            console.error("Could not fetch payments", error);
            toast.error("Could not fetch payment history.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPayments();
    }, [customerId]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await paymentsAPI.createPayment({ ...newPayment, customerId });
            toast.success('Payment recorded successfully!');
            setNewPayment({ amount: '', paymentMethod: 'cash', notes: '' });
            setShowForm(false);
            onPaymentAdded(); // Refresh parent component data (customer balance)
            fetchPayments(); // Refresh payment list in this component
        } catch (error) {
            toast.error('Failed to record payment.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Payment History</h3>
                <Button onClick={() => setShowForm(!showForm)} variant="secondary">
                    <FaPlus className="mr-2" /> {showForm ? 'Cancel' : 'Add Payment'}
                </Button>
            </div>
            {showForm && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-4">
                    {/* Form fields for adding a new payment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Amount</label>
                            <input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Payment Method</label>
                            <select value={newPayment.paymentMethod} onChange={e => setNewPayment({...newPayment, paymentMethod: e.target.value})} className="w-full p-2 border rounded">
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Notes (Optional)</label>
                        <input type="text" value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div className="text-right">
                        <Button type="submit" disabled={loading} variant="success">
                            {loading ? 'Saving...' : 'Save Payment'}
                        </Button>
                    </div>
                </form>
            )}
             {/* Display Payment History */}
            <div className="space-y-2">
                {loading ? <p>Loading payments...</p> : payments.length > 0 ? (
                    payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{new Date(payment.paymentDate).toLocaleDateString()} - {payment.notes}</span>
                            <span className="font-bold">Rs {payment.amount.toFixed(2)}</span>
                        </div>
                    ))
                ) : (
                     <p className="text-gray-500">No payment history recorded.</p>
                )}
            </div>
        </div>
    );
};


// --- Main CustomerDetail Component ---
const CustomerDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    
    // ✅ CORRECTED: Changed 'customerDetails' to 'currentCustomer' to match your Redux state
    const { currentCustomer: customer, status, error } = useSelector(state => state.customers);

    const fetchDetails = () => {
        if (id) {
            dispatch(fetchCustomerById(id));
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [dispatch, id]);

    if (status === 'loading' || !customer) {
        return <Loading />;
    }

    if (status === 'failed') {
        return <div className="text-center text-red-500">{error || 'Error loading customer details.'}</div>;
    }

    const totalSpent = customer.sales ? customer.sales.reduce((acc, sale) => acc + sale.totalAmount, 0) : 0;

    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{customer.name}</h1>
                        <p className="text-gray-600">{customer.contact || 'No contact'} | {customer.address || 'No address'}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/customers">
                            <Button variant="secondary"><FaArrowLeft className="mr-2" />Back to List</Button>
                        </Link>
                        <Link to={`/customers/edit/${customer.id}`}>
                           <Button><FaEdit className="mr-2" />Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-green-100 p-4 rounded-lg">
                        <p className="text-sm text-green-800 font-semibold">Total Spent</p>
                        <p className="text-2xl font-bold text-green-900">Rs {totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg">
                        <p className="text-sm text-red-800 font-semibold">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-red-900">Rs {parseFloat(customer.outstandingBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-semibold">Credit Limit</p>
                        <p className="text-2xl font-bold text-blue-900">Rs {parseFloat(customer.creditLimit || 0).toFixed(2)}</p>
                    </div>
                </div>

                <PaymentHistory customerId={customer.id} onPaymentAdded={fetchDetails} />
                
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Purchase History</h3>
                    <div className="space-y-4">
                        {customer.sales && customer.sales.length > 0 ? (
                            customer.sales.map(sale => (
                                <div key={sale.id} className="bg-gray-50 p-4 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">Invoice #{sale.id}</p>
                                            <p className="text-sm text-gray-600">{new Date(sale.saleDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">Rs {sale.totalAmount.toFixed(2)}</p>
                                            <span className={`px-2 py-1 text-xs rounded-full ${sale.paymentStatus === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                                {sale.paymentStatus}
                                            </span>
                                        </div>
                                        <Link to={`/sales/${sale.id}`} className="text-blue-600 hover:text-blue-800 flex items-center">
                                            <FaFileInvoice className="mr-2"/> View Invoice
                                        </Link>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        {sale.items && sale.items.map(item => (
                                            <p key={item.id} className="text-gray-700 ml-4">
                                                - {item.product.name} (x{item.quantity})
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No purchase history found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;
