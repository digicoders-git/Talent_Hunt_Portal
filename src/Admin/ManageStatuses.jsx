import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Loader2, RefreshCw, Tag, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStatusesApi, createStatusApi, deleteStatusApi } from '../API/status';

export default function ManageStatuses() {
    const navigate = useNavigate();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [newStatusName, setNewStatusName] = useState('');

    const fetchStatuses = async () => {
        setLoading(true);
        try {
            const response = await getStatusesApi();
            if (response.success) {
                setStatuses(response.statuses || []);
            } else {
                toast.error(response.message || "Failed to load statuses");
            }
        } catch (error) {
            console.error("Fetch Statuses Error:", error);
            toast.error("Failed to load statuses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    const handleCreateStatus = async (e) => {
        e.preventDefault();
        if (!newStatusName.trim()) {
            toast.warn("Please enter a valid status name");
            return;
        }

        setSubmitting(true);
        try {
            const response = await createStatusApi(newStatusName.trim());
            if (response.success) {
                toast.success(response.message || "Status created successfully!");
                setNewStatusName('');
                fetchStatuses();
            } else {
                toast.error(response.message || "Failed to create status");
            }
        } catch (error) {
            console.error("Create Status Error:", error);
            toast.error(error.response?.data?.message || "Failed to create status");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStatus = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete status "${name}"?`)) {
            setDeletingId(id);
            try {
                const response = await deleteStatusApi(id);
                if (response.success) {
                    toast.success(response.message || "Status deleted successfully!");
                    fetchStatuses();
                } else {
                    toast.error(response.message || "Failed to delete status");
                }
            } catch (error) {
                console.error("Delete Status Error:", error);
                toast.error("Failed to delete status");
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Back Button */}
            <div className="mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
            </div>

            {/* Breadcrumb */}
            <div className="mb-6 flex items-center justify-between no-print">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-teal-600 font-semibold cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Admin</span>
                    <span className="text-gray-400">/</span>
                    <div className="text-gray-600">Manage Statuses</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Status Form Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-teal-600" />
                        Create New Status
                    </h2>
                    <form onSubmit={handleCreateStatus} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Name</label>
                            <input
                                type="text"
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                                placeholder="e.g. Call Connected, Busy..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
                                disabled={submitting}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {submitting ? "Adding Status..." : "Add Status"}
                        </button>
                    </form>
                </div>

                {/* Statuses List Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Tag className="h-5 w-5 text-teal-600 animate-pulse" />
                            Available Statuses ({statuses.length})
                        </h2>
                        <button
                            onClick={fetchStatuses}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Refresh Statuses"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-2" />
                            <p className="text-sm font-medium text-gray-500">Loading statuses...</p>
                        </div>
                    ) : statuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-base font-semibold text-gray-700">No Statuses Found</p>
                            <p className="text-xs text-gray-500 mt-1">Add your first status on the left panel.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {statuses.map((status) => (
                                <div
                                    key={status._id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-150 hover:border-teal-500 hover:bg-white hover:shadow-md transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-2.5 w-2.5 rounded-full bg-teal-500"></div>
                                        <span className="text-sm font-semibold text-gray-800">{status.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteStatus(status._id, status.name)}
                                        disabled={deletingId === status._id}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                                        title="Delete Status"
                                    >
                                        {deletingId === status._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
