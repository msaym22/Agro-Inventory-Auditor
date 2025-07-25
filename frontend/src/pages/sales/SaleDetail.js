import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import salesAPI from '../../api/sales';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loading from '../../components/common/Loading';
import InvoiceGenerator from '../../components/sales/InvoiceGenerator';
import { Button } from '../../components/common/Button';
import ImagePreview from '../../components/common/ImagePreview';

export const SaleDetail = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const response = await salesAPI.getSaleById(id);
        setSale(response);
      } catch (err) {
        console.error('Failed to fetch sale:', err);
        setError('Failed to load sale details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  const handleGenerateInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const response = await salesAPI.generateInvoice(id);
      setInvoiceData(response);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
        <Link
          to="/sales"
          className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Back to Sales
        </Link>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-8">
        <p>Sale not found</p>
        <Link
          to="/sales"
          className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Sale #{sale.id}</h1>
            <p className="text-gray-600">
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">PKR {sale.totalAmount.toFixed(2)}</p>
            <p className="text-gray-600 capitalize">{sale.paymentMethod}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Customer</h2>
          <p>{sale.customer?.name || 'Walk-in Customer'}</p>
          {sale.customer?.contact && <p>Contact: {sale.customer.contact}</p>}
          {sale.customer?.address && <p>Address: {sale.customer.address}</p>}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Products</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(item => (
                <tr key={item.id}>
                  <td className="border p-2">{item.product.name}</td>
                  <td className="border p-2 text-center">PKR {item.product.sellingPrice}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">
                    PKR {(item.product.sellingPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-right">
          {sale.discount > 0 && (
            <p className="text-gray-600">
              Discount: PKR {sale.discount.toFixed(2)}
            </p>
          )}
          <p className="text-xl font-bold mt-2">
            Grand Total: PKR {sale.totalAmount.toFixed(2)}
          </p>
        </div>

        {sale.receiptImage && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Receipt Image</h2>
            <ImagePreview url={`/uploads/${sale.receiptImage}`} alt="Sale Receipt" />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Generate Invoice</h2>
            <Button
              onClick={handleGenerateInvoice}
              variant="info"
              size="medium"
              loading={invoiceLoading}
              disabled={invoiceLoading}
            >
              Generate Invoice
            </Button>
          </div>
          {invoiceData && <InvoiceGenerator invoiceData={invoiceData} />}
        </div>
      </div>
    </div>
  );
};
export default SaleDetail;
