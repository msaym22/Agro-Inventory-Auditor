import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import config from '../../config/config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { THEME_COLORS } = config;

const AnalyticsChart = ({ title, data, type = 'line' }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to fill container
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: THEME_COLORS.primary, // Use primary theme color for legend
          font: { size: 14, weight: 'bold' },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: THEME_COLORS.secondary, // Use secondary theme color for title
        font: { size: 22, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: 'bold' },
        padding: 12,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 12 } },
        grid: { display: false }, // Hide x-axis grid lines
      },
      y: {
        ticks: { color: '#64748b', font: { size: 12 } },
        grid: { color: '#e2e8f0', borderDash: [5, 5] }, // Light dashed y-axis grid
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  const chartData = {
    labels: data?.labels ?? [],
    datasets: [
      {
        label: data?.label || 'Data',
        data: data?.values ?? [],
        borderColor: type === 'line' ? THEME_COLORS.info : THEME_COLORS.primary, // Info for line, primary for bar
        backgroundColor: type === 'bar' ? `${THEME_COLORS.primary}B3` : `${THEME_COLORS.info}33`, // Primary with opacity for bar, info with opacity for line
        pointBackgroundColor: THEME_COLORS.info,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: THEME_COLORS.info,
        pointRadius: type === 'line' ? 5 : 0,
        pointHoverRadius: type === 'line' ? 7 : 0,
        tension: type === 'line' ? 0.4 : 0, // Smooth curves for line chart
        borderWidth: 2,
        fill: type === 'line' ? true : false,
      },
    ],
  };

  return (
    <div className="backdrop-blur-lg bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 h-96">
      {type === 'line' ? (
        <Line options={options} data={chartData} />
      ) : (
        <Bar options={options} data={chartData} />
      )}
    </div>
  );
};

export default AnalyticsChart;