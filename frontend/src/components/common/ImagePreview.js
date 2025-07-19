import React, { useState } from 'react';
import { FaExpand, FaCompress } from 'react-icons/fa'; // Import icons

const ImagePreview = ({ url, alt = "Preview" }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!url) {
    return (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500">
        No Image Available
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-lg shadow-md border border-gray-200">
      <img
        src={url}
        alt={alt}
        className="w-full h-64 object-contain transition-transform duration-300 group-hover:scale-105"
      />

      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
      >
        {isFullscreen ? <FaCompress className="h-5 w-5" /> : <FaExpand className="h-5 w-5" />}
      </button>

      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={toggleFullscreen}
        >
          <img
            src={url}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-4xl font-light leading-none"
            onClick={toggleFullscreen}
            title="Close"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;