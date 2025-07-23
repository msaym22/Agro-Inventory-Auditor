// frontend/src/components/dashboard/Header.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice'; // Assuming you have a logout thunk/action

const Header = () => {
  const { user } = useSelector(state => state.auth); // Assuming user info is stored here
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-gray-800">
        Welcome, {user?.username || 'User'}! {/* Changed 'Guest' to 'User' for common case */}
      </div>
      <nav>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          Sign Out
        </button>
      </nav>
    </header>
  );
};

export default Header;