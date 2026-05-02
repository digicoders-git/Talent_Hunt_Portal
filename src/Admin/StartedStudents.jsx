import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Download, Loader2, RotateCcw, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getStudentsByAssessmentApi, downloadStudentsByAssessmentApi } from '../API/student';
import { getMeApi } from '../API/admin';
import { OtpVerificationModal } from '../Comp/OtpVerificationModal';

export default function StartedStudents() {
    // Route parameter is :id, but we need code passed via state
    const { id: assessmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        limit: 10
    });
    const [filters, setFilters] = useState({
        college: '',
        course: '',
        year: ''
    });
    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [startedStudents, setStartedStudents] = useState([]);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);

    const fetchResults = async (page = 1) => {
        const code = location.state?.assessmentCode;
        if (!code) {
            toast.error("Assessment Code missing. Please navigate from Assessment page.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await getStudentsByAssessmentApi({
                assesmentCode: code,
                page,
                limit: itemsPerPage,
                search: searchQuery,
                college: filters.college,
                course: filters.course,
                year: filters.year
            });
            console.log(response);

            if (response.success) {
                const studentsList = response.students || [];

                const mappedData = studentsList.map(stu => ({
                    id: stu._id,
                    name: stu.name || "N/A",
                    phone: stu.mobile || "N/A",
                    college: stu.college || "N/A",
                    course: stu.course || "N/A",
                    year: stu.year || "N/A",
                    marks: stu.marks,
                    total: stu.total,
                    dateTime: stu.createdAt ? new Date(stu.createdAt).toLocaleString() : "N/A"
                }));

                setStartedStudents(mappedData);
                setPagination(response.pagination);
                setCurrentPage(response.pagination.page);
            } else {
                setStartedStudents([]);
                setPagination({ total: 0, totalPages: 1, page: 1, limit: 10 });
            }
        } catch (error) {
            console.error("Failed to fetch started students:", error);
            toast.error("Failed to load students data");
            setStartedStudents([]);
            setPagination({ total: 0, totalPages: 1, page: 1, limit: 10 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults(1);
        fetchUserRole();
    }, [assessmentId, location.state]);

    const fetchUserRole = async () => {
        try {
            const response = await getMeApi();
            if (response.success && response.admin) {
                setUserRole(response.admin.role);
            }
        } catch (error) {
            console.error("Failed to fetch user role:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchResults(1);
    };

    const resetFilters = () => {
        setFilters({ college: '', course: '', year: '' });
        setSearchQuery('');
        fetchResults(1);
    };

    const handlePageChange = (page) => {
        fetchResults(page);
    };

    const downloadExcel = async () => {
        const code = location.state?.assessmentCode;
        if (!code) {
            toast.error("Assessment Code missing");
            return;
        }

        setExportLoading(true);
        try {
            await downloadStudentsByAssessmentApi(code, {
                college: filters.college,
                course: filters.course,
                year: filters.year,
                search: searchQuery
            });
            toast.success("Student list downloaded!");
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Failed to download student list");
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EDF2F7] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#319795] mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Fetching student results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#EDF2F7] min-h-screen">
            <div className="mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Assessment Takers</h2>
                    <p className="text-sm text-gray-500">Showing first attempt submissions for each student</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Compact Backend Filters */}
                    <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1 gap-1 shadow-sm">
                        <input
                            type="text"
                            name="college"
                            value={filters.college}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="College"
                            className="hidden sm:block w-28 bg-transparent border-none px-2 py-1.5 text-xs focus:ring-0 outline-none"
                        />
                        <input
                            type="text"
                            name="course"
                            value={filters.course}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Course"
                            className="hidden sm:block w-24 bg-transparent border-none px-2 py-1.5 text-xs focus:ring-0 outline-none"
                        />
                        <input
                            type="text"
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Year"
                            className="w-16 bg-transparent border-none px-2 py-1.5 text-xs focus:ring-0 outline-none"
                        />
                        <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                        <button
                            onClick={applyFilters}
                            className="bg-[#319795] text-white p-1.5 rounded hover:bg-teal-700 transition-all active:scale-95"
                            title="Apply Filters"
                        >
                            <Search className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={resetFilters}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-100 transition-all active:scale-95"
                            title="Reset Filters"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {userRole === 'admin' && (
                        <button
                            onClick={() => setIsOtpModalOpen(true)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none h-[38px]"
                        >
                            <Download className="h-4 w-4" />
                            Excel
                        </button>
                    )}

                    <div className="relative w-full sm:w-60">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Name or Mobile..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:border-[#319795] bg-white h-[38px] text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E6FFFA] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#E6FFFA] text-[#2D3748] font-bold border-b border-[#319795]">
                            <tr>
                                <th className="px-6 py-4">Sr No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">College</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Year</th>
                                <th className="px-6 py-4">Marks</th>
                                <th className="px-6 py-4">Date-Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6FFFA]">
                            {startedStudents.map((student, index) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-[#2D3748]">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        <div className="flex items-center gap-2">
                                            <span>{student.phone}</span>
                                            {student.phone !== "N/A" && (
                                                <div className="flex gap-1">
                                                    <a
                                                        href={`tel:${student.phone}`}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Call"
                                                    >
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${student.phone}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        <span className="bg-green-50 text-green-700 py-1 px-3 rounded text-xs border border-green-100 font-medium whitespace-normal inline-block max-w-[200px]">
                                            {student.college}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-wide">
                                            {student.course}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        <span className="bg-purple-50 text-purple-700 py-1 px-3 rounded-full text-xs font-bold border border-purple-100 uppercase tracking-wide">
                                            {student.year}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#4A5568]">
                                        {student.marks !== null && student.total !== null ? (
                                            <span className="bg-orange-50 text-orange-700 py-1 px-3 rounded text-xs font-bold border border-orange-100">
                                                {student.marks}/{student.total}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Not Submitted</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-[#718096] text-xs">
                                        {student.dateTime}
                                    </td>
                                </tr>
                            ))}
                            {startedStudents.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#E6FFFA] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                    <div className="font-medium">Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} entries</div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        <div className="flex items-center gap-1.5">
                            <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-bold text-sm">
                                {currentPage} of {pagination.totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                            className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <OtpVerificationModal
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onVerified={downloadExcel}
            />
        </div>
    );
}