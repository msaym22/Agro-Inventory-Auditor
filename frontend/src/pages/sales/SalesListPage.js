import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSales } from '../../api/sales'; // Ensure this is correctly imported
import { Link, useNavigate } from 'react-router-dom';
import SaleList from '../../components/sales/SaleList';
import SearchInput from '../../components/common/SearchInput';
import Loading from '../../components/common/Loading';
import { Button } from '../../components/common/Button';

const SalesListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const salesState = useSelector(state => state.sales.items); // Access the 'items' property
  const status = useSelector(state => state.sales.status);
  const error = useSelector(state => state.sales.error);
  const pagination = useSelector(state => state.sales.pagination);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Pass an object with page and search term to the thunk
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sales Records</h1>
        <Button
          onClick={handleRecordNewSale}
          variant="primary"
          size="large"
        >
          Record New Sale
        </Button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/2">
            <SearchInput
              placeholder="Search sales by customer or amount..."
              onSearch={handleSearch}
              debounceMs={500}
            />
          </div>
          {/* Add other filters here if needed */}
        </div>

        {status === 'loading' ? (
          <Loading />
        ) : error ? (
          <div className="text-red-500 text-center py-8 text-lg">
            Error: {error}
          </div>
        ) : salesState && salesState.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-4">No sales records found.</p>
            <Button
              onClick={handleRecordNewSale}
              variant="secondary"
              size="medium"
            >
              Record Your First Sale
            </Button>
          </div>
        ) : (
          <>
            <SaleList
              sales={salesState}
              onSelect={handleSelectSale}
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
          </>
        )}
      </div>
    </div>
  );
};

export default SalesListPage;