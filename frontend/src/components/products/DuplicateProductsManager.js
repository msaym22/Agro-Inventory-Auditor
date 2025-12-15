import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { findDuplicateProducts, mergeDuplicateProducts } from '../../api/products';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/helpers';

const DuplicateProductsManager = ({ onDuplicatesResolved }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const response = await findDuplicateProducts();
      setDuplicates(response.duplicates || []);
    } catch (error) {
      console.error('Error loading duplicates:', error);
      toast.error('Failed to load duplicate products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (groupIndex, productId) => {
    setSelectedProducts(prev => ({
      ...prev,
      [groupIndex]: productId
    }));
  };

  const handleMerge = async (groupIndex) => {
    const group = duplicates[groupIndex];
    const keepProductId = selectedProducts[groupIndex];
    
    if (!keepProductId) {
      toast.warn('Please select a product to keep');
      return;
    }

    if (!window.confirm(`Are you sure you want to merge ${group.count} products named "${group.name}"? This will combine their stock and delete the others.`)) {
      return;
    }

    setMerging(true);
    try {
      const productIds = group.products.map(p => p.id);
      await mergeDuplicateProducts(productIds, keepProductId);
      
      toast.success(`Successfully merged ${group.count} products`);
      
      // Remove the merged group from the list
      setDuplicates(prev => prev.filter((_, index) => index !== groupIndex));
      
      // Clear selection for this group
      setSelectedProducts(prev => {
        const newSelections = { ...prev };
        delete newSelections[groupIndex];
        return newSelections;
      });

      // Notify parent component if all duplicates are resolved
      const remainingDuplicates = duplicates.filter((_, index) => index !== groupIndex);
      if (remainingDuplicates.length === 0 && onDuplicatesResolved) {
        onDuplicatesResolved();
      }
    } catch (error) {
      console.error('Error merging products:', error);
      toast.error('Failed to merge products');
    } finally {
      setMerging(false);
    }
  };

  const handleKeepSeparate = (groupIndex) => {
    // Remove the group from duplicates list (user chooses to keep them separate)
    setDuplicates(prev => prev.filter((_, index) => index !== groupIndex));
    
    // Clear selection for this group
    setSelectedProducts(prev => {
      const newSelections = { ...prev };
      delete newSelections[groupIndex];
      return newSelections;
    });

    toast.info('Products kept separate');

    // Notify parent component if all duplicates are resolved
    const remainingDuplicates = duplicates.filter((_, index) => index !== groupIndex);
    if (remainingDuplicates.length === 0 && onDuplicatesResolved) {
      onDuplicatesResolved();
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (duplicates.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-lg font-semibold mb-2">
          ✅ No Duplicate Products Found
        </div>
        <p className="text-green-700">
          All products have unique names. No action needed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🔍 Found {duplicates.length} Duplicate Product Group(s)
        </h3>
        <p className="text-yellow-700 text-sm">
          Review the duplicate products below. You can either merge them into one product (combining stock) or keep them separate.
        </p>
      </div>

      {duplicates.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                "{group.name}"
              </h4>
              <p className="text-sm text-gray-600">
                {group.count} duplicate entries found
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleKeepSeparate(groupIndex)}
                variant="secondary"
                size="small"
                disabled={merging}
              >
                Keep Separate
              </Button>
              <Button
                onClick={() => handleMerge(groupIndex)}
                variant="primary"
                size="small"
                disabled={merging || !selectedProducts[groupIndex]}
              >
                Merge Products
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Select which product to keep (others will be merged into it):
            </div>
            {group.products.map((product, productIndex) => (
              <div
                key={product.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedProducts[groupIndex] === product.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductSelect(groupIndex, product.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`group-${groupIndex}`}
                    checked={selectedProducts[groupIndex] === product.id}
                    onChange={() => handleProductSelect(groupIndex, product.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">
                          {product.name}
                          {product.nameUrdu && (
                            <span className="text-gray-600 ml-2">({product.nameUrdu})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {product.category && (
                            <div>Category: {product.category}</div>
                          )}
                          {product.storageLocation && (
                            <div>Location: {product.storageLocation}</div>
                          )}
                          {product.supplier && (
                            <div>Supplier: {product.supplier}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium text-gray-800">
                          Stock: {product.stock}
                        </div>
                        <div className="text-gray-600">
                          Price: {formatCurrency(product.sellingPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {product.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DuplicateProductsManager;
