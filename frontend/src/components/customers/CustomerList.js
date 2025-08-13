import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DataTable } from '../common/DataTable';
import { FaEdit, FaEye, FaTrash, FaSearch } from 'react-icons/fa';
import Fuse from 'fuse.js';
import VoiceSearch from '../common/VoiceSearch';
import { bulkDeleteCustomers } from '../../features/customers/customerSlice';
import { toast } from 'react-toastify';

const CustomerList = ({ customers, onSelect, onEdit, onView, onDelete }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name'); // 'name', 'contact', or 'address'
  const [selectedIds, setSelectedIds] = useState([]);

  const fuse = useMemo(() => new Fuse(customers, {
    keys: [
      searchMode === 'name' ? 'name' : searchMode === 'contact' ? 'contact' : 'address',
    ],
    threshold: 0.3,
    ignoreLocation: true,
  }), [customers, searchMode]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return customers;
    const results = fuse.search(searchTerm);
    return results.map(r => r.item);
  }, [searchTerm, fuse, customers]);

  const handleVoiceSearch = (transcript) => {
    setSearchTerm(transcript);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected customer(s)?`)) return;
    
    try {
      const result = await dispatch(bulkDeleteCustomers(selectedIds)).unwrap();
      
      // Show success message for successful deletions
      if (result.successfulIds.length > 0) {
        toast.success(`Successfully deleted ${result.successfulIds.length} customer(s)`);
      }
      
      // Show warning for failed deletions
      if (result.failedResults.length > 0) {
        const failedMessages = result.failedResults.map(f => f.error).join(', ');
        toast.warning(`${result.failedResults.length} customer(s) could not be deleted: ${failedMessages}`);
      }
      
      setSelectedIds([]);
    } catch (error) {
      toast.error(`Failed to delete customers: ${error}`);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact', accessor: 'contact' },
    { header: 'Address', accessor: 'address' },
    { header: 'Credit Limit', accessor: 'creditLimit' },
    { header: 'Outstanding Balance', accessor: 'outstandingBalance' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button
            onClick={(e) => { e.stopPropagation(); onView(row); }}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="View Customer"
            type="button"
          >
            <FaEye />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row); }}
            className="text-green-500 hover:text-green-700 transition-colors"
            title="Edit Customer"
            type="button"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete Customer"
            type="button"
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
            placeholder={`Search customers by ${searchMode}...`}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
          <VoiceSearch onResult={handleVoiceSearch} />
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-gray-600 font-medium">Search by:</span>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'name' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('name')}
            type="button"
          >
            Name
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'contact' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('contact')}
            type="button"
          >
            Contact
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'address' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('address')}
            type="button"
          >
            Address
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            disabled={selectedIds.length === 0}
            type="button"
          >
            Delete Selected ({selectedIds.length})
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        onRowClick={onSelect}
        selectable={true}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
};

export default CustomerList;