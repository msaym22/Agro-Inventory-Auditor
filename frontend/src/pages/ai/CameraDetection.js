import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { detectProduct } from '../../api/aiDetection';
import Loading from '../../components/common/Loading';
import { FaCamera, FaUpload, FaSearch, FaSpinner } from 'react-icons/fa';

const CameraDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [matches, setMatches] = useState([]);
  const [queryFeatures, setQueryFeatures] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
        setMatches([]);
        setQueryFeatures(null);
      } else {
        toast.error('Please select a valid image file');
      }
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setPreview(canvas.toDataURL());
          setMatches([]);
          setQueryFeatures(null);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Failed to access camera: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      toast.error('Please select or capture an image first');
      return;
    }

    setDetecting(true);
    setMatches([]);
    setQueryFeatures(null);

    try {
      const result = await detectProduct(selectedImage);
      
      if (result.success) {
        setMatches(result.matches || []);
        setQueryFeatures(result.queryFeatures);
        
        if (result.matches && result.matches.length > 0) {
          toast.success(`Found ${result.matches.length} matching product(s)`);
        } else {
          toast.info('No matching products found. Try training more images.');
        }
      } else {
        toast.error('Detection failed');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error(error.response?.data?.error || 'Failed to detect product');
    } finally {
      setDetecting(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreview(null);
    setMatches([]);
    setQueryFeatures(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Product Detection</h1>
        <p className="text-gray-600">Upload or capture an image to detect matching products</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Image Input</h2>
          
          {/* Camera Preview */}
          {stream && (
            <div className="mb-4 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border-2 border-gray-300"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={handleCapture}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 flex items-center gap-2"
              >
                <FaCamera className="text-xl" />
                Capture
              </button>
            </div>
          )}

          {/* Image Preview */}
          {preview && !stream && (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg border-2 border-gray-300"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            {!stream ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FaUpload />
                  Upload Image
                </button>
                <button
                  onClick={startCamera}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaCamera />
                  Use Camera
                </button>
              </>
            ) : (
              <button
                onClick={stopCamera}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Cancel Camera
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {preview && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDetect}
                disabled={detecting}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {detecting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <FaSearch />
                    Detect Product
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
          
          {detecting && (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          )}

          {!detecting && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="flex gap-4">
                    {match.product.image && (
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${match.product.image}`}
                        alt={match.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {match.product.name}
                      </h3>
                      {match.product.nameUrdu && (
                        <p className="text-sm text-gray-600">{match.product.nameUrdu}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">SKU:</span> {match.product.sku}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Stock:</span> {match.product.stock}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Price:</span> PKR {match.product.sellingPrice}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Confidence:</span>
                            <span className="text-sm font-bold text-blue-600">
                              {(match.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${match.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!detecting && matches.length === 0 && !preview && (
            <div className="text-center py-12 text-gray-500">
              <FaSearch className="text-4xl mx-auto mb-4 opacity-50" />
              <p>Upload or capture an image to start detection</p>
            </div>
          )}

          {!detecting && matches.length === 0 && preview && (
            <div className="text-center py-12 text-gray-500">
              <p>No matching products found. Try training more images for better results.</p>
            </div>
          )}

          {queryFeatures && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Image Analysis</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Dimensions:</span>{' '}
                  {queryFeatures.dimensions?.width} × {queryFeatures.dimensions?.height}
                </p>
                {queryFeatures.shapeFeatures && (
                  <>
                    <p>
                      <span className="font-medium">Holes detected:</span>{' '}
                      {queryFeatures.shapeFeatures.holes?.count || 0}
                    </p>
                    <p>
                      <span className="font-medium">Shape area:</span>{' '}
                      {(queryFeatures.shapeFeatures.area * 100).toFixed(1)}%
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraDetection;

