import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import config from '../config/config'; // Import theme colors

const { THEME_COLORS } = config;

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/sales', label: 'Orders' },
  { to: '/backup', label: 'Backup & Restore' },
];

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className={`w-64 bg-gray-800 text-white flex flex-col p-6 shadow-2xl rounded-r-xl transition-all duration-300 ease-in-out`}>
        {/* Sidebar Header: Logo/Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-1 text-white">Almadina Agro</h1>
          <p className="text-sm text-gray-400">Vehari, Pakistan</p>
        </div>
        {/* Navigation Menu */}
        <nav className="flex-grow space-y-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out font-semibold text-lg relative
                ${location.pathname === link.to ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 hover:text-blue-300 text-gray-200'}`}
              style={{
                backgroundColor: location.pathname === link.to ? THEME_COLORS.primary : '',
              }}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        {/* Sign Out Button */}
        <div className="mt-10">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out shadow-lg"
          >
            Sign out
          </button>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 p-10 lg:p-12">
        {/* Main Content Header */}
        <header className="flex items-center justify-between mb-10 pb-5 border-b border-gray-200">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{navLinks.find(l => l.to === location.pathname)?.label || 'Dashboard'}</h2>
          <div className="flex items-center space-x-6">
            {/* Search, notifications, user profile can be added here if needed */}
            <span className="text-gray-600 font-medium">{user?.username || 'Guest'}</span>
          </div>
        </header>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;