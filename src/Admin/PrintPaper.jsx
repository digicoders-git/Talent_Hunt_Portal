import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { getQuestionsByTopicApi } from '../API/question';
import { toast } from 'react-toastify';

export default function PrintPaper() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const topicName = location.state?.topicName || 'Interview Questions';

    useEffect(() => {
        fetchQuestions();
    }, [topicId]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await getQuestionsByTopicApi(topicId);
            setQuestions(response.questions || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch questions');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 print:p-0">
            {/* Print Button & Navigation - Hidden when printing */}
            <div className="print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 sm:px-0">
                    <button
                        onClick={() => navigate('/admin/topics')}
                        className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    >
                        <Printer className="h-4 w-4" />
                        Print Questions
                    </button>
                </div>
            </div>

            {/* Paper Content */}
            <div className="max-w-4xl mx-auto bg-white print:max-w-none print:w-full">
                {/* Header */}
                <div className="text-center mb-8 print:mb-6">
                    <div className='flex items-center justify-center'>
                        <img className='h-16 w-40 print:h-12 print:w-32' src="/digicoders-logo.png" alt="" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700 print:text-xl print:mb-2">{topicName}</h2>
                </div>

                {/* Student Details */}
                <div className="flex flex-wrap gap-x-6 gap-y-4 mb-8 text-sm font-medium print:break-after-avoid print:mb-6">
                    <div className="flex items-end gap-2 flex-grow min-w-[280px]">
                        <span className="text-gray-700">Name:</span>
                        <div className="flex-grow border-b border-gray-400 min-w-[180px]"></div>
                    </div>
                    <div className="flex items-end gap-2 w-56">
                        <span className="text-gray-700">Mobile No.:</span>
                        <div className="flex-grow border-b border-gray-400"></div>
                    </div>
                    <div className="flex items-end gap-2 w-40">
                        <span className="text-gray-700">Date:</span>
                        <div className="flex-grow border-b border-gray-400 text-center">/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/</div>
                    </div>
                    <div className="w-full flex items-end gap-2">
                        <div className="flex items-end gap-2 w-1/2">
                            <span className="text-gray-700">Branch/Batch:</span>
                            <div className="flex-grow border-b border-gray-400"></div>
                        </div>
                        <div className="flex items-end gap-2 w-1/2">
                            <span className="text-gray-700">College:</span>
                            <div className="flex-grow border-b border-gray-400"></div>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3 print:space-y-2">
                    {questions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No questions found for this topic.</p>
                        </div>
                    ) : (
                        questions.map((q, index) => (
                            <div key={q._id} className="break-inside-avoid mb-3 print:mb-2">
                                <p className="font-bold text-black mb-1 text-[0.95rem] print:text-[0.9rem] print:mb-0.5">
                                    Q.{index + 1}) {q.question}
                                </p>
                                <div className="grid grid-cols-2 gap-y-0.5 gap-x-3 ml-1 print:gap-y-0 print:gap-x-2">
                                    {Object.entries(q.options).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-1.5 print:gap-1">
                                            <div className="w-3.5 h-3.5 border-2 border-black rounded-sm flex-shrink-0 print:w-3 print:h-3"></div>
                                            <span className="text-black font-semibold text-xs print:text-[0.7rem]">
                                                {key}). {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { 
                        margin: 1.5cm !important;
                        size: A4;
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print\:hidden {
                        display: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>
        </div>
    );
}
