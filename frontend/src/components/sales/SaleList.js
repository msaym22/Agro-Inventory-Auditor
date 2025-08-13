import React from 'react';
import { DataTable } from '../common/DataTable';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const SaleList = ({ sales, onSelect, onEdit, onDelete, onView }) => {
  const columns = [
    {
      header: 'Invoice ID',
      accessor: 'id',
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
      accessor: 'customer.name',
      render: (row) => {
        if (row.customer && row.customer.name) {
          return row.customer.name;
        }
        return 'Walk-in Customer';
      },
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
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(row);
            }}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="View Details"
          >
            <FaEye />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(row);
            }}
            className="text-green-600 hover:text-green-900 transition-colors"
            title="Edit Sale"
          >
            <FaEdit />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(row.id);
            }}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Delete Sale"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sales}
      onRowClick={onSelect}
    />
  );
};

export default SaleList;
