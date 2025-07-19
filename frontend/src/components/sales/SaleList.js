import React from 'react';
import DataTable from '../common/DataTable';
import { formatCurrency, formatDate } from '../../utils/helpers'; // Ensure these utilities are available

const SaleList = ({ sales, onSelect }) => {
  const columns = [
    {
      header: 'Sale ID',
      accessor: 'id',
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (sale) => formatDate(sale.date)
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (sale) => sale.customer?.name || 'Walk-in Customer'
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (sale) => sale.items.length
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (sale) => formatCurrency(sale.totalAmount)
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      render: (sale) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
          sale.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {sale.paymentStatus}
        </span>
      )
    },
    {
      header: 'Method',
      accessor: 'paymentMethod',
      render: (sale) => (
        <span className="capitalize text-gray-700">
          {sale.paymentMethod}
        </span>
      )
    }
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