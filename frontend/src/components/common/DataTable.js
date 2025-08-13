import React, { useState, useMemo } from 'react';

const DataTable = ({ columns, data, onRowClick, selectable = false, onSelectionChange }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const rows = Array.isArray(data) ? data : [];

  const allSelected = useMemo(() => rows.length > 0 && rows.every(r => selectedIds.has(r.id)), [rows, selectedIds]);

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allSelected) {
      next.clear();
    } else {
      rows.forEach(r => r.id && next.add(r.id));
    }
    setSelectedIds(next);
    onSelectionChange && onSelectionChange(Array.from(next));
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    onSelectionChange && onSelectionChange(Array.from(next));
  };

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
            )}
            {columns.map((column, idx) => (
              <th
                key={column.accessor || idx}
                scope="col"
                className="px-6 py-3"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              className={`bg-white border-b hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {selectable && (
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={row.id ? selectedIds.has(row.id) : false}
                    onChange={(e) => { e.stopPropagation(); row.id && toggleOne(row.id); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              {columns.map((column, colIdx) => (
                <td key={column.accessor || colIdx} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data available.
        </div>
      )}
    </div>
  );
};

export default DataTable;
export { DataTable };
