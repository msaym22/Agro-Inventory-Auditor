import React from 'react';
import { formatCurrency } from '../../utils/helpers'; // Assuming this utility exists
import { FaShoppingCart, FaUsers, FaBoxOpen } from 'react-icons/fa'; // Example icons

// Updated props: totalSales, totalCustomers (removed totalRevenue)
export const QuickStats = ({ totalSales, totalCustomers }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total Sales Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalSales}</p>
        </div>
        <FaShoppingCart className="text-blue-400 text-4xl opacity-75" />
      </div>

      {/* Total Customers Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Total Customers</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totalCustomers}</p>
        </div>
        <FaUsers className="text-purple-400 text-4xl opacity-75" />
      </div>

      {/* Placeholder for another stat if needed, or remove this card */}
      {/* This card previously showed Total Revenue, now it's removed as per request */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Products in Stock</h3>
          {/* This data needs to come from products state, not salesAnalytics */}
          {/* For now, just showing a placeholder or you can calculate it here */}
          <p className="text-3xl font-bold text-green-600 mt-2">...</p> 
        </div>
        <FaBoxOpen className="text-green-400 text-4xl opacity-75" />
      </div>
    </div>
  );
};

export default QuickStats;