// frontend/src/components/products/ProductForm.js
import React from 'react';
import RichTextEditor from '../common/RichTextEditor'; // Import RichTextEditor
import FileUpload from '../common/FileUpload'; // Import FileUpload
import ImagePreview from '../common/ImagePreview'; // Import ImagePreview
import { Button } from '../common/Button'; // Import Button
import config from '../../config/config';

const { CURRENCY } = config;

const ProductForm = ({
  product,
  onChange,
  onImageChange,
  onDescriptionChange, // New prop for RichTextEditor
  onSubmit,
  loading,
  imagePreviewUrl // New prop for image preview
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column - Basic Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Product Details</h2>

            <div className="mb-5">
              <label htmlFor="name" className="block font-medium text-gray-700 mb-2">Product Name<span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={product.name}
                onChange={onChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="e.g., Super Growth Fertilizer"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="sellingPrice" className="block font-medium text-gray-700 mb-2">Selling Price ({CURRENCY})<span className="text-red-500">*</span></label>
              <input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                value={product.sellingPrice}
                onChange={onChange}
                min="0"
                step="0.01"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="0.00"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="purchasePrice" className="block font-medium text-gray-700 mb-2">Purchase Price ({CURRENCY})</label>
              <input
                type="number"
                id="purchasePrice"
                name="purchasePrice"
                value={product.purchasePrice}
                onChange={onChange}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="0.00"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="minimumPrice" className="block font-medium text-gray-700 mb-2">Minimum Price ({CURRENCY})</label>
              <input
                type="number"
                id="minimumPrice"
                name="minimumPrice"
                value={product.minimumPrice}
                onChange={onChange}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="0.00"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="stock" className="block font-medium text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                id="stock"       // Changed from "stockQuantity" to "stock"
                name="stock"     // Changed from "stockQuantity" to "stock"
                value={product.stock} // Changed from "product.stockQuantity" to "product.stock"
                onChange={onChange}
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="0"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="category" className="block font-medium text-gray-700 mb-2">Category</label>
              <select
                id="category"
                name="category"
                value={product.category}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
              >
                <option value="">Select Category</option>
                <option value="seeds">Seeds</option>
                <option value="fertilizers">Fertilizers</option>
                <option value="pesticides">Pesticides</option>
                <option value="tools">Tools</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Right Column - Additional Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Information</h2>

            <div className="mb-5">
              <label className="block font-medium text-gray-700 mb-2">Product Image</label>
              <FileUpload onFileSelect={onImageChange} accept="image/*" />
              {imagePreviewUrl && (
                <div className="mt-4">
                  <ImagePreview url={imagePreviewUrl} alt="Product Image" />
                </div>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="description" className="block font-medium text-gray-700 mb-2">Description</label>
              <RichTextEditor value={product.description} onChange={onDescriptionChange} />
            </div>

            <div className="mb-5">
              <label htmlFor="applications" className="block font-medium text-gray-700 mb-2">Used In/Applications</label>
              <input
                type="text"
                id="applications"
                name="applications"
                value={product.applications}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="e.g., Wheat cultivation, Pest control"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="storageLocation" className="block font-medium text-gray-700 mb-2">Storage Location</label>
              <input
                type="text"
                id="storageLocation"
                name="storageLocation"
                value={product.storageLocation}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="e.g., Warehouse A, Shelf 3"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="supplier" className="block font-medium text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={product.supplier}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="e.g., AgriCorp"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="expiryDate" className="block font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={product.expiryDate || ''}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="comments" className="block font-medium text-gray-700 mb-2">Comments/Notes</label>
              <textarea
                id="comments"
                name="comments"
                value={product.comments}
                onChange={onChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                placeholder="Any additional notes about the product..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
          >
            {product.id ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;