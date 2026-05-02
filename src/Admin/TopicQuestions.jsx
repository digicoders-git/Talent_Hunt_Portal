import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, X, FileSpreadsheet, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { createQuestionsApi, getQuestionsByTopicApi, deleteQuestionApi, updateQuestionApi, importQuestionsFromExcelApi, exportQuestionsByTopicApi } from '../API/question';
import { getAllTopicsApi } from '../API/topic';
import { getCoursesApi } from '../API/course';
import { getAcademicYearsApi } from '../API/year';

export default function TopicQuestions() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [topicName, setTopicName] = useState(location.state?.topicName || 'Loading...');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [courses, setCourses] = useState([]);
    const [years, setYears] = useState([]);
    const [filterCourse, setFilterCourse] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    const formatTopicName = (name) => {
        if (!name) return '';
        return name.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    useEffect(() => {
        fetchQuestions();
        if (!location.state?.topicName) {
            fetchTopicName();
        }
        fetchCoursesAndYears();
    }, [topicId]);

    const fetchCoursesAndYears = async () => {
        try {
            const [cRes, yRes] = await Promise.all([getCoursesApi(), getAcademicYearsApi()]);
            if (cRes.success) setCourses(cRes.courses || []);
            if (yRes.success) setYears(yRes.years || []);
        } catch (error) {
            console.error('Failed to fetch courses/years:', error);
        }
    };

    const fetchTopicName = async () => {
        try {
            const response = await getAllTopicsApi();
            if (response.success && response.topics) {
                const topic = response.topics.find(t => t._id === topicId);
                if (topic) {
                    setTopicName(topic.topicName);
                }
            }
        } catch (error) {
            console.error("Failed to fetch topic name:", error);
            setTopicName('Topic Questions');
        }
    };

    const fetchQuestions = async (courseId = filterCourse, yearId = filterYear) => {
        try {
            setLoading(true);
            const response = await getQuestionsByTopicApi(topicId, courseId, yearId);
            setQuestions(response.questions || []);
            if (response.topicName && !location.state?.topicName) {
                setTopicName(response.topicName);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch questions');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const initialFormState = {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        answer: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [multipleQuestions, setMultipleQuestions] = useState([{ ...initialFormState, id: Date.now() }]);

    const handleDownloadSample = () => {
        const sampleData = [
            {
                question: "What is React?",
                optionA: "A JavaScript library",
                optionB: "A database",
                optionC: "A programming language",
                optionD: "An operating system",
                correctOption: "A"
            },
            {
                question: "Which hook is used for state management?",
                optionA: "useEffect",
                optionB: "useState",
                optionC: "useContext",
                optionD: "useReducer",
                correctOption: "B"
            }
        ];

        // Create proper Excel format with tab separation
        const headers = "question\toptionA\toptionB\toptionC\toptionD\tcorrectOption\n";
        const csvContent = sampleData.map(q =>
            `${q.question}\t${q.optionA}\t${q.optionB}\t${q.optionC}\t${q.optionD}\t${q.correctOption}`
        ).join('\n');

        const blob = new Blob([headers + csvContent], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_questions_template.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Sample Excel template downloaded!");
    };

    const handleOpenAdd = () => {
        setEditingQuestion(null);
        setFormData(initialFormState);
        setMultipleQuestions([{ ...initialFormState, id: Date.now() }]);
        setIsAddModalOpen(true);
    };

    const handleExportExcel = async () => {
        setSubmitting(true);
        try {
            const response = await exportQuestionsByTopicApi(topicId, filterCourse, filterYear);

            // Create a blob from the response data
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use topic name for filename or default
            const fileName = `${topicName || 'questions'}_export.xlsx`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Questions exported successfully!");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export questions. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (q) => {
        setEditingQuestion(q);
        setFormData({
            question: q.question,
            optionA: q.options?.A || '',
            optionB: q.options?.B || '',
            optionC: q.options?.C || '',
            optionD: q.options?.D || '',
            correctOption: q.correctOption
        });
        setIsAddModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingQuestion && (!selectedCourse || !selectedYear)) {
            toast.error('Please select Course and Year before adding questions!');
            return;
        }
        if (editingQuestion) {
            // Validate all fields for single edit
            if (!formData.question.trim() || !formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() || !formData.optionD.trim() || !formData.correctOption) {
                toast.error("Please fill all fields including all 4 options!");
                return;
            }
            setSubmitting(true);
            try {
                const payload = {
                    question: formData.question,
                    options: {
                        A: formData.optionA,
                        B: formData.optionB,
                        C: formData.optionC,
                        D: formData.optionD
                    },
                    correctOption: formData.correctOption
                };
                const response = await updateQuestionApi(editingQuestion._id, payload);
                toast.success(response.message);
                setIsAddModalOpen(false);
                fetchQuestions();
                window.dispatchEvent(new Event('dashboardUpdated'));
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to update question');
            } finally {
                setSubmitting(false);
            }
        } else {
            const validQuestions = multipleQuestions.filter((q) => {
                const isValid = q.question.trim() &&
                    q.optionA.trim() &&
                    q.optionB.trim() &&
                    q.optionC.trim() &&
                    q.optionD.trim() &&
                    ['A', 'B', 'C', 'D'].includes(q.answer);

                if (!isValid) {
                    // Check specifically what is missing to give better feedback if needed, 
                    // but for now we just filter and track if any are invalid
                }
                return isValid;
            });

            if (validQuestions.length !== multipleQuestions.length) {
                toast.error("Please fill all required fields (Question, All Options, and Correct Answer) for all forms!");
                return;
            }

            setSubmitting(true);
            try {
                const questionsData = validQuestions.map(q => ({
                    question: q.question,
                    options: {
                        A: q.optionA,
                        B: q.optionB,
                        C: q.optionC,
                        D: q.optionD
                    },
                    correctOption: q.answer
                }));

                const response = await createQuestionsApi(topicId, { questions: questionsData, courseId: selectedCourse, yearId: selectedYear });
                toast.success(response.message);
                setIsAddModalOpen(false);
                fetchQuestions();
                window.dispatchEvent(new Event('dashboardUpdated'));
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to create questions');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const addNewQuestionForm = () => {
        setMultipleQuestions([...multipleQuestions, { ...initialFormState, id: Date.now() + Math.random() }]);
    };

    const removeQuestionForm = (id) => {
        if (multipleQuestions.length > 1) {
            setMultipleQuestions(multipleQuestions.filter(q => q.id !== id));
        }
    };

    const updateMultipleQuestion = (id, field, value) => {
        setMultipleQuestions(multipleQuestions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#319795",
            cancelButtonColor: "#f56565",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await deleteQuestionApi(id);
                    toast.success(response.message);
                    fetchQuestions();
                    window.dispatchEvent(new Event('dashboardUpdated'));
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete question');
                }
            }
        });
    };

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!selectedCourse || !selectedYear) {
            toast.error('Please select Course and Year before importing!');
            e.target.value = '';
            return;
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            toast.error("Please upload only Excel files (.xlsx, .xls)!");
            e.target.value = '';
            return;
        }

        setSubmitting(true);
        try {
            const response = await importQuestionsFromExcelApi(topicId, file, selectedCourse, selectedYear);
            toast.success(`${response.message}. Imported: ${response.insertedCount}, Failed: ${response.failedCount}`);
            if (response.failedCount > 0 && response.failedRows.length > 0) {
                console.log('Failed rows:', response.failedRows);
            }
            setIsGuidanceOpen(false);
            fetchQuestions();
            window.dispatchEvent(new Event('dashboardUpdated'));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import questions');
        } finally {
            setSubmitting(false);
        }
        e.target.value = '';
    };

    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-3 sm:p-6 bg-[#EDF2F7] min-h-screen">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/admin/topics')}
                        className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                        <button onClick={() => navigate('/admin/topics')} className="text-[#319795] hover:underline">Topics</button>
                        <span>/</span>
                        <span className="text-gray-700">{formatTopicName(topicName)}</span>
                    </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{formatTopicName(topicName)} Questions</h1>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); fetchQuestions(e.target.value, filterYear); setCurrentPage(1); }}
                        className="border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                        <option value="">All Courses</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.course}</option>)}
                    </select>
                    <select value={filterYear} onChange={e => { setFilterYear(e.target.value); fetchQuestions(filterCourse, e.target.value); setCurrentPage(1); }}
                        className="border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                        <option value="">All Years</option>
                        {years.map(y => <option key={y._id} value={y._id}>{y.academicYear}</option>)}
                    </select>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                        onClick={() => setIsGuidanceOpen(true)}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="hidden sm:inline">Import Excel</span>
                        <span className="sm:hidden">Import</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={submitting}
                        className={`flex items-center gap-2 ${submitting ? 'bg-green-600/70 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-all`}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        <span className="hidden sm:inline">{submitting ? 'Exporting...' : 'Export Excel'}</span>
                        <span className="sm:hidden">{submitting ? 'Exp...' : 'Export'}</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-[#319795] hover:bg-[#2B7A73] text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Question</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="bg-zinc-100 border border-gray-300 rounded px-3 py-2 w-full sm:w-64"
                />
            </div>

            {/* Desktop Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                    <p className="text-gray-500 font-medium font-inter">Loading questions...</p>
                </div>
            ) : (
                <>
                    <div className="hidden lg:block bg-white rounded-lg overflow-auto max-h-[70vh]">
                        <table className="w-full min-w-[1400px]">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">Sr.</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Course</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">Year</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[250px]">Question</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">Option A</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">Option B</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">Option C</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">Option D</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">Answer</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedQuestions.map((q, index) => (
                                    <tr key={q._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.course?.course || 'N/A'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.year?.academicYear || 'N/A'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-900">{q.question}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.options?.A}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.options?.B}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.options?.C}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{q.options?.D}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                {q.correctOption}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(q)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                        {paginatedQuestions.map((q, index) => (
                            <div key={q._id} className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-sm font-medium text-gray-500">Q{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(q)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q._id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <div>A) {q.options?.A}</div>
                                        <div>B) {q.options?.B}</div>
                                        <div>C) {q.options?.C}</div>
                                        <div>D) {q.options?.D}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Correct Answer:</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                        {q.correctOption}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border border-gray-200 gap-4">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-medium">{paginatedQuestions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</span> of <span className="font-medium">{filteredQuestions.length}</span> questions
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${currentPage === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'}`}
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-bold transition-all ${currentPage === page ? 'bg-[#319795] text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )
            }

            {/* Add/Edit Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6 border-b">
                                <h3 className="text-lg font-semibold">
                                    {editingQuestion ? 'Edit Question' : 'Add New Questions'}
                                </h3>
                            </div>
                            <div className="p-4 sm:p-6">
                                {!editingQuestion && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div>
                                            <label className="block text-sm font-semibold text-blue-800 mb-1">Course <span className="text-red-500">*</span></label>
                                            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                                                <option value="">Select Course</option>
                                                {courses.map(c => <option key={c._id} value={c._id}>{c.course}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-blue-800 mb-1">Year <span className="text-red-500">*</span></label>
                                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                                                <option value="">Select Year</option>
                                                {years.map(y => <option key={y._id} value={y._id}>{y.academicYear}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {editingQuestion ? (
                                    // Single question edit form
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                                            <textarea
                                                value={formData.question}
                                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                placeholder="Enter question..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                                                <input
                                                    type="text"
                                                    value={formData.optionA}
                                                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Option A..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                                                <input
                                                    type="text"
                                                    value={formData.optionB}
                                                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Option B..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Option C *</label>
                                                <input
                                                    type="text"
                                                    value={formData.optionC}
                                                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Option C..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Option D *</label>
                                                <input
                                                    type="text"
                                                    value={formData.optionD}
                                                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Option D..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answer</label>
                                            <div className="flex gap-4">
                                                {['A', 'B', 'C', 'D'].map((option) => (
                                                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="answer"
                                                            value={option}
                                                            checked={formData.correctOption === option}
                                                            onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                                                            className="w-4 h-4 text-[#319795] focus:ring-[#319795]"
                                                        />
                                                        <span className="text-sm font-medium">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {multipleQuestions.map((questionForm, index) => (
                                            <div key={questionForm.id} className="border border-gray-200 rounded-lg p-4 relative">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-medium text-gray-700">Question {index + 1}</h4>
                                                    {multipleQuestions.length > 1 && (
                                                        <button
                                                            onClick={() => removeQuestionForm(questionForm.id)}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                                                        <textarea
                                                            value={questionForm.question}
                                                            onChange={(e) => updateMultipleQuestion(questionForm.id, 'question', e.target.value)}
                                                            rows="2"
                                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                            placeholder="Enter question..."
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Option A *</label>
                                                            <input
                                                                type="text"
                                                                value={questionForm.optionA}
                                                                onChange={(e) => updateMultipleQuestion(questionForm.id, 'optionA', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                                placeholder="Option A..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Option B *</label>
                                                            <input
                                                                type="text"
                                                                value={questionForm.optionB}
                                                                onChange={(e) => updateMultipleQuestion(questionForm.id, 'optionB', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                                placeholder="Option B..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Option C *</label>
                                                            <input
                                                                type="text"
                                                                value={questionForm.optionC}
                                                                onChange={(e) => updateMultipleQuestion(questionForm.id, 'optionC', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                                placeholder="Option C..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Option D *</label>
                                                            <input
                                                                type="text"
                                                                value={questionForm.optionD}
                                                                onChange={(e) => updateMultipleQuestion(questionForm.id, 'optionD', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                                placeholder="Option D..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answer *</label>
                                                        <div className="flex gap-4">
                                                            {['A', 'B', 'C', 'D'].map((option) => (
                                                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`answer_${questionForm.id}`}
                                                                        value={option}
                                                                        checked={questionForm.answer === option}
                                                                        onChange={(e) => updateMultipleQuestion(questionForm.id, 'answer', e.target.value)}
                                                                        className="w-4 h-4 text-[#319795] focus:ring-[#319795]"
                                                                    />
                                                                    <span className="text-sm font-medium">{option}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 order-3 sm:order-1"
                                >
                                    Cancel
                                </button>
                                {!editingQuestion && (
                                    <button
                                        onClick={addNewQuestionForm}
                                        className="flex items-center gap-2 bg-[#319795] hover:bg-[#2B7A73] text-white px-3 py-1.5 rounded text-sm order-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Another
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className={`bg-[#319795] ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#2B7A73]'} text-white px-4 py-2 rounded order-1 sm:order-2 flex items-center justify-center gap-2`}
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingQuestion ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Saving...' : `Save  Question(s)`)}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Import Modal */}
            {
                isGuidanceOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6 border-b">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Import Questions</h3>
                                    <button onClick={() => setIsGuidanceOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Required Format:</h4>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <p>• Excel file (.xlsx, .xls)</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div>
                                        <label className="block text-sm font-semibold text-yellow-800 mb-1">Course <span className="text-red-500">*</span></label>
                                        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                                            <option value="">Select Course</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.course}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-yellow-800 mb-1">Year <span className="text-red-500">*</span></label>
                                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                                            <option value="">Select Year</option>
                                            {years.map(y => <option key={y._id} value={y._id}>{y.academicYear}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownloadSample}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-2"
                                    >
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Download Excel Sample
                                    </button>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Choose Excel File to Import:
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleImportFile}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 flex justify-end">
                                <button
                                    onClick={() => setIsGuidanceOpen(false)}
                                    className="px-2 py-1 border-2 rounded-xl text-red-400 hover:text-red-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}