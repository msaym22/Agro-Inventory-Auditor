// frontend/src/pages/sales/SalesListPage.js
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Components
import SaleList from '../../components/sales/SaleList';
import Loading from '../../components/common/Loading';
import SearchInput from '../../components/common/SearchInput';
import VoiceSearch from '../../components/common/VoiceSearch';
import { Button } from '../../components/common/Button';

// Redux Thunks and Actions
import { fetchSales, deleteExistingSale } from '../../features/sales/saleSlice';

const SalesListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux states
  const { items: sales, loading, error, pagination } = useSelector(state => state.sales);

  const [currentPage, setCurrentPage] = useState(pagination?.currentPage || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch on mount and when page changes (no fetch on search term typing)
  useEffect(() => {
    dispatch(fetchSales({ page: currentPage, limit: 200 }));
  }, [dispatch, currentPage]);

  // Client-side filter for smooth typing
  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales || [];
    const term = searchTerm.toLowerCase();
    return (sales || []).filter(sale => {
      if (sale.id?.toString().includes(term)) return true;
      if (sale.customer?.name?.toLowerCase().includes(term)) return true;
      if (Array.isArray(sale.items)) {
        return sale.items.some(it =>
          it.product?.name?.toLowerCase().includes(term) ||
          it.product?.nameUrdu?.toLowerCase().includes(term)
        );
      }
      return false;
    });
  }, [sales, searchTerm]);

  const handleVoiceSearch = (transcript) => {
    setSearchTerm(transcript);
    setCurrentPage(1);
  };

  const handleSelectSale = (sale) => {
    navigate(`/sales/${sale.id}`);
  };

  const handleViewSale = (sale) => {
    navigate(`/sales/${sale.id}`);
  };

  const handleEditSale = (sale) => {
    // Optional: implement edit route later; for now go to detail
    navigate(`/sales/${sale.id}`);
  };

  const handleRecordNewSale = () => {
    navigate('/sales/new');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setIsDeleting(true);
      try {
        const resultAction = await dispatch(deleteExistingSale(id));
        if (deleteExistingSale.fulfilled.match(resultAction)) {
          toast.success('Sale deleted successfully!');
        } else {
          toast.error(resultAction.payload || 'Failed to delete sale.');
        }
      } catch (err) {
        toast.error('An unexpected error occurred during deletion.');
        console.error('Error deleting sale:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    toast.error(error);
    return <div className="text-red-500 text-center py-4">Error loading sales data.</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales List</h1>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className="flex items-center gap-3 w-full md:w-1/2">
          <SearchInput
            placeholder="Search sales by customer, product, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            debounceMs={0}
          />
          <VoiceSearch onResult={handleVoiceSearch} />
        </div>
        <Button onClick={handleRecordNewSale}>Add New Sale</Button>
      </div>
      
      <SaleList
        sales={filteredSales}
        onSelect={handleSelectSale}
        onView={handleViewSale}
        onEdit={handleEditSale}
        onDelete={handleDelete}
      />

      {pagination && pagination.totalItems > 0 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div className="text-gray-600 text-sm">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} sales
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              Previous
            </Button>
            <span className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">
              {currentPage}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === pagination.totalPages}
              variant="secondary"
              size="small"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesListPage;