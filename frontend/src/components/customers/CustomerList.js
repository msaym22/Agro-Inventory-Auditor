import React from 'react';
import { DataTable } from '../common/DataTable';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa'; // Import FaTrash

const CustomerList = ({ customers, onSelect, onEdit, onView, onDelete }) => { // Add onDelete prop
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact', accessor: 'contact' },
    { header: 'Address', accessor: 'address' },
    { header: 'Credit Limit', accessor: 'creditLimit' },
    { header: 'Outstanding Balance', accessor: 'outstandingBalance' },
    {
      header: 'Actions',
      render: (row) => ( // 'row' is already the customer object
        <div className="flex space-x-3">
          <button
            onClick={() => onView(row)} // Use onView prop
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="View Customer"
          >
            <FaEye />
          </button>
          <button
            onClick={() => onEdit(row)} // Use onEdit prop
            className="text-green-500 hover:text-green-700 transition-colors"
            title="Edit Customer"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(row.id)} // Add delete button and call onDelete with customer ID
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete Customer"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={customers}
      onRowClick={onSelect} // Keep existing onRowClick for general selection if needed
    />
  );
};

export default CustomerList;