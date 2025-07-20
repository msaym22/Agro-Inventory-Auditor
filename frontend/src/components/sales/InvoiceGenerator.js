// frontend/src/components/sales/InvoiceGenerator.js
import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import config from '../../config/config';

// === IMPORTANT: FONT EMBEDDING FOR URDU ===
// Import your generated font data here.
// The variable name 'jameelNooriNastaleeqNormal' should match the 'export' variable in your JameelNooriNastaleeq-normal.js file.
// Make sure the path is correct relative to this file.
import { jameelNooriNastaleeqNormal } from '../../fonts/JameelNooriNastaleeq-normal';

const { CURRENCY } = config;

const InvoiceGenerator = ({ invoiceData }) => {
  const componentRef = useRef();
  const [currentLanguage, setCurrentLanguage] = useState('en'); // 'en' for English, 'ur' for Urdu

  // Translations object for both English and Urdu labels
  const translations = {
    companyName: { en: 'Almadina Agro Vehari', ur: 'المدینہ ایگرو وہاڑی' },
    companySlogan: { en: 'Agricultural Products Supplier', ur: 'زرعی مصنوعات کا سپلائر' },
    companyAddress: { en: 'Vehari, Punjab, Pakistan', ur: 'وہاڑی، پنجاب، پاکستان' },
    invoiceTitle: { en: 'Invoice', ur: 'انوائس' },
    customerInfo: { en: 'Invoice To:', ur: 'خریدار کی معلومات:' },
    customer: { en: 'Customer', ur: 'خریدار' },
    contact: { en: 'Contact', ur: 'رابطہ' },
    address: { en: 'Address', ur: 'پتہ' },
    date: { en: 'Date', ur: 'تاریخ' },
    paymentMethod: { en: 'Payment Method', ur: 'ادائیگی کا طریقہ' },
    status: { en: 'Status', ur: 'حالت' },
    product: { en: 'Product', ur: 'مصنوعات' },
    quantity: { en: 'Quantity', ur: 'مقدار' },
    unitPrice: { en: 'Unit Price', ur: 'فی یونٹ قیمت' },
    total: { en: 'Total', ur: 'کل' },
    subTotal: { en: 'Sub Total', ur: 'ذیلی کل' },
    discount: { en: 'Discount', ur: 'رعایت' },
    grandTotal: { en: 'Grand Total', ur: 'کل رقم' },
    notes: { en: 'Notes', ur: 'نوٹس' },
    thankYou: { en: 'Thank you for your business!', ur: 'آپ کے کاروبار کے لیے شکریہ!' },
    walkInCustomer: { en: 'Walk-in Customer', ur: 'عام گاہک' },
    na: { en: 'N/A', ur: 'دستیاب نہیں' },
    printInvoice: { en: 'Print Invoice', ur: 'پرنٹ انوائس' },
    downloadPdf: { en: 'Download PDF', ur: 'PDF ڈاؤن لوڈ کریں' },
    loading: { en: 'Loading invoice details...', ur: 'انوائس کی تفصیلات لوڈ ہو رہی ہیں...' },
    // Payment methods and statuses for translation if they are dynamic
    cash: { en: 'Cash', ur: 'نقد' },
    card: { en: 'Card', ur: 'کارڈ' },
    credit: { en: 'Credit', ur: 'کریڈٹ' },
    paid: { en: 'Paid', ur: 'ادا شدہ' },
    pending: { en: 'Pending', ur: 'زیر التواء' },
    partial: { en: 'Partial', ur: 'جزوی' },
  };

  // Helper function to get translated text
  const getTranslation = (key, value = '') => {
    if (translations[key] && translations[key][currentLanguage]) {
      return translations[key][currentLanguage];
    }
    const lowerCaseValue = String(value).toLowerCase();
    if (translations[lowerCaseValue] && translations[lowerCaseValue][currentLanguage]) {
      return translations[lowerCaseValue][currentLanguage];
    }
    return value;
  };

  // Helper to get product name based on language
  const getProductNameForLanguage = (item) => {
    // Backend's generateInvoice already flattens item.product.name to item.productName
    // So, we just access item.productName directly.
    // If you were to add productNameUrdu to your backend's invoiceData.items, use it here.
    return currentLanguage === 'ur' && item.productNameUrdu
      ? item.productNameUrdu
      : item.productName;
  };

  // Helper to reverse text for RTL
  const reverseText = (text) => {
    return text;
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${getTranslation('invoiceTitle')}-${invoiceData?.saleId || 'N/A'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Jameel Noori Nastaleeq', 'Noto Naskh Urdu', 'Noto Sans Arabic', 'Inter', sans-serif;
        ${currentLanguage === 'ur' ? 'direction: rtl;' : 'direction: ltr;'}
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
      table {
        ${currentLanguage === 'ur' ? 'direction: rtl;' : 'direction: ltr;'}
      }
      th, td {
        ${currentLanguage === 'ur' ? 'text-align: right;' : 'text-align: left;'}
      }
      .text-left-rtl {
        ${currentLanguage === 'ur' ? 'text-align: right;' : 'text-align: left;'}
      }
      .text-right-rtl {
        ${currentLanguage === 'ur' ? 'text-align: left;' : 'text-align: right;'}
      }
    `,
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // === IMPORTANT: FONT EMBEDDING FOR URDU IN PDF ===
    if (currentLanguage === 'ur') {
        doc.addFileToVFS('Jameel-Noori-Nastaleeq-Regular.ttf', jameelNooriNastaleeqNormal);
        doc.addFont('Jameel-Noori-Nastaleeq-Regular.ttf', 'Jameel Noori Nastaleeq', 'normal');
        doc.setFont('Jameel Noori Nastaleeq');
    } else {
        doc.setFont('Helvetica', 'normal');
    }
    // === End Font and RTL Configuration ===

    // Company Info
    doc.setFontSize(22);
    doc.text(reverseText(getTranslation('companyName')), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(reverseText(getTranslation('companySlogan')), doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.text(reverseText(getTranslation('companyAddress')), doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
    doc.text(reverseText(getTranslation('invoiceTitle')), doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });

    // Customer Info & Date/Payment
    doc.setFontSize(10);
    const customerName = invoiceData.customerName || getTranslation('walkInCustomer');
    const customerContact = invoiceData.customerContact || getTranslation('na');
    const customerAddress = invoiceData.customerAddress || getTranslation('na');
    const saleDate = invoiceData.saleDate ? new Date(invoiceData.saleDate).toLocaleDateString(currentLanguage === 'ur' ? 'ur-PK' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : getTranslation('na');

    if (currentLanguage === 'ur') {
      doc.text(reverseText(`${getTranslation('customer')}: ${customerName}`), doc.internal.pageSize.getWidth() - 14, 60, { align: 'right' });
      doc.text(reverseText(`${getTranslation('contact')}: ${customerContact}`), doc.internal.pageSize.getWidth() - 14, 65, { align: 'right' });
      doc.text(reverseText(`${getTranslation('address')}: ${customerAddress}`), doc.internal.pageSize.getWidth() - 14, 70, { align: 'right' });

      doc.text(reverseText(`${getTranslation('date')}: ${saleDate}`), 14, 60, { align: 'left' });
      doc.text(reverseText(`${getTranslation('paymentMethod')}: ${getTranslation(invoiceData.paymentMethod, invoiceData.paymentMethod)}`), 14, 65, { align: 'left' });
      doc.text(reverseText(`${getTranslation('status')}: ${getTranslation(invoiceData.paymentStatus, invoiceData.paymentStatus)}`), 14, 70, { align: 'left' });
    } else {
      doc.text(`${getTranslation('customer')}: ${customerName}`, 14, 60);
      doc.text(`${getTranslation('contact')}: ${customerContact}`, 14, 65);
      doc.text(`${getTranslation('address')}: ${customerAddress}`, 14, 70);

      doc.text(`${getTranslation('date')}: ${saleDate}`, doc.internal.pageSize.getWidth() - 14, 60, { align: 'right' });
      doc.text(`${getTranslation('paymentMethod')}: ${getTranslation(invoiceData.paymentMethod, invoiceData.paymentMethod)}`, doc.internal.pageSize.getWidth() - 14, 65, { align: 'right' });
      doc.text(`${getTranslation('status')}: ${getTranslation(invoiceData.paymentStatus, invoiceData.paymentStatus)}`, doc.internal.pageSize.getWidth() - 14, 70, { align: 'right' });
    }

    // Table Headers and Data for PDF
    const tableHeaders = currentLanguage === 'ur' ?
      [reverseText(getTranslation('total')), reverseText(getTranslation('unitPrice')), reverseText(getTranslation('quantity')), reverseText(getTranslation('product'))] :
      [getTranslation('product'), getTranslation('quantity'), getTranslation('unitPrice'), getTranslation('total')];

    const tableColumnStyles = currentLanguage === 'ur' ? {
      0: { halign: 'right', cellWidth: 35 },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 70 }
    } : {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    };

    const tableData = (invoiceData.items || []).map(item => {
      // Use the correctly mapped productName from backend
      const productName = getProductNameForLanguage(item);
      const quantity = item.quantity;
      // CORRECTED: Access priceAtSale and lineTotal directly from the item object
      const priceAtSale = `${CURRENCY} ${(item.priceAtSale || 0).toFixed(2)}`;
      const lineTotal = `${CURRENCY} ${(item.lineTotal || 0).toFixed(2)}`;

      return currentLanguage === 'ur' ?
        [reverseText(lineTotal), reverseText(priceAtSale), reverseText(quantity.toString()), reverseText(productName)] :
        [productName, quantity, priceAtSale, lineTotal];
    });

    doc.autoTable({
      startY: 80,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: currentLanguage === 'ur' ? 'right' : 'left',
        font: currentLanguage === 'ur' ? 'Jameel Noori Nastaleeq' : 'Helvetica'
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: currentLanguage === 'ur' ? 'right' : 'left',
        font: currentLanguage === 'ur' ? 'Jameel Noori Nastaleeq' : 'Helvetica'
      },
      columnStyles: tableColumnStyles,
      didDrawPage: function (data) {
        let pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setFont(currentLanguage === 'ur' ? 'Jameel Noori Nastaleeq' : 'Helvetica', 'normal');
        doc.text(reverseText(getTranslation('thankYou')), doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(currentLanguage === 'ur' ? 'Jameel Noori Nastaleeq' : 'Helvetica', 'normal');
    const textAlignment = currentLanguage === 'ur' ? 'right' : 'right';

    doc.text(reverseText(`${getTranslation('subTotal')}: ${CURRENCY} ${(invoiceData.subTotal || 0).toFixed(2)}`), doc.internal.pageSize.getWidth() - 14, finalY, { align: textAlignment });
    doc.text(reverseText(`${getTranslation('discount')}: ${CURRENCY} ${(invoiceData.discount || 0).toFixed(2)}`), doc.internal.pageSize.getWidth() - 14, finalY + 7, { align: textAlignment });
    doc.text(reverseText(`${getTranslation('grandTotal')}: ${CURRENCY} ${(invoiceData.grandTotal || 0).toFixed(2)}`), doc.internal.pageSize.getWidth() - 14, finalY + 14, { align: textAlignment });

    // Notes
    if (invoiceData.notes) {
      doc.setFontSize(10);
      doc.setFont(currentLanguage === 'ur' ? 'Jameel Noori Nastaleeq' : 'Helvetica', 'normal');
      doc.text(reverseText(`${getTranslation('notes')}: ${invoiceData.notes}`), doc.internal.pageSize.getWidth() - 14, finalY + 25, { align: textAlignment });
    }

    doc.save(`invoice-${invoiceData.saleId}.pdf`);
  };

  if (!invoiceData) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-gray-600">{getTranslation('loading')}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end space-x-4 mb-4 no-print">
        <div className="mr-4">
          <label htmlFor="language-select" className="sr-only">Select Language</label>
          <select
            id="language-select"
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {getTranslation('printInvoice')}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {getTranslation('downloadPdf')}
        </button>
      </div>

      {/* Printable Area (HTML) */}
      <div
        ref={componentRef}
        className="bg-white p-8 rounded shadow"
        dir={currentLanguage === 'ur' ? 'rtl' : 'ltr'}
        style={{
          fontFamily: currentLanguage === 'ur' ? "'Jameel Noori Nastaleeq', 'Noto Naskh Urdu', 'Inter', sans-serif" : "'Inter', sans-serif",
          textAlign: currentLanguage === 'ur' ? 'right' : 'left'
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{getTranslation('companyName')}</h1>
          <p className="text-lg">{getTranslation('companySlogan')}</p>
          <p className="text-gray-600">{getTranslation('companyAddress')}</p>
          <h2 className="text-2xl font-bold mt-4">{getTranslation('invoiceTitle')}</h2>
        </div>

        <div className="flex justify-between mb-8">
          <div className={currentLanguage === 'ur' ? 'text-right-rtl' : 'text-left'}>
            <h2 className="text-xl font-semibold">{getTranslation('customerInfo')}</h2>
            <p>{invoiceData.customerName || getTranslation('walkInCustomer')}</p>
            <p>{getTranslation('contact')}: {invoiceData.customerContact || getTranslation('na')}</p>
            <p>{getTranslation('address')}: {invoiceData.customerAddress || getTranslation('na')}</p>
          </div>

          <div className={currentLanguage === 'ur' ? 'text-left-rtl' : 'text-right'}>
            <p><strong>{getTranslation('date')}:</strong> {invoiceData.saleDate ? new Date(invoiceData.saleDate).toLocaleDateString(currentLanguage === 'ur' ? 'ur-PK' : 'en-US') : getTranslation('na')}</p>
            <p><strong>{getTranslation('paymentMethod')}:</strong> {getTranslation(invoiceData.paymentMethod, invoiceData.paymentMethod)}</p>
            <p><strong>{getTranslation('status')}:</strong> {getTranslation(invoiceData.paymentStatus, invoiceData.paymentStatus)}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-green-100">
              <th className={`border p-2 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-left'}`}>{getTranslation('product')}</th>
              <th className="border p-2 text-center">{getTranslation('quantity')}</th>
              <th className={`border p-2 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{getTranslation('unitPrice')}</th>
              <th className={`border p-2 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{getTranslation('total')}</th>
            </tr>
          </thead>
          <tbody>
            {(invoiceData.items || []).map((item, index) => (
              <tr key={index}>
                <td className={`border p-2 font-medium text-gray-800 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-left'}`}>
                  {getProductNameForLanguage(item)}
                </td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className={`border p-2 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{CURRENCY} {(item.priceAtSale || 0).toFixed(2)}</td>
                <td className={`border p-2 font-semibold text-gray-800 ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{CURRENCY} {(item.lineTotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className={`border p-2 font-semibold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{getTranslation('subTotal')}</td>
              <td className={`border p-2 font-semibold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>
                {CURRENCY} {(invoiceData.subTotal || 0).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan="3" className={`border p-2 font-semibold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{getTranslation('discount')}</td>
              <td className={`border p-2 font-semibold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>
                {CURRENCY} {(invoiceData.discount || 0).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan="3" className={`border p-2 text-xl font-extrabold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>{getTranslation('grandTotal')}</td>
              <td className={`border p-2 text-xl font-extrabold ${currentLanguage === 'ur' ? 'text-right-rtl' : 'text-right'}`}>
                {CURRENCY} {(invoiceData.grandTotal || 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoiceData.notes && (
          <div className="mt-4 p-2 bg-gray-50 rounded">
            <p className="font-semibold">{getTranslation('notes')}:</p>
            <p className="text-gray-700">{invoiceData.notes}</p>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500">
          <p>{getTranslation('thankYou')}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;