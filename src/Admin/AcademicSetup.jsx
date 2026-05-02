import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GraduationCap, Calendar, BookOpen, Loader2, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getAllCollegesApi, createCollegeApi, updateCollegeApi, deleteCollegeApi } from '../API/college';
import { getAcademicYearsApi, createAcademicYearApi, updateAcademicYearApi, deleteAcademicYearApi } from '../API/year';
import { getCoursesApi, createCourseApi, updateCourseApi, deleteCourseApi } from '../API/course';

export default function AcademicSetup() {
    const [activeTab, setActiveTab] = useState('colleges');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ collegeName: '', academicYear: '', course: '', location: '' });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [colleges, setColleges] = useState([]);
    const [years, setYears] = useState([]);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery('');
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [collegeRes, yearRes, courseRes] = await Promise.all([
                getAllCollegesApi(),
                getAcademicYearsApi(),
                getCoursesApi()
            ]);

            if (collegeRes.success) setColleges(collegeRes.colleges || []);
            if (yearRes.success) setYears(yearRes.data || yearRes.years || []);
            if (courseRes.success) setCourses(courseRes.data || courseRes.courses || []);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load academic data");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'colleges', label: 'Colleges', mobileLabel: 'Colleges', icon: GraduationCap, count: colleges.length },
        { id: 'years', label: 'Academic Years', mobileLabel: 'Years', icon: Calendar, count: years.length },
        { id: 'courses', label: 'Courses', mobileLabel: 'Courses', icon: BookOpen, count: courses.length }
    ];

    const handleAdd = (type) => {
        setEditingItem(null);
        setFormData({ collegeName: '', academicYear: '', course: '', location: '' });
        setActiveTab(type);
        setIsModalOpen(true);
    };

    const handleEdit = (item, type) => {
        setEditingItem({ ...item, type });
        if (type === 'colleges') setFormData({ collegeName: item.collegeName, location: item.location });
        if (type === 'years') setFormData({ academicYear: item.academicYear });
        if (type === 'courses') setFormData({ course: item.course });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            if (activeTab === 'colleges') {
                if (!formData.collegeName || !formData.location) {
                    toast.error('College name and location are required!');
                    setSubmitting(false);
                    return;
                }
                const payload = { collegeName: formData.collegeName, location: formData.location };
                if (editingItem) {
                    await updateCollegeApi(editingItem._id, payload);
                    toast.success('College updated successfully');
                } else {
                    await createCollegeApi(payload);
                    toast.success('College added successfully');
                }
            }

            if (activeTab === 'years') {
                if (!formData.academicYear) {
                    toast.error('Academic year is required!');
                    setSubmitting(false);
                    return;
                }
                const payload = { academicYear: formData.academicYear };
                if (editingItem) {
                    await updateAcademicYearApi(editingItem._id, payload);
                    toast.success('Academic year updated successfully');
                } else {
                    await createAcademicYearApi(payload);
                    toast.success('Academic year added successfully');
                }
            }

            if (activeTab === 'courses') {
                if (!formData.course) {
                    toast.error('Course name is required!');
                    setSubmitting(false);
                    return;
                }
                const payload = { course: formData.course };
                if (editingItem) {
                    await updateCourseApi(editingItem._id, payload);
                    toast.success('Course updated successfully');
                } else {
                    await createCourseApi(payload);
                    toast.success('Course added successfully');
                }
            }

            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        let data = [];
        let filename = '';

        if (activeTab === 'colleges') {
            data = colleges.map((c, i) => ({ '#': i + 1, 'College Name': c.collegeName, 'Location': c.location }));
            filename = 'Colleges';
        } else if (activeTab === 'years') {
            data = years.map((y, i) => ({ '#': i + 1, 'Academic Year': y.academicYear }));
            filename = 'Academic_Years';
        } else {
            data = courses.map((c, i) => ({ '#': i + 1, 'Course Name': c.course }));
            filename = 'Courses';
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, filename);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const handleDelete = (id, type) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#319795',
            cancelButtonColor: '#f56565',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    if (type === 'colleges') await deleteCollegeApi(id);
                    if (type === 'years') await deleteAcademicYearApi(id);
                    if (type === 'courses') await deleteCourseApi(id);
                    toast.success('Deleted successfully');
                    await fetchData();
                } catch (error) {
                    toast.error("Delete failed");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const renderPagination = (totalItems) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border border-gray-200 mt-6 gap-4">
                <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#319795]"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-medium text-sm">
                        {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#319795]"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        let filteredData = [];
        let dataToRender = [];

        if (activeTab === 'colleges') {
            filteredData = colleges.filter(college => 
                college.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                college.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
            dataToRender = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            return (
                <div className="space-y-4">
                    {dataToRender.length > 0 ? (
                        <>
                            {dataToRender.map((college, index) => (
                                <div key={college._id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#E6FFFA] text-[#319795] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{college.collegeName}</h3>
                                            <p className="text-sm text-gray-500">{college.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(college, 'colleges')} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(college._id, 'colleges')} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {renderPagination(filteredData.length)}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500 italic">No colleges found</div>
                    )}
                </div>
            );
        }

        if (activeTab === 'years') {
            filteredData = years.filter(year => 
                year.academicYear.toLowerCase().includes(searchQuery.toLowerCase())
            );
            dataToRender = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            return (
                <div className="space-y-4">
                    {dataToRender.length > 0 ? (
                        <>
                            {dataToRender.map((year, index) => (
                                <div key={year._id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#E6FFFA] text-[#319795] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{year.academicYear}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(year, 'years')} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(year._id, 'years')} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {renderPagination(filteredData.length)}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500 italic">No academic years found</div>
                    )}
                </div>
            );
        }

        if (activeTab === 'courses') {
            filteredData = courses.filter(course => 
                course.course.toLowerCase().includes(searchQuery.toLowerCase())
            );
            dataToRender = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            return (
                <div className="space-y-4">
                    {dataToRender.length > 0 ? (
                        <>
                            {dataToRender.map((course, index) => (
                                <div key={course._id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#E6FFFA] text-[#319795] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{course.course}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(course, 'courses')} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(course._id, 'courses')} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {renderPagination(filteredData.length)}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500 italic">No courses found</div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className="p-6 bg-[#F7FAFC] min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Academic Setup</h1>
                <p className="text-gray-600">Manage colleges, academic years, and courses</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-white text-[#319795] shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.mobileLabel}</span>
                                <span className="bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Add Button and Search */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAdd(activeTab)}
                        className="flex items-center gap-2 bg-[#319795] hover:bg-[#2B7A73] text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add {activeTab === 'colleges' ? 'College' : activeTab === 'years' ? 'Academic Year' : 'Course'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Export Excel
                    </button>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder={`Search ${activeTab === 'colleges' ? 'college name or location' : activeTab === 'years' ? 'academic year' : 'course name'}...`}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#319795] transition-colors text-sm bg-white"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                    <p className="text-gray-500 font-medium">Loading setup data...</p>
                </div>
            ) : renderContent()}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {editingItem ? 'Edit' : 'Add'} {activeTab === 'colleges' ? 'College' : activeTab === 'years' ? 'Academic Year' : 'Course'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'colleges' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                                            <input
                                                type="text"
                                                value={formData.collegeName || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                                    setFormData({ ...formData, collegeName: val });
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#319795] outline-none"
                                                placeholder="Enter college name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                                    setFormData({ ...formData, location: val });
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#319795] outline-none"
                                                placeholder="Enter location"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'years' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                        <input
                                            type="text"
                                            value={formData.academicYear || ''}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#319795] outline-none"
                                            placeholder="Select Year"
                                        />
                                    </div>
                                )}

                                {activeTab === 'courses' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                                        <input
                                            type="text"
                                            value={formData.course || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, course: val });
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#319795] outline-none"
                                            placeholder="Enter course name"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className={`flex-1 px-4 py-2 ${submitting ? 'bg-[#319795]/70 cursor-not-allowed' : 'bg-[#319795] hover:bg-[#2B7A73]'} text-white rounded-lg flex items-center justify-center gap-2 transition-all`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}