import api from './api';

export const getProductsForTraining = async () => {
  const response = await api.get('/training/products');
  return response.data;
};

export const getTrainingImages = async (productId) => {
  const response = await api.get(`/training/products/${productId}/images`);
  return response.data;
};

export const uploadTrainingImages = async (productId, imageFiles) => {
  const formData = new FormData();
  formData.append('productId', productId);
  
  // Append all images
  if (Array.isArray(imageFiles)) {
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
  } else {
    formData.append('images', imageFiles);
  }

  const response = await api.post('/training/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const deleteTrainingImage = async (imageId) => {
  const response = await api.delete(`/training/images/${imageId}`);
  return response.data;
};

export const trainModel = async (productId) => {
  const response = await api.post(`/training/train/${productId}`);
  return response.data;
};

export const getTrainingStats = async () => {
  const response = await api.get('/training/stats');
  return response.data;
};

