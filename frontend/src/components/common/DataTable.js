import React from 'react';

const DataTable = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={column.accessor || idx} // Use accessor as key if available, fallback to index
                scope="col"
                className="px-6 py-3"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Ensure data is an array before mapping */}
          {(data || []).map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx} // IMPORTANT: Use a unique ID from the row data (e.g., row.id)
                                    // Fallback to rowIdx only if no unique ID is guaranteed.
                                    // For sales, row.id should be available.
              className={`bg-white border-b hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIdx) => (
                <td key={column.accessor || colIdx} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(data || []).length === 0 && ( // Ensure data is an array before checking length
        <div className="text-center py-8 text-gray-500">
          No data available.
        </div>
      )}
    </div>
  );
};

export default DataTable;
export { DataTable };
