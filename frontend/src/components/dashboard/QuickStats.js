import React from 'react';
import {
  FaBox, FaUsers, FaShoppingCart, FaMoneyBillWave
} from 'react-icons/fa';
import config from '../../config/config';

const { CURRENCY } = config;

const statsConfig = [
  {
    label: 'Total Products',
    icon: <FaBox className="text-green-500 text-4xl animate-bounce" />,
    bg: 'from-green-100 to-green-50',
    key: 'products',
  },
  {
    label: 'Total Customers',
    icon: <FaUsers className="text-blue-500 text-4xl animate-pulse" />,
    bg: 'from-blue-100 to-blue-50',
    key: 'customers',
  },
  {
    label: 'Total Sales',
    icon: <FaShoppingCart className="text-purple-500 text-4xl animate-bounce" />,
    bg: 'from-purple-100 to-purple-50',
    key: 'sales',
  },
  {
    label: 'Total Revenue',
    icon: <FaMoneyBillWave className="text-yellow-600 text-4xl animate-pulse" />,
    bg: 'from-yellow-100 to-yellow-50',
    key: 'revenue',
    isCurrency: true,
  },
];

const QuickStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {statsConfig.map((stat, idx) => (
        <div
          key={stat.key}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} p-8 rounded-3xl shadow-xl flex items-center gap-5 border border-white transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer`}
        >
          <div className="flex-shrink-0 text-opacity-80">
            {stat.icon}
          </div>
          <div>
            <p className="text-gray-700 font-semibold mb-2 text-lg">{stat.label}</p>
            <p className="text-4xl font-extrabold text-gray-900 drop-shadow-md">
              {stat.isCurrency
                ? `${CURRENCY} ${stats?.revenue != null ? stats.revenue.toFixed(2) : '0.00'}`
                : stats?.[stat.key] ?? 0}
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
            {React.cloneElement(stat.icon, { className: `${stat.icon.props.className} text-8xl` })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;