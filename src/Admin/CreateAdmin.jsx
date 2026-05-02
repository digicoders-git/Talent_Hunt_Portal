import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Eye, EyeOff, X, RotateCcw, UserPlus, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { createAdminApi, getAdminApi, updateAdminApi, deleteAdminApi, toggleAdminStatusApi, changeUserPasswordApi } from '../API/admin';

const emptyForm = { userName: '', email: '', password: '' };

export default function CreateAdmin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewUser, setViewUser] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [showViewPassword, setShowViewPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [searchName, setSearchName] = useState('');
    const [searchMobile, setSearchMobile] = useState('');
    const [searchEmail, setSearchEmail] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async (search = '') => {
        setLoading(true);
        try {
            const res = await getAdminApi(search);
            if (res.success) setUsers(res.admin || []);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const q = searchName || searchMobile || searchEmail;
        fetchUsers(q);
    };

    const handleReset = () => {
        setSearchName(''); setSearchMobile(''); setSearchEmail('');
        fetchUsers();
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setForm({ userName: user.userName, email: user.email || '', password: '' });
        setShowPassword(false);
        setNewPassword('');
        setShowNewPassword(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.userName || !form.email) return toast.error('Name and Email are required');
        if (!editingUser && !form.password) return toast.error('Password is required');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) return toast.error('Enter a valid email address');
        if (!editingUser && form.password.length < 6) return toast.error('Password must be at least 6 characters');

        setSubmitting(true);
        try {
            if (editingUser) {
                const res = await updateAdminApi(editingUser._id, { userName: form.userName, email: form.email });
                if (res.success) {
                    if (newPassword) {
                        if (newPassword.length < 6) {
                            toast.error('Password must be at least 6 characters');
                            setSubmitting(false);
                            return;
                        }
                        await changeUserPasswordApi(editingUser._id, newPassword);
                    }
                    toast.success('User updated successfully!');
                    setIsModalOpen(false);
                    setNewPassword('');
                    fetchUsers();
                }
            } else {
                const res = await createAdminApi(form);
                if (res.success) {
                    toast.success('User created successfully!');
                    setIsModalOpen(false);
                    fetchUsers();
                }
            }
        } catch (err) {
            toast.error(err.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (user) => {
        Swal.fire({
            title: 'Delete User?',
            text: `Are you sure you want to delete "${user.userName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e53e3e',
            cancelButtonColor: '#319795',
            confirmButtonText: 'Yes, delete!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await deleteAdminApi(user._id);
                    if (res.success) {
                        toast.success('User deleted successfully!');
                        fetchUsers();
                    }
                } catch (err) {
                    toast.error(err.message || 'Failed to delete user');
                }
            }
        });
    };

    const handleToggleStatus = (user) => {
        const isCurrentlyActive = user.isActive !== false;
        Swal.fire({
            title: isCurrentlyActive ? 'Deactivate User?' : 'Activate User?',
            text: `Are you sure you want to ${isCurrentlyActive ? 'deactivate' : 'activate'} "${user.userName}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyActive ? '#e53e3e' : '#319795',
            cancelButtonColor: '#718096',
            confirmButtonText: isCurrentlyActive ? 'Yes, Deactivate!' : 'Yes, Activate!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await toggleAdminStatusApi(user._id);
                    if (res.success) {
                        toast.success(res.message);
                        fetchUsers();
                    }
                } catch (err) {
                    toast.error(err.message || 'Failed to toggle status');
                }
            }
        });
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
        setChangingPassword(true);
        try {
            const res = await changeUserPasswordApi(viewUser._id, newPassword);
            if (res.success) {
                toast.success('Password changed successfully!');
                setNewPassword('');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#319795] font-semibold">Settings</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-[#2D3748]">Manage Users</span>
                </div>
            </div>

            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#319795] bg-white w-full sm:w-44"
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchMobile}
                            onChange={(e) => setSearchMobile(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by user ID..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#319795] bg-white w-full sm:w-44"
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by email..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#319795] bg-white w-full sm:w-44"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSearch} className="bg-[#319795] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2c7a7b] transition-colors flex items-center gap-1">
                            <Search className="h-4 w-4" /> Search
                        </button>
                        <button onClick={handleReset} className="text-gray-500 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors" title="Reset">
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#319795] hover:bg-[#2c7a7b] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Create User
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-[#E6FFFA] overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#E6FFFA] text-[#2D3748] font-semibold border-b border-[#319795]">
                                <tr>
                                    <th className="px-6 py-4">Sr No.</th>
                                    <th className="px-6 py-4">Full Name</th>
                                    <th className="px-6 py-4">User ID</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6FFFA]">
                                {users.map((user, index) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-[#4A5568]">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-[#2D3748]">{user.userName}</td>
                                        <td className="px-6 py-4 text-[#4A5568]">
                                            <span className="bg-blue-50 text-blue-600 py-1 px-2 rounded text-xs border border-blue-100 font-medium font-mono">
                                                {user.userId || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[#4A5568]">{user.email || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                user.role === 'admin'
                                                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                                    user.isActive !== false
                                                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                                                }`}
                                            >
                                                {user.isActive !== false ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-[#718096] text-xs">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => { setViewUser(user); setNewPassword(''); setShowViewPassword(false); setShowNewPassword(false); }}
                                                    className="text-purple-500 border border-purple-300 p-1.5 rounded-lg hover:bg-purple-50 transition-all active:scale-90"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-[#319795] border border-[#319795] p-1.5 rounded-lg hover:bg-[#E6FFFA] transition-all active:scale-90"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={user.role === 'admin'}
                                                    className={`border p-1.5 rounded-lg transition-all active:scale-90 ${
                                                        user.role === 'admin'
                                                            ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                                            : 'text-red-500 border-red-300 hover:bg-red-50'
                                                    }`}
                                                    title={user.role === 'admin' ? 'Admin cannot be deleted' : 'Delete'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
            {viewUser && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="bg-[#319795] text-white px-5 py-3 flex justify-between items-center">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <User className="h-4 w-4" /> User Details
                            </h3>
                            <button onClick={() => setViewUser(null)} className="text-white/80 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {/* Avatar + Basic Info */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {viewUser.image ? (
                                        <img src={viewUser.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-purple-500">{viewUser.userName?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-[#2D3748] text-base">{viewUser.userName}</p>
                                    <p className="text-xs text-gray-400">{viewUser.email || '—'}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ viewUser.isActive !== false ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                                            {viewUser.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100">User</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { label: 'User ID', value: viewUser.userId || '—' },
                                    { label: 'Created', value: viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : '—' },
                                    { label: 'Updated', value: viewUser.updatedAt ? new Date(viewUser.updatedAt).toLocaleDateString() : '—' },
                                    { label: 'Password', value: showViewPassword ? '(encrypted)' : '••••••••', toggle: true },
                                ].map((item, i) => (
                                    <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-xs font-semibold text-[#2D3748] font-mono truncate">{item.value}</p>
                                            {item.toggle && (
                                                <button type="button" onClick={() => setShowViewPassword(!showViewPassword)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                                    {showViewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Change Password - removed, now in Edit modal */}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setViewUser(null); openEditModal(viewUser); }}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#319795] text-white hover:bg-teal-700 transition-colors"
                                >
                                    <Edit className="h-3.5 w-3.5" /> Edit User
                                </button>
                                <button
                                    onClick={() => setViewUser(null)}
                                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                {editingUser ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={form.userName}
                                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email ID</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="Enter email address"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID</label>
                                <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 flex items-center justify-between">
                                    <span className="font-mono text-gray-500">
                                        {editingUser ? editingUser.userId || '—' : 'Auto Generated by System'}
                                    </span>
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                        {editingUser ? 'Read Only' : 'Auto'}
                                    </span>
                                </div>
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Min 6 characters"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {editingUser && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Change Password <span className="text-gray-300 normal-case font-normal">(leave blank to keep current)</span></label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min 6)"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#319795] text-white hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : (editingUser ? 'Save Changes' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
