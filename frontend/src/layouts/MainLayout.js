import React from 'react';
import { Outlet } from 'react-router-dom';
// Corrected import paths based on your clarification
import Sidebar from '../components/dashboard/Sidebar'; // Corrected path
import Header from '../components/dashboard/Header';   // Corrected path

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet /> {/* Renders the child route components */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;