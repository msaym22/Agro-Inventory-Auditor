import React, { useState, useMemo } from 'react';
import { DataTable } from '../common/DataTable';
import { FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import Fuse from 'fuse.js';
import config from '../../config/config';
import { formatCurrency } from '../../utils/helpers';

const { CURRENCY } = config;

export const ProductList = ({ products, onEdit, onDelete, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name'); // 'name' or 'description'

  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      searchMode === 'name' ? 'name' : 'description',
    ],
    threshold: 0.3,
    ignoreLocation: true,
  }), [products, searchMode]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return products;
    const results = fuse.search(searchTerm);
    return results.map(r => r.item);
  }, [searchTerm, fuse, products]);

  const columns = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Stock', accessor: 'stock' }, // Changed to 'stock' based on backend model
    {
      header: `Price (${CURRENCY})`, // Dynamically use CURRENCY
      accessor: 'sellingPrice',
      render: (product) => formatCurrency(product.sellingPrice) // Format currency
    },
    {
      header: 'Actions',
      render: ({ row }) => (
        <div className="flex space-x-3">
          <button
            onClick={() => onView(row.original)}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="View Product"
          >
            <FaEye />
          </button>
          <button
            onClick={() => onEdit(row.original)}
            className="text-green-500 hover:text-green-700 transition-colors"
            title="Edit Product"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(row.original.id)}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete Product"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 w-full md:w-1/2">
          <span className="text-gray-500 text-xl"><FaSearch /></span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Search products by ${searchMode}...`}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-gray-600 font-medium">Search by:</span>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'name' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('name')}
          >
            Name
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'description' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('description')}
          >
            Description
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
         pagination={true} // Pagination logic needs to be handled outside DataTable for client-side filtering
         pageSize={10}
      />
    </div>
  );
};