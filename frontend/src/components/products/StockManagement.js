import React from 'react';

export const StockManagement = ({ product, onUpdateStock }) => {
  const [adjustment, setAdjustment] = React.useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateStock(product.id, adjustment);
    setAdjustment(0); // Reset adjustment after submission
  };

  return (
    <div className="border-t mt-4 pt-4">
      <h3 className="font-bold mb-2">Stock Adjustment</h3>
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)} // Ensure integer or 0
          className="border rounded p-2 w-24 mr-2"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Update Stock
        </button>
      </form>
      <div className="mt-2">
        <span className="font-semibold">Current Stock:</span> {product.stock} {/* Corrected: product.stock */}
      </div>
    </div>
  );
};