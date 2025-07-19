import React from 'react';
import DataTable from '../common/DataTable';
import { formatCurrency } from '../../utils/helpers'; // Ensure this utility is available

const CustomerList = ({ customers, onSelect }) => {
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact', accessor: 'contact' },
    {
      header: 'Balance',
      accessor: 'outstandingBalance',
      render: (customer) => (
        <span className={customer.outstandingBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {formatCurrency(customer.outstandingBalance)}
        </span>
      )
    },
    {
      header: 'Last Purchase',
      accessor: 'lastPurchase',
      render: (customer) => customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={customers}
      onRowClick={onSelect}
    />
  );
};

export default CustomerList;