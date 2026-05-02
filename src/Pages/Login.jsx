import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Phone, GraduationCap, Calendar, BookOpen, Key, Sparkles, ArrowRight, ChevronDown, Search, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAcademicDataApi, studentRegisterApi, existStudentApi, uploadStudentCertificateApi } from '../API/student';
import { getAssessmentByCodeApi } from '../API/assesmentQuestions';
import { getAssessmentByStatusApi } from '../API/assesment';
import { getSingleCertificateApi } from '../API/certificate';

export default function DigiCodersPortal() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        college: '',
        year: '',
        course: '',
        code: '',
    });

    const [collegeSearch, setCollegeSearch] = useState('');
    const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
    const collegeDropdownRef = useRef(null);

    const [yearSearch, setYearSearch] = useState('');
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const yearDropdownRef = useRef(null);

    const [courseSearch, setCourseSearch] = useState('');
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const courseDropdownRef = useRef(null);

    const [academicData, setAcademicData] = useState({
        colleges: [],
        years: [],
        courses: []
    });
    const [loadingAcademic, setLoadingAcademic] = useState(true);

    useEffect(() => {
        const fetchAcademicData = async () => {
            try {
                const response = await getAcademicDataApi();
                if (response.success) {
                    setAcademicData({
                        colleges: response.colleges || [],
                        years: response.years || [],
                        courses: response.course || []
                    });
                }
            } catch (error) {
                console.error("Failed to fetch academic data:", error);
                toast.error("Failed to load college and course data");
            } finally {
                setLoadingAcademic(false);
            }
        };
        fetchAcademicData();
    }, []);

    const digi = "{Coders}"
    const navigate = useNavigate();
    const { code, certId, assessmentCode } = useParams();
    const [certTemplate, setCertTemplate] = useState(null);
    const [fetchingCert, setFetchingCert] = useState(false);
    const [certNotFound, setCertNotFound] = useState(false);

    const [focusedField, setFocusedField] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(null); // { days, hours, minutes, seconds, startTime }
    const countdownRef = useRef(null);

    useEffect(() => {
        return () => clearInterval(countdownRef.current);
    }, []);

    useEffect(() => {
        const fetchCertificateTemplate = async () => {
            if (certId) {
                setFetchingCert(true);
                setCertNotFound(false);
                try {
                    const response = await getSingleCertificateApi(certId);
                    const template = response?.certificate || (response?._id ? response : null);
                    if (template) {
                        setCertTemplate(template);
                    } else {
                        toast.error("No certificate found for this link");
                        setCertNotFound(true);
                    }
                } catch (error) {
                    console.error("Certificate fetch error:", error);
                    toast.error("No certificate found for this link");
                    setCertNotFound(true);
                } finally {
                    setFetchingCert(false);
                }
            }
        };
        fetchCertificateTemplate();
    }, [certId, assessmentCode]);

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

    useEffect(() => {
        // Auto-fill assessment code from URL parameter without validation
        if (code) {
            setFormData(prev => ({ ...prev, code: code }));
        }
        // Auto-fill assessment code from certificate URL
        if (assessmentCode) {
            setFormData(prev => ({ ...prev, code: assessmentCode }));
        }
    }, [code, assessmentCode]);

    // Check for existing student when mobile number is valid
    useEffect(() => {
        const checkExistingStudent = async () => {
            const mobile = formData.mobile;
            // Validate: 10 digits and starts with 6, 7, 8, or 9
            if (/^[6-9]\d{9}$/.test(mobile)) {
                try {
                    const response = await existStudentApi({ mobile });
                    if (response.success && response.existMobile) {
                        const student = response.existMobile;

                        // Show welcome message
                        Swal.fire({
                            title: `Welcome ${student.name}`,
                            text: 'Welcome to DigiCoders!',
                            icon: 'success',
                            timer: 3000,
                            showConfirmButton: false,
                            toast: true,
                            position: 'top-end',
                            background: '#fff',
                            color: '#0D9488'
                        });

                        // Auto-fill form data
                        setFormData(prev => ({
                            ...prev,
                            name: student.name || prev.name,
                            email: student.email || prev.email,
                            college: student.college || prev.college,
                            year: student.year || prev.year,
                            course: student.course || prev.course
                            // Do not auto-fill code as per request
                        }));
                    }
                } catch (error) {
                    // console.log("New student or error checking mobile:", error);
                    // No action needed specifically for failure/new student as per requirements
                }
            }
        };

        if (formData.mobile) {
            checkExistingStudent();
        }
    }, [formData.mobile]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validation for Mobile: Only numbers
        if (name === 'mobile') {
            if (value.length > 10) return;
            if (!/^\d*$/.test(value)) return;
        }

        // Validation for Name: Only alphabets and spaces
        if (name === 'name') {
            if (!/^[a-zA-Z\s]*$/.test(value)) return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleCollegeSelect = (college) => {
        setFormData({ ...formData, college });
        setCollegeSearch('');
        setShowCollegeDropdown(false);
    };

    const handleYearSelect = (year) => {
        setFormData({ ...formData, year });
        setYearSearch('');
        setShowYearDropdown(false);
    };

    const handleCourseSelect = (course) => {
        setFormData({ ...formData, course });
        setCourseSearch('');
        setShowCourseDropdown(false);
    };

    const filteredColleges = (academicData.colleges || []).filter(item =>
        item.collegeName?.toLowerCase().includes(collegeSearch.toLowerCase())
    );

    const filteredYears = (academicData.years || []).filter(item =>
        item.academicYear?.toLowerCase().includes(yearSearch.toLowerCase())
    );

    const filteredCourses = (academicData.courses || []).filter(item =>
        item.course?.toLowerCase().includes(courseSearch.toLowerCase())
    ).sort((a, b) => a.course.localeCompare(b.course));

    const handleSubmit = async () => {
        // Helper function for alerting and focusing
        const alertAndFocus = (message, fieldName) => {
            Swal.fire({
                title: 'Missing Input!',
                text: message,
                icon: 'warning',
                confirmButtonColor: '#0D9488',
            }).then(() => {
                const field = document.getElementsByName(fieldName)[0];
                if (field) field.focus();
            });
        };

        // Name validation
        if (!formData.name.trim()) return alertAndFocus('Please enter your Full Name.', 'name');
        if (formData.name.trim().length < 2) {
            Swal.fire({
                title: 'Invalid Name!',
                text: 'Name must be at least 2 characters long.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // Email validation
        if (!formData.email.trim()) return alertAndFocus('Please enter your Email Address.', 'email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Swal.fire({
                title: 'Invalid Email!',
                text: 'Please enter a valid email address.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // Mobile validation
        if (!formData.mobile.trim()) return alertAndFocus('Please enter your Mobile Number.', 'mobile');
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(formData.mobile)) {
            Swal.fire({
                title: 'Invalid Mobile!',
                text: 'Mobile number must be 10 digits and start with 6, 7, 8, or 9.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // College validation
        if (!formData.college.trim()) return alertAndFocus('Please select your College.', 'college');
        const collegeExists = academicData.colleges.some(c => c.collegeName === formData.college);
        if (!collegeExists) {
            Swal.fire({
                title: 'Invalid College!',
                text: 'Please select a college from the dropdown list.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // Year validation
        if (!formData.year.trim()) return alertAndFocus('Please select your Current Year.', 'year');
        const yearExists = academicData.years.some(y => y.academicYear === formData.year);
        if (!yearExists) {
            Swal.fire({
                title: 'Invalid Year!',
                text: 'Please select a year from the dropdown list.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // Course validation
        if (!formData.course.trim()) return alertAndFocus('Please select your Course.', 'course');
        const courseExists = academicData.courses.some(c => c.course === formData.course);
        if (!courseExists) {
            Swal.fire({
                title: 'Invalid Course!',
                text: 'Please select a course from the dropdown list.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
            return;
        }

        // If it's a certificate flow, handle it differently
        if (certId) {
            if (certNotFound) {
                toast.error("Process blocked: Invalid certificate link");
                return;
            }
            setSubmitting(true);
            const statusToastId = toast.loading("Generating your certificate...");
            try {
                // 1. Register or find student (using the existing studentRegisterApi logic but for certificate only)
                // Since this flow doesn't have an assessment code, we might need a dedicated API or just skip the assessment check.
                // However, the user said "normal jaise create hota h student vaise ho hi hoga".
                // I will use a dummy/special code if needed, but let's see if we can just create student.

                const registerPayload = {
                    ...formData,
                    code: formData.code.toUpperCase().trim() || certTemplate.certificateName
                };

                const regResponse = await studentRegisterApi(registerPayload);
                if (!regResponse.success) {
                    throw new Error(regResponse.message || "Registration failed");
                }

                const studentData = regResponse.newStudent;

                // Get assessment data for certificate
                let assessmentName = "Certificate Course";
                if (assessmentCode) {
                    try {
                        const assessmentResponse = await getAssessmentByStatusApi(true);
                        if (assessmentResponse.success && assessmentResponse.assessments) {
                            const matchingAssessment = assessmentResponse.assessments.find(
                                assessment => assessment.assessmentCode === assessmentCode
                            );
                            if (matchingAssessment) {
                                assessmentName = matchingAssessment.assessmentName || "Certificate Course";
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch assessment data:", error);
                    }
                }

                // 2. Generate Certificate
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = certTemplate.certificateImage;

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

                // Function to capitalize text (first letter of each word)
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

                // Draw fields
                if (certTemplate.studentName?.status !== false) {
                    await ensureFontLoaded(fontCSSMap[certTemplate.studentName?.fontFamily]);
                    drawText(capitalizeText(studentData.name), certTemplate.studentName);
                }
                if (certTemplate.collegeName?.status !== false) {
                    await ensureFontLoaded(fontCSSMap[certTemplate.collegeName?.fontFamily]);
                    drawText(studentData.college, certTemplate.collegeName);
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
                    drawText(studentData.code || "DIGICODERS", certTemplate.assessmentCode);
                }

                const blob = await new Promise(resolve => {
                    canvas.toBlob(
                        resolve,
                        'image/jpeg',
                        0.75
                    );
                });

                const fileName =
                    `${certTemplate.certificateName}_${studentData.name}`.replace(/\s+/g, '_') + '.jpg';

                const file = new File([blob], fileName, { type: 'image/jpeg' });

                // upload
                await uploadStudentCertificateApi(studentData._id, file);

                // download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);


                toast.update(statusToastId, { render: "Certificate generated and downloaded!", type: "success", isLoading: false, autoClose: 3000 });

                // Clear Form
                setFormData({
                    name: '', email: '', mobile: '', college: '', year: '', course: '', code: ''
                });

            } catch (err) {
                console.error("Certificate flow error:", err);
                toast.update(statusToastId, { render: err.message || "Failed to process certificate", type: "error", isLoading: false, autoClose: 3000 });
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // API Integration
        setSubmitting(true);
        try {
            // First validate assessment details
            const enteredCode = formData.code.toUpperCase().trim();
            const startCheckResponse = await getAssessmentByCodeApi(enteredCode);

            if (!startCheckResponse.success || !startCheckResponse.data) {
                Swal.fire({
                    title: 'Assessment Not Found!',
                    text: 'The assessment code provided is invalid.',
                    icon: 'error',
                    confirmButtonColor: '#0D9488',
                });
                setSubmitting(false);
                return;
            }

            // Access nested assessment details object (handling 'assesmentId' key from populated response)
            // Fallback to data itself if not nested (safety check)
            const assessmentData = startCheckResponse.data.assesmentId || startCheckResponse.data;

            if (!assessmentData) {
                Swal.fire({ title: 'Error!', text: 'Assessment data is missing or malformed.', icon: 'error', confirmButtonColor: '#0D9488' });
                setSubmitting(false);
                return;
            }

            const { startDateTime, endDateTime, status } = assessmentData;

            // Check allowed years
            const allowedYears = assessmentData?.allowedYears || [];
            if (allowedYears.length > 0) {
                const studentYearName = formData.year;
                const isAllowed = allowedYears.some(y =>
                    (y.academicYear || y) === studentYearName
                );
                if (!isAllowed) {
                    const allowedNames = allowedYears.map(y => y.academicYear || y).join(', ');
                    Swal.fire({
                        title: '\uD83D\uDEAB This Test is Not For You!',
                        html: `<p>This assessment is only for: <b>${allowedNames}</b></p><p>Your year: <b>${studentYearName}</b></p>`,
                        icon: 'error',
                        confirmButtonColor: '#0D9488',
                        confirmButtonText: 'OK'
                    });
                    setSubmitting(false);
                    return;
                }
            }
            const now = new Date();

            // Helper to parse "DD/MM/YYYY, HH:mm:ss"
            const parseAssessmentDate = (dateStr) => {
                if (!dateStr) return new Date();
                try {
                    // Check if it's in a format with comma like "06/01/2026, 11:20:00"
                    if (dateStr.includes(',')) {
                        const [datePart, timePart] = dateStr.split(',').map(s => s.trim());
                        // STRICTLY DD/MM/YYYY format based on Jan 6th being "06/01"
                        const [dayStr, monthStr, yearStr] = datePart.split('/');
                        const [hours, minutes, seconds] = timePart.split(':').map(Number);

                        const day = parseInt(dayStr, 10);
                        const month = parseInt(monthStr, 10);
                        const year = parseInt(yearStr, 10);

                        if (day && month && year) {
                            return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
                        }
                    }
                    // Fallback to standard parsing
                    return new Date(dateStr);
                } catch (e) {
                    console.error("Date parsing error:", e);
                    return new Date(dateStr);
                }
            };

            const start = parseAssessmentDate(startDateTime);
            const end = parseAssessmentDate(endDateTime);

            if (!status) {
                Swal.fire({
                    title: 'Assessment Inactive!',
                    text: 'This assessment is currently not active.',
                    icon: 'warning',
                    confirmButtonColor: '#0D9488',
                });
                setSubmitting(false);
                return;
            }

            if (now < start) {
                // Start countdown
                const tick = () => {
                    const remaining = new Date(start) - new Date();
                    if (remaining <= 0) {
                        clearInterval(countdownRef.current);
                        setCountdown(null);
                        // Play start sound
                        const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
                        audio.play().catch(() => {});
                        return;
                    }
                    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    setCountdown({ days, hours, minutes, seconds, startTime: start });
                };
                tick();
                clearInterval(countdownRef.current);
                countdownRef.current = setInterval(tick, 1000);
                // Play tick sound every second
                const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA==');
                beep.play().catch(() => {});
                setSubmitting(false);
                return;
            }

            if (now > end) {
                Swal.fire({
                    title: 'Assessment Ended!',
                    text: `This assessment ended at ${end.toLocaleString()}`,
                    icon: 'error',
                    confirmButtonColor: '#0D9488',
                });
                setSubmitting(false);
                return;
            }

            // Ensure assessment code is uppercase when sent to backend
            const payload = {
                ...formData,
                code: enteredCode
            };
            const response = await studentRegisterApi(payload);
            if (response.success) {
                // Store student data in localStorage for persistence
                const studentData = {
                    name: response.newStudent.name,
                    mobile: response.newStudent.mobile,
                    email: response.newStudent.email,
                    college: response.newStudent.college,
                    year: response.newStudent.year,
                    course: response.newStudent.course,
                    code: response.newStudent.code,
                    id: response.newStudent._id,
                    submissionDate: response.newStudent.createdAt,
                    isLoggedIn: true
                };

                // Save course and year for question filtering
                const courseObj = academicData.courses.find(c => c.course === formData.course);
                const yearObj = academicData.years.find(y => y.academicYear === formData.year);
                localStorage.setItem('studentCourse', courseObj?._id || formData.course);
                localStorage.setItem('studentYear', yearObj?._id || formData.year);

                Swal.fire({
                    title: 'Registration Successful!',
                    text: response.message || 'Starting Assessment...',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#FFFFFF',
                    color: '#2D3748'
                });

                setTimeout(() => {
                    navigate(`/assessment/${studentData.code}/${studentData.id}`);
                }, 1500);
            } else {
                Swal.fire({
                    title: 'Registration Failed!',
                    text: response.message || 'Something went wrong',
                    icon: 'error',
                    confirmButtonColor: '#0D9488',
                });
            }
        } catch (error) {
            console.error('Registration error:', error);
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.message || 'An error occurred during registration. Please check your assessment code or try again.',
                icon: 'error',
                confirmButtonColor: '#0D9488',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden">




            {/* Main Container */}
            <div className="relative w-full max-w-4xl z-10 transition-all duration-300">
                {fetchingCert && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                        <div className="w-12 h-12 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[#0D9488] font-bold">Validating Certificate Link...</p>
                    </div>
                )}
                {/* Top Sparkle Effect */}
                <div className="flex justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[#0D9488] animate-pulse" />
                </div>

                {/* Countdown Overlay */}
                {countdown && (
                    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0D9488] to-[#115E59] flex flex-col items-center justify-center p-6">
                        <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mb-6 shadow-lg">
                            <img src="/talenthunt.png" alt="TalentHunt" className="h-20 w-20 object-contain rounded-full" />
                        </div>
                        <h1 className="text-white text-2xl md:text-4xl font-black text-center mb-2">Talent Hunt Scholarship Test</h1>
                        <p className="text-teal-200 text-sm md:text-base mb-8 text-center">Starting on {countdown.startTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {countdown.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        <div className="flex gap-4 md:gap-8">
                            {countdown.days > 0 && (
                                <div className="bg-white/20 backdrop-blur rounded-2xl p-4 md:p-6 text-center min-w-[70px] md:min-w-[100px]">
                                    <p className="text-white text-3xl md:text-5xl font-black">{String(countdown.days).padStart(2,'0')}</p>
                                    <p className="text-teal-200 text-xs md:text-sm font-bold uppercase mt-1">Days</p>
                                </div>
                            )}
                            <div className="bg-white/20 backdrop-blur rounded-2xl p-4 md:p-6 text-center min-w-[70px] md:min-w-[100px]">
                                <p className="text-white text-3xl md:text-5xl font-black">{String(countdown.hours).padStart(2,'0')}</p>
                                <p className="text-teal-200 text-xs md:text-sm font-bold uppercase mt-1">Hours</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-2xl p-4 md:p-6 text-center min-w-[70px] md:min-w-[100px]">
                                <p className="text-white text-3xl md:text-5xl font-black">{String(countdown.minutes).padStart(2,'0')}</p>
                                <p className="text-teal-200 text-xs md:text-sm font-bold uppercase mt-1">Minutes</p>
                            </div>
                            <div className={`bg-white/20 backdrop-blur rounded-2xl p-4 md:p-6 text-center min-w-[70px] md:min-w-[100px] ${countdown.seconds % 2 === 0 ? 'bg-white/30' : ''}`}>
                                <p className="text-white text-3xl md:text-5xl font-black">{String(countdown.seconds).padStart(2,'0')}</p>
                                <p className="text-teal-200 text-xs md:text-sm font-bold uppercase mt-1">Seconds</p>
                            </div>
                        </div>
                        <p className="text-teal-100 mt-8 text-sm animate-pulse">🎯 Get ready! Fill your details and submit when test starts.</p>
                        <button
                            onClick={() => { clearInterval(countdownRef.current); setCountdown(null); }}
                            className="mt-6 text-teal-200 underline text-sm"
                        >Go back to form</button>
                    </div>
                )}

                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200">
                    {/* Header Section with Animated Background */}
                    {/* Header Section with Animated Background */}
                    <div className="relative px-6 py-8 overflow-hidden">


                        {/* Content */}
                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center mb-4">

                                {/* CLEAN CONTAINER */}
                                <div className="bg-white px-4 py-3 rounded-2xl flex items-center gap-4">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-2 border-gray-100 shadow flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/talenthunt.png"
                                            alt="TalentHunt Logo"
                                            className="h-20 md:h-28 w-20 md:w-28 object-contain rounded-full"
                                        />
                                    </div>
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-2 border-gray-100 shadow flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/digicoders-logo-circle.png"
                                            alt="DigiCoders Logo"
                                            className="h-20 md:h-28 w-20 md:w-28 object-contain mix-blend-darken"
                                        />
                                    </div>
                                </div>

                            </div>

                            <h1 className="text-2xl md:text-5xl font-black text-[#1F2937] mb-4">
                                Talent Hunt Scholarship Test
                            </h1>

                            <div className="flex items-center justify-center gap-2">
                                <div className="w-8 md:w-12 h-[2px] bg-[#0D9488]" />
                                <p className="text-sm md:text-lg font-medium text-[#115E59]">
                                    Welcome! Let's get you started
                                </p>
                                <div className="w-8 md:w-12 h-[2px] bg-[#0D9488]" />
                            </div>
                        </div>



                    </div>

                    {/* Form Section */}
                    <div className="p-8 md:p-12 bg-transparent">
                        <div className="space-y-6">
                            {/* Row 1: Name and Mobile */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="flex items-center text-sm font-bold text-black mb-3">

                                        MOBILE NUMBER <span className="text-pink-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        disabled={certNotFound}
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('mobile')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="10 Digit Mobile Number"
                                        maxLength="10"
                                        className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'mobile' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="group">
                                    <label className="flex items-center text-sm font-bold text-black mb-3">
                                        YOUR NAME <span className="text-pink-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        disabled={certNotFound}
                                        value={formData.name}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Enter Your Full Name"
                                        className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'name' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Email */}
                            <div className="group">
                                <label className="flex items-center text-sm font-bold text-black mb-3">
                                    EMAIL ADDRESS <span className="text-pink-500 ml-1">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    disabled={certNotFound}
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter Your Email Address"
                                    className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'email' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>

                            {/* Row 3: College Name */}
                            <div className="group" ref={collegeDropdownRef}>
                                <label className="flex items-center text-sm font-bold text-black mb-3">
                                    COLLEGE NAME <span className="text-pink-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        disabled={certNotFound}
                                        value={formData.college}
                                        onClick={() => !certNotFound && setShowCollegeDropdown(true)}
                                        onFocus={() => {
                                            if (!certNotFound) {
                                                setFocusedField('college');
                                                setShowCollegeDropdown(true);
                                            }
                                        }}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Choose College"
                                        className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'college' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <ChevronDown
                                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showCollegeDropdown ? 'rotate-180' : ''}`}
                                        onClick={() => !certNotFound && setShowCollegeDropdown(!showCollegeDropdown)}
                                    />

                                    {showCollegeDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                            {/* Internal Search */}
                                            <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={collegeSearch}
                                                        onChange={(e) => setCollegeSearch(e.target.value)}
                                                        placeholder="Search college..."
                                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-y-auto max-h-52 custom-scrollbar">
                                                {filteredColleges.length > 0 ? (
                                                    filteredColleges.map((item, index) => (
                                                        <div
                                                            key={item._id || index}
                                                            onClick={() => handleCollegeSelect(item.collegeName)}
                                                            className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                                        >
                                                            {item.collegeName}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                                        No colleges found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 4: Year and Course */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="group" ref={yearDropdownRef}>
                                    <label className="flex items-center text-sm font-bold text-black mb-3">
                                        CURRENT YEAR <span className="text-pink-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            disabled={certNotFound}
                                            value={formData.year}
                                            onClick={() => !certNotFound && setShowYearDropdown(true)}
                                            onFocus={() => {
                                                if (!certNotFound) {
                                                    setFocusedField('year');
                                                    setShowYearDropdown(true);
                                                }
                                            }}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Choose Year"
                                            className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'year' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        <ChevronDown
                                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
                                            onClick={() => setShowYearDropdown(!showYearDropdown)}
                                        />

                                        {showYearDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                                {/* Internal Search */}
                                                <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={yearSearch}
                                                            onChange={(e) => setYearSearch(e.target.value)}
                                                            placeholder="Search year..."
                                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="overflow-y-auto max-h-52 custom-scrollbar">
                                                    {filteredYears.length > 0 ? (
                                                        filteredYears.map((item, index) => (
                                                            <div
                                                                key={item._id || index}
                                                                onClick={() => handleYearSelect(item.academicYear)}
                                                                className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                                            >
                                                                {item.academicYear}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                                            No years found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="group" ref={courseDropdownRef}>
                                    <label className="flex items-center text-sm font-bold text-black mb-3">
                                        COURSE <span className="text-pink-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            disabled={certNotFound}
                                            value={formData.course}
                                            onClick={() => !certNotFound && setShowCourseDropdown(true)}
                                            onFocus={() => {
                                                if (!certNotFound) {
                                                    setFocusedField('course');
                                                    setShowCourseDropdown(true);
                                                }
                                            }}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Choose Course"
                                            className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'course' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer ${certNotFound ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        <ChevronDown
                                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showCourseDropdown ? 'rotate-180' : ''}`}
                                            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                        />

                                        {showCourseDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                                {/* Internal Search */}
                                                <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={courseSearch}
                                                            onChange={(e) => setCourseSearch(e.target.value)}
                                                            placeholder="Search course..."
                                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="overflow-y-auto max-h-52 custom-scrollbar">
                                                    {filteredCourses.length > 0 ? (
                                                        filteredCourses.map((item, index) => (
                                                            <div
                                                                key={item._id || index}
                                                                onClick={() => handleCourseSelect(item.course)}
                                                                className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                                            >
                                                                {item.course}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                                            No courses found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>



                            <div className="group">
                                <label className="flex items-center text-sm font-bold text-black mb-3">

                                    ASSESSMENT CODE <span className="text-pink-500 ml-1">*</span>
                                    <span className="ml-2 md:ml-3 text-[8px] md:text-[10px] bg-slate-800 text-white px-2 py-1 rounded-full font-semibold border border-slate-700">PROVIDED BY TEAM</span>
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('code')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="ENTER CODE"
                                    className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'code' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-center font-mono text-lg md:text-xl tracking-[0.3em] md:tracking-[0.5em] uppercase font-bold`}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`group relative w-full ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0D9488] hover:bg-[#115E59]'} text-white font-black py-2 px-4 md:py-3 md:px-6 rounded-2xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base md:text-lg mt-5 md:mt-6 overflow-hidden`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {certId ? 'PROCESSING...' : 'REGISTERING...'}
                                        </>
                                    ) : (
                                        <>
                                            {certNotFound ? 'INVALID LINK' : (certId ? 'SUBMIT' : 'START ASSESSMENT')}
                                            {!certNotFound && <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
                                        </>
                                    )}
                                </span>
                            </button>

                            {/* Info Text */}
                            <div className="text-center pt-4">
                                <p className="text-gray-500 text-sm">🔒 Your information is secure and encrypted</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 space-y-2">
                    <p className="text-gray-500 text-sm">© 2026 DigiCoders. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}