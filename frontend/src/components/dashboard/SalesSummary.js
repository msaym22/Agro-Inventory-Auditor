import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FaMoneyBillWave } from 'react-icons/fa';

const SalesSummary = ({ sales }) => {
  if (!sales || sales.length === 0) return (
    <div className="backdrop-blur-lg bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 rounded-2xl shadow-xl border border-white/30 flex flex-col items-center justify-center h-full">
      <FaMoneyBillWave className="text-blue-400 text-5xl mb-4" />
      <p className="text-gray-600 text-lg">No recent sales to display.</p>
      <Link to="/sales/new" className="mt-4 text-blue-600 hover:underline font-semibold">Record Your First Sale</Link>
    </div>
  );

  return (
    <div className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-blue-100 via-white to-blue-50 p-8 rounded-3xl shadow-xl border border-white/30">
      <div className="flex items-center mb-6">
        <FaMoneyBillWave className="text-blue-600 mr-3 text-3xl" />
        <h3 className="font-extrabold text-2xl text-blue-800 tracking-wide">Recent Sales</h3>
      </div>

      <div className="space-y-4">
        {sales.map(sale => (
          <div
            key={sale.id}
            className="group flex justify-between items-center border-b border-blue-100 pb-4 last:border-0 last:pb-0 transform hover:translate-x-1 transition-transform duration-200 ease-in-out"
          >
            <div>
              <Link
                to={`/sales/${sale.id}`}
                className="text-blue-700 hover:text-blue-900 font-semibold text-lg transition-colors duration-200"
              >
                Sale #{sale.id}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {sale.customer?.name || 'Walk-in Customer'} • {formatDate(sale.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-800 text-lg">{formatCurrency(sale.totalAmount)}</p>
              <p className="text-xs capitalize text-gray-500">
                {sale.paymentMethod} • {sale.paymentStatus}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/sales" className="text-lg text-blue-700 font-semibold hover:underline flex items-center justify-center group">
          View all sales
          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </Link>
      </div>
    </div>
  );
};

export default SalesSummary;