import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, X, Loader2, Filter, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { createTopicApi, getAllTopicsApi, updateTopicApi, deleteTopicApi, toggleTopicStatusApi } from '../API/topic';

export function ManageTopics() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [topicName, setTopicName] = useState('');
    const [topics, setTopics] = useState([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterRef = React.useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState(location.state?.status || 'Active');
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTopics();

        if (location.state?.status) {
            setStatusFilter(location.state.status);
            setCurrentPage(1);
        }

        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const response = await getAllTopicsApi();
            const topicsData = response.topics;
            setTopics(Array.isArray(topicsData) ? topicsData : []);
        } catch (error) {
            toast.error('Failed to fetch topics');
            setTopics([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTopics = Array.isArray(topics) ? topics.filter(topic => {
        const matchesSearch = topic.topicName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'Active' ? topic.status === true : topic.status === false;
        return matchesSearch && matchesStatus;
    }) : [];

    const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
    const paginatedTopics = filteredTopics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSubmit = async () => {
        if (topicName.trim()) {
            setSubmitting(true);
            try {
                if (editingTopic) {
                    await updateTopicApi(editingTopic._id, { topicName });
                    toast.success("Topic Updated Successfully!");
                } else {
                    await createTopicApi({ topicName });
                    toast.success("Topic Added Successfully!");
                }
                setTopicName('');
                setEditingTopic(null);
                setIsDialogOpen(false);
                fetchTopics();
                window.dispatchEvent(new Event('dashboardUpdated'));
            } catch (error) {
                toast.error(editingTopic ? 'Failed to update topic' : 'Failed to add topic');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleToggleStatus = async (topic) => {
        try {
            const response = await toggleTopicStatusApi(topic._id);
            toast.success(response.message);
            fetchTopics();
            window.dispatchEvent(new Event('dashboardUpdated'));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleEdit = (topic) => {
        setEditingTopic(topic);
        setTopicName(topic.topicName);
        setIsDialogOpen(true);
    };

    const handleDelete = async (topic) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to delete "${topic.topicName}" topic?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteTopicApi(topic._id);
                toast.success('Topic and related questions deleted successfully!');
                fetchTopics();
                window.dispatchEvent(new Event('dashboardUpdated'));
            } catch (error) {
                toast.error('Failed to delete topic');
            }
        }
    };

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#319795] font-semibold">Topics</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-700">Manage Topics</span>
                </div>
            </div>

            {/* Add Topic Button and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        setTopicName('');
                        setEditingTopic(null);
                        setIsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#319795] hover:bg-[#2B7A73] text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    <Plus className="h-5 w-5" />
                    Add Topic
                </button>

                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    {/* Custom Premium Filter Dropdown */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 transition-all duration-300 font-bold text-xs sm:text-sm shadow-sm cursor-pointer whitespace-nowrap
                                ${statusFilter === 'Active'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'}`}
                        >
                            <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Status: {statusFilter}</span>
                            <span className="sm:hidden">{statusFilter}</span>
                            <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => {
                                        setStatusFilter('Active');
                                        setCurrentPage(1);
                                        setIsFilterDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer
                                        ${statusFilter === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <CheckCircle2 className={`h-4 w-4 ${statusFilter === 'Active' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                    Active Topics
                                </button>
                                <button
                                    onClick={() => {
                                        setStatusFilter('Inactive');
                                        setCurrentPage(1);
                                        setIsFilterDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer
                                        ${statusFilter === 'Inactive' ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <XCircle className={`h-4 w-4 ${statusFilter === 'Inactive' ? 'text-rose-500' : 'text-gray-400'}`} />
                                    Inactive Topics
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-lg px-2 sm:px-3 py-0.5 focus-within:border-[#319795] transition-all shadow-sm flex-1 sm:flex-initial">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Find topics..."
                            className="bg-transparent py-2 w-full sm:w-48 focus:outline-none text-xs sm:text-sm font-medium text-gray-700"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium font-inter">Loading topics...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="bg-[#E6FFFA] border-b border-[#B2F5EA]">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]">Sr.No.</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]">Topic Name</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]">Add Question</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTopics.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <p className="text-lg font-bold">No {statusFilter} Topics Found</p>
                                                    <p className="text-sm">Try adjusting your search or filter</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTopics.map((topic, index) => (
                                            <tr key={topic._id} className="border-b border-gray-100 hover:bg-[#E6FFFA] transition-colors">
                                                <td className="px-6 py-4 text-[#2D3748]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={topic.status}
                                                            onChange={() => handleToggleStatus(topic)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#319795]"></div>
                                                    </label>
                                                </td>
                                                <td className="px-6 py-4 text-[#2D3748]">{topic.topicName}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/admin/topic-questions/${topic._id}`, { state: { topicName: topic.topicName } })}
                                                        className="bg-[#319795] hover:bg-[#2B7A73] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                                                    >
                                                        Questions ({topic.questionCout || 0})
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => navigate(`/admin/print/${topic._id}`, { state: { topicName: topic.topicName } })}
                                                            className="text-[#319795] hover:text-[#2B7A73] border border-[#319795] hover:border-[#2B7A73] px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
                                                        >
                                                            Print
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(topic)}
                                                            className="text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 p-1.5 rounded transition-colors cursor-pointer"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(topic)}
                                                            className="text-red-600 hover:text-red-700 border border-red-600 hover:border-red-700 p-1.5 rounded transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                            <div>
                                Showing {filteredTopics.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTopics.length)} of {filteredTopics.length} entries
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-[#319795] font-medium cursor-pointer'}`}
                                >
                                    Previous
                                </button>

                                <span className="px-3 py-1.5 bg-[#319795] text-white rounded font-medium">
                                    {currentPage}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`px-3 py-1.5 rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-[#319795] font-medium cursor-pointer'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Topic Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-lg max-w-md w-full transform transition-all scale-100">
                        <div className="flex items-center justify-between px-6 py-4 bg-[#319795] text-white rounded-t-lg">
                            <h3 className="text-xl font-semibold">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="text-white hover:text-gray-200 transition-colors cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Topic Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={topicName}
                                onChange={(e) => setTopicName(e.target.value)}
                                placeholder="Topic Name"
                                className="w-full border border-gray-300 rounded px-4 py-2.5 focus:outline-none focus:border-[#319795] transition-colors"
                                autoFocus
                            />
                        </div>
                        <div className="px-6 pb-6">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`w-full ${submitting ? 'bg-[#319795]/70 cursor-not-allowed' : 'bg-[#319795] hover:bg-[#2B7A73] cursor-pointer'} text-white py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="inline-block w-5 h-5 bg-white rounded-full flex items-center justify-center text-[#319795] text-xs">✓</span>
                                        Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}