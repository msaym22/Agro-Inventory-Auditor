import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';

const LowStockAlert = ({ products }) => {
  if (!products || products.length === 0) return (
    <div className="backdrop-blur-lg bg-gradient-to-br from-green-50 via-white to-green-100 p-6 rounded-2xl shadow-xl border border-white/30 flex flex-col items-center justify-center h-full">
      <FaBoxOpen className="text-green-400 text-5xl mb-4" />
      <p className="text-gray-600 text-lg">All products are adequately stocked.</p>
      <Link to="/products" className="mt-4 text-green-600 hover:underline font-semibold">View Products</Link>
    </div>
  );

  return (
    <div className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-red-100 via-white to-yellow-50 p-8 rounded-3xl shadow-xl border border-white/30">
      <div className="flex items-center mb-6">
        <FaExclamationTriangle className="text-red-600 mr-3 text-3xl animate-pulse" />
        <h3 className="font-extrabold text-2xl text-red-800 tracking-wide">Low Stock Alert</h3>
      </div>

      <ul className="space-y-4">
        {products.slice(0, 5).map(product => (
          <li
            key={product.id}
            className="group flex justify-between items-center border-b border-red-100 pb-4 last:border-0 last:pb-0 transform hover:translate-x-1 transition-transform duration-200 ease-in-out"
          >
            <div>
              <Link to={`/products/${product.id}`} className="text-blue-700 hover:text-blue-900 font-semibold text-lg transition-colors duration-200">
                {product.name}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full mb-1">Stock: {product.stock}</span>
              <span className="block text-xs text-red-600 font-semibold">Action Required</span>
            </div>
          </li>
        ))}
      </ul>

      {products.length > 5 && (
        <div className="mt-8 text-center">
          <Link to="/products?stock=low" className="text-lg text-red-700 font-semibold hover:underline flex items-center justify-center group">
            View all {products.length} low stock items
            <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LowStockAlert;