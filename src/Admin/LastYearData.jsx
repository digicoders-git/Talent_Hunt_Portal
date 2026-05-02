import React, { useState, useRef, useEffect } from 'react';
import { Phone, MessageCircle, Download, Upload, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { importLastYearExcelApi, getLastYearDataApi } from '../API/lastYearData';

export default function LastYearData() {
    const [currentPage, setCurrentPage] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const fileInputRef = useRef(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchData();
    }, [currentPage, debouncedSearch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getLastYearDataApi(currentPage, debouncedSearch);
            if (response.success) {
                setData(response.data || []);
                setTotalPages(response.totalPages || 0);
                setTotal(response.total || 0);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please select a valid Excel file');
            return;
        }

        setUploading(true);
        try {
            const response = await importLastYearExcelApi(file);
            if (response.success) {
                toast.success(`${response.inserted} records imported successfully!`);
                fetchData();
            } else {
                toast.error(response.message || 'Failed to import Excel');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import Excel');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-6 bg-[#EDF2F7] min-h-screen">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Last Year Data</h2>
                    <p className="text-sm text-gray-500">DigiCoders Talent Hunt Scholarship Test - Historical Records</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search..."
                            className="w-full sm:w-64 bg-white border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm focus:outline-none focus:border-[#319795]"
                        />
                        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 bg-[#319795] hover:bg-[#2c7a7b] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <Upload className="h-4 w-4" />
                            {uploading ? 'Importing...' : 'Import Excel'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E6FFFA] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium">Loading data...</p>
                    </div>
                ) : (
                    <>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#E6FFFA] text-[#2D3748] font-semibold border-b border-[#319795]">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Certificate</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Obtained Marks</th>
                                <th className="px-4 py-3">Total Marks</th>
                                <th className="px-4 py-3">Date Time</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Student Batch</th>
                                <th className="px-4 py-3">College</th>
                                <th className="px-4 py-3">Course</th>
                                <th className="px-4 py-3">Year</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6FFFA]">
                            {data.map((item, index) => (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-[#4A5568]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium">Certificate</span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[#2D3748]">{item.studentName}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold">{item.obtainedMarks}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{item.totalMarks}</span>
                                    </td>
                                    <td className="px-4 py-3 text-[#718096] text-xs">{item.dateTime}</td>
                                    <td className="px-4 py-3 text-[#4A5568]">
                                        <div className="flex items-center gap-2">
                                            <span>{item.phone}</span>
                                            <div className="flex gap-1">
                                                <a
                                                    href={`tel:${item.phone}`}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Call"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                </a>
                                                <a
                                                    href={`https://wa.me/${item.phone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[#4A5568]">{item.studentBatch}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-green-50 text-green-700 py-1 px-2 rounded text-xs font-medium max-w-[200px] inline-block truncate" title={item.college}>
                                            {item.college}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{item.course}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{item.year}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-[#E6FFFA] text-xs text-[#2D3748] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span>Showing {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, total)} of {total} entries</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-[#319795] font-medium'}`}
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-medium">{currentPage}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1.5 rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-[#319795] font-medium'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
                    </>
                )}
            </div>
        </div>
    );
}
