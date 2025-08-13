import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import config from '../../config/config';

const SaleReceipt = ({ sale }) => {
  if (!sale) return null;

  const buildUrl = (u) => {
    const apiBase = (config.API_URL || '').replace(/\/?api\/?$/, '');
    const pathOnly = u.startsWith('/uploads/') ? u : (u.startsWith('uploads/') ? `/${u}` : `/uploads/${u}`);
    return `${apiBase}${pathOnly}`;
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Receipt</h2>

      {sale.receiptImage ? (
        <img
          src={buildUrl(sale.receiptImage)}
          alt="Sale receipt"
          className="w-full max-w-md mx-auto border rounded"
        />
      ) : (
        <p className="text-gray-500">No receipt image available</p>
      )}

      <div className="mt-4">
        <h3 className="font-medium mb-2">Payment Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-600">Total Amount:</div>
          <div className="text-right">{formatCurrency(sale.totalAmount)}</div>

          <div className="text-gray-600">Discount:</div>
          <div className="text-right">{formatCurrency(sale.discount)}</div>

          <div className="text-gray-600 font-medium">Net Amount:</div>
          <div className="text-right font-medium">
            {formatCurrency(sale.totalAmount - sale.discount)}
          </div>

          <div className="text-gray-600">Payment Method:</div>
          <div className="text-right capitalize">{sale.paymentMethod}</div>

          <div className="text-gray-600">Status:</div>
          <div className="text-right capitalize">{sale.paymentStatus}</div>
        </div>
      </div>
    </div>
  );
};

export default SaleReceipt;