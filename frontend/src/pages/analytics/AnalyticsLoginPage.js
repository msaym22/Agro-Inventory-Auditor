// frontend/src/pages/analytics/AnalyticsLoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../components/common/Button';

const ANALYTICS_PASSWORD = 'naveed1974'; // Hardcoded password for analytics access

const AnalyticsLoginPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (password === ANALYTICS_PASSWORD) {
      toast.success('Analytics access granted!');
      // Store a flag in session storage or local storage
      // This is a simple client-side check for this session
      sessionStorage.setItem('analytics_authenticated', 'true');
      navigate('/analytics'); // Redirect to the main analytics page
    } else {
      toast.error('Incorrect password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Analytics Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter password to view detailed analytics
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
              variant="primary"
              size="large"
            >
              Access Analytics
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnalyticsLoginPage;