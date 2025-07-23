// frontend/src/components/dashboard/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaBox, FaUsers, FaShoppingCart, FaChartBar, FaCloudUploadAlt } from 'react-icons/fa'; // Example icons

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4 flex flex-col">
      <div className="text-2xl font-bold mb-6 text-center">
        Almadina Agro
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaHome className="mr-3" /> Dashboard
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaBox className="mr-3" /> Products
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaUsers className="mr-3" /> Customers
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/sales"
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaShoppingCart className="mr-3" /> Sales
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/analytics-login" 
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaChartBar className="mr-3" /> Analytics
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/backup-restore"
              className={({ isActive }) =>
                isActive ? "flex items-center p-3 rounded-lg bg-blue-700" : "flex items-center p-3 rounded-lg hover:bg-gray-700"
              }
            >
              <FaCloudUploadAlt className="mr-3" /> Backup & Restore
            </NavLink>
          </li>
        </ul>
      </nav>
      {/* Add logout or other footer items if necessary */}
    </div>
  );
};

export default Sidebar;