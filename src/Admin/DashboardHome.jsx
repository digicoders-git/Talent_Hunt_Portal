import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Award, History, FileText, BookOpen } from 'lucide-react';
import { getDashboardDataApi } from '../API/auth';
import { getMeApi } from '../API/auth';

export default function DashboardHome() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        totalStudents: 0,
        activeAssesment: 0,
        historyAssesment: 0,
        results: 0,
        activeTopics: 0,
        inactiveTopics: 0,
        questions: 0,
        totalCertificates: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    const fetchDashboardData = async () => {
        try {
            const meRes = await getMeApi();
            if (meRes.success && meRes.admin) {
                setRole(meRes.admin.role);
                if (meRes.admin.role === 'user') {
                    navigate('/admin/students');
                    return;
                }
            }
            const response = await getDashboardDataApi();
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Listen for updates from other components
        window.addEventListener('dashboardUpdated', fetchDashboardData);
        return () => window.removeEventListener('dashboardUpdated', fetchDashboardData);
    }, []);

    const cards = [
        { title: 'ACTIVE ASSESSMENT', value: dashboardData.activeAssesment, icon: Clock, link: '/admin/assessment' },
        { title: 'HISTORY', value: dashboardData.historyAssesment, icon: History, link: '/admin/history' },
        { title: 'TOTAL STUDENTS', value: dashboardData.totalStudents, icon: Users, link: '/admin/students' },
        { title: 'TOTAL RESULTS', value: dashboardData.results, icon: FileText, link: '/admin/history' },
        { title: 'ACTIVE TOPICS', value: dashboardData.activeTopics, icon: BookOpen, link: '/admin/topics', filter: 'Active' },
        { title: 'INACTIVE TOPICS', value: dashboardData.inactiveTopics, icon: BookOpen, link: '/admin/topics', filter: 'Inactive' },
        { title: 'TOTAL QUESTIONS', value: dashboardData.questions, icon: FileText, link: '/admin/topics' },
        { title: 'CERTIFICATES', value: dashboardData.totalCertificates, icon: Award, link: '/admin/certificate' },
        { title: 'TOTAL USERS', value: dashboardData.totalUsers, icon: Users, link: '/admin/create-admin' },
    ];

    if (loading) {
        return (
            <div className="p-6 bg-[#EDF2F7] min-h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#319795]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#EDF2F7] min-h-full">
            {/* Breadcrumb - Simplified */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Admin</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-[#319795] font-bold">Dashboard Analytics</span>
                </div>
            </div>

            {/* Cards - Exact match to reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => navigate(card.link, { state: { status: card.filter } })}
                            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden h-[150px] flex flex-col justify-between"
                        >
                            {/* Pink corner decoration */}
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-200 rounded-full opacity-60 z-0"></div>

                            <div className="relative z-10 w-full">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                                        {card.title}
                                    </h3>
                                    <div className="bg-[#319795] w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>

                                <p className="text-4xl font-bold text-[#2D3748] mt-2">
                                    {card.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}