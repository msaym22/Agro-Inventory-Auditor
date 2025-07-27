// frontend/src/components/dashboard/AnalyticsPasswordPrompt.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setAnalyticsAuthenticated } from '../../features/auth/authSlice'; // Import the new action

const AnalyticsPasswordPrompt = ({ isVisible, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      dispatch(setAnalyticsAuthenticated(true)); // Authenticate analytics in Redux
      toast.success('Analytics access granted!');
      onCancel(); // Close the modal
      navigate('/analytics'); // Navigate to the analytics page
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
      <div className="bg-white p-6 rounded-lg shadow-xl w-80 max-w-md">
        <h2 className="text-xl font-bold mb-4 text-green-800">Analytics Access Required</h2>
        <p className="mb-4 text-gray-700">Please enter the analytics password.</p>
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label htmlFor="analyticsPassword" className="sr-only">Analytics Password</label>
            <input
              type="password"
              id="analyticsPassword"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Analytics Password"
              value={password}
              onChange={handlePasswordChange} // Using the defined handler
              autoFocus // Automatically focus on the input field
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Verify Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnalyticsPasswordPrompt;