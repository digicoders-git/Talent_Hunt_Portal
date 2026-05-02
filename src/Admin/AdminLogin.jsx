import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User, Shield, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminLoginApi, verifyAdminLoginOtpApi, userLoginApi } from '../API/auth';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('admin');
    const [loading, setLoading] = useState(false);

    // Admin - step 1: email, step 2: otp
    const [adminEmail, setAdminEmail] = useState('');
    const [adminOtpStep, setAdminOtpStep] = useState(false);
    const [adminOtp, setAdminOtp] = useState('');

    // User - direct login
    const [userForm, setUserForm] = useState({ email: '', password: '' });

    const switchTab = (tab) => {
        setActiveTab(tab);
        setAdminOtpStep(false);
        setAdminOtp('');
        setAdminEmail('');
        setUserForm({ email: '', userId: '', password: '' });
    };

    // ── Admin Step 1: Send OTP ──────────────────────────────
    const handleAdminSendOtp = async () => {
        if (!adminEmail) return toast.error('Please enter your email');
        setLoading(true);
        try {
            const res = await adminLoginApi({ email: adminEmail });
            if (res.success && res.otpSent) {
                toast.success('OTP sent to admin email!');
                setAdminOtpStep(true);
            } else {
                toast.error(res.message || 'Failed to send OTP');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Invalid email');
        } finally {
            setLoading(false);
        }
    };

    // ── Admin Step 2: Verify OTP ────────────────────────────
    const handleAdminVerifyOtp = async () => {
        if (!adminOtp || adminOtp.length !== 6) return toast.error('Enter valid 6-digit OTP');
        setLoading(true);
        try {
            const res = await verifyAdminLoginOtpApi({ otp: adminOtp });
            if (res.success) {
                toast.success('Login Successful');
                navigate('/admin/dashboard');
            } else {
                toast.error(res.message || 'Invalid OTP');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    // ── User: Direct Login ──────────────────────────────────
    const handleUserLogin = async () => {
        if (!userForm.email || !userForm.password)
            return toast.error('All fields are required');
        setLoading(true);
        try {
            const res = await userLoginApi({ email: userForm.email, password: userForm.password });
            if (res.success) {
                toast.success('Login Successful');
                navigate('/admin/dashboard');
            } else {
                toast.error(res.message || 'Login failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">

                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img src="/icon.jpg" className="h-24 w-24 rounded-full" alt="logo" />
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                        <button
                            onClick={() => switchTab('admin')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-[#319795] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Shield className="h-4 w-4" /> Admin Login
                        </button>
                        <button
                            onClick={() => switchTab('user')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'user' ? 'bg-[#319795] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <User className="h-4 w-4" /> User Login
                        </button>
                    </div>

                    {/* ── ADMIN STEP 1: Email + Send OTP ── */}
                    {activeTab === 'admin' && !adminOtpStep && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Admin Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                    <input
                                        type="email"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminSendOtp()}
                                        placeholder="Enter admin email"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#319795] focus:bg-white outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAdminSendOtp}
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-[#319795]/70 cursor-not-allowed' : 'bg-[#319795] hover:bg-[#2B7A73]'} text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest`}
                            >
                                {loading
                                    ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <> Send OTP <ArrowRight className="h-4 w-4" /> </>
                                }
                            </button>
                        </div>
                    )}

                    {/* ── ADMIN STEP 2: OTP ── */}
                    {activeTab === 'admin' && adminOtpStep && (
                        <div className="space-y-5">
                            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-center">
                                <p className="text-sm text-teal-700 font-medium">OTP sent to admin email</p>
                                <p className="text-xs text-teal-600 font-bold mt-0.5">digicoderstech@gmail.com</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Enter OTP</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={adminOtp}
                                        onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminVerifyOtp()}
                                        placeholder="6-digit OTP"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#319795] focus:bg-white outline-none transition-all text-center text-xl font-bold tracking-[0.4em] font-mono"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAdminVerifyOtp}
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-[#319795]/70 cursor-not-allowed' : 'bg-[#319795] hover:bg-[#2B7A73]'} text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest`}
                            >
                                {loading
                                    ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <> Verify & Login <ArrowRight className="h-4 w-4" /> </>
                                }
                            </button>
                            <button onClick={() => { setAdminOtpStep(false); setAdminOtp(''); }} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
                                ← Back
                            </button>
                        </div>
                    )}

                    {/* ── USER: Direct Login ── */}
                    {activeTab === 'user' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email ID</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUserLogin()}
                                        placeholder="Enter your email"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#319795] focus:bg-white outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                    <input
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUserLogin()}
                                        placeholder="••••••••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#319795] focus:bg-white outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUserLogin}
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-[#319795]/70 cursor-not-allowed' : 'bg-[#319795] hover:bg-[#2B7A73]'} text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest mt-2`}
                            >
                                {loading
                                    ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <> Log In <ArrowRight className="h-4 w-4" /> </>
                                }
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
