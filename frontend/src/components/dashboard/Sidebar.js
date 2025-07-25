import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBoxOpen, FaUsers, FaShoppingCart, FaChartBar, FaDatabase, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ onLogout }) => {
  const linkClasses = "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors";
  const activeLinkClasses = "bg-green-200 text-green-900 font-bold";

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-green-800">Almadina Agro</h1>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaTachometerAlt className="mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaBoxOpen className="mr-3" />
          Products
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaUsers className="mr-3" />
          Customers
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaShoppingCart className="mr-3" />
          Sales
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaChartBar className="mr-3" />
          Analytics
        </NavLink>
        <NavLink to="/backup-restore" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaDatabase className="mr-3" />
          Backup & Restore
        </NavLink>
      </nav>
      <div className="p-4 border-t">
        <button onClick={onLogout} className={`${linkClasses} w-full`}>
          <FaSignOutAlt className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;