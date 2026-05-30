import React, { useState, useEffect, useRef } from 'react';
import { Search, Edit, X, Download, Loader2, RotateCcw, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllStudentsApi, getStudentsByAssessmentApi, updateStudentApi, downloadStudentsByAssessmentApi, downloadStudentsPDFApi } from '../API/student';
import { getAllAssessmentsApi } from '../API/assesment';
import { getMeApi } from '../API/admin';
import { getStatusesApi } from '../API/status';
import { addRemarkApi } from '../API/remark';
import { OtpVerificationModal } from '../Comp/OtpVerificationModal';
import * as XLSX from 'xlsx';

export function ManageStudents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [lastFetchedAsmt, setLastFetchedAsmt] = useState(null);
    const [assessmentSearch, setAssessmentSearch] = useState('All Assessments');
    const [showAssessmentDropdown, setShowAssessmentDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
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
    const assessmentDropdownRef = useRef(null);
    const itemsPerPage = 10;

    const [assessments, setAssessments] = useState([]);

    // Remarks & Status States
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [activeStudentForRemark, setActiveStudentForRemark] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statuses, setStatuses] = useState([]);
    const [remarkSubmitting, setRemarkSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
        fetchUserRole();
    }, []);

    const fetchStatusesForRemarks = async () => {
        try {
            const response = await getStatusesApi();
            if (response.success && response.statuses) {
                setStatuses(response.statuses);
                if (response.statuses.length > 0) {
                    setSelectedStatus(response.statuses[0].name);
                }
            }
        } catch (error) {
            console.error("Failed to fetch statuses:", error);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await getAllAssessmentsApi();
            if (response.success) {
                setAssessments(response.assessments || []);
            }

            // Fetch statuses for remarks
            await fetchStatusesForRemarks();

            // Fetch All Students initially
            await fetchStudents();
        } catch (error) {
            console.error("Initial Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            let response;
            const commonParams = {
                page,
                limit: itemsPerPage,
                college: filters.college,
                course: filters.course,
                year: filters.year,
                search: searchQuery
            };

            if (selectedAssessment) {
                // Fetch students for specific assessment
                response = await getStudentsByAssessmentApi({
                    assesmentCode: selectedAssessment.assessmentCode,
                    ...commonParams
                });
                setLastFetchedAsmt(selectedAssessment.assessmentCode);
            } else {
                // Fetch all students
                response = await getAllStudentsApi(commonParams);
                setLastFetchedAsmt(null);
            }

            if (response.success) {
                mapAndSetStudents(response.students);
                setPagination(response.pagination || { total: 0, totalPages: 1, page: 1, limit: 10 });
                setCurrentPage(response.pagination?.page || 1);
            } else {
                setStudents([]);
                setPagination({ total: 0, totalPages: 1, page: 1, limit: 10 });
                toast.error(response.message || "No students found");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setStudents([]);
            setPagination({ total: 0, totalPages: 1, page: 1, limit: 10 });
            toast.error("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const mapAndSetStudents = (rawStudents) => {
        if (!rawStudents || !Array.isArray(rawStudents)) {
            setStudents([]);
            return;
        }
        const mapped = rawStudents.map(s => ({
            id: s._id,
            name: s.name,
            phone: String(s.mobile),
            email: s.email,
            college: s.college,
            course: s.course,
            year: s.year,
            date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
            remarks: s.remarks || [],
            remarksCount: s.remarksCount || 0,
            latestRemark: s.latestRemark || null
        }));
        setStudents(mapped);
    };

    const handleOpenRemarkModal = (studentItem) => {
        setActiveStudentForRemark(studentItem);
        setRemarkText('');
        if (statuses.length > 0) {
            setSelectedStatus(statuses[0].name);
        }
        setIsRemarkModalOpen(true);
    };

    const handleSubmitRemark = async (e) => {
        e.preventDefault();
        if (!remarkText.trim()) {
            toast.warn("Remark text cannot be empty");
            return;
        }
        if (!selectedStatus) {
            toast.warn("Please select a status");
            return;
        }

        setRemarkSubmitting(true);
        try {
            const response = await addRemarkApi({
                studentId: activeStudentForRemark.id,
                text: remarkText.trim(),
                status: selectedStatus
            });

            if (response.success && response.remark) {
                // Normalize the new remark so it has adminName
                const normalizedRemark = {
                    _id: response.remark._id,
                    text: response.remark.text,
                    status: response.remark.status,
                    adminName: response.remark.admin?.userName || "N/A",
                    createdAt: response.remark.createdAt
                };

                // Update local state students list with new remark
                const updatedRemarkList = [normalizedRemark, ...(activeStudentForRemark.remarks || [])];
                const updatedItem = {
                    ...activeStudentForRemark,
                    remarks: updatedRemarkList,
                    remarksCount: updatedRemarkList.length,
                    latestRemark: normalizedRemark
                };
                
                setStudents(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                
                // Update active item in modal
                setActiveStudentForRemark(updatedItem);
                
                toast.success("Remark added successfully!");
                setIsRemarkModalOpen(false);
            } else {
                toast.error(response.message || "Failed to add remark");
            }
        } catch (error) {
            console.error("Add Remark Error:", error);
            toast.error("Failed to add remark");
        } finally {
            setRemarkSubmitting(false);
        }
    };

    const handleSearchByAssessment = async () => {
        // Trigger fetch with page 1
        fetchStudents(1);
        if (!selectedAssessment || assessmentSearch === 'All Assessments') {
            toast.success("Showing all students");
        } else {
            toast.success(`Filtering by assessment: ${selectedAssessment.assessmentName}`);
        }
    };

    const filteredAssessments = assessments.filter(assessment =>
        assessment.assessmentName?.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
        assessment.assessmentCode?.toLowerCase().includes(assessmentSearch.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                assessmentDropdownRef.current &&
                !assessmentDropdownRef.current.contains(event.target)
            ) {
                setShowAssessmentDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchStudents(1);
    };

    const resetFilters = () => {
        setFilters({ college: '', course: '', year: '' });
        setSearchQuery('');
        setAssessmentSearch('All Assessments');
        setSelectedAssessment(null);
        fetchStudents(1);
    };

    const currentStudents = students;

    const handlePageChange = (page) => {
        fetchStudents(page);
    };

    // Edit Modal Logic
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // OTP Modal Logic
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [pendingDownload, setPendingDownload] = useState(null);

    // User Role
    const [userRole, setUserRole] = useState(null);

    const handleEditStudent = (student) => {
        setEditingStudent({ ...student });
        setIsEditModalOpen(true);
    };

    const handleSaveStudent = async () => {
        if (!editingStudent.name || !editingStudent.phone || !editingStudent.email || !editingStudent.college || !editingStudent.course || !editingStudent.year) {
            toast.error("All fields are required!");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: editingStudent.name,
                mobile: editingStudent.phone,
                email: editingStudent.email,
                college: editingStudent.college,
                course: editingStudent.course,
                year: editingStudent.year
            };

            const response = await updateStudentApi(editingStudent.id, payload);

            if (response.success) {
                setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
                setIsEditModalOpen(false);
                toast.success("Student updated successfully!");
            } else {
                toast.error(response.message || "Failed to update student");
            }
        } catch (error) {
            console.error("Update Error:", error);
            toast.error(error.response?.data?.message || "Failed to update student");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStudent = (student) => {
        // Delete functionality removed
    };

    const requestDownloadWithOtp = (downloadType) => {
        setPendingDownload(downloadType);
        setIsOtpModalOpen(true);
    };

    const handleOtpVerified = async () => {
        if (pendingDownload === 'excel') {
            await downloadExcel();
        } else if (pendingDownload === 'pdf') {
            await downloadPDF();
        } else if (pendingDownload === 'frontendExcel') {
            downloadFrontendExcel();
        }
        setPendingDownload(null);
    };

    const downloadExcel = async () => {
        setExportLoading(true);
        try {
            const code = selectedAssessment?.assessmentCode || null;
            const currentFilters = {
                college: filters.college,
                course: filters.course,
                year: filters.year,
                search: searchQuery
            };

            await downloadStudentsByAssessmentApi(code, currentFilters);
            toast.success("Excel file downloaded!");
        } catch (error) {
            console.error("Export Error:", error);
            toast.error(error.message || "Failed to download Excel file");
        } finally {
            setExportLoading(false);
        }
    };

    const downloadPDF = async () => {
        setExportLoading(true);
        try {
            const code = selectedAssessment?.assessmentCode || null;
            const currentFilters = {
                college: filters.college,
                course: filters.course,
                year: filters.year,
                search: searchQuery
            };

            await downloadStudentsPDFApi(code, currentFilters);
            toast.success("PDF file downloaded!");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error(error.message || "Failed to download PDF file");
        } finally {
            setExportLoading(false);
        }
    };

    const downloadFrontendExcel = () => {
        if (students.length === 0) {
            toast.error("No data to download");
            return;
        }

        const data = students.map((s, i) => ({
            'Sr No.': (currentPage - 1) * itemsPerPage + i + 1,
            'Name': s.name,
            'Phone': s.phone,
            'Email': s.email,
            'College': s.college,
            'Course': s.course,
            'Year': s.year,
            'Registration Date': s.date
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `Students_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel downloaded!");
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#319795] font-semibold">Students</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-[#2D3748]">Manage Students</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
                    {/* Assessment Dropdown */}
                    <div className="relative w-full sm:w-56">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Select Assessment</label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={assessmentSearch}
                                    onChange={(e) => {
                                        setAssessmentSearch(e.target.value);
                                        setShowAssessmentDropdown(true);
                                    }}
                                    onFocus={() => {
                                        setAssessmentSearch("");
                                        setShowAssessmentDropdown(true);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchByAssessment()}
                                    placeholder="Search assessments..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-12 focus:outline-none focus:border-[#319795] transition-colors bg-white text-sm"
                                />

                                <button
                                    onClick={handleSearchByAssessment}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center bg-[#319795] text-white p-1.5 rounded-r-lg hover:bg-teal-700 transition-all active:scale-95"
                                    title="Search Assessment"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                </button>
                                {showAssessmentDropdown && (
                                    <div ref={assessmentDropdownRef} className="custom-scrollbar absolute z-20 w-full bg-white shadow-xl border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto">
                                        <div
                                            onClick={() => {
                                                setSelectedAssessment(null);
                                                setAssessmentSearch('All Assessments');
                                                setShowAssessmentDropdown(false);
                                            }}
                                            className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b font-medium text-gray-600"
                                        >
                                            All Assessments
                                        </div>
                                        {filteredAssessments.map((assessment) => (
                                            <div
                                                key={assessment._id || assessment.assessmentId}
                                                onClick={() => {
                                                    setSelectedAssessment(assessment);
                                                    setAssessmentSearch(assessment.assessmentName);
                                                    setShowAssessmentDropdown(false);
                                                }}
                                                className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                                            >
                                                <div className="font-semibold">{assessment.assessmentName}</div>
                                                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{assessment.assessmentCode}</div>
                                            </div>
                                        ))}
                                        {filteredAssessments.length === 0 && (
                                            <div className="px-4 py-3 text-gray-400 text-sm italic">No assessments found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Compact Backend Filters */}
                    <div className="flex items-center bg-zinc-50 border border-gray-300 rounded-xl p-1 gap-0.5 sm:gap-1 shadow-sm w-full sm:w-auto overflow-hidden">
                        <input
                            type="text"
                            name="college"
                            value={filters.college}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="College"
                            className="flex-1 min-w-0 w-24 sm:w-28 bg-transparent border-none px-2 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                        />
                        <div className="h-4 w-[1px] bg-gray-300 shrink-0"></div>
                        <input
                            type="text"
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Year"
                            className="w-[45px] sm:w-[60px] bg-transparent border-none px-1 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                        />
                        <div className="h-4 w-[1px] bg-gray-300 shrink-0"></div>
                        <input
                            type="text"
                            name="course"
                            value={filters.course}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Course"
                            className="w-[50px] sm:w-[80px] bg-transparent border-none px-1 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                        />
                        <div className="h-6 w-[1px] bg-gray-200 mx-0.5 sm:mx-1 shrink-0"></div>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={applyFilters}
                                disabled={loading}
                                className="bg-[#319795] text-white p-1.5 sm:p-2 rounded-lg hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                title="Apply Filters"
                            >
                                <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                            <button
                                onClick={resetFilters}
                                disabled={loading}
                                className="text-gray-400 hover:text-red-500 p-1.5 sm:p-2 rounded-lg hover:bg-white transition-all active:scale-95 shrink-0"
                                title="Reset Filters"
                            >
                                <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 w-full lg:w-auto">
                    <div className="relative flex items-center gap-2">
                        <div className="relative w-full">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-0">
                                <Search className="h-4 w-4 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Name or Mobile..."
                                className="bg-white pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:border-[#319795] text-sm h-[42px]"
                            />
                        </div>
                        <button
                            onClick={applyFilters}
                            className="bg-[#319795] text-white px-4 rounded-lg hover:bg-teal-700 transition-all active:scale-95 h-[42px] font-bold text-xs shadow-sm"
                        >
                            <Search className="h-4 w-4 text-white" />
                        </button>
                    </div>

                    <div className="flex gap-2 items-end">
                        {userRole === 'admin' && (
                            <>
                                <button
                                    onClick={() => requestDownloadWithOtp('frontendExcel')}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    title="Download current page data"
                                >
                                    <Download className="h-4 w-4" />
                                    Excel
                                </button>
                                <button
                                    onClick={() => requestDownloadWithOtp('excel')}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    title="Download all filtered data from server"
                                >
                                    <Download className="h-4 w-4" />
                                    All Data
                                </button>
                                <button
                                    onClick={() => requestDownloadWithOtp('pdf')}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    title="Download PDF report"
                                >
                                    <Download className="h-4 w-4" />
                                    PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E6FFFA] overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium font-inter">Loading students data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#E6FFFA] text-[#2D3748] font-semibold border-b border-[#319795]">
                                <tr>
                                    <th className="px-6 py-4">Sr No.</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">College</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Year</th>
                                    <th className="px-6 py-4">Reg. Date</th>
                                    {userRole === 'user' && (
                                        <>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Remarks</th>
                                        </>
                                    )}
                                    {userRole === 'admin' && <th className="px-6 py-4 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6FFFA]">
                                {currentStudents.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-[#4A5568]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-[#2D3748]">{student.name}</td>
                                        <td className="px-6 py-4 text-[#4A5568]">
                                            <div className="flex items-center gap-2">
                                                <span>{student.phone}</span>
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
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#4A5568]">{student.email}</td>
                                        <td className="px-6 py-4 text-[#4A5568]"><span className="bg-green-50 text-green-600 py-1 px-2 rounded text-xs border border-green-100 font-medium">{student.college}</span></td>
                                        <td className="px-6 py-4 text-[#4A5568]"><span className="bg-blue-50 text-blue-600 py-1 px-2 rounded text-xs border border-blue-100 font-medium">{student.course}</span></td>
                                        <td className="px-6 py-4 text-[#4A5568]"><span className="bg-purple-50 text-purple-600 py-1 px-2 rounded text-xs border border-purple-100 font-medium">{student.year}</span></td>
                                        <td className="px-6 py-4 text-[#718096] text-xs">{student.date}</td>
                                        {userRole === 'user' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    {student.latestRemark ? (
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                            student.latestRemark.status === 'Call Connected' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            student.latestRemark.status === 'Busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            student.latestRemark.status === 'Not Connected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-teal-50 text-teal-700 border-teal-200'
                                                        }`}>
                                                            {student.latestRemark.status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-medium text-xs">No Status</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleOpenRemarkModal(student)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                                                            student.remarksCount > 0
                                                                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        {student.remarksCount > 0 ? (
                                                            <span>{student.remarksCount} Remark{student.remarksCount > 1 ? 's' : ''}</span>
                                                        ) : (
                                                            <span>+ Add Remark</span>
                                                        )}
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                        {userRole === 'admin' && (
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEditStudent(student)} className="text-[#319795] border border-[#319795] p-1.5 rounded-lg hover:bg-[#E6FFFA] transition-all active:scale-90"><Edit className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {currentStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? "9" : userRole === 'user' ? "10" : "8"} className="px-6 py-12 text-center text-gray-500 italic">No students found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && (
                    <div className="px-6 py-4 border-t border-[#E6FFFA] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                        <div className="font-medium">Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} entries</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-1.5 rounded-lg border bg-white shadow-sm font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>
                            
                            <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-medium">
                                {currentPage}
                            </span>
                            
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || pagination.totalPages === 0} className="px-4 py-1.5 rounded-lg border bg-white shadow-sm font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {
                isEditModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in zoom-in duration-200">
                            <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Edit className="h-5 w-5" /> Edit Student Details</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input type="text" value={editingStudent?.name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label><input type="text" value={editingStudent?.phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">College</label><input type="text" value={editingStudent?.college || ''} onChange={(e) => setEditingStudent({ ...editingStudent, college: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course</label><input type="text" value={editingStudent?.course || ''} onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label><input type="text" value={editingStudent?.year || ''} onChange={(e) => setEditingStudent({ ...editingStudent, year: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input type="email" value={editingStudent?.email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200">Cancel</button>
                                <button
                                    onClick={handleSaveStudent}
                                    disabled={submitting}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold bg-[#319795] text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {isRemarkModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transform transition-all animate-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" /> Student Remarks & Status
                            </h3>
                            <button onClick={() => setIsRemarkModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {/* Student details summary */}
                            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-semibold text-teal-800">
                                <div>
                                    <p className="text-gray-500 uppercase tracking-wide text-[10px] font-bold">Student Name</p>
                                    <p className="text-base text-gray-900 font-extrabold">{activeStudentForRemark?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 uppercase tracking-wide text-[10px] font-bold">Phone</p>
                                    <p className="text-base text-teal-700 font-extrabold">{activeStudentForRemark?.phone}</p>
                                </div>
                            </div>

                            {/* History Timeline */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Remarks History</h4>
                                {(!activeStudentForRemark?.remarks || activeStudentForRemark.remarks.length === 0) ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500 font-medium">No remarks added yet.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-4">
                                        {activeStudentForRemark.remarks.map((rem, i) => (
                                            <div key={rem._id || i} className="relative group">
                                                {/* Dot indicator */}
                                                <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-teal-500 ring-4 ring-white"></span>
                                                
                                                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-150 hover:bg-white hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-[#2D3748] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{rem.adminName || rem.admin?.userName || "N/A"}</span>
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                rem.status === 'Call Connected' ? 'bg-green-100 text-green-700' :
                                                                rem.status === 'Busy' ? 'bg-amber-100 text-amber-700' :
                                                                rem.status === 'Not Connected' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-teal-100 text-teal-700'
                                                            }`}>
                                                                {rem.status}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-semibold">{new Date(rem.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 leading-relaxed font-medium break-words">{rem.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Remark Form */}
                            <form onSubmit={handleSubmitRemark} className="space-y-4 pt-4 border-t border-gray-150">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add New Remark</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Set Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none bg-white shadow-sm"
                                        >
                                            {statuses.length === 0 ? (
                                                <option value="">No statuses available</option>
                                            ) : (
                                                statuses.map(st => (
                                                    <option key={st._id} value={st.name}>{st.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remark Description</label>
                                    <textarea
                                        value={remarkText}
                                        onChange={(e) => setRemarkText(e.target.value)}
                                        placeholder="Write what was discussed or student updates..."
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none shadow-sm placeholder:text-gray-400"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={remarkSubmitting || statuses.length === 0}
                                    className={`w-full py-3 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                        (remarkSubmitting || statuses.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {remarkSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {remarkSubmitting ? "Submitting Remark..." : "Save Remark & Status"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <OtpVerificationModal
                isOpen={isOtpModalOpen}
                onClose={() => {
                    setIsOtpModalOpen(false);
                    setPendingDownload(null);
                }}
                onVerified={handleOtpVerified}
            />
        </div >
    );
}