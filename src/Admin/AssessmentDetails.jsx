import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getResultsByStudentApi } from '../API/result';
import { toast } from 'react-toastify';

export default function AssessmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [allResults, setAllResults] = useState([]);
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await getResultsByStudentApi(id);
                // console.log("Full Student Results Response:", response);
                if (response.success) {
                    // Mapping the new API structure
                    setAllResults(response.results || []);
                    if (response.results && response.results.length > 0) {
                        setStudentInfo(response.results[0].student);
                    }
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-600 h-10 w-10" />
            </div>
        );
    }

    if (!studentInfo || allResults.length === 0) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold">Student data not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">Go Back</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            {/* Buttons - Non-printable normally */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ backgroundColor: '#6b7280', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                    ← Back
                </button>
                <button
                    onClick={handlePrint}
                    style={{ backgroundColor: '#4ade80', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                    Print
                </button>
            </div>

            <div id="printableArea" style={{ backgroundColor: 'white', color: 'black' }}>
                {/* Student Info Section */}
                <div style={{ backgroundColor: 'white', padding: '16px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Student Assessment Report</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Name:</strong> {studentInfo.name || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Phone:</strong> {studentInfo.mobile || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Email:</strong> {studentInfo.email || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>College:</strong> {studentInfo.college || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Course:</strong> {studentInfo.course || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Year:</strong> {studentInfo.year || 'N/A'}</p>
                            <p style={{ marginBottom: '6px', wordBreak: 'break-word' }}><strong>Code:</strong> {studentInfo.code || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Single Submission Display */}
                {allResults.length > 0 ? (
                    (() => {
                        const result = allResults[0];
                        return (
                            <div style={{ marginBottom: '40px', border: '2px solid #319795', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#319795' }}>
                                        Submission Details
                                    </h2>
                                    <span style={{ backgroundColor: '#E6FFFA', color: '#1A433F', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
                                        Score: {result.marks || 0}
                                    </span>
                                </div>

                                {/* Questions for this submission */}
                                <div>
                                    {result.questions && result.questions.length > 0 ? (
                                        result.questions.map((qItem, qIndex) => {
                                            const options = qItem.options || {};
                                            const selectedKey = qItem.selectedOption;
                                            const isCorrect = qItem.isCorrect;
                                            
                                            // Check if selectedOption is an actual option (A, B, C, D) or status (unattempted, skipped, unvisited)
                                            const isActualOption = ['A', 'B', 'C', 'D'].includes(selectedKey);
                                            const statusText = isActualOption ? (isCorrect ? 'Correct' : 'Incorrect') : selectedKey;
                                            const statusColor = isActualOption ? (isCorrect ? 'green' : 'red') : 'orange';

                                            return (
                                                <div key={qItem._id || qIndex} style={{ marginBottom: '24px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                                    <p style={{ fontSize: '16px', marginBottom: '12px', lineHeight: '1.5' }}>
                                                        <strong>Q{qIndex + 1}. {qItem.question}</strong>
                                                        <span style={{ color: statusColor, marginLeft: '10px', fontWeight: 'bold' }}>
                                                            {isActualOption ? (isCorrect ? '✓' : '✗') : ''} {statusText}
                                                        </span>
                                                    </p>

                                                    <div style={{ marginLeft: '15px' }}>
                                                        {Object.entries(options).map(([key, value]) => {
                                                            const isUserChoice = String(key) === String(selectedKey) && isActualOption;

                                                            let style = { padding: '8px', marginBottom: '4px', borderRadius: '4px' };
                                                            if (isUserChoice) {
                                                                style.backgroundColor = isCorrect ? '#DCFCE7' : '#FEE2E2';
                                                                style.color = isCorrect ? '#166534' : '#991B1B';
                                                                style.fontWeight = 'bold';
                                                                style.border = `1px solid ${isCorrect ? '#86EFAC' : '#FECACA'}`;
                                                            }

                                                            return (
                                                                <p key={key} style={style}>
                                                                    <strong>{key}.</strong> {value}
                                                                    {isUserChoice && <span style={{ fontSize: '12px', marginLeft: '10px' }}>(You Selected)</span>}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>No question details available for this attempt.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <p style={{ textCenter: 'center', padding: '40px', color: '#666' }}>No results found.</p>
                )}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    #printableArea { border: none !important; padding: 0 !important; }
                    div { border-color: #eee !important; }
                }
            `}</style>
        </div>
    );
}