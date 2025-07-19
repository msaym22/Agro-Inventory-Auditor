import React from 'react';
import config from '../../config/config';

const { THEME_COLORS } = config;

const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full min-h-[300px] bg-gray-50 rounded-lg p-8">
      <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[${THEME_COLORS.primary}] mb-4`}></div>
      <p className="text-gray-600 text-lg font-medium">Loading data, please wait...</p>
    </div>
  );
};

export default Loading;