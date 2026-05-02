import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Clock,
    Users,
    Award,
    Shield,
    History,
    Menu,
    X,
    GraduationCap,
    User,
    LogOut,
    Database,
    UserPlus
} from 'lucide-react';

import { getAdminApi } from '../../API/admin';
import { adminLogout, getMeApi } from '../../API/auth';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [admin, setAdmin] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const verifySession = async () => {
            try {
                const meRes = await getMeApi();
                if (meRes.success && meRes.admin) {
                    setAdmin(meRes.admin);
                    setCurrentRole(meRes.admin.role);
                    if (meRes.admin.role === 'user' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
                        navigate('/admin/students');
                    }
                } else {
                    throw new Error('Session invalid');
                }
            } catch (error) {
                navigate('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();

        // Auto logout after 5 hours - check every minute
        const sessionInterval = setInterval(async () => {
            try {
                await getMeApi();
            } catch {
                clearInterval(sessionInterval);
                navigate('/admin/login');
            }
        }, 60 * 1000);

        const fetchAdmin = async () => {
            try {
                const meRes = await getMeApi();
                if (meRes.success && meRes.admin) setAdmin(meRes.admin);
            } catch (e) { console.error(e); }
        };

        window.addEventListener('adminUpdated', fetchAdmin);
        return () => {
            window.removeEventListener('adminUpdated', fetchAdmin);
            clearInterval(sessionInterval);
        };
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-teal-600 font-semibold flex flex-col items-center">
                    {/* Simple spinner or text */}
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    Verifying Session...
                </div>
            </div>
        );
    }

    const allMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['admin'] },
        { id: 'create-admin', label: 'Create User', icon: UserPlus, path: '/admin/create-admin', roles: ['admin'] },
        { id: 'topics', label: 'Manage Topics', icon: BookOpen, path: '/admin/topics', roles: ['admin'] },
        { id: 'assessment', label: 'Active Assessment', icon: Clock, path: '/admin/assessment', roles: ['admin'] },
        { id: 'history', label: 'Assessment History', icon: History, path: '/admin/history', roles: ['admin'] },
        { id: 'students', label: 'Manage Students', icon: Users, path: '/admin/students', roles: ['admin', 'user'] },
        { id: 'certificate', label: 'Manage Certificates', icon: Award, path: '/admin/certificate', roles: ['admin'] },
        { id: 'academic', label: 'Academic Setup', icon: GraduationCap, path: '/admin/academic', roles: ['admin'] },
        { id: 'last-year-data', label: 'Last Year Data', icon: Database, path: '/admin/last-year-data', roles: ['admin'] },
        { id: 'security', label: 'Profile', icon: User, path: '/admin/security', roles: ['admin', 'user'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

    const handleNavigation = (path) => {
        navigate(path);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Logout?',
            text: "Are you sure you want to logout?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#319795',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!',
            background: '#FFFFFF',
            color: '#2D3748'
        });

        if (result.isConfirmed) {
            try {
                const response = await adminLogout();
                if (response.success) {
                    Swal.fire({
                        title: 'Logged Out!',
                        text: 'You have been logged out successfully.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#FFFFFF',
                        color: '#2D3748'
                    });
                    setTimeout(() => {
                        navigate('/admin/login');
                    }, 1500);
                } else {
                    Swal.fire({
                        title: 'Error!',
                        text: response.message || "Logout failed",
                        icon: 'error',
                        confirmButtonColor: '#319795',
                    });
                }
            } catch (error) {
                console.error("Logout error:", error);
                Swal.fire({
                    title: 'Error!',
                    text: "An error occurred during logout",
                    icon: 'error',
                    confirmButtonColor: '#319795',
                });
            }
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#EDF2F7' }}> {/* Soft Gray Background */}
            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen transition-all duration-500 z-50 overflow-hidden flex-shrink-0 print:hidden 
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{
                    width: sidebarOpen ? '17rem' : '5rem',
                    backgroundColor: '#319795',
                    color: '#E6FFFA',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Logo */}
                <div className="p-6 h-20 flex items-center justify-center border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center justify-center transition-all duration-500">
                        <div
                            className="rounded-full flex items-center justify-center overflow-hidden transition-all duration-500"
                            style={{
                                width: sidebarOpen ? '4rem' : '2.5rem',
                                height: sidebarOpen ? '4rem' : '2.5rem',
                                backgroundColor: '#319795'
                            }}
                        >
                            <img
                                src='/icon.jpg'
                                alt="logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {sidebarOpen && (
                    <button onClick={() => setSidebarOpen(false)} className="fixed top-2 left-56 lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="h-8 w-8" />
                    </button>
                )}


                {/* Menu */}
                <nav className="mt-6 px-3 space-y-2 flex-grow overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/admin/dashboard');

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'justify-center'} py-3.5 rounded-xl transition-all duration-300 group relative cursor-pointer`}
                                style={{
                                    backgroundColor: isActive ? '#287D80' : 'transparent',
                                    color: isActive ? '#FFFFFF' : '#E6FFFA',
                                }}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <Icon className={`h-6 w-6 shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'text-[#4FD1C5] group-hover:text-white'} ${!sidebarOpen ? 'scale-110' : ''}`} />
                                <span className={`text-[15px] whitespace-nowrap font-medium tracking-wide transition-all duration-500 overflow-hidden ${sidebarOpen ? 'opacity-100 ml-4 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!sidebarOpen && (
                                    <div className="absolute left-full ml-2 px-3 py-2 bg-[#2D3748] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#2D3748] rotate-45 border-l border-b border-white/10"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="mt-auto pb-6 px-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'justify-center'} py-3.5 rounded-xl transition-all duration-300 group relative cursor-pointer bg-red-500 hover:bg-red-700`}
                        title={!sidebarOpen ? 'Logout' : ''}
                    >
                        <LogOut className={`h-6 w-6 shrink-0 transition-all duration-300 text-white group-hover:scale-110 ${!sidebarOpen ? 'scale-110' : ''}`} />
                        <span className={`text-[15px] whitespace-nowrap font-bold tracking-wide text-white transition-all duration-500 overflow-hidden ${sidebarOpen ? 'opacity-100 ml-4 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                            Logout
                        </span>
                        {!sidebarOpen && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-red-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] shadow-xl">
                                Logout
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-700 rotate-45"></div>
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col h-screen min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-30 border-b print:hidden" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(prev => !prev)} className="p-2 rounded-lg hover:bg-[#FF7F50]/20">
                                {sidebarOpen ? <X className="h-6 w-6" style={{ color: '#319795' }} /> : <Menu className="h-6 w-6" style={{ color: '#319795' }} />}
                            </button>
                            <h2 className="text-xl font-semibold" style={{ color: '#2D3748' }}>
                                DigiCoders Talent Hunt Scholarship Test
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium hidden sm:block" style={{ color: '#2D3748' }}>
                                {admin?.userName || 'Admin'}
                            </span>

                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-[#FF7F50] bg-[#FF7F50]" >
                                {admin?.image ? (
                                    <img src={admin.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-[#E6FFFA]" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto min-w-0" style={{ backgroundColor: '#EDF2F7' }}>
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="px-6 py-4 text-center border-t print:hidden" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.1)' }}>
                    <p className="text-sm" style={{ color: '#2D3748' }}>
                        © 2026 <span style={{ color: '#FF7F50', fontWeight: '600' }}>DigiCoders Talent Hunt Scholarship Test</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}
