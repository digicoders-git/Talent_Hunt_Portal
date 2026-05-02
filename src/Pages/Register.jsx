import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Calendar, BookOpen, Sparkles, ArrowRight, ChevronDown, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAcademicDataApi, studentRegisterApi } from '../API/student';
import { getAssessmentByCodeApi } from '../API/assesmentQuestions';

export default function Register() {
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

    const [academicData, setAcademicData] = useState({ colleges: [], years: [], courses: [] });
    const [loadingAcademic, setLoadingAcademic] = useState(true);
    const [focusedField, setFocusedField] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const { code } = useParams();

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
                toast.error("Failed to load college and course data");
            } finally {
                setLoadingAcademic(false);
            }
        };
        fetchAcademicData();
    }, []);

    useEffect(() => {
        if (code) setFormData(prev => ({ ...prev, code }));
    }, [code]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target)) setShowCollegeDropdown(false);
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) setShowYearDropdown(false);
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) setShowCourseDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name' && !/^[a-zA-Z\s]*$/.test(value)) return;
        setFormData({ ...formData, [name]: value });
    };

    const filteredColleges = academicData.colleges.filter(item =>
        item.collegeName?.toLowerCase().includes(collegeSearch.toLowerCase())
    );
    const filteredYears = academicData.years.filter(item =>
        item.academicYear?.toLowerCase().includes(yearSearch.toLowerCase())
    );
    const filteredCourses = academicData.courses.filter(item =>
        item.course?.toLowerCase().includes(courseSearch.toLowerCase())
    ).sort((a, b) => a.course.localeCompare(b.course));

    const handleSubmit = async () => {
        const alertAndFocus = (message, fieldName) => {
            Swal.fire({ title: 'Missing Input!', text: message, icon: 'warning', confirmButtonColor: '#0D9488' })
                .then(() => { const field = document.getElementsByName(fieldName)[0]; if (field) field.focus(); });
        };

        if (!formData.name.trim()) return alertAndFocus('Please enter your Full Name.', 'name');
        if (formData.name.trim().length < 2) {
            Swal.fire({ title: 'Invalid Name!', text: 'Name must be at least 2 characters long.', icon: 'error', confirmButtonColor: '#0D9488' });
            return;
        }
        if (!formData.college.trim()) return alertAndFocus('Please select your College.', 'college');
        if (!academicData.colleges.some(c => c.collegeName === formData.college)) {
            Swal.fire({ title: 'Invalid College!', text: 'Please select a college from the dropdown list.', icon: 'error', confirmButtonColor: '#0D9488' });
            return;
        }
        if (!formData.year.trim()) return alertAndFocus('Please select your Current Year.', 'year');
        if (!academicData.years.some(y => y.academicYear === formData.year)) {
            Swal.fire({ title: 'Invalid Year!', text: 'Please select a year from the dropdown list.', icon: 'error', confirmButtonColor: '#0D9488' });
            return;
        }
        if (!formData.course.trim()) return alertAndFocus('Please select your Course.', 'course');
        if (!academicData.courses.some(c => c.course === formData.course)) {
            Swal.fire({ title: 'Invalid Course!', text: 'Please select a course from the dropdown list.', icon: 'error', confirmButtonColor: '#0D9488' });
            return;
        }

        setSubmitting(true);
        try {
            const enteredCode = formData.code.toUpperCase().trim();
            const startCheckResponse = await getAssessmentByCodeApi(enteredCode);

            if (!startCheckResponse.success || !startCheckResponse.data) {
                Swal.fire({ title: 'Assessment Not Found!', text: 'The assessment code provided is invalid.', icon: 'error', confirmButtonColor: '#0D9488' });
                setSubmitting(false);
                return;
            }

            const assessmentData = startCheckResponse.data.assesmentId || startCheckResponse.data;
            const { startDateTime, endDateTime, status } = assessmentData;
            const now = new Date();

            const parseAssessmentDate = (dateStr) => {
                if (!dateStr) return new Date();
                try {
                    if (dateStr.includes(',')) {
                        const [datePart, timePart] = dateStr.split(',').map(s => s.trim());
                        const [dayStr, monthStr, yearStr] = datePart.split('/');
                        const [hours, minutes, seconds] = timePart.split(':').map(Number);
                        const day = parseInt(dayStr, 10), month = parseInt(monthStr, 10), year = parseInt(yearStr, 10);
                        if (day && month && year) return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
                    }
                    return new Date(dateStr);
                } catch (e) { return new Date(dateStr); }
            };

            const start = parseAssessmentDate(startDateTime);
            const end = parseAssessmentDate(endDateTime);

            if (!status) {
                Swal.fire({ title: 'Assessment Inactive!', text: 'This assessment is currently not active.', icon: 'warning', confirmButtonColor: '#0D9488' });
                setSubmitting(false); return;
            }
            if (now < start) {
                Swal.fire({ title: 'Assessment Not Started!', text: `Please wait. Assessment will start at ${start.toLocaleString()}`, icon: 'info', confirmButtonColor: '#0D9488' });
                setSubmitting(false); return;
            }
            if (now > end) {
                Swal.fire({ title: 'Assessment Ended!', text: `This assessment ended at ${end.toLocaleString()}`, icon: 'error', confirmButtonColor: '#0D9488' });
                setSubmitting(false); return;
            }

            const response = await studentRegisterApi({ ...formData, code: enteredCode });
            if (response.success) {
                const studentData = response.newStudent;
                localStorage.setItem('studentCourse', academicData.courses.find(c => c.course === formData.course)?._id || formData.course);
                localStorage.setItem('studentYear', academicData.years.find(y => y.academicYear === formData.year)?._id || formData.year);
                Swal.fire({ title: 'Registration Successful!', text: response.message || 'Starting Assessment...', icon: 'success', timer: 1500, showConfirmButton: false });
                setTimeout(() => navigate(`/assessment/${studentData.code}/${studentData._id}`), 1500);
            } else {
                Swal.fire({ title: 'Registration Failed!', text: response.message || 'Something went wrong', icon: 'error', confirmButtonColor: '#0D9488' });
            }
        } catch (error) {
            Swal.fire({ title: 'Error!', text: error.response?.data?.message || 'An error occurred during registration.', icon: 'error', confirmButtonColor: '#0D9488' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="relative w-full max-w-4xl z-10 transition-all duration-300">
                <div className="flex justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[#0D9488] animate-pulse" />
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200">
                    {/* Header */}
                    <div className="relative px-6 py-8 overflow-hidden">
                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center mb-4">
                                <div className="bg-white px-4 py-3 rounded-2xl flex items-center gap-3">
                                    <img src="/talenthunt.png" alt="TalentHunt Logo" className="h-24 md:h-32 w-auto object-contain" />
                                    <img src="/digicoders-logo-circle.png" alt="DigiCoders Logo" className="h-24 md:h-32 w-auto object-contain mix-blend-darken" />
                                </div>
                            </div>
                            <h1 className="text-2xl md:text-5xl font-black text-[#1F2937] mb-4">Talent Hunt Scholarship Test</h1>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-8 md:w-12 h-[2px] bg-[#0D9488]" />
                                <p className="text-sm md:text-lg font-medium text-[#115E59]">Welcome! Let's get you started</p>
                                <div className="w-8 md:w-12 h-[2px] bg-[#0D9488]" />
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 md:p-12 bg-transparent">
                        <div className="space-y-6">
                            {/* Name */}
                            <div className="group">
                                <label className="flex items-center text-sm font-bold text-black mb-3">
                                    YOUR NAME <span className="text-pink-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter Your Full Name"
                                    className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'name' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base`}
                                />
                            </div>

                            {/* College */}
                            <div className="group" ref={collegeDropdownRef}>
                                <label className="flex items-center text-sm font-bold text-black mb-3">
                                    COLLEGE NAME <span className="text-pink-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={formData.college}
                                        onClick={() => setShowCollegeDropdown(true)}
                                        onFocus={() => { setFocusedField('college'); setShowCollegeDropdown(true); }}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Choose College"
                                        className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'college' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer`}
                                    />
                                    <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showCollegeDropdown ? 'rotate-180' : ''}`} onClick={() => setShowCollegeDropdown(!showCollegeDropdown)} />
                                    {showCollegeDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="text" value={collegeSearch} onChange={(e) => setCollegeSearch(e.target.value)} placeholder="Search college..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white" onClick={(e) => e.stopPropagation()} />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto max-h-52">
                                                {filteredColleges.length > 0 ? filteredColleges.map((item, index) => (
                                                    <div key={item._id || index} onClick={() => { setFormData({ ...formData, college: item.collegeName }); setCollegeSearch(''); setShowCollegeDropdown(false); }} className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors">
                                                        {item.collegeName}
                                                    </div>
                                                )) : <div className="px-4 py-3 text-gray-500 text-sm text-center">No colleges found</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Year and Course */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="group" ref={yearDropdownRef}>
                                    <label className="flex items-center text-sm font-bold text-black mb-3">
                                        CURRENT YEAR <span className="text-pink-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <input type="text" readOnly value={formData.year} onClick={() => setShowYearDropdown(true)} onFocus={() => { setFocusedField('year'); setShowYearDropdown(true); }} onBlur={() => setFocusedField(null)} placeholder="Choose Year"
                                            className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'year' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer`}
                                        />
                                        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} onClick={() => setShowYearDropdown(!showYearDropdown)} />
                                        {showYearDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input type="text" value={yearSearch} onChange={(e) => setYearSearch(e.target.value)} placeholder="Search year..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white" onClick={(e) => e.stopPropagation()} />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-52">
                                                    {filteredYears.length > 0 ? filteredYears.map((item, index) => (
                                                        <div key={item._id || index} onClick={() => { setFormData({ ...formData, year: item.academicYear }); setYearSearch(''); setShowYearDropdown(false); }} className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors">
                                                            {item.academicYear}
                                                        </div>
                                                    )) : <div className="px-4 py-3 text-gray-500 text-sm text-center">No years found</div>}
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
                                        <input type="text" readOnly value={formData.course} onClick={() => setShowCourseDropdown(true)} onFocus={() => { setFocusedField('course'); setShowCourseDropdown(true); }} onBlur={() => setFocusedField(null)} placeholder="Choose Course"
                                            className={`w-full px-4 py-2 md:px-4 md:py-3 bg-gray-50 border-2 ${focusedField === 'course' ? 'border-[#0D9488]' : 'border-gray-200'} rounded-2xl text-[#1F2937] placeholder-gray-400 focus:outline-none transition-all duration-300 hover:border-gray-300 text-sm md:text-base pr-10 cursor-pointer`}
                                        />
                                        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showCourseDropdown ? 'rotate-180' : ''}`} onClick={() => setShowCourseDropdown(!showCourseDropdown)} />
                                        {showCourseDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-68 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-20">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input type="text" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} placeholder="Search course..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D9488] bg-white" onClick={(e) => e.stopPropagation()} />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-52">
                                                    {filteredCourses.length > 0 ? filteredCourses.map((item, index) => (
                                                        <div key={item._id || index} onClick={() => { setFormData({ ...formData, course: item.course }); setCourseSearch(''); setShowCourseDropdown(false); }} className="px-4 py-3 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors">
                                                            {item.course}
                                                        </div>
                                                    )) : <div className="px-4 py-3 text-gray-500 text-sm text-center">No courses found</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Code */}
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

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`group relative w-full ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0D9488] hover:bg-[#115E59]'} text-white font-black py-2 px-4 md:py-3 md:px-6 rounded-2xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base md:text-lg mt-5 md:mt-6 overflow-hidden`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {submitting ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>REGISTERING...</>
                                    ) : (
                                        <>START ASSESSMENT <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" /></>
                                    )}
                                </span>
                            </button>

                            <div className="text-center pt-4">
                                <p className="text-gray-500 text-sm">🔒 Your information is secure and encrypted</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 space-y-2">
                    <p className="text-gray-500 text-sm">© 2026 DigiCoders. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
