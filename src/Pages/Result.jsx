import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getResultsByStudentApi } from '../API/result';
import { getSingleCertificateApi } from '../API/certificate';
import { uploadStudentCertificateApi } from '../API/student';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Download, Home, FileText, Youtube, MessageCircle, Linkedin, Instagram, Facebook, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import domtoimage from 'dom-to-image-more';
import { useRef } from 'react';

export default function Result() {
    const { width, height } = useWindowSize();
    const location = useLocation();
    const navigate = useNavigate();
    const [showConfetti, setShowConfetti] = useState(true);
    const resultRef = useRef(null);

    const { studentId, assessmentId, certificateId } = useParams();
    const [resultData, setResultData] = useState(null);
    const [certificateData, setCertificateData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Prevent back navigation
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // load fonts 
    const ensureFontLoaded = async (fontFamily) => {
        if (!fontFamily) return;
        const cleanName = fontFamily.split(',')[0].trim();
        const isLoaded = document.fonts.check(`16px "${cleanName}"`);
        if (isLoaded) return;
        await document.fonts.ready;
    };


    // font mapping with css value
    const fontCSSMap = {
        'Inter': 'Inter, sans-serif',
        'Roboto': 'Roboto, sans-serif',
        'Playfair Display': 'Playfair Display, serif',
        'Montserrat': 'Montserrat, sans-serif',
        'Dancing Script': 'Dancing Script, cursive',
        'Courier New': 'Courier New, monospace',
        'Lobster': 'Lobster, cursive',
        'Pacifico': 'Pacifico, cursive',
        'Great Vibes': 'Great Vibes, cursive',
        'Satisfy': 'Satisfy, cursive',
        'Kaushan Script': 'Kaushan Script, cursive',
        'Crimson Text': 'Crimson Text, serif',
        'Libre Baskerville': 'Libre Baskerville, serif',
        'Cormorant Garamond': 'Cormorant Garamond, serif'
    };



    const fetchResult = async () => {
        try {
            if (!studentId || !assessmentId) {
                return;
            }

            // Don't set loading true here to avoid UI flickering during background refresh
            // But if it's the first load (resultData is null), we might want to show loading
            if (!resultData) setLoading(true);

            const response = await getResultsByStudentApi(studentId);

            if (response.success && response.results) {

                const currentResult = response.results.find(res => {
                    const targetId = res.assesmentQuestions?._id || res.assesmentQuestions || res.assessmentQuestions?._id || res.assessmentQuestions;
                    return targetId === assessmentId;
                });

                if (currentResult) {
                    setResultData(currentResult);

                    // Also fetch certificate data if certificateId exists
                    if (certificateId && certificateId !== 'null' && certificateId !== 'undefined') {
                        try {
                            const certResp = await getSingleCertificateApi(certificateId);
                            if (certResp) {
                                setCertificateData(certResp);
                            }
                        } catch (error) {
                            console.error("Certificate fetch error:", error);
                        }
                    }
                } else {
                    console.error("Result not found for this assessment");
                }
            }
        } catch (error) {
            console.error("Fetch result error:", error);
            // toast.error(error.message || "Something went wrong while fetching your result");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResult();
    }, [studentId, assessmentId]);

    // Stop confetti after 8 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowConfetti(false);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#1F2937] font-bold text-lg">Fetching Result...</p>
                </div>
            </div>
        );
    }

    if (!resultData) return null;

    const digi = "{Coders}";

    // Screenshot and download result card as PNG
    const handleSaveResult = async () => {
        console.log("Save Result clicked!");

        if (!resultRef.current) {
            toast.error("Result card not found!");
            return;
        }

        const toastId = toast.loading("Generating result image...");

        try {
            // Hide action buttons and social media during screenshot
            const actionButtons = document.getElementById('action-buttons');
            const socialMedia = document.getElementById('social-media');
            if (actionButtons) actionButtons.style.display = 'none';
            if (socialMedia) socialMedia.style.display = 'none';

            // Use dom-to-image-more which supports modern CSS colors
            const dataUrl = await domtoimage.toPng(resultRef.current, {
                quality: 0.95,
                bgcolor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                },
                filter: (node) => {
                    // Remove borders from all elements during capture
                    if (node.style) {
                        node.style.border = 'none';
                        node.style.outline = 'none';
                        node.style.boxShadow = 'none';
                    }
                    return true;
                }
            });

            // Show action buttons and social media again
            if (actionButtons) actionButtons.style.display = 'flex';
            if (socialMedia) socialMedia.style.display = 'block';

            // Create download link
            const link = document.createElement('a');
            const studentName = resultData.student?.name || 'Student';
            const fileName = `DigiCoders_${studentName.replace(/\s+/g, '_')}_Result.png`;
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log("Download triggered!");

            toast.update(toastId, {
                render: "Result saved successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
        } catch (error) {
            // Show action buttons and social media again in case of error
            const actionButtons = document.getElementById('action-buttons');
            const socialMedia = document.getElementById('social-media');
            if (actionButtons) actionButtons.style.display = 'flex';
            if (socialMedia) socialMedia.style.display = 'block';

            console.error("Screenshot failed:", error);
            toast.update(toastId, {
                render: `Failed to save result: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    // Generate and Download Certificate using Canvas
    const handleDownloadCertificate = async () => {
        if (!certificateData) {
            toast.error("Certificate template not found!");
            return;
        }

        // 1. Check if certificate already exists
        if (resultData.student?.certificate) {
            try {
                // Determine if we can download it directly (if cross-origin issues allow) or if we need to open it
                // For a specialized experience requested: "url milega usme ek image hogi usi ko download kre"

                // Attempt to fetch and download as blob to force 'Download' behavior instead of 'Open'
                const response = await fetch(resultData.student.certificate);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `DigiCoders_Certificate_${(resultData.student?.name || 'Student').replace(/\s+/g, '_')}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success("Certificate downloaded successfully!");
                return;
            } catch (e) {
                console.error("Error downloading existing certificate:", e);
                // Fallback: just open it if fetch fails (likely due to CORS if not configured)
                window.open(resultData.student.certificate, '_blank');
                return;
            }
        }

        const toastId = toast.loading("Generating your certificate...");

        try {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Essential for cross-origin Cloudinary images
            img.src = certificateData.certificateImage;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Failed to load certificate template image"));
            });

            // Create Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Use API provided dimensions if available to ensure consistency with preview
            const width = certificateData.width || img.width;
            const height = certificateData.height || img.height;

            canvas.width = width;
            canvas.height = height;

            // Draw Base Image
            ctx.drawImage(img, 0, 0, width, height);
            await document.fonts.ready;

            // Function to capitalize text (first letter of each word)
            const capitalizeText = (text) => {
                if (!text) return text;
                return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            };

            // Function to draw styled text
            const drawText = (text, style) => {
                if (!style || !text) return;

                const weight = style.bold ? 'bold ' : '';
                const italic = style.italic ? 'italic ' : '';
                const fontFamily = style.fontFamily || 'Inter, sans-serif';

                const getFontSizePx = (size, canvasWidth) => {
                    if (size?.includes('%')) {
                        return (parseFloat(size) / 100) * canvasWidth;
                    }
                    return parseFloat(size);
                };

                const fontSizePx = getFontSizePx(style.fontSize, canvas.width);

                ctx.font = `${weight}${italic}${fontSizePx}px ${fontFamily}`;
                ctx.fillStyle = style.textColor || '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const parsePos = (pos, base) => {
                    if (!pos) return base / 2;
                    const val = parseFloat(pos);
                    if (isNaN(val)) return base / 2;

                    return pos.toString().includes('%')
                        ? (val / 100) * base
                        : val;
                };

                const x = parsePos(style.horizontalPosition, canvas.width);
                const y = parsePos(style.verticalPosition, canvas.height);

                ctx.fillText(text, x, y);
            };




            // 1. Student Name
            const studentFont = fontCSSMap[certificateData.studentName?.fontFamily] || 'Inter, sans-serif';
            await ensureFontLoaded(studentFont);
            drawText(capitalizeText(resultData.student?.name), {
                ...certificateData.studentName,
                fontFamily: studentFont
            });

            // 2. Assessment Name
            if (certificateData.assessmentName) {
                const assessmentFont = fontCSSMap[certificateData.assessmentName?.fontFamily] || 'Inter, sans-serif';
                await ensureFontLoaded(assessmentFont);
                const aName = resultData.assesmentQuestions?.assesmentId?.assessmentName ||
                    resultData.assessmentQuestions?.assesmentId?.assessmentName;
                drawText(aName, {
                    ...certificateData.assessmentName,
                    fontFamily: assessmentFont
                });
            }

            // 3. College Name
            if (certificateData.collegeName) {
                const collegeFont = fontCSSMap[certificateData.collegeName?.fontFamily] || 'Inter, sans-serif';
                await ensureFontLoaded(collegeFont);
                drawText(resultData.student?.college, {
                    ...certificateData.collegeName,
                    fontFamily: collegeFont
                });
            }

            // 4. Date
            if (certificateData.date) {
                const dateFont = fontCSSMap[certificateData.date?.fontFamily] || 'Inter, sans-serif';
                await ensureFontLoaded(dateFont);
                const dateToUse = location.state?.submissionDate || new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });
            
                drawText(dateToUse, {
                    ...certificateData.date,
                    fontFamily: dateFont
                });
            }

            // 5. Assessment Code
            if (certificateData.assessmentCode) {
                const codeFont = fontCSSMap[certificateData.assessmentCode?.fontFamily] || 'Inter, sans-serif';
                await ensureFontLoaded(codeFont);
                const aCode = resultData.student?.code || "DIGICODERS";
                drawText(aCode, {
                    ...certificateData.assessmentCode,
                    fontFamily: codeFont
                });
            }


            // Generate blob with dynamic quality to keep size <= 3MB
            let quality = 1.0; // start with max quality
            let blob;
            let dataUrl;
            const maxBytes = 3 * 1024 * 1024; // 3 MB max

            do {
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                blob = await (await fetch(dataUrl)).blob();

                if (blob.size <= maxBytes) break; // size acceptable
                quality -= 0.05; // gradually reduce quality
            } while (quality > 0.1);

            const fileName = `DigiCoders_Certificate_${(resultData.student?.name || 'Student').replace(/\s+/g, '_')}.jpg`;
            const file = new File([blob], fileName, { type: "image/jpeg" });

            // Upload the certificate
            if (resultData.student?._id) {
                try {
                    await uploadStudentCertificateApi(resultData.student._id, file);
                    console.log("Certificate uploaded successfully");

                    // Refresh result data from server to ensure state is in sync with the new certificate URL
                    await fetchResult();

                } catch (uploadError) {
                    console.error("Failed to upload certificate:", uploadError);
                    // Proceed to download anyway so user gets their file
                }
            }

            // Trigger Download
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.update(toastId, {
                render: "Certificate downloaded and saved!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
        } catch (error) {
            console.error("Certificate generation failed:", error);
            toast.update(toastId, {
                render: `Failed to generate certificate: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <div id="result-screen">

            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
                {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} style={{ zIndex: 50, pointerEvents: 'none' }} />}

                <div id="result-card" ref={resultRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-4 md:p-6 relative z-10 border border-gray-100 text-center animate-fade-in-up">

                    {/* Header */}
                    <div className="mb-4">
                        <div className="flex justify-center mb-3">
                            <img
                                src="/icon.jpg"
                                alt="DigiCoders Logo"
                                className="h-24 md:h-32 object-contain mix-blend-darken"
                            />
                        </div>
                        <div className="flex flex-col justify-center items-center gap-2 mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#0D9488] text-center">
                                Congratulations, <span className='text-purple-500'>{resultData.student?.name?.split(' ')[0]}!</span>
                            </h2>
                        </div>

                        <p className="text-gray-500 text-base">You have successfully completed the assessment.</p>

                        {/* Assessment Details Table */}
                        <div className="mt-4 mb-6">
                            {/* Desktop Table */}
                            <div className="hidden md:block border border-gray-300 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="py-3 px-4 text-center font-bold text-gray-700">Assessment Code</th>
                                            <th className="py-3 px-4 text-center font-bold text-gray-700">Date</th>
                                            <th className="py-3 px-4 text-center font-bold text-gray-700">Time</th>
                                            <th className="py-3 px-4 text-center font-bold text-gray-700">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="py-3 px-4 text-center font-medium text-gray-600">{resultData.student?.code}</td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-600">{location.state?.submissionDate || (resultData.createdAt ? new Date(resultData.createdAt).toLocaleDateString() : new Date().toLocaleDateString())}</td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-600">{location.state?.submissionTime || new Date(resultData.createdAt).toLocaleTimeString()}</td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-600">{resultData.duration || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Compact Layout - Labels Left, Values Right */}
                            <div className="md:hidden border border-gray-300 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700 text-sm">Assessment Code:</span>
                                    <span className="font-medium text-gray-600 text-sm">{resultData.student?.code}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700 text-sm">Date:</span>
                                    <span className="font-medium text-gray-600 text-sm">{location.state?.submissionDate || (resultData.createdAt ? new Date(resultData.createdAt).toLocaleDateString() : new Date().toLocaleDateString())}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700 text-sm">Time:</span>
                                    <span className="font-medium text-gray-600 text-sm">{location.state?.submissionTime || new Date(resultData.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700 text-sm">Duration:</span>
                                    <span className="font-medium text-gray-600 text-sm">{resultData.duration || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 mb-3">
                        <h3 className="text-lg font-bold text-[#1F2937] mb-4 border-b-2 border-[#0D9488] pb-1 inline-block">Assessment Result</h3>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-5">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Questions</p>
                                <p className="text-2xl font-black text-[#1F2937]">{resultData.total}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Attempted</p>
                                <p className="text-2xl font-black text-blue-600">{resultData.attempted}</p>
                            </div>
                            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">Correct</p>
                                <p className="text-2xl font-black text-[#0D9488]">{resultData.correct}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Incorrect</p>
                                <p className="text-2xl font-black text-red-500">{resultData.incorrect}</p>
                            </div>
                        </div>

                        {/* Final Score */}
                        <div className="w-full max-w-md bg-gradient-to-r from-[#0D9488] to-[#115E59] rounded-2xl p-6 text-white shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
                            <p className="text-teal-100 font-bold mb-2 uppercase tracking-widest text-sm">Your Final Score</p>
                            <p className="text-5xl md:text-6xl font-black">{resultData.correct} <span className="text-3xl text-teal-200">/ {resultData.total}</span></p>
                        </div>

                        {/* Actions */}
                        <div id="action-buttons" className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={handleSaveResult}
                                className="flex items-center gap-2 px-8 py-3 bg-[#0D9488] hover:bg-[#115E59] text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1"
                            >
                                <Download size={20} /> SAVE RESULT
                            </button>
                        </div>

                        {/* Social Media Links */}
                        <div id="social-media" className="mt-6 pt-4 border-t border-gray-200">
                            <p className="text-gray-600 text-sm mb-3 font-medium">Follow us on social media</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <a
                                    href="https://www.youtube.com/@digicoders"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <Youtube size={16} />
                                </a>
                                <a
                                    href="https://www.whatsapp.com/channel/0029VaDTIxW5EjxzOyubYT3l"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <MessageCircle size={16} />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/digicoders/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <Linkedin size={16} />
                                </a>
                                <a
                                    href="https://www.instagram.com/digicoderstech/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <Instagram size={16} />
                                </a>
                                <a
                                    href="https://www.facebook.com/DigiCodersTech/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <Facebook size={16} />
                                </a>
                                <a
                                    href="https://t.me/digicoderstech"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all hover:scale-105 shadow-md"
                                >
                                    <Send size={16} />
                                </a>
                            </div>
                        </div>

                        <p className="mt-4 text-gray-400 text-sm">Congratulations! You have completed the assessment.</p>
                    </div>
                </div>
            </div>

            {/* Fixed Certificate Button at Bottom */}
            {certificateData && (
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-center">
                    <button
                        onClick={handleDownloadCertificate}
                        className="w-4/5 md:w-full md:max-w-2xl flex items-center justify-center gap-2 px-6 py-2 md:py-4 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 text-sm md:text-lg"
                    >
                        <Download size={24} /> DOWNLOAD CERTIFICATE
                    </button>
                </div>
            )}
        </div>


    );
}
