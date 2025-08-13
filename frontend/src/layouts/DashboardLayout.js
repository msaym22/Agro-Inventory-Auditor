// frontend/src/layouts/DashboardLayout.js (Content from previous interaction, assumed correct)
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import config from '../config/config';
import AnalyticsPasswordPrompt from '../components/dashboard/AnalyticsPasswordPrompt'; // Assumed to be correct now

const { THEME_COLORS } = config;

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', type: 'link' },
  { to: '/products', label: 'Products', type: 'link' },
  { to: '/customers', label: 'Customers', type: 'link' },
  { to: '/sales', label: 'Orders', type: 'link' },
  { to: 'analytics-modal', label: 'Analytics', type: 'modal' }, // Triggers modal
  { to: '/backup-restore', label: 'Backup & Restore', type: 'link' },
  { to: '/settings/drive', label: 'Settings', type: 'link' }, // Added Settings link
];

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);
  const { analyticsAuthenticated } = useSelector(state => state.auth);

  const [showAnalyticsPrompt, setShowAnalyticsPrompt] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAnalyticsClick = () => {
    if (analyticsAuthenticated) {
      navigate('/analytics');
    } else {
      setShowAnalyticsPrompt(true);
    }
  };

  const handleCloseAnalyticsPrompt = () => {
    setShowAnalyticsPrompt(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* This is where your Almadina Agro branding and sidebar should be */}
      <aside className={`w-64 bg-gray-800 text-white flex flex-col p-6 shadow-2xl rounded-r-xl transition-all duration-300 ease-in-out`}>
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-1 text-white">Almadina Agro</h1> {/* Your branding */}
          <p className="text-sm text-gray-400">Vehari, Pakistan</p>
        </div>
        <nav className="flex-grow space-y-4">
          {navLinks.map(link => (
            link.type === 'link' ? (
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
            ) : (
              <div
                key={link.to}
                onClick={handleAnalyticsClick}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out font-semibold text-lg relative
                  ${location.pathname === '/analytics' && analyticsAuthenticated ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 hover:text-blue-300 text-gray-200'}`}
                style={{
                  backgroundColor: location.pathname === '/analytics' && analyticsAuthenticated ? THEME_COLORS.primary : '',
                }}
              >
                <span>{link.label}</span>
              </div>
            )
          ))}
        </nav>
        <div className="mt-10">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out shadow-lg"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10 lg:p-12">
        <header className="flex items-center justify-between mb-10 pb-5 border-b border-gray-200">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {navLinks.find(l => l.to === location.pathname || (l.type === 'modal' && location.pathname === '/analytics'))?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-6">
            <span className="text-gray-600 font-medium">{user?.username || 'Guest'}</span>
          </div>
        </header>
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <Outlet />
        </div>
      </main>
      <AnalyticsPasswordPrompt
        isVisible={showAnalyticsPrompt}
        onCancel={handleCloseAnalyticsPrompt}
      />
    </div>
  );
};

export default DashboardLayout;