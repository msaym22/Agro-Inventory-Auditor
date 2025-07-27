// frontend/src/components/common/Modal.js
import React from 'react';
// import { Button } from '../../components/common/Button'; // Removed unused import

const Modal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full relative">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;