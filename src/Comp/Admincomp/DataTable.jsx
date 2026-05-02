// First, create a reusable DataTable component
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({ columns, data, searchable = true, pageSize = 10 }) => {
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    // Search filter
    const filteredData = useMemo(() => {
        if (!search) return data;
        return data.filter(row =>
            columns.some(col => {
                const value = col.selector ? col.selector(row) : row[col.field];
                return String(value).toLowerCase().includes(search.toLowerCase());
            })
        );
    }, [data, search, columns]);

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {searchable && (
                <div className="p-4 border-b">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="border border-gray-300 rounded px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-amber-600"
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => col.sortable && handleSort(col.field)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.name}
                                        {col.sortable && (
                                            <div className="flex flex-col">
                                                <ChevronUp className={`h-3 w-3 ${sortConfig.key === col.field && sortConfig.direction === 'asc' ? 'text-amber-600' : 'text-gray-400'}`} />
                                                <ChevronDown className={`h-3 w-3 -mt-1 ${sortConfig.key === col.field && sortConfig.direction === 'desc' ? 'text-amber-600' : 'text-gray-400'}`} />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-50">
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4 text-sm text-gray-700">
                                        {col.cell ? col.cell(row, rowIdx) : col.selector ? col.selector(row) : row[col.field]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t flex justify-between items-center text-sm">
                <div className="text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 bg-amber-600 text-white rounded">{currentPage}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};


export default DataTable;