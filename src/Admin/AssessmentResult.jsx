import React, { useState, useEffect, useRef } from 'react';
import { Download, Search, FileText, FileSpreadsheet, ChevronDown, ArrowLeft, Eye, Loader2, RotateCcw, Edit, X, Trophy, Phone, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getResultsByAssessmentIdApi, downloadResultsByAssessmentIdApi } from '../API/result';
import { getSingleStudentApi, uploadStudentCertificateApi, updateStudentApi } from '../API/student';
import { getMeApi } from '../API/admin';
import { getSingleCertificateApi } from '../API/certificate';
import { OtpVerificationModal } from '../Comp/OtpVerificationModal';
import html2canvas from 'html2canvas';

const handleExportData = async () => {
    if (!id) return;
    setExportLoading(true);
    try {
        await downloadResultsByAssessmentIdApi(id, {
            college: filters.college,
            course: filters.course,
            year: filters.year,
            search: searchQuery
        });
        toast.success("Excel results downloaded!");
    } catch (error) {
        console.error("Export Error:", error);
        toast.error(error.message || "Failed to export results");
    } finally {
        setExportLoading(false);
    }
};

const normalizeHttpsUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("https://")) return url;
    if (url.startsWith("http://")) return url.replace("http://", "https://");
    return url;
};


export default function AssessmentResult() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [exportLoading, setExportLoading] = useState(false);
    const itemsPerPage = 10;

    const [loading, setLoading] = useState(true);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [firstSubmissions, setFirstSubmissions] = useState([]);
    const [secondSubmissions, setSecondSubmissions] = useState([]);
    const [activeTab, setActiveTab] = useState('first');
    const [assessmentName, setAssessmentName] = useState('');
    const [certificateId, setCertificateId] = useState(null);
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
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [updatedStudents, setUpdatedStudents] = useState(new Set());
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Top Results states
    const [isTopResultsModalOpen, setIsTopResultsModalOpen] = useState(false);
    const [isTopResultsViewOpen, setIsTopResultsViewOpen] = useState(false);
    const [topResultsData, setTopResultsData] = useState({});
    const [topFilters, setTopFilters] = useState({
        college: '',
        year: [],
        course: [],
        limit: '10'
    });
    const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const collegeDropdownRef = useRef(null);
    const yearDropdownRef = useRef(null);
    const courseDropdownRef = useRef(null);

    // Debounce timer refs
    const filterDebounceRef = useRef(null);
    const searchDebounceRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target)) {
                setShowCollegeDropdown(false);
            }
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
                setShowYearDropdown(false);
            }
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
                setShowCourseDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const fetchResultsWithParams = async (page = 1, search = searchQuery, filterParams = filters) => {
        if (!id) return;
        setTableLoading(true);
        try {
            const response = await getResultsByAssessmentIdApi(id, {
                page,
                limit: itemsPerPage,
                search: search,
                college: filterParams.college,
                course: filterParams.course,
                year: filterParams.year
            });

            if (response.success) {
                setAssessmentName(response.assessmentName || '');
                setCertificateId(response.certificateName || null);

                const formatData = (list, submissionType) => list.map(res => ({
                    id: res._id,
                    studentId: res.student?._id,
                    name: res.student?.name || "N/A",
                    phone: res.student?.mobile || "N/A",
                    email: res.student?.email || "N/A",
                    course: res.student?.course || "N/A",
                    year: res.student?.year || "N/A",
                    college: res.student?.college || "N/A",
                    marks: `${res.marks || 0}/${res.total || 0}`,
                    time: res.createdAt ? new Date(res.createdAt).toLocaleString() : "N/A",
                    duration: res.duration || "N/A",
                    refNo: res.student?.code || "N/A",
                    rank: res.rank || "N/A",
                    submission: submissionType
                }));

                setFirstSubmissions(formatData(response.firstSubmission || [], 1));
                setSecondSubmissions(formatData(response.reattempt || [], 2));

                setPagination({
                    total: response.pagination?.total || 0,
                    totalPages: response.pagination?.totalPages || 1,
                    limit: itemsPerPage,
                    page
                });
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("Failed to fetch assessment results:", error);
            toast.error("Failed to load results");
        } finally {
            setTableLoading(false);
            setIsInitialLoad(false);
        }
    };

    const fetchResults = async (page = 1) => {
        return fetchResultsWithParams(page, searchQuery, filters);
    };

    const fetchAllSubmissions = async () => {
        try {
            const response = await getResultsByAssessmentIdApi(id, {
                page: 1,
                limit: 10000
            });
            if (response.success && response.firstSubmission) {
                const formatted = response.firstSubmission.map(res => ({
                    college: res.student?.college || "N/A",
                    course: res.student?.course || "N/A",
                    year: res.student?.year || "N/A",
                }));
                setAllSubmissions(formatted);
            }
        } catch (error) {
            console.error("Failed to fetch all submissions for filters:", error);
        }
    };

    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            await fetchResults(1);
            await fetchUserRole();
            await fetchAllSubmissions();
            setLoading(false);
        };
        initialFetch();
    }, [id]);

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
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        // Clear existing timer
        if (filterDebounceRef.current) {
            clearTimeout(filterDebounceRef.current);
        }
        
        // Set new timer for 600ms - pass current values
        filterDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchResultsWithParams(1, searchQuery, newFilters);
        }, 600);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Clear existing timer
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        
        // Set new timer for 600ms - pass current values
        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchResultsWithParams(1, value, filters);
        }, 600);
    };

    const resetFilters = () => {
        setFilters({ college: '', course: '', year: '' });
        setSearchQuery('');
        setCurrentPage(1);
        fetchResults(1);
    };

    const handleTopResultsSubmit = async () => {
        if (!topFilters.limit || parseInt(topFilters.limit) <= 0) {
            toast.error('Please enter a valid number');
            return;
        }

        const toastId = toast.loading("Fetching top results...");
        try {
            const response = await getResultsByAssessmentIdApi(id, {
                page: 1,
                limit: 10000,
                college: topFilters.college,
                year: topFilters.year.length > 0 ? topFilters.year.join(',') : '',
                course: topFilters.course.length > 0 ? topFilters.course.join(',') : ''
            });

            if (response.success) {
                const formatData = (list, submissionType) => list.map(res => ({
                    id: res._id,
                    studentId: res.student?._id,
                    name: res.student?.name || "N/A",
                    phone: res.student?.mobile || "N/A",
                    email: res.student?.email || "N/A",
                    course: res.student?.course || "N/A",
                    year: res.student?.year || "N/A",
                    college: res.student?.college || "N/A",
                    marks: `${res.marks || 0}/${res.total || 0}`,
                    time: res.createdAt ? new Date(res.createdAt).toLocaleString() : "N/A",
                    duration: res.duration || "N/A",
                    refNo: res.student?.code || "N/A",
                    rank: res.rank || "N/A",
                    submission: submissionType
                }));

                const formatted = formatData(response.firstSubmission || [], 1);
                
                // Segment/Group data by Course and Year
                const targetCourses = topFilters.course.length > 0 ? topFilters.course : ['All Courses'];
                const targetYears = topFilters.year.length > 0 ? topFilters.year : ['All Years'];

                const groupedData = {};
                targetCourses.forEach(c => {
                    targetYears.forEach(y => {
                        const groupKey = `${c} - ${y}`;
                        groupedData[groupKey] = [];
                    });
                });

                formatted.forEach(item => {
                    const matchedCourses = targetCourses.filter(tc => 
                        tc === 'All Courses' || (item.course && item.course.toLowerCase().trim() === tc.toLowerCase().trim())
                    );
                    const matchedYears = targetYears.filter(ty => 
                        ty === 'All Years' || (item.year && item.year.toLowerCase().trim() === ty.toLowerCase().trim())
                    );

                    matchedCourses.forEach(mc => {
                        matchedYears.forEach(my => {
                            const groupKey = `${mc} - ${my}`;
                            if (groupedData[groupKey]) {
                                groupedData[groupKey].push(item);
                            }
                        });
                    });
                });

                const finalGroupedResults = {};
                const limitNum = parseInt(topFilters.limit) || 10;

                Object.keys(groupedData).forEach(groupKey => {
                    const students = groupedData[groupKey];
                    
                    students.sort((a, b) => {
                        const getScore = (m) => {
                            if (!m) return 0;
                            const parts = m.split('/');
                            return parseFloat(parts[0]) || 0;
                        };
                        const scoreA = getScore(a.marks);
                        const scoreB = getScore(b.marks);
                        if (scoreB !== scoreA) {
                            return scoreB - scoreA;
                        }
                        const getSeconds = (d) => {
                            if (!d || d === 'N/A') return 999999;
                            const parts = d.split(':').map(Number);
                            if (parts.length === 2) return parts[0] * 60 + parts[1];
                            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                            return Number(d) || 999999;
                        };
                        return getSeconds(a.duration) - getSeconds(b.duration);
                    });

                    finalGroupedResults[groupKey] = students.slice(0, limitNum);
                });

                setTopResultsData(finalGroupedResults);
                setIsTopResultsModalOpen(false);
                setIsTopResultsViewOpen(true);
                toast.update(toastId, {
                    render: "Top results loaded!",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });
            } else {
                toast.update(toastId, {
                    render: response.message || "Failed to fetch top results",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000
                });
            }
        } catch (error) {
            console.error("Top Results Error:", error);
            toast.update(toastId, {
                render: "Failed to fetch top results",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    const downloadSingleGroupImage = async (groupKey) => {
        const groupStudents = topResultsData[groupKey] || [];
        if (groupStudents.length === 0) {
            toast.error("No results to download");
            return;
        }

        const toastId = toast.loading(`Generating download for ${groupKey}...`);
        try {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:absolute;left:-9999px;background:#fff;padding:25px;width:1200px;';

            wrapper.innerHTML = `
                <div style="background:linear-gradient(135deg, #0d9488, #14b8a6);color:#fff;padding:25px;border-radius:12px 12px 0 0;font-family:sans-serif;box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="font-size:26px;font-weight:800;margin:0;letter-spacing:0.5px;">🏆 Top Results</h2>
                    <p style="margin:5px 0 0 0; opacity:0.9; font-size:14px;">Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                <div style="background:#E6FFFA;padding:16px;border-bottom:3px solid #B2F5EA;font-family:sans-serif;display:flex;gap:15px;align-items:center;">
                    <span style="font-weight:800;color:#115e59;font-size:13px;text-transform:uppercase;">Group:</span>
                    <span style="background:#fff;padding:6px 12px;border-radius:8px;color:#0f766e;font-weight:bold;font-size:12px;border:1px solid #B2F5EA;">${groupKey}</span>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-top:25px;font-family:sans-serif;box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">
                    <thead style="background:#E6FFFA;">
                        <tr>
                            <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">RANK</th>
                            <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">STUDENT NAME</th>
                            <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">REF CODE</th>
                            <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">COURSE</th>
                            <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">YEAR</th>
                            <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">COLLEGE</th>
                            <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">SCORE</th>
                            <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">DURATION</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupStudents.map((item, index) => `
                            <tr style="background:${index % 2 === 0 ? '#fff' : '#f9fafb'};">
                                <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;">
                                    <div style="display:flex;align-items:center;justify-content:center;height:100%;">
                                        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${index === 0 ? '#fef3c7' : index === 1 ? '#f3f4f6' : index === 2 ? '#fed7aa' : '#f0fdfa'};color:${index === 0 ? '#92400e' : index === 1 ? '#374151' : index === 2 ? '#9a3412' : '#0f766e'};font-weight:bold;">${index + 1}</span>
                                    </div>
                                </td>
                                <td style="padding:12px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#1e293b;"><div style="display:flex;align-items:center;height:100%;">${item.name}</div></td>
                                <td style="padding:12px 10px;border:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#475569;"><div style="display:flex;align-items:center;height:100%;">${item.refNo}</div></td>
                                <td style="padding:12px 10px;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;height:100%;"><span style="background:#dbeafe;color:#1e40af;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:bold;display:inline-flex;align-items:center;justify-content:center;text-transform:uppercase;">${item.course}</span></div></td>
                                <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#f3e8ff;color:#6b21a8;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:bold;display:inline-flex;align-items:center;justify-content:center;">${item.year}</span></div></td>
                                <td style="padding:12px 10px;border:1px solid #e5e7eb;color:#475569;font-weight:500;"><div style="display:flex;align-items:center;height:100%;">${item.college}</div></td>
                                <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#ccfbf1;color:#0f766e;padding:6px 12px;border-radius:8px;font-weight:extrabold;display:inline-flex;align-items:center;justify-content:center;">${item.marks}</span></div></td>
                                <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;font-weight:bold;font-size:11px;color:#475569;"><div style="display:flex;align-items:center;justify-content:center;height:100%;">${item.duration}</div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="text-align:center;padding:15px 0;margin-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;font-family:sans-serif;font-weight:600;">
                    Assessment Portal • All Rights Reserved
                </div>
            `;

            document.body.appendChild(wrapper);

            const canvas = await html2canvas(wrapper, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            document.body.removeChild(wrapper);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Top_Results_${groupKey.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                toast.update(toastId, {
                    render: `${groupKey} downloaded successfully!`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });
            });
        } catch (error) {
            console.error('Download error:', error);
            toast.update(toastId, {
                render: "Failed to download image",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    const getUniqueValues = (field) => {
        const values = new Set();
        allSubmissions.forEach(item => {
            if (item[field] && item[field] !== 'N/A') values.add(item[field]);
        });
        return Array.from(values).sort();
    };

    const handleViewStudent = (student) => {
        navigate(`/admin/assessment/details/${student.studentId}`);
    };

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

            const response = await updateStudentApi(editingStudent.studentId, payload);

            if (response.success) {
                // Update both first and second submissions
                setFirstSubmissions(prev => prev.map(s => s.studentId === editingStudent.studentId ? editingStudent : s));
                setSecondSubmissions(prev => prev.map(s => s.studentId === editingStudent.studentId ? editingStudent : s));

                // Mark student as updated for certificate regeneration
                setUpdatedStudents(prev => new Set([...prev, editingStudent.studentId]));

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

    // Get current data based on active tab
    const getCurrentData = () => {
        return activeTab === 'first' ? firstSubmissions : secondSubmissions;
    };

    // Server-side pagination - data already paginated
    const getPaginatedData = () => {
        return getCurrentData();
    };

    // Update pagination when tab changes
    useEffect(() => {
        if (!isInitialLoad) {
            setCurrentPage(1);
            fetchResultsWithParams(1, searchQuery, filters);
        }
    }, [activeTab]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
            fetchResultsWithParams(page, searchQuery, filters);
        }
    };

    // Font mapping
    const fontCSSMap = {
        'Inter': 'Inter, sans-serif',
        'Roboto': 'Roboto, sans-serif',
        'Playfair Display': 'Playfair Display, serif',
        'Montserrat': 'Montserrat, sans-serif',
        'Dancing Script': 'Dancing Script, cursive',
        'Courier New': 'Courier New, monospace',
        'Lobster': 'Lobster, cursive',
        'Pacifico': 'Pacifico, cursive',
        'Great Vibes': 'Great Vibes, cursive',
        'Satisfy': 'Satisfy, cursive',
        'Kaushan Script': 'Kaushan Script, cursive',
        'Crimson Text': 'Crimson Text, serif',
        'Libre Baskerville': 'Libre Baskerville, serif',
        'Cormorant Garamond': 'Cormorant Garamond, serif'
    };

    const ensureFontLoaded = async (fontFamily) => {
        if (!fontFamily) return;
        const cleanName = fontFamily.split(',')[0].trim();
        const isLoaded = document.fonts.check(`16px "${cleanName}"`);
        if (isLoaded) return;
        await document.fonts.ready;
    };

    const downloadStudentResult = async (studentItem) => {
        if (!studentItem.studentId) {
            toast.error("Invalid Student ID");
            return;
        }

        try {
            const response = await getSingleStudentApi(studentItem.studentId);

            if (response.success && response.student) {
                const student = response.student;
                const isStudentUpdated = updatedStudents.has(studentItem.studentId);

                // Check if certificate exists and student hasn't been updated
                if (student.certificate && !isStudentUpdated) {
                    // const imageResponse = await fetch(student.certificate);
                    const certUrl = normalizeHttpsUrl(student.certificate);
                    const imageResponse = await fetch(certUrl);

                    if (!imageResponse.ok) throw new Error("Failed to fetch certificate");

                    const blob = await imageResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Certificate_${student.name.replace(/\s+/g, '_')}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success("Certificate downloaded successfully!");
                    return;
                }

                // Generate certificate if it doesn't exist OR student was updated if it doesn't exist
                if (!certificateId) {
                    toast.error("Certificate template not found for this assessment");
                    return;
                }

                const toastId = toast.loading("Generating certificate...");

                try {
                    // Get certificate template
                    const certResponse = await getSingleCertificateApi(certificateId);
                    const certTemplate = certResponse?.certificate || certResponse;

                    if (!certTemplate) {
                        throw new Error("Certificate template not found");
                    }

                    // Generate certificate using canvas
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    // img.src = certTemplate.certificateImage;
                    img.src = normalizeHttpsUrl(certTemplate.certificateImage);


                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error("Failed to load certificate template"));
                    });

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const w = certTemplate.width || img.width;
                    const h = certTemplate.height || img.height;
                    canvas.width = w;
                    canvas.height = h;

                    ctx.drawImage(img, 0, 0, w, h);
                    await document.fonts.ready;

                    const capitalizeText = (text) => {
                        if (!text) return text;
                        return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    };

                    const drawText = (text, style) => {
                        if (!style || !text) return;
                        const weight = style.bold ? 'bold ' : '';
                        const italic = style.italic ? 'italic ' : '';
                        const fontFamily = fontCSSMap[style.fontFamily] || 'Inter, sans-serif';

                        const fontSizePx = style.fontSize?.toString().includes('%')
                            ? (parseFloat(style.fontSize) / 100) * canvas.width
                            : parseFloat(style.fontSize);

                        ctx.font = `${weight}${italic}${fontSizePx}px ${fontFamily}`;
                        ctx.fillStyle = style.textColor || '#000';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const x = style.horizontalPosition?.toString().includes('%')
                            ? (parseFloat(style.horizontalPosition) / 100) * canvas.width
                            : parseFloat(style.horizontalPosition);
                        const y = style.verticalPosition?.toString().includes('%')
                            ? (parseFloat(style.verticalPosition) / 100) * canvas.height
                            : parseFloat(style.verticalPosition);

                        ctx.fillText(text, x, y);
                    };

                    // Draw certificate fields
                    if (certTemplate.studentName?.status !== false) {
                        await ensureFontLoaded(fontCSSMap[certTemplate.studentName?.fontFamily]);
                        drawText(capitalizeText(student.name), certTemplate.studentName);
                    }
                    if (certTemplate.collegeName?.status !== false) {
                        await ensureFontLoaded(fontCSSMap[certTemplate.collegeName?.fontFamily]);
                        drawText(student.college, certTemplate.collegeName);
                    }
                    if (certTemplate.assessmentName?.status !== false) {
                        await ensureFontLoaded(fontCSSMap[certTemplate.assessmentName?.fontFamily]);
                        drawText(assessmentName, certTemplate.assessmentName);
                    }
                    if (certTemplate.date?.status !== false) {
                        await ensureFontLoaded(fontCSSMap[certTemplate.date?.fontFamily]);
                        drawText(new Date().toLocaleDateString(), certTemplate.date);
                    }
                    if (certTemplate.assessmentCode?.status !== false) {
                        await ensureFontLoaded(fontCSSMap[certTemplate.assessmentCode?.fontFamily]);
                        drawText(student.code || "DIGICODERS", certTemplate.assessmentCode);
                    }

                    const blob = await new Promise(resolve => {
                        canvas.toBlob(resolve, 'image/jpeg', 0.75);
                    });

                    const fileName = `${certTemplate.certificateName}_${student.name}`.replace(/\s+/g, '_') + '.jpg';
                    const file = new File([blob], fileName, { type: 'image/jpeg' });

                    // Upload certificate
                    await uploadStudentCertificateApi(student._id, file);

                    // Remove student from updated list after successful regeneration
                    if (isStudentUpdated) {
                        setUpdatedStudents(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(studentItem.studentId);
                            return newSet;
                        });
                    }

                    // Download certificate
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.update(toastId, {
                        render: "Certificate generated and downloaded!",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000
                    });
                } catch (certError) {
                    console.error("Certificate generation error:", certError);
                    toast.update(toastId, {
                        render: certError.message || "Failed to generate certificate",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000
                    });
                }
            } else {
                toast.error("Student not found");
            }
        } catch (error) {
            console.error("Certificate Download Error:", error);
            toast.error("Failed to download certificate. It might not be available.");
        }
    };

    const handleExportData = async () => {
        if (!id) return;
        setExportLoading(true);
        try {
            await downloadResultsByAssessmentIdApi(id, {
                college: filters.college,
                course: filters.course,
                year: filters.year,
                search: searchQuery
            });
            toast.success("Excel results downloaded successfully!");
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Failed to export results");
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium font-inter">Loading assessment results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-teal-600 font-semibold cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Admin</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-teal-600 font-semibold cursor-pointer" onClick={() => navigate(-1)}>Manage Result</span>
                    <span className="text-gray-400">/</span>
                    <div className="text-gray-600">Result Tracking</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 print-content flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-200px)]">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-700 uppercase">Assessment Submissions</h2>
                </div>

                <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print border-b border-gray-200 flex-shrink-0">
                    {/* Left: Export & Top Results Actions */}
                    <div className="w-full xl:w-auto order-2 xl:order-1 flex gap-2">
                        {userRole === 'admin' && (
                            <button
                                onClick={() => setIsOtpModalOpen(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg border border-transparent transition-colors text-sm font-bold shadow-sm justify-center h-[42px]"
                            >
                                <Download className="h-4 w-4" />
                                Export Excel
                            </button>
                        )}
                        <button
                            onClick={() => setIsTopResultsModalOpen(true)}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg border border-transparent transition-colors text-sm font-bold shadow-sm justify-center h-[42px]"
                        >
                            <Trophy className="h-4 w-4" />
                            Top Results
                        </button>
                    </div>

                    {/* Right: Filters & Search */}
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto order-1 xl:order-2">
                        {/* Compact Backend Filters */}
                        <div className="flex items-center bg-zinc-50 border border-gray-300 rounded-xl p-1 gap-0.5 sm:gap-1 shadow-sm w-full md:w-auto overflow-hidden">
                            <input
                                type="text"
                                name="college"
                                value={filters.college}
                                onChange={handleFilterChange}
                                placeholder="College"
                                className="flex-1 min-w-0 md:w-32 bg-transparent border-none px-2 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                            />
                            <div className="h-4 w-[1px] bg-gray-300 shrink-0"></div>
                            <input
                                type="text"
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                                placeholder="Year"
                                className="w-[45px] sm:w-[65px] bg-transparent border-none px-1 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                            />
                            <div className="h-4 w-[1px] bg-gray-300 shrink-0"></div>
                            <input
                                type="text"
                                name="course"
                                value={filters.course}
                                onChange={handleFilterChange}
                                placeholder="Course"
                                className="w-[55px] sm:w-[90px] bg-transparent border-none px-1 py-1.5 text-[11px] sm:text-xs font-semibold focus:ring-0 outline-none text-gray-700 placeholder:text-gray-400"
                            />
                            <div className="h-6 w-[1px] bg-gray-200 mx-0.5 sm:mx-1 shrink-0"></div>
                            <button
                                onClick={resetFilters}
                                className="text-gray-400 hover:text-red-500 p-1.5 sm:p-2 rounded-lg hover:bg-white transition-all active:scale-95 shrink-0"
                                title="Reset Filters"
                            >
                                <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                        </div>

                        <div className="relative w-full md:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10 pr-4 py-2 border bg-zinc-50 border-gray-300 rounded-xl w-full focus:outline-none focus:border-teal-500 transition-colors text-xs sm:text-sm font-medium h-[40px] sm:h-[42px] shadow-sm"
                                placeholder="Name or Mobile"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-4 flex-shrink-0">
                    <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
                        <button
                            onClick={() => {
                                setActiveTab('first');
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all rounded-t-lg whitespace-nowrap ${activeTab === 'first'
                                ? 'border-teal-500 text-white bg-teal-500 shadow-md'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            First Submission ({firstSubmissions.length})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('second');
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all rounded-t-lg whitespace-nowrap ${activeTab === 'second'
                                ? 'border-orange-500 text-white bg-orange-500 shadow-md'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Re-Attempt ({secondSubmissions.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    {tableLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium font-inter">Loading results...</p>
                            </div>
                        </div>
                    ) : getCurrentData().length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {activeTab === 'first' ? 'No First Submissions' : 'No Re-Attempts'}
                                </h3>
                                <p className="text-gray-500 font-inter">
                                    {searchQuery || filters.college || filters.course || filters.year ? 'No matching records found for your filters.' :
                                        activeTab === 'first' ? 'No students have submitted this assessment yet.' :
                                            'No students have re-attempted this assessment.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[1200px]">
                                <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b-2 border-gray-200 font-inter">
                                    <tr>
                                        <th className="px-4 py-3 text-center min-w-[50px] text-xs uppercase tracking-wider">Sr.</th>
                                        {activeTab === 'first' && <th className="px-4 py-3 text-center min-w-[70px] text-xs uppercase tracking-wider">Rank</th>}
                                        <th className="px-4 py-3 min-w-[150px] text-xs uppercase tracking-wider">Student Name</th>
                                        <th className="px-4 py-3 text-center min-w-[60px] text-xs uppercase tracking-wider">View</th>
                                        <th className="px-4 py-3 min-w-[120px] text-xs uppercase tracking-wider">Ref Code</th>
                                        <th className="px-4 py-3 min-w-[140px] text-xs uppercase tracking-wider">Course</th>
                                        <th className="px-4 py-3 text-center min-w-[120px] text-xs uppercase tracking-wider">Year</th>
                                        <th className="px-4 py-3 min-w-[120px] text-xs uppercase tracking-wider">Phone</th>
                                        <th className="px-4 py-3 min-w-[180px] text-xs uppercase tracking-wider">College</th>
                                        <th className="px-4 py-3 text-center min-w-[90px] text-xs uppercase tracking-wider">Score</th>
                                        <th className="px-4 py-3 text-center min-w-[100px] text-xs uppercase tracking-wider">Duration</th>
                                        <th className="px-4 py-3 min-w-[150px] text-xs uppercase tracking-wider">Date/Time</th>
                                        <th className="px-4 py-3 text-center min-w-[70px] text-xs uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {getPaginatedData().map((item, index) => (
                                        <tr key={`${item.id}-${item.submission}`} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{((currentPage - 1) * pagination.limit) + index + 1}</td>
                                            {activeTab === 'first' && (
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' :
                                                        item.rank === 2 ? 'bg-gray-100 text-gray-700 ring-2 ring-gray-200' :
                                                            item.rank === 3 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' :
                                                                'bg-green-50 text-green-700'
                                                        }`}>
                                                        {item.rank}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                                                    {item.name}
                                                </div>
                                                {activeTab === 'second' && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase mt-1">
                                                        Re-Attempt
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleViewStudent(item)}
                                                    className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-100 rounded-lg transition-all active:scale-90"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs font-semibold">
                                                {item.refNo}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-bold border border-blue-100 uppercase">
                                                    {item.course}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded text-xs font-bold border border-purple-100">
                                                    {item.year}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{item.phone}</span>
                                                    {item.phone !== "N/A" && (
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
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="truncate max-w-[200px] text-gray-600 font-medium" title={item.college}>
                                                    {item.college}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-orange-50 text-orange-700 font-extrabold px-3 py-1 rounded-lg text-sm border border-orange-200 shadow-sm">
                                                    {item.marks}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 font-bold text-xs uppercase">
                                                {item.duration}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 font-medium text-xs">
                                                {item.time}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditStudent(item)}
                                                        className="text-teal-600 border border-teal-600 p-1.5 rounded-lg hover:bg-teal-50 transition-all active:scale-90"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => downloadStudentResult(item)}
                                                        className="text-teal-600 hover:text-teal-800 p-1.5 hover:bg-teal-100 rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <div className="font-semibold font-inter">Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} entries</div>
                    <div className="flex gap-2 items-center">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="px-4 py-1.5 rounded-lg border bg-white shadow-sm text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>

                        <div className="flex gap-1.5 items-center">
                            <span className="px-3 py-1.5 bg-teal-500 text-white rounded-lg font-bold text-sm">
                                {currentPage} of {pagination.totalPages}
                            </span>
                        </div>

                        <button
                            disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="px-4 py-1.5 rounded-lg border bg-white shadow-sm text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Edit className="h-5 w-5" /> Edit Student Details
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editingStudent?.name || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={editingStudent?.phone || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">College</label>
                                    <input
                                        type="text"
                                        value={editingStudent?.college || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, college: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course</label>
                                    <input
                                        type="text"
                                        value={editingStudent?.course || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
                                    <input
                                        type="text"
                                        value={editingStudent?.year || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, year: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingStudent?.email || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStudent}
                                disabled={submitting}
                                className={`px-6 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Results Modal */}
            {isTopResultsModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Trophy className="h-5 w-5" /> Top Results Filter</h3>
                            <button onClick={() => setIsTopResultsModalOpen(false)} className="text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">College (Optional)</label>
                                <div className="relative" ref={collegeDropdownRef}>
                                    <button
                                        onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-left focus:outline-none focus:border-[#319795] transition-colors bg-white text-xs sm:text-sm flex items-center justify-between"
                                    >
                                        <span className="truncate">{topFilters.college || 'All Colleges'}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    </button>
                                    {showCollegeDropdown && (
                                        <div className="custom-scrollbar absolute z-20 w-full bg-white shadow-xl border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto">
                                            <div
                                                onClick={() => {
                                                    setTopFilters({...topFilters, college: ''});
                                                    setShowCollegeDropdown(false);
                                                }}
                                                className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm border-b font-medium text-gray-600"
                                            >
                                                All Colleges
                                            </div>
                                            {getUniqueValues('college').map((c) => (
                                                <div
                                                    key={c}
                                                    onClick={() => {
                                                        setTopFilters({...topFilters, college: c});
                                                        setShowCollegeDropdown(false);
                                                    }}
                                                    className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm text-gray-700 border-b border-gray-50 last:border-0 break-words"
                                                >
                                                    {c}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Year (Optional)</label>
                                <div className="relative" ref={yearDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowYearDropdown(!showYearDropdown)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-left focus:outline-none focus:border-[#319795] transition-colors bg-white text-xs sm:text-sm flex items-center justify-between"
                                    >
                                        <span className="truncate">
                                            {topFilters.year.length > 0 ? topFilters.year.join(', ') : 'All Years'}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    </button>
                                    {showYearDropdown && (
                                        <div className="custom-scrollbar absolute z-20 w-full bg-white shadow-xl border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto">
                                            <div
                                                onClick={() => {
                                                    setTopFilters({...topFilters, year: []});
                                                }}
                                                className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm border-b font-bold text-gray-700 flex items-center justify-between"
                                            >
                                                <span>All Years</span>
                                                {topFilters.year.length === 0 && <span className="text-teal-600 font-bold">✓</span>}
                                            </div>
                                            {getUniqueValues('year').map((y) => {
                                                const isSelected = topFilters.year.includes(y);
                                                return (
                                                    <div
                                                        key={y}
                                                        onClick={() => {
                                                            const newYears = isSelected
                                                                ? topFilters.year.filter(val => val !== y)
                                                                : [...topFilters.year, y];
                                                            setTopFilters({...topFilters, year: newYears});
                                                        }}
                                                        className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm text-gray-700 border-b border-gray-50 last:border-0 break-words flex items-center justify-between font-medium"
                                                    >
                                                        <span>{y}</span>
                                                        {isSelected && <span className="text-teal-600 font-bold">✓</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course (Optional)</label>
                                <div className="relative" ref={courseDropdownRef}>
                                    <button
                                        onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-left focus:outline-none focus:border-[#319795] transition-colors bg-white text-xs sm:text-sm flex items-center justify-between"
                                    >
                                        <span className="truncate">{topFilters.course || 'All Courses'}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    </button>
                                    {showCourseDropdown && (
                                        <div className="custom-scrollbar absolute z-20 w-full bg-white shadow-xl border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto">
                                            <div
                                                onClick={() => {
                                                    setTopFilters({...topFilters, course: ''});
                                                    setShowCourseDropdown(false);
                                                }}
                                                className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm border-b font-medium text-gray-600"
                                            >
                                                All Courses
                                            </div>
                                            {getUniqueValues('course').map((c) => (
                                                <div
                                                    key={c}
                                                    onClick={() => {
                                                        setTopFilters({...topFilters, course: c});
                                                        setShowCourseDropdown(false);
                                                    }}
                                                    className="px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-xs sm:text-sm text-gray-700 border-b border-gray-50 last:border-0 break-words"
                                                >
                                                    {c}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Number of Results</label>
                                <input type="number" min="1" value={topFilters.limit} onChange={(e) => setTopFilters({...topFilters, limit: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Enter number" />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setIsTopResultsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleTopResultsSubmit} className="px-6 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all">Show Results</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Results View Modal */}
            {isTopResultsViewOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div id="top-results-modal" className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Trophy className="h-5 w-5 animate-bounce text-yellow-300 fill-yellow-300" /> 
                                Top Segmented Results
                            </h3>
                            <button onClick={() => setIsTopResultsViewOpen(false)} className="text-white/80 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="bg-[#E6FFFA] px-6 py-3 border-b border-[#B2F5EA] flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 text-sm flex-shrink-0">
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <span className="font-bold text-teal-800">Filters:</span>
                                <span className="bg-white px-3 py-1 rounded-lg text-teal-700 font-semibold text-xs sm:text-sm shadow-sm border border-teal-100">
                                    College: {topFilters.college || 'All'}
                                </span>
                                <span className="bg-white px-3 py-1 rounded-lg text-teal-700 font-semibold text-xs sm:text-sm shadow-sm border border-teal-100">
                                    Year: {topFilters.year.length > 0 ? topFilters.year.join(', ') : 'All'}
                                </span>
                                <span className="bg-white px-3 py-1 rounded-lg text-teal-700 font-semibold text-xs sm:text-sm shadow-sm border border-teal-100">
                                    Course: {topFilters.course.length > 0 ? topFilters.course.join(', ') : 'All'}
                                </span>
                            </div>
                            <button 
                                onClick={async () => {
                                    const wrapper = document.createElement('div');
                                    wrapper.style.cssText = 'position:absolute;left:-9999px;background:#fff;padding:25px;width:1200px;';
                                    
                                    let groupsHTML = '';
                                    Object.keys(topResultsData).forEach(groupKey => {
                                        const groupStudents = topResultsData[groupKey] || [];
                                        if (groupStudents.length === 0) return;
                                        
                                        groupsHTML += `
                                            <div style="margin-top: 30px; margin-bottom: 12px; border-bottom: 3px solid #14b8a6; padding-bottom: 8px;">
                                                <h3 style="font-size: 20px; font-weight: 800; color: #0f766e; margin: 0; text-transform: uppercase; font-family: sans-serif; letter-spacing: 0.5px;">🏆 ${groupKey} (Top ${groupStudents.length})</h3>
                                            </div>
                                            <table style="width:100%;border-collapse:collapse;margin-bottom:25px;font-family:sans-serif;box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">
                                                <thead style="background:#E6FFFA;">
                                                    <tr>
                                                        <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">RANK</th>
                                                        <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">STUDENT NAME</th>
                                                        <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">REF CODE</th>
                                                        <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">COURSE</th>
                                                        <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">YEAR</th>
                                                        <th style="padding:14px 10px;text-align:left;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">COLLEGE</th>
                                                        <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">SCORE</th>
                                                        <th style="padding:14px 10px;text-align:center;border:1px solid #B2F5EA;font-size:11px;font-weight:bold;vertical-align:middle;color:#0f766e;text-transform:uppercase;">DURATION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${groupStudents.map((item, index) => `
                                                        <tr style="background:${index % 2 === 0 ? '#fff' : '#f9fafb'};">
                                                            <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;">
                                                                <div style="display:flex;align-items:center;justify-content:center;height:100%;">
                                                                    <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${index === 0 ? '#fef3c7' : index === 1 ? '#f3f4f6' : index === 2 ? '#fed7aa' : '#f0fdfa'};color:${index === 0 ? '#92400e' : index === 1 ? '#374151' : index === 2 ? '#9a3412' : '#0f766e'};font-weight:bold;">${index + 1}</span>
                                                                </div>
                                                            </td>
                                                            <td style="padding:12px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#1e293b;"><div style="display:flex;align-items:center;height:100%;">${item.name}</div></td>
                                                            <td style="padding:12px 10px;border:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#475569;"><div style="display:flex;align-items:center;height:100%;">${item.refNo}</div></td>
                                                            <td style="padding:12px 10px;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;height:100%;"><span style="background:#dbeafe;color:#1e40af;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:bold;display:inline-flex;align-items:center;justify-content:center;text-transform:uppercase;">${item.course}</span></div></td>
                                                            <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#f3e8ff;color:#6b21a8;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:bold;display:inline-flex;align-items:center;justify-content:center;">${item.year}</span></div></td>
                                                            <td style="padding:12px 10px;border:1px solid #e5e7eb;color:#475569;font-weight:500;"><div style="display:flex;align-items:center;height:100%;">${item.college}</div></td>
                                                            <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;"><div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#ccfbf1;color:#0f766e;padding:6px 12px;border-radius:8px;font-weight:extrabold;display:inline-flex;align-items:center;justify-content:center;">${item.marks}</span></div></td>
                                                            <td style="padding:12px 10px;text-align:center;border:1px solid #e5e7eb;font-weight:bold;font-size:11px;color:#475569;"><div style="display:flex;align-items:center;justify-content:center;height:100%;">${item.duration}</div></td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        `;
                                    });

                                    wrapper.innerHTML = `
                                        <div style="background:linear-gradient(135deg, #0d9488, #14b8a6);color:#fff;padding:25px;border-radius:12px 12px 0 0;font-family:sans-serif;box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                            <h2 style="font-size:26px;font-weight:800;margin:0;letter-spacing:0.5px;">🏆 Top Results Report</h2>
                                            <p style="margin:5px 0 0 0; opacity:0.9; font-size:14px;">Generated on ${new Date().toLocaleDateString()}</p>
                                        </div>
                                        <div style="background:#E6FFFA;padding:16px;border-bottom:3px solid #B2F5EA;font-family:sans-serif;display:flex;gap:15px;align-items:center;">
                                            <span style="font-weight:800;color:#115e59;font-size:13px;text-transform:uppercase;">Filters Applied:</span>
                                            <span style="background:#fff;padding:6px 12px;border-radius:8px;color:#0f766e;font-weight:bold;font-size:12px;border:1px solid #B2F5EA;">College: ${topFilters.college || 'All'}</span>
                                            <span style="background:#fff;padding:6px 12px;border-radius:8px;color:#0f766e;font-weight:bold;font-size:12px;border:1px solid #B2F5EA;">Year: ${topFilters.year.length > 0 ? topFilters.year.join(', ') : 'All'}</span>
                                            <span style="background:#fff;padding:6px 12px;border-radius:8px;color:#0f766e;font-weight:bold;font-size:12px;border:1px solid #B2F5EA;">Course: ${topFilters.course.length > 0 ? topFilters.course.join(', ') : 'All'}</span>
                                        </div>
                                        ${groupsHTML}
                                        <div style="text-align:center;padding:15px 0;margin-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;font-family:sans-serif;font-weight:600;">
                                            Assessment Portal • All Rights Reserved
                                        </div>
                                    `;
                                    
                                    document.body.appendChild(wrapper);
                                    
                                    try {
                                        const canvas = await html2canvas(wrapper, {
                                            scale: 2,
                                            backgroundColor: '#ffffff',
                                            useCORS: true
                                        });
                                        document.body.removeChild(wrapper);
                                        
                                        canvas.toBlob(blob => {
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Top_Results_${new Date().getTime()}.png`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                            toast.success('Downloaded successfully!');
                                        });
                                    } catch (error) {
                                        if (wrapper.parentNode) document.body.removeChild(wrapper);
                                        console.error('Download error:', error);
                                        toast.error('Failed to download');
                                    }
                                }} 
                                className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Download className="h-4 w-4" /> Download Report
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 space-y-8">
                            {Object.keys(topResultsData).length === 0 || Object.values(topResultsData).every(arr => arr.length === 0) ? (
                                <div className="flex items-center justify-center py-20 bg-white border border-gray-150 rounded-2xl">
                                    <div className="text-center">
                                        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-gray-700 mb-2">No Results Found</h3>
                                        <p className="text-gray-400 text-sm font-medium">No matching results for the selected combination.</p>
                                    </div>
                                </div>
                            ) : (
                                Object.keys(topResultsData).map(groupKey => {
                                    const groupStudents = topResultsData[groupKey] || [];
                                    if (groupStudents.length === 0) return null;

                                    const cardId = `group-card-${groupKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                    return (
                                        <div key={groupKey} id={cardId} className="border border-teal-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all hover:shadow-md">
                                            <div className="bg-gradient-to-r from-teal-50/70 to-[#E6FFFA]/50 px-5 py-3.5 border-b border-teal-100 flex items-center justify-between">
                                                <span className="font-extrabold text-teal-800 tracking-wide text-sm flex items-center gap-2 uppercase">
                                                    <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-400" />
                                                    {groupKey}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-teal-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm">
                                                        Top {groupStudents.length} Students
                                                    </span>
                                                    <button
                                                        onClick={() => downloadSingleGroupImage(groupKey)}
                                                        data-html2canvas-ignore="true"
                                                        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Download className="h-3.5 w-3.5" /> Download Image
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-[#f8fafc] text-gray-600 font-bold border-b border-gray-200 text-xs uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-3.5 text-center min-w-[60px]">Rank</th>
                                                            <th className="px-4 py-3.5 min-w-[160px]">Student Name</th>
                                                            <th className="px-4 py-3.5 min-w-[120px]">Ref Code</th>
                                                            <th className="px-4 py-3.5 min-w-[120px]">Course</th>
                                                            <th className="px-4 py-3.5 text-center min-w-[85px]">Year</th>
                                                            <th className="px-4 py-3.5 min-w-[180px]">College</th>
                                                            <th className="px-4 py-3.5 text-center min-w-[95px]">Score</th>
                                                            <th className="px-4 py-3.5 text-center min-w-[100px]">Duration</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                        {groupStudents.map((item, index) => (
                                                            <tr key={item.id} className="hover:bg-teal-50/20 transition-colors">
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold ${
                                                                        index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' :
                                                                        index === 1 ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-200' :
                                                                        index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' :
                                                                        'bg-teal-50 text-teal-700'
                                                                    }`}>
                                                                        {index + 1}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 font-bold text-gray-900">{item.name}</td>
                                                                <td className="px-4 py-3.5 text-gray-600 font-mono text-xs font-semibold">{item.refNo}</td>
                                                                <td className="px-4 py-3.5">
                                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100 uppercase">
                                                                        {item.course}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-100">
                                                                        {item.year}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <div className="truncate max-w-[200px] text-gray-600 font-medium" title={item.college}>
                                                                        {item.college}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <span className="bg-teal-50 text-teal-700 font-extrabold px-3 py-1 rounded-lg text-sm border border-teal-200 shadow-sm">
                                                                        {item.marks}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center text-gray-600 font-bold text-xs uppercase">
                                                                    {item.duration}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <OtpVerificationModal
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onVerified={handleExportData}
            />
        </div>
    );
}