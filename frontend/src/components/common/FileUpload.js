import React, { useCallback, useRef } from 'react';
import { Button } from './Button'; // Import the Button component

const FileUpload = ({ onFileSelect, accept, multiple = false, buttonText = "Select File" }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(multiple ? e.target.files : e.target.files[0]);
    } else {
      onFileSelect(null); // Clear selection if no file is chosen
    }
  }, [onFileSelect, multiple]);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        type="button"
        onClick={handleButtonClick}
        variant="outline"
        size="medium"
        className="flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
        </svg>
        {buttonText}
      </Button>
      <input
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        ref={fileInputRef}
      />
      {fileInputRef.current?.files[0] && (
        <span className="text-sm text-gray-600 truncate max-w-[150px]">
          {fileInputRef.current.files[0].name}
        </span>
      )}
    </div>
  );
};

export default FileUpload;