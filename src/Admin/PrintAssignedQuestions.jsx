import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Loader2, ArrowLeft } from 'lucide-react';
import { getAssessmentQuestionsApi } from '../API/assesmentQuestions';

export default function PrintAssignedQuestions() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [assessmentName, setAssessmentName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await getAssessmentQuestionsApi(id);
                if (response.success) {
                    let qList = [];
                    // Extract assessment name from nested structure: response.data.assesmentId.assessmentName
                    if (response.data?.assesmentId?.assessmentName) {
                        setAssessmentName(response.data.assesmentId.assessmentName);
                    }

                    // Robust parsing similar to AssignQuestions.jsx
                    if (response.data?.questionIds) {
                        qList = response.data.questionIds;
                    } else if (response.questions && typeof response.questions === 'object' && !Array.isArray(response.questions)) {
                        qList = response.questions.questionIds || response.questions.questions || [];
                    } else if (Array.isArray(response.questions)) {
                        qList = response.questions;
                    } else if (response.data) {
                        qList = Array.isArray(response.data) ? response.data : (response.data.questions || []);
                    }
                    setQuestions(Array.isArray(qList) ? qList : []);
                }
            } catch (error) {
                console.error("Failed to fetch questions for printing:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchQuestions();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading questions for printing...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">No Questions Assigned</h2>
                    <p className="text-gray-500">Please assign questions first to print the paper.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 print:p-0">
            {/* Print & Back Button - Hidden when printing */}
            <div className="max-w-4xl mx-auto mb-8 print:hidden flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    <Printer className="h-4 w-4" />
                    Print Paper
                </button>
            </div>

            {/* Paper Content */}
            <div className="max-w-4xl mx-auto bg-white print:w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className='flex items-center justify-center'>
                        <img className='h-16 w-48 object-contain' src="/digicoders-logo.png" alt="Logo" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-700 mt-4 underline decoration-double underline-offset-8">
                        {assessmentName || "Interview Questionnaire"}
                    </h2>
                </div>

                {/* Student Details */}
                <div className="flex flex-wrap gap-x-8 gap-y-6 mb-12 text-sm font-medium">
                    <div className="flex items-end gap-2 flex-grow">
                        <span className="text-gray-700 font-bold">Student Name:</span>
                        <div className="flex-grow border-b-2 border-dotted border-gray-400"></div>
                    </div>
                    <div className="flex items-end gap-2 w-64">
                        <span className="text-gray-700 font-bold">Contact No:</span>
                        <div className="flex-grow border-b-2 border-dotted border-gray-400"></div>
                    </div>
                    <div className="flex items-end gap-2 w-48">
                        <span className="text-gray-700 font-bold">Date:</span>
                        <div className="flex-grow border-b-2 border-dotted border-gray-400 text-center">/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/</div>
                    </div>
                    <div className="w-full flex items-end gap-2">
                        <div className="flex items-end gap-2 w-1/2">
                            <span className="text-gray-700 font-bold">Course / Batch:</span>
                            <div className="flex-grow border-b-2 border-dotted border-gray-400"></div>
                        </div>
                        <div className="flex items-end gap-2 w-1/2">
                            <span className="text-gray-700 font-bold">College:</span>
                            <div className="flex-grow border-b-2 border-dotted border-gray-400"></div>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-10">
                    {questions.map((q, index) => {
                        // Extracting options from the backend structure (options: {A, B, C, D})
                        const choices = [
                            { letter: 'A', text: q.options?.A || q.optionA },
                            { letter: 'B', text: q.options?.B || q.optionB },
                            { letter: 'C', text: q.options?.C || q.optionC },
                            { letter: 'D', text: q.options?.D || q.optionD }
                        ].filter(c => c.text);

                        return (
                            <div key={q._id || index} className="break-inside-avoid">
                                <div className="flex gap-2 items-start mb-4">
                                    <span className="font-bold text-black text-lg min-w-[40px]">Q.{index + 1}</span>
                                    <p className="font-bold text-black text-lg leading-snug">
                                        {q.question}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-12 ml-10">
                                    {choices.map((choice, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-6 h-6 border-2 border-black rounded-sm flex-shrink-0"></div>
                                            <span className="text-black font-bold text-base">
                                                {choice.letter}). {choice.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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