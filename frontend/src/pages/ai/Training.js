import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getProductsForTraining,
  getTrainingImages,
  uploadTrainingImages,
  deleteTrainingImage,
  trainModel,
  getTrainingStats
} from '../../api/training';
import Loading from '../../components/common/Loading';
import {
  FaUpload,
  FaTrash,
  FaPlay,
  FaSpinner,
  FaImages,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';

const Training = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trainingImages, setTrainingImages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'images', 'stats'

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadTrainingImages(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductsForTraining();
      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadTrainingImages = async (productId) => {
    try {
      const response = await getTrainingImages(productId);
      if (response.success) {
        setTrainingImages(response.images || []);
      }
    } catch (error) {
      console.error('Error loading training images:', error);
      toast.error('Failed to load training images');
    }
  };

  const loadStats = async () => {
    try {
      const response = await getTrainingStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = async (e, productId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const response = await uploadTrainingImages(productId, files);
      if (response.success) {
        toast.success(`Successfully uploaded ${response.uploadedCount} image(s)`);
        await loadProducts();
        if (selectedProduct && selectedProduct.id === productId) {
          await loadTrainingImages(productId);
        }
        await loadStats();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this training image?')) {
      return;
    }

    try {
      const response = await deleteTrainingImage(imageId);
      if (response.success) {
        toast.success('Training image deleted');
        if (selectedProduct) {
          await loadTrainingImages(selectedProduct.id);
        }
        await loadProducts();
        await loadStats();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleTrainModel = async (productId) => {
    if (!window.confirm('Start training the AI model for this product? This may take a moment.')) {
      return;
    }

    try {
      setTraining(true);
      const response = await trainModel(productId);
      if (response.success) {
        toast.success('Model training completed successfully!');
        await loadProducts();
        await loadStats();
      }
    } catch (error) {
      console.error('Error training model:', error);
      toast.error(error.response?.data?.error || 'Failed to train model');
    } finally {
      setTraining(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'training':
        return <FaSpinner className="text-blue-500 animate-spin" />;
      case 'failed':
        return <FaTimesCircle className="text-red-500" />;
      case 'pending':
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'training':
        return 'Training';
      case 'failed':
        return 'Failed';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  if (loading && !products.length) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Training</h1>
        <p className="text-gray-600">Train AI models to recognize your products</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'products'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Products
        </button>
        {selectedProduct && (
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'images'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Training Images ({selectedProduct.name})
          </button>
        )}
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Products for Training</h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaImages className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Training Images</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Model Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Accuracy</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <img
                              src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${product.image}`}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{product.name}</div>
                            {product.nameUrdu && (
                              <div className="text-sm text-gray-500">{product.nameUrdu}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{product.trainingImagesCount || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        {product.aiModel ? (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(product.aiModel.trainingStatus)}
                            <span className="text-sm text-gray-600">
                              {getStatusText(product.aiModel.trainingStatus)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not started</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {product.aiModel?.accuracy ? (
                          <span className="text-sm font-medium text-green-600">
                            {(product.aiModel.accuracy * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, product.id)}
                              className="hidden"
                              disabled={uploading}
                            />
                            <button
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                              disabled={uploading}
                            >
                              <FaUpload className="text-xs" />
                              Upload
                            </button>
                          </label>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setActiveTab('images');
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
                          >
                            <FaImages className="text-xs" />
                            View
                          </button>
                          {product.trainingImagesCount >= 3 && (
                            <button
                              onClick={() => handleTrainModel(product.id)}
                              disabled={training || product.aiModel?.trainingStatus === 'training'}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
                            >
                              {training || product.aiModel?.trainingStatus === 'training' ? (
                                <FaSpinner className="text-xs animate-spin" />
                              ) : (
                                <FaPlay className="text-xs" />
                              )}
                              Train
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Training Images Tab */}
      {activeTab === 'images' && selectedProduct && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Training Images</h2>
              <p className="text-sm text-gray-600">{selectedProduct.name}</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, selectedProduct.id)}
                className="hidden"
                disabled={uploading}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload Images
                  </>
                )}
              </button>
            </label>
          </div>

          {trainingImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaImages className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No training images uploaded yet</p>
              <p className="text-sm mt-2">Upload at least 3 images to train the model</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trainingImages.map((image) => (
                <div key={image.id} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image.imagePath}`}
                    alt="Training"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                    }}
                  />
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-500">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedProduct.trainingImagesCount < 3 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
              <FaExclamationTriangle className="text-yellow-600" />
              <p className="text-sm text-yellow-800">
                At least 3 training images are required to train the model. 
                Currently: {selectedProduct.trainingImagesCount || 0} images.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalProducts || 0}</p>
              </div>
              <FaChartBar className="text-3xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products with Training</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.productsWithTraining || 0}</p>
              </div>
              <FaImages className="text-3xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Training Images</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalTrainingImages || 0}</p>
              </div>
              <FaImages className="text-3xl text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products Without Training</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.productsWithoutTraining || 0}</p>
              </div>
              <FaExclamationTriangle className="text-3xl text-yellow-500 opacity-50" />
            </div>
          </div>

          {stats?.modelsByStatus && (
            <div className="md:col-span-2 lg:col-span-4 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Models by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.modelsByStatus).map(([status, count]) => (
                  <div key={status} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(status)}
                      <span className="font-medium text-gray-700 capitalize">{status}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Training;
