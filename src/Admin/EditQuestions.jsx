import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';

export default function EditQuestions() {
    const { topicId } = useParams();
    const navigate = useNavigate();

    // Mock initial questions
    const [loading, setLoading] = useState(true);
    // Mock initial questions
    const [questions, setQuestions] = useState([]);

    React.useEffect(() => {
        // Simulate fetch
        const timer = setTimeout(() => {
            setQuestions([
                {
                    id: 1,
                    text: "Who is known as the father of computer?",
                    options: ["Dennis Ritchie", "Bill Gates", "Charles Babbage", "James Gosling"],
                    correct: 2
                }
            ]);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [topicId]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: questions.length + 1,
                text: "",
                options: ["", "", "", ""],
                correct: 0
            }
        ]);
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const handleOptionChange = (qId, optIndex, value) => {
        setQuestions(questions.map(q =>
            q.id === qId ? {
                ...q,
                options: q.options.map((opt, idx) => idx === optIndex ? value : opt)
            } : q
        ));
    };

    const handleDeleteQuestion = (id) => {
        Swal.fire({
            title: "Remove question?",
            text: "This question will be removed from your local draft.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#319795",
            cancelButtonColor: "#f56565",
            confirmButtonText: "Remove"
        }).then((result) => {
            if (result.isConfirmed) {
                setQuestions(questions.filter(q => q.id !== id));
                toast.success("Question removed");
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500 mb-4" />
                    <p className="text-gray-500 font-medium">Loading questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Edit Questions</h1>
                            <p className="text-gray-500">Topic ID: {topicId}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
                        <Save className="h-5 w-5" />
                        Save Changes
                    </button>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-gray-700">Question {index + 1}</h3>
                                <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-red-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="Enter question here..."
                                    />
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Option {String.fromCharCode(65 + idx)}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.id}`}
                                                    checked={q.correct === idx}
                                                    onChange={() => handleQuestionChange(q.id, 'correct', idx)}
                                                    className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(q.id, idx, e.target.value)}
                                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Question Button */}
                <button
                    onClick={handleAddQuestion}
                    className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add New Question
                </button>
            </div>
        </div>
    );
}
