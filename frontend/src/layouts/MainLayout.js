// frontend/src/layouts/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* MainLayout should be simple, typically just rendering its children (e.g., LoginForm) */}
      <Outlet /> {/* Renders the child route components like Login or AnalyticsLoginPage */}
    </div>
  );
};

export default MainLayout;