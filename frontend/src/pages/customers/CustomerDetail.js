import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Add useNavigate here
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerById, updateCustomerBalance } from '../../api/customers';
import CustomerForm from '../../components/customers/CustomerForm';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { toast } from 'react-toastify';

const CustomerDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate here
  const { currentCustomer, status, error } = useSelector(state => state.customers);
  const [balanceAdjustment, setBalanceAdjustment] = useState(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomerById(id));
  }, [dispatch, id]);

  const handleBalanceUpdate = async () => {
    if (balanceAdjustment === 0 || isNaN(balanceAdjustment)) {
      toast.info('Please enter a valid amount for balance adjustment.');
      return;
    }

    setUpdateLoading(true);
    try {
      await dispatch(updateCustomerBalance({
        id: currentCustomer.id,
        amount: parseFloat(balanceAdjustment),
        notes: adjustmentNotes
      })).unwrap();
      toast.success('Balance updated successfully!');
      setBalanceAdjustment(0);
      setAdjustmentNotes('');
    } catch (err) {
      console.error('Failed to update balance', err);
      toast.error('Failed to update balance. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCustomerUpdate = async (updatedData) => {
    setUpdateLoading(true);
    try {
      const { updateCustomer } = require('../../api/customers');
      await updateCustomer(currentCustomer.id, updatedData);
      dispatch(fetchCustomerById(id));
      toast.success('Customer details updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update customer details', err);
      toast.error('Failed to update customer details. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (status === 'loading') {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8 text-lg">
        {error}
        <Link
          to="/customers"
          className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p className="text-lg mb-4">Customer not found.</p>
        <Link
          to="/customers"
          className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const purchasesColumns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (item) => formatDate(item.date)
    },
    {
      header: 'Amount',
      accessor: 'totalAmount',
      render: (item) => formatCurrency(item.totalAmount)
    },
    {
      header: 'Discount',
      accessor: 'discount',
      render: (item) => formatCurrency(item.discount)
    },
    {
      header: 'Payment',
      accessor: 'paymentMethod',
      render: (item) => `${item.paymentMethod} (${item.paymentStatus})`
    },
    {
      header: 'Actions',
      render: (item) => (
        <Link
          to={`/sales/${item.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          View
        </Link>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{currentCustomer.name}</h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "secondary" : "info"}
          size="medium"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Customer'}
        </Button>
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded shadow mb-6">
          <CustomerForm customer={currentCustomer} onSubmit={handleCustomerUpdate} loading={updateLoading} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Contact</label>
                <p className="font-medium">{currentCustomer.contact || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Address</label>
                <p>{currentCustomer.address || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Credit Limit</label>
                <p className="font-medium">{formatCurrency(currentCustomer.creditLimit)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Outstanding Balance</label>
                <p className={`font-medium ${
                  currentCustomer.outstandingBalance > 0
                    ? 'text-red-600'
                    : currentCustomer.outstandingBalance < 0
                      ? 'text-green-600'
                      : ''
                }`}>
                  {formatCurrency(currentCustomer.outstandingBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Balance Adjustment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Positive to add credit, negative to add payment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="2"
                  placeholder="Reason for adjustment"
                />
              </div>

              <Button
                onClick={handleBalanceUpdate}
                disabled={!balanceAdjustment || updateLoading}
                loading={updateLoading}
                variant="success"
                size="medium"
              >
                Update Balance
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Purchase History</h2>
        {currentCustomer.purchases?.length > 0 ? (
          <DataTable
            columns={purchasesColumns}
            data={currentCustomer.purchases}
            onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
          />
        ) : (
          <p>No purchase history found</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;