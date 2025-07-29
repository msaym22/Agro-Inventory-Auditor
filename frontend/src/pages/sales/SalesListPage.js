// frontend/src/pages/sales/SalesListPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Components
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import SearchInput from '../../components/common/SearchInput';
import { Button } from '../../components/common/Button';

// Redux Thunks and Actions
import { fetchSales, deleteExistingSale } from '../../features/sales/saleSlice'; // CORRECTED IMPORT: fetchSales is a thunk
import { formatCurrency, formatDate } from '../../utils/helpers'; // Assuming these are available

const SalesListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux states
  const { items: sales, loading, error, pagination } = useSelector(state => state.sales); // Correctly access 'items'

  const [currentPage, setCurrentPage] = useState(pagination.currentPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Dispatch fetchSales as a thunk with current page and search term
    dispatch(fetchSales({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleSelectSale = (sale) => {
    navigate(`/sales/${sale.id}`);
  };

  const handleRecordNewSale = () => {
    navigate('/sales/new');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setIsDeleting(true);
      try {
        const resultAction = await dispatch(deleteExistingSale(id)); // Dispatch the delete thunk
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

  const columns = [
    { header: 'Sale ID', accessor: 'id' },
    { header: 'Date', accessor: 'saleDate', formatter: (date) => formatDate(date) },
    { header: 'Customer', accessor: 'customer.name' }, // Access nested customer name
    { header: 'Total Amount', accessor: 'totalAmount', formatter: (amount) => formatCurrency(amount) },
    { header: 'Payment Status', accessor: 'paymentStatus' },
    {
      header: 'Actions',
      accessor: 'actions',
      formatter: (row) => (
        <div className="flex space-x-2">
          <Button onClick={() => navigate(`/sales/${row.id}`)} small>View</Button>
          <Button onClick={() => navigate(`/sales/${row.id}/edit`)} small>Edit</Button>
          <Button onClick={() => handleDelete(row.id)} small danger disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    toast.error(error); // Display error using toast
    return <div className="text-red-500 text-center py-4">Error loading sales data.</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales List</h1>
      <div className="flex justify-between items-center mb-4">
        <SearchInput
          placeholder="Search sales by customer or product..."
          value={searchTerm}
          onSearch={handleSearch}
          debounceMs={500} // Added debounce for better performance
        />
        <Button onClick={handleRecordNewSale}>Add New Sale</Button>
      </div>
      <DataTable
        columns={columns}
        data={sales} // Use 'sales' (which is 'items')
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SalesListPage;