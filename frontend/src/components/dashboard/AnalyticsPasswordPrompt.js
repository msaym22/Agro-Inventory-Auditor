// frontend/src/components/dashboard/AnalyticsPasswordPrompt.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setAnalyticsAuthenticated, setAccountantAuthenticated } from '../../features/auth/authSlice'; // Import both actions

const AnalyticsPasswordPrompt = ({ isVisible, onCancel, onSuccess, isForAccountant = false }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const pageTitle = isForAccountant ? 'Accountant Access' : 'Analytics Access';
  const description = isForAccountant ? 'accounting features' : 'analytics dashboard';

  // FIX: Ensure handlePasswordChange is defined here
  const handlePasswordChange = (e) => { 
    setPassword(e.target.value);
    setError(''); // Clear error on new input
  };

  const handleVerify = (e) => {
    e.preventDefault();
    // IMPORTANT: Replace 'your_secure_analytics_password' with a truly secure method.
    // Ideally, this would be an API call to your backend to verify the password securely.
    // Avoid hardcoding passwords in frontend code for production.
    if (password === 'naveed1974') { // Use your actual analytics password here
      // Dispatch the appropriate action based on the page type
      if (isForAccountant) {
        dispatch(setAccountantAuthenticated(true));
        toast.success('Accountant access granted!');
      } else {
        dispatch(setAnalyticsAuthenticated(true));
        toast.success('Analytics access granted!');
      }
      
      onCancel(); // Close the modal
      if (onSuccess) {
        onSuccess(); // Call the success callback if provided
      }
    } else {
      setError('Incorrect password. Please try again.');
      toast.error('Incorrect password.');
    }
  };

  if (!isVisible) {
    return null; // Don't render if not visible
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">{pageTitle}</h2>
        <p className="text-gray-600 mb-4">
          Enter password to access {description}
        </p>
        
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnalyticsPasswordPrompt;