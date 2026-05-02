import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Search, Edit, Trash2, X, Copy, Link, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAssessmentByStatusApi, toggleAssessmentStatusApi, createAssessmentApi, updateAssessmentApi, deleteAssessmentApi } from '../API/assesment';
import { getAllCertificatesApi } from '../API/certificate';





export function AssessmentHistory() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [dateQuery, setDateQuery] = useState('');
    const [dateInput, setDateInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState(null);
    const itemsPerPage = 10;
    const certificateRef = useRef(null);
    const [certificateLoading, setCertificateLoading] = useState(false);


    // Helper function to convert datetime to Kolkata timezone
    // Helper function to convert "DD/MM/YYYY, HH:MM:SS" to "YYYY-MM-DDTHH:MM" for input fields
    const parseBackendDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return '';
        try {
            // Handle ISO format from backend (e.g., "2025-01-10T10:30:00.000Z")
            if (dateStr.includes('T')) {
                return dateStr.slice(0, 16);
            }
            // Handle custom format "DD/MM/YYYY, HH:MM:SS"
            const [datePart, timePart] = dateStr.split(', ');
            if (datePart && timePart) {
                const [day, month, year] = datePart.split('/');
                const [hour, minute] = timePart.split(':');
                if (day && month && year && hour && minute) {
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
                }
            }

            // Fallback for other standard formats
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const y = date.getFullYear();
                const mo = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                const h = String(date.getHours()).padStart(2, '0');
                const mi = String(date.getMinutes()).padStart(2, '0');
                return `${y}-${mo}-${d}T${h}:${mi}`;
            }
            return '';
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                certificateRef.current &&
                !certificateRef.current.contains(event.target)
            ) {
                setShowCertificateDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setCurrentPage(1);
        }, 1500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchAssessments();
    }, [currentPage, searchQuery, dateQuery]);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            if (dateStr.includes('T')) {
                return new Date(dateStr).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    };

    const [certificateOptions, setCertificateOptions] = useState([]);

    const fetchCertificates = async () => {
        setCertificateLoading(true);
        try {
            const response = await getAllCertificatesApi();
            if (response.success) {
                setCertificateOptions(response.certificates || []);
            }
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        } finally {
            setCertificateLoading(false);
        }
    };

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const response = await getAssessmentByStatusApi(false, currentPage, itemsPerPage, searchQuery, dateQuery);
            setAssessments(response.assessments || []);
            setTotalPages(response.totalPages || 0);
            setTotalCount(response.totalCount || 0);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch assessments');
            setAssessments([]);
        } finally {
            setLoading(false);
        }
    };



    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            toast.success("Assessment code copied!");
        }).catch(() => {
            toast.error("Failed to copy code");
        });
    };

    const handleCopyName = (name) => {
        navigator.clipboard.writeText(name).then(() => {
            toast.success("Assessment name copied!");
        }).catch(() => {
            toast.error("Failed to copy name");
        });
    };

    const handleCopyLink = (item) => {
        let link;
        if (item.certificateOnly) {
            const certificateId = item.certificateName?._id || item.certificateName;
            link = `${window.location.origin}/certificate/${certificateId}/${item.assessmentCode}`;
        } else {
            link = `${window.location.origin}/${item.assessmentCode}`;
        }
        navigator.clipboard.writeText(link).then(() => {
            toast.success("Assessment link copied!");
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    const handleExport = (assessment) => {
        const headers = ["Name", "Code", "Total Questions", "Duration", "Start Time", "End Time", "Status", "Remark"];
        const row = [
            assessment.name,
            assessment.code,
            assessment.totalQuestions,
            assessment.duration,
            assessment.startTime,
            assessment.endTime,
            assessment.status ? "Active" : "Inactive",
            assessment.remark
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + row.join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${assessment.name.replace(/ /g, "_")}_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        totalQuestions: '',
        duration: '15',
        startTime: '',
        endTime: '',
        hasCertificate: 'No',
        certificateType: 'Default',
        certificateName: '',
        remark: '',
        certificateOnly: 'No'
    });



    const [certificateSearch, setCertificateSearch] = useState('');
    const [showCertificateDropdown, setShowCertificateDropdown] = useState(false);

    const filteredCertificates = certificateOptions.filter(cert =>
        cert.certificateName?.toLowerCase().includes(certificateSearch.toLowerCase()) &&
        cert.status === true
    );

    const handleEdit = (assessment) => {
        setEditingAssessment(assessment);
        setFormData({
            name: assessment.assessmentName,
            code: assessment.assessmentCode,
            totalQuestions: assessment.totalQuestions.toString(),
            duration: assessment.timeDuration.toString(),
            startTime: parseBackendDate(assessment.startDateTime),
            endTime: parseBackendDate(assessment.endDateTime),
            hasCertificate: assessment.generateCertificate ? 'Yes' : 'No',
            certificateType: assessment.certificateType || 'Default',
            remark: assessment.remark,
            certificateName: assessment.certificateName?.certificateName || '',
            certificateOnly: assessment.certificateOnly ? 'Yes' : 'No'
        });
        setCertificateSearch(assessment.certificateName?.certificateName || '');
        setIsModalOpen(true);
        if (certificateOptions.length === 0) {
            fetchCertificates();
        }
    };

    // Auto-fill helper functions
    const generateAssessmentCode = () => {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `DCT${day}${minutes.charAt(1)}${seconds.charAt(1)}`;
    };

    const getAutoFillTimes = () => {
        const now = new Date();
        const startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours before
        const endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours after
        
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        
        return {
            startTime: formatDateTime(startTime),
            endTime: formatDateTime(endTime)
        };
    };

    const handleAdd = () => {
        setEditingAssessment(null);
        const autoTimes = getAutoFillTimes();
        setFormData({
            name: '',
            code: generateAssessmentCode(),
            totalQuestions: '',
            duration: '15',
            startTime: autoTimes.startTime,
            endTime: autoTimes.endTime,
            hasCertificate: 'No',
            certificateType: 'Default',
            remark: '',
            certificateOnly: 'No'
        });
        setCertificateSearch('');
        setShowCertificateDropdown(false);
        setIsModalOpen(true);
        if (certificateOptions.length === 0) {
            fetchCertificates();
        }
    };

    const handleSave = async () => {
        // Validate all required fields
        if (!formData.name.trim()) {
            toast.error("Assessment Name is required!");
            return;
        }
        if (!formData.code.trim()) {
            toast.error("Assessment Code is required!");
            return;
        }
        if (formData.certificateOnly === 'No') {
            if (!formData.totalQuestions) {
                toast.error("Total Questions is required!");
                return;
            }
            if (!formData.duration) {
                toast.error("Duration is required!");
                return;
            }
        }
        if (!formData.startTime.trim()) {
            toast.error("Start Date-Time is required!");
            return;
        }
        if (!formData.endTime.trim()) {
            toast.error("End Date-Time is required!");
            return;
        }

        // Validate certificate field if certificate is enabled
        let selectedCertificateId = null;
        if (formData.hasCertificate === 'Yes' || formData.certificateOnly === 'Yes') {
            const selectedCert = certificateOptions.find(cert => cert.certificateName === certificateSearch);
            if (!selectedCert) {
                toast.error("Please select a valid certificate from the dropdown options!");
                return;
            }
            selectedCertificateId = selectedCert._id;
        }

        const payload = {
            assessmentName: formData.name,
            assessmentCode: formData.code,
            totalQuestions: formData.certificateOnly === 'Yes' ? 0 : parseInt(formData.totalQuestions),
            timeDuration: formData.certificateOnly === 'Yes' ? 0 : parseInt(formData.duration),
            startDateTime: new Date(formData.startTime).toISOString(),
            endDateTime: new Date(formData.endTime).toISOString(),
            generateCertificate: formData.hasCertificate === 'Yes' || formData.certificateOnly === 'Yes',
            certificateName: selectedCertificateId,
            remark: formData.remark,
            status: false, // History assessments are false
            certificateOnly: formData.certificateOnly === 'Yes'
        };

        setSubmitting(true);
        try {
            let response;
            if (editingAssessment) {
                response = await updateAssessmentApi(editingAssessment._id, payload);
            } else {
                response = await createAssessmentApi(payload);
            }

            if (response.success) {
                toast.success(editingAssessment ? "Assessment updated successfully!" : "Assessment added successfully!");
                setIsModalOpen(false);
                fetchAssessments();
                window.dispatchEvent(new Event('dashboardUpdated'));
            } else {
                toast.error(response.message || "Failed to save assessment");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save assessment');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const response = await toggleAssessmentStatusApi(id);
            if (response.success || response.status) {
                toast.success(response.message || "Assessment activated successfully");
                // Immediately remove from History UI since it's now active
                setAssessments(prev => prev.filter(item => item._id !== id));
                window.dispatchEvent(new Event('dashboardUpdated'));
            } else {
                toast.error(response.message || "Failed to update status");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteAssessment = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This assessment will be permanently deleted!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#319795",
            cancelButtonColor: "#f56565",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await deleteAssessmentApi(id);
                    if (response.success) {
                        toast.success("Assessment deleted successfully");
                        fetchAssessments();
                        window.dispatchEvent(new Event('dashboardUpdated'));
                    } else {
                        toast.error(response.message || "Failed to delete assessment");
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete assessment');
                }
            }
        });
    };

    return (
        <div className="p-6">
            {/* ... Header and Controls remain same ... */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#319795] font-semibold">Assessment</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-[#2D3748]">Assessment History</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-[#319795] hover:bg-[#2c7a7b] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                    <Plus className="h-4 w-4 text-white" />
                    Add Assessment
                </button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-[#2D3748] whitespace-nowrap">Search:</span>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Name/Code/Remark"
                            className="border border-gray-300 bg-white rounded px-3 py-1.5 w-full sm:w-48 focus:outline-none focus:border-[#319795] transition-colors text-sm"
                        />
                    </div>
                    <div className="relative flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-[#2D3748] whitespace-nowrap">Date:</span>
                        <input
                            type="text"
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setDateQuery(dateInput);
                                    setCurrentPage(1);
                                }
                            }}
                            placeholder="DD/MM/YYYY"
                            className="border border-gray-300 bg-white rounded px-3 py-1.5 flex-1 sm:w-32 focus:outline-none focus:border-[#319795] transition-colors text-sm"
                        />
                        <button
                            onClick={() => {
                                setDateQuery(dateInput);
                                setCurrentPage(1);
                            }}
                            className="p-1.5 text-[#319795] hover:bg-[#E6FFFA] rounded transition-colors flex-shrink-0"
                            title="Search by date"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-[#E6FFFA] overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium font-inter">Loading history...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-[#E6FFFA] text-[#2D3748] font-semibold border-b border-[#319795]">
                                    <tr>
                                        <th className="px-4 py-3 w-16">Sr No.</th>
                                        <th className="px-4 py-3 w-20">Status</th>
                                        <th className="px-4 py-3">Questions</th>
                                        <th className="px-4 py-3">Assessment Name</th>
                                        <th className="px-4 py-3">Assessment Code</th>
                                        <th className="px-4 py-3">Date-Time</th>
                                        <th className="px-4 py-3">Remark</th>
                                        <th className="px-4 py-3">Certificate</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6FFFA]">
                                    {assessments.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Search className="h-12 w-12 mb-4 opacity-20" />
                                                    <p className="text-lg font-bold">No Assessment History Found</p>
                                                    <p className="text-sm">Adjust your search or create an assessment.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : assessments.map((item, index) => (
                                        <tr key={item._id}>
                                            <td className="px-4 py-3 align-top">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="px-4 py-3 align-top">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.status}
                                                        onChange={() => toggleStatus(item._id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#319795]"></div>
                                                </label>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {item.certificateOnly ? (
                                                    <div className="text-purple-600 font-medium text-sm px-3 py-1 bg-purple-50 rounded inline-block">
                                                        Certificate Only
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/admin/assign-questions/${item._id}`, { state: { assessmentCode: item.assessmentCode } });
                                                        }}
                                                        className="bg-emerald-400 text-white px-3 py-1 rounded text-xs font-medium hover:bg-emerald-500 transition-colors"
                                                    >
                                                        Questions ({item.count || 0}/{item.totalQuestions})
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 whitespace-normal break-words text-[#2D3748] font-medium leading-tight">{item.assessmentName}</div>
                                                    <button
                                                        onClick={() => handleCopyName(item.assessmentName)}
                                                        className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                                        title="Copy Assessment Name"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                {!item.certificateOnly && (
                                                    <div className="text-xs bg-[#F56565]/20 text-[#B8322F] inline-block px-1.5 rounded mt-1">
                                                        {item.timeDuration} Min
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-[#2D3748] mb-2">{item.assessmentCode}</div>
                                                <div className="flex gap-1 mb-1">
                                                    <button
                                                        onClick={() => handleCopyCode(item.assessmentCode)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
                                                        title="Copy Assessment Code"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        Copy Code
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyLink(item)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-colors"
                                                        title="Copy Assessment Link"
                                                    >
                                                        <Link className="h-3 w-3" />
                                                        Copy Link
                                                    </button>
                                                </div>
                                                <div className="space-y-1 space-x-1">
                                                    <div className="text-xs bg-[#319795]/20 text-[#2B7A73] inline-block px-1.5 rounded">
                                                        Start: {item.start || 0}
                                                    </div>
                                                    {!item.certificateOnly && (
                                                        <div className="text-xs bg-[#F56565]/20 text-[#B8322F] inline-block px-1.5 rounded">
                                                            Submit: {item.submit || 0}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-gray-500 text-xs whitespace-nowrap">
                                                <div className="font-bold text-gray-700">{formatDisplayDate(item.startDateTime)}</div>
                                                <div className="text-gray-400">{formatDisplayDate(item.endDateTime)}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="w-20 whitespace-normal break-words text-[#2D3748] text-xs leading-tight">
                                                    {item.remark}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-[#2D3748]">
                                                <div className="w-20 whitespace-normal break-words text-xs leading-tight">{item.generateCertificate ? 'Yes' : 'No'}</div>
                                                <div className="w-20 whitespace-normal break-words text-xs text-gray-400 leading-tight">{item.certificateName?.certificateName || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    {!item.certificateOnly && (
                                                        <button
                                                            onClick={() => navigate(`/admin/assessment/result/${item._id}`)}
                                                            className="border border-[#319795] text-[#319795] px-2 py-0.5 rounded text-xs hover:bg-[#E6FFFA]"
                                                        >
                                                            Result
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/admin/assessment/started-students/${item._id}`, { state: { assessmentCode: item.assessmentCode } })}
                                                        className="border border-orange-500 text-orange-500 px-2 py-0.5 rounded text-xs hover:bg-orange-50"
                                                    >
                                                        Export
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAssessment(item._id)}
                                                            className="p-1 border border-red-500 text-red-500 rounded hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-[#E6FFFA] text-xs text-[#2D3748] flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span>
                                Showing {assessments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-[#319795] font-medium'}`}
                                >
                                    Previous
                                </button>

                                <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-medium">
                                    {currentPage}
                                </span>

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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#319795] text-[#E6FFFA] px-6 py-4 flex justify-between items-center">
                            <h3 className="font-semibold text-lg">{editingAssessment ? 'Edit Assessment Schedule' : 'Add Assessment Schedule'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-[#E6FFFA] hover:text-[#B2F5EA]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                            {/* Form fields same as ActiveAssessment */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Assessment Name<span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Assessment Code<span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Only Certificate</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="radio"
                                            name="certificate_only_history"
                                            checked={formData.certificateOnly === 'Yes'}
                                            onChange={() => setFormData({ ...formData, certificateOnly: 'Yes', hasCertificate: 'Yes' })}
                                            className="text-[#319795] focus:ring-[#319795]"
                                        /> Yes
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="radio"
                                            name="certificate_only_history"
                                            checked={formData.certificateOnly === 'No'}
                                            onChange={() => setFormData({ ...formData, certificateOnly: 'No' })}
                                            className="text-[#319795] focus:ring-[#319795]"
                                        /> No
                                    </label>
                                </div>
                            </div>
                            {formData.certificateOnly === 'No' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Total Question<span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            value={formData.totalQuestions}
                                            onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Time Duration (Min)<span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.duration}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*$/.test(value)) {
                                                    setFormData({ ...formData, duration: value });
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date-Time<span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date-Time<span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                />
                            </div>
                            {formData.certificateOnly === 'No' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Generate Certificate</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="radio"
                                                name="cert_history"
                                                checked={formData.hasCertificate === 'Yes'}
                                                onChange={() => setFormData({ ...formData, hasCertificate: 'Yes' })}
                                                className="text-[#319795] focus:ring-[#319795]"
                                            /> Yes
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="radio"
                                                name="cert_history"
                                                checked={formData.hasCertificate === 'No'}
                                                onChange={() => setFormData({ ...formData, hasCertificate: 'No' })}
                                                className="text-[#319795] focus:ring-[#319795]"
                                            /> No
                                        </label>
                                    </div>
                                </div>
                            )}
                            {(formData.hasCertificate === 'Yes' || formData.certificateOnly === 'Yes') && (
                                <div className="relative" ref={certificateRef}>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Choose Certificate Name<span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={certificateSearch}
                                            onChange={(e) => {
                                                setCertificateSearch(e.target.value);
                                                setShowCertificateDropdown(true);
                                            }}
                                            onFocus={() => setShowCertificateDropdown(true)}
                                            placeholder="Search certificate..."
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                        />
                                        {certificateLoading && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#319795]" />
                                            </div>
                                        )}
                                    </div>
                                    {showCertificateDropdown && !certificateLoading && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
                                            {filteredCertificates.map((cert) => (
                                                <div
                                                    key={cert._id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, certificateName: cert.certificateName });
                                                        setCertificateSearch(cert.certificateName);
                                                        setShowCertificateDropdown(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                >
                                                    {cert.certificateName}
                                                </div>
                                            ))}
                                            {filteredCertificates.length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm">No certificates found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label>
                                <input
                                    type="text"
                                    value={formData.remark}
                                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#319795]"
                                />
                            </div>
                        </div>

                        <div className="bg-[#EDF2F7] px-6 py-4 flex justify-start">
                            <button
                                onClick={handleSave}
                                disabled={submitting}
                                className={`bg-[#319795] ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#2c7a7b]'} text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors`}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="bg-white text-[#319795] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                                )}
                                {editingAssessment ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Adding...' : 'Add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}