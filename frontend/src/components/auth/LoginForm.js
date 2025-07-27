// frontend/src/components/auth/LoginForm.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../common/Button';
import { login } from '../../features/auth/authSlice'; // FIXED: Import 'login' thunk

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Dispatch the login thunk
      await dispatch(login({ username, password })).unwrap(); // Use .unwrap() to handle rejections
      toast.success('Login successful!');
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (err) {
      toast.error(err || 'Login failed. Please try again.');
      console.error("Login Error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Button
          type="submit"
          fullWidth
          loading={status === 'loading'}
          disabled={status === 'loading'}
          variant="primary"
          size="large"
        >
          {status === 'loading' ? 'Logging in...' : 'Sign in'}
        </Button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </form>
  );
};

export default LoginForm;