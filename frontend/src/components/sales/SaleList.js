import React from 'react';
import { DataTable } from '../common/DataTable'; // Assuming DataTable is used here

const SaleList = ({ sales, onSelect }) => {
  const columns = [
    {
      header: 'Invoice ID',
      accessor: 'id', // Assuming 'id' is the invoice ID
      render: (row) => (
        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
          #{row.id}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'saleDate',
      render: (row) => new Date(row.saleDate).toLocaleDateString(),
    },
    {
      header: 'Customer',
      accessor: 'customer.name', // Access nested customer name
      render: (row) => row.customer ? row.customer.name : 'Walk-in Customer',
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (row) => `PKR ${parseFloat(row.totalAmount).toFixed(2)}`,
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            row.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent onSelect from firing when clicking action button
            onSelect(row); // Assuming onSelect handles viewing details
          }}
          className="text-blue-600 hover:text-blue-900 font-semibold"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sales} // Ensure 'sales' is an array here
      onRowClick={onSelect} // Pass onSelect to DataTable for row clicks
    />
  );
};

export default SaleList;
