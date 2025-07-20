// frontend/src/components/sales/InvoiceGenerator.js
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Ensure jspdf-autotable is correctly imported
import config from '../../config/config'; // Import config for CURRENCY

const { CURRENCY } = config; // Destructure CURRENCY from config

const InvoiceGenerator = ({ invoiceData }) => {
  const componentRef = useRef(); // Ref for the component to print

  // Handle printing the HTML content
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice-${invoiceData?.saleId || 'N/A'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Inter', sans-serif; /* Ensure consistent font */
        -webkit-print-color-adjust: exact; /* For background colors/images */
      }
      /* Hide print buttons when printing */
      .no-print {
        display: none;
      }
    `,
  });

  // Handle downloading the PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // 2) Add Almadina Agro Vehari title on top for PDF
    doc.setFontSize(22);
    doc.text('Almadina Agro Vehari', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Agricultural Products Supplier', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Vehari, Punjab, Pakistan', doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
    doc.text('Invoice', doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });


    // Add customer info for PDF
    doc.setFontSize(10);
    // Corrected: Access customer details directly from invoiceData
    doc.text(`Customer: ${invoiceData.customerName || 'Walk-in Customer'}`, 14, 60);
    doc.text(`Contact: ${invoiceData.customerContact || 'N/A'}`, 14, 65);
    doc.text(`Address: ${invoiceData.customerAddress || 'N/A'}`, 14, 70); // Added address

    // Date and Payment details for PDF
    // Corrected: Access saleDate directly from invoiceData
    doc.text(`Date: ${new Date(invoiceData.saleDate).toLocaleDateString()}`, 180, 60, null, null, 'right');
    doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 180, 65, null, null, 'right');
    doc.text(`Status: ${invoiceData.paymentStatus}`, 180, 70, null, null, 'right');

    // Create table for PDF
    // CRITICAL FIX: Use invoiceData.items and ensure it's an array before mapping
    const tableData = (invoiceData.items || []).map(item => [
      item.productName, // Access productName directly
      item.quantity,
      // Ensure unitPrice is a number before toFixed
      `${CURRENCY} ${(item.unitPrice || 0).toFixed(2)}`, // Access unitPrice from backend
      // Ensure total is a number before toFixed
      `${CURRENCY} ${(item.total || 0).toFixed(2)}` // Access total from backend
    ]);

    doc.autoTable({
      startY: 80, // Adjusted startY to make space for new header info
      head: [['Product', 'Qty', 'Unit Price', 'Total']], // Updated table headers for clarity
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 70 }, // Product
        1: { cellWidth: 20, halign: 'center' }, // Qty
        2: { cellWidth: 35, halign: 'right' }, // Price
        3: { cellWidth: 35, halign: 'right' } // Total
      },
      didDrawPage: function (data) {
        // Footer: Thank you message
        let pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.text("Thank you for your business!", doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Add totals for PDF (3) Write amount only 1 time at the end: Grand Total only
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    // It's already calculated as grandTotal from backend
    // Ensure grandTotal is a number before toFixed
    doc.text(`Total Amount: ${CURRENCY} ${(invoiceData.grandTotal || 0).toFixed(2)}`, 180, finalY, null, null, 'right');
    
    // Notes for PDF
    if (invoiceData.notes) {
      doc.setFontSize(10);
      doc.text(`Notes: ${invoiceData.notes}`, 14, finalY + 10);
    }

    // Save the PDF
    doc.save(`invoice-${invoiceData.saleId}.pdf`);
  };

  // Ensure invoiceData is available before rendering
  if (!invoiceData) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-gray-600">Loading invoice details...</p>
      </div>
    );
  }

  // Handle the display version of the invoice
  return (
    <div className="mt-8">
      <div className="flex justify-end space-x-4 mb-4 no-print"> {/* Added no-print class */}
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print Invoice
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Download PDF
        </button>
      </div>

      {/* Printable Area */}
      <div ref={componentRef} className="bg-white p-8 rounded shadow">
        {/* 2) Add Almadina Agro Vehari title on top for HTML */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Almadina Agro Vehari</h1>
          <p className="text-lg">Agricultural Products Supplier</p>
          <p className="text-gray-600">Vehari, Punjab, Pakistan</p>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold">Invoice To:</h2>
            {/* Corrected: Access customer details directly */}
            <p>{invoiceData.customerName || 'Walk-in Customer'}</p>
            <p>{invoiceData.customerContact || 'N/A'}</p>
            <p>{invoiceData.customerAddress || 'N/A'}</p>
          </div>

          <div className="text-right">
            {/* 1) Remove "Sales Number" (removing Invoice # from here) */}
            {/* No sales number here as requested */}
            <p><strong>Date:</strong> {new Date(invoiceData.saleDate).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> {invoiceData.paymentMethod}</p>
            <p><strong>Status:</strong> {invoiceData.paymentStatus}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-green-100">
              <th className="border p-2 text-left">Product</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* CRITICAL FIX: Use invoiceData.items and ensure it's an array before mapping */}
            {(invoiceData.items || []).map((item, index) => (
              <tr key={index}>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-right">{CURRENCY} {(item.priceAtSale || 0).toFixed(2)}</td>
                <td className="border p-2 text-right">{CURRENCY} {(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* 3) Write "amount" only 1 time at the end (keeping only Grand Total in footer) */}
            <tr>
              <td colSpan="3" className="border p-2 text-right font-semibold">Grand Total</td>
              <td className="border p-2 text-right font-semibold">
                {CURRENCY} {invoiceData.grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
        
        {invoiceData.notes && (
          <div className="mt-4 p-2 bg-gray-50 rounded">
            <p className="font-semibold">Notes:</p>
            <p className="text-gray-700">{invoiceData.notes}</p>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;