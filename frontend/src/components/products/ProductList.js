import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DataTable } from '../common/DataTable';
import { FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import Fuse from 'fuse.js';
import config from '../../config/config';
import { formatCurrency } from '../../utils/helpers';
import VoiceSearch from '../common/VoiceSearch';
import { bulkDeleteProducts } from '../../features/products/productSlice';
import { toast } from 'react-toastify';

const { CURRENCY } = config;

const CATEGORIES = ['all','fiat','messi','spery','kabuta','lawada','electronics','hardware','lubricants','berring'];

export const ProductList = ({ products, onEdit, onDelete, onView, showLowStockHighlight = false }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name'); // 'name' or 'description'
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      searchMode === 'name' ? 'name' : 'description',
    ],
    threshold: 0.3,
    ignoreLocation: true,
  }), [products, searchMode]);

  const filteredData = useMemo(() => {
    let source = products || [];
    if (activeCategory !== 'all') {
      source = source.filter(p => (p.category || '').toLowerCase() === activeCategory);
    }
    if (!searchTerm) return source;
    const results = new Fuse(source, fuse.options).search(searchTerm);
    return results.map(r => r.item);
  }, [searchTerm, fuse.options, products, activeCategory]);

  const handleVoiceSearch = (transcript) => {
    setSearchTerm(transcript);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    
    try {
      const result = await dispatch(bulkDeleteProducts(selectedIds)).unwrap();
      
      // Show success message for successful deletions
      if (result.successfulIds.length > 0) {
        toast.success(`Successfully deleted ${result.successfulIds.length} product(s)`);
      }
      
      // Show warning for failed deletions
      if (result.failedResults.length > 0) {
        const failedMessages = result.failedResults.map(f => f.error).join(', ');
        toast.warning(`${result.failedResults.length} product(s) could not be deleted: ${failedMessages}`);
      }
      
      setSelectedIds([]);
    } catch (error) {
      toast.error(`Failed to delete products: ${error}`);
    }
  };

  const columns = [
    { header: 'Location', accessor: 'storageLocation' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Stock', 
      accessor: 'stock',
      render: (product) => {
        const stock = product.stock || 0;
        if (showLowStockHighlight && stock <= 10) {
          const isCritical = stock <= 5;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isCritical 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {isCritical ? '🚨 ' : '⚠️ '}
              {stock}
            </span>
          );
        }
        return stock;
      }
    },
    {
      header: `Price (${CURRENCY})`,
      accessor: 'sellingPrice',
      render: (product) => formatCurrency(product.sellingPrice)
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button
            onClick={(e) => { e.stopPropagation(); onView(row); }}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="View Product"
            type="button"
          >
            <FaEye />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row); }}
            className="text-green-500 hover:text-green-700 transition-colors"
            title="Edit Product"
            type="button"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete Product"
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
            placeholder={`Search products by ${searchMode}...`}
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
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${searchMode === 'description' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSearchMode('description')}
            type="button"
          >
            Description
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
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full border ${activeCategory===cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        selectable={true}
        onSelectionChange={setSelectedIds}
        onRowClick={row => onView && onView(row)}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};