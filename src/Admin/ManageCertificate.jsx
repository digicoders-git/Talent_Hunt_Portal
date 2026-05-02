import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Search, Edit, Trash2, X, Eye, ArrowLeft, Save, Image as ImageIcon, Type, Layout, Grid, Loader2, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getAllCertificatesApi, toggleCertificateStatusApi, deleteCertificateApi, getSingleCertificateApi, createCertificateApi, updateCertificateApi } from '../API/certificate';

export function ManageCertificate() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const canvasRef = useRef(null);

    // Load Google Fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Lobster&family=Pacifico&family=Great+Vibes&family=Satisfy&family=Kaushan+Script&family=Dancing+Script&family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const response = await getAllCertificatesApi();
            if (response.success) {
                setCertificates(response.certificates || []);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch certificates');
        } finally {
            setLoading(false);
        }
    };

    const initialFormState = {
        name: '',
        image: null,
        imageFile: null, // To store the actual File object
        width: 0,
        height: 0,
        studentName: { status: true, textColor: '#000000', verticalPosition: '50%', horizontalPosition: '50%', fontSize: '30px', fontFamily: 'Inter', bold: false, italic: false, underline: false },
        assessmentName: { status: false, textColor: '#000000', verticalPosition: '40%', horizontalPosition: '50%', fontSize: '20px', fontFamily: 'Inter', bold: false, italic: false, underline: false },
        assessmentCode: { status: false, textColor: '#000000', verticalPosition: '65%', horizontalPosition: '50%', fontSize: '16px', fontFamily: 'Inter', bold: false, italic: false, underline: false },
        collegeName: { status: false, textColor: '#000000', verticalPosition: '25%', horizontalPosition: '50%', fontSize: '18px', fontFamily: 'Inter', bold: false, italic: false, underline: false },
        date: { status: false, textColor: '#000000', verticalPosition: '75%', horizontalPosition: '50%', fontSize: '14px', fontFamily: 'Inter', bold: false, italic: false, underline: false }
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleBackToList = () => {
        setView('list');
        setEditingId(null);
        setFormData(initialFormState);
        navigate('/admin/certificate');
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setView('editor');
    };

    const handleEdit = (cert) => {
        setEditingId(cert._id);

        // Check which fields are present in the response to set their ON/OFF status
        const layers = ['studentName', 'assessmentName', 'assessmentCode', 'collegeName', 'date'];
        const updatedLayers = {};

        layers.forEach(layer => {
            if (cert[layer]) {
                // If layer exists, keep its data and ensure status is true
                updatedLayers[layer] = { ...cert[layer], status: true };
            } else {
                // If layer is missing, use default settings but keep status false
                updatedLayers[layer] = { ...initialFormState[layer], status: false };
            }
        });

        setFormData({
            name: cert.certificateName,
            image: cert.certificateImage,
            imageFile: null, // Reset file so we don't re-upload unless changed
            width: cert.width || 0,
            height: cert.height || 0,
            ...updatedLayers
        });
        setView('editor');
    };

    const handlePreviewModal = async (cert) => {
        // First set the existing data as fallback so the modal opens immediately
        setSelectedImage(cert);
        setIsPreviewOpen(true);

        try {
            const response = await getSingleCertificateApi(cert._id);
            if (response && response.success && response.certificate) {
                // Then update with latest full data from backend if available
                setSelectedImage(response.certificate);
            }
        } catch (error) {
            console.error("Preview fetch error:", error);
            // Modal is already open with fallback data 'cert'
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                setFormData(prev => ({ ...prev, image: url, imageFile: file, width: img.width, height: img.height }));
            };
            img.src = url;
        }
    };

    const updateNestedState = (section, field, value) => {
        // Validation for position and font size fields
        if ((field === 'verticalPosition' || field === 'horizontalPosition' || field === 'fontSize') && typeof value === 'string' && value.includes(' ')) {
            return; // Don't allow spaces
        }

        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.image) {
            toast.error("Please provide a name and upload a certificate image.");
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();
            data.append('certificateName', formData.name);
            data.append('width', formData.width);
            data.append('height', formData.height);

            // Only send image if a new file was actually selected
            if (formData.imageFile) {
                data.append('certificateImage', formData.imageFile);
            }

            // Only send layers that are currently toggled ON
            const layers = ['studentName', 'assessmentName', 'assessmentCode', 'collegeName', 'date'];
            layers.forEach(layer => {
                if (formData[layer] && formData[layer].status) {
                    data.append(layer, JSON.stringify(formData[layer]));
                }
            });

            let response;
            if (editingId) {
                response = await updateCertificateApi(editingId, data);
            } else {
                response = await createCertificateApi(data);
            }

            if (response.success) {
                toast.success(editingId ? "Certificate updated successfully!" : "Certificate added successfully!");
                fetchCertificates();
                handleBackToList();
                window.dispatchEvent(new Event('dashboardUpdated'));
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.message || 'Failed to save certificate');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const response = await toggleCertificateStatusApi(id);
            if (response.success) {
                toast.success(response.message || "Status updated successfully");
                fetchCertificates();
                window.dispatchEvent(new Event('dashboardUpdated'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This certificate template will be permanently removed!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#319795",
            cancelButtonColor: "#f56565",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await deleteCertificateApi(id);
                    if (response.success) {
                        toast.success("Certificate deleted successfully");
                        fetchCertificates();
                        window.dispatchEvent(new Event('dashboardUpdated'));
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete certificate');
                }
            }
        });
    };

    const handleCopyCertLink = (id) => {
        const link = `${window.location.origin}/certificate/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            toast.success("Certificate direct link copied!");
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    const fontFamilies = [
        { name: 'Inter', value: 'Inter, sans-serif' },
        { name: 'Roboto', value: 'Roboto, sans-serif' },
        { name: 'Playfair Display', value: 'Playfair Display, serif' },
        { name: 'Montserrat', value: 'Montserrat, sans-serif' },
        { name: 'Dancing Script', value: 'Dancing Script, cursive' },
        { name: 'Courier New', value: 'Courier New, monospace' },
        { name: 'Lobster', value: 'Lobster, cursive' },
        { name: 'Pacifico', value: 'Pacifico, cursive' },
        { name: 'Great Vibes', value: 'Great Vibes, cursive' },
        { name: 'Satisfy', value: 'Satisfy, cursive' },
        { name: 'Kaushan Script', value: 'Kaushan Script, cursive' },
        { name: 'Crimson Text', value: 'Crimson Text, serif' },
        { name: 'Libre Baskerville', value: 'Libre Baskerville, serif' },
        { name: 'Cormorant Garamond', value: 'Cormorant Garamond, serif' }
    ];

    // Canvas drawing effect for Editor
    useEffect(() => {
        if (view !== 'editor' || !formData.image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = formData.image;

        img.onload = () => {
            const width = formData.width || img.width;
            const height = formData.height || img.height;

            // Set canvas resolution to match image
            canvas.width = width;
            canvas.height = height;

            // Clear and draw base image
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Draw layers
            const layers = [
                { id: 'studentName', sample: 'Gunjan Rathore' },
                { id: 'assessmentName', sample: 'html&Jquery' },
                { id: 'assessmentCode', sample: 'hhh-3344' },
                { id: 'collegeName', sample: 'MMIT Kushinagar' },
                { id: 'date', sample: '27/01/2026' }
            ];

            layers.forEach(layer => {
                const settings = formData[layer.id];
                if (!settings || !settings.status) return;

                const fontDetail = fontFamilies.find(f => f.name === settings.fontFamily);
                const fontStyle = fontDetail ? fontDetail.value : 'Inter, sans-serif';
                const weight = settings.bold ? 'bold ' : '';
                const italic = settings.italic ? 'italic ' : '';
                const underline = settings.underline;

                const sizeVal = parseFloat(settings.fontSize);
                const sizePx = isNaN(sizeVal) ? 30 : sizeVal;

                ctx.font = `${weight}${italic}${sizePx}px ${fontStyle}`;
                ctx.fillStyle = settings.textColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const x = settings.horizontalPosition.toString().includes('%')
                    ? (parseFloat(settings.horizontalPosition) / 100) * width
                    : parseFloat(settings.horizontalPosition);

                const y = settings.verticalPosition.toString().includes('%')
                    ? (parseFloat(settings.verticalPosition) / 100) * height
                    : parseFloat(settings.verticalPosition);

                ctx.fillText(layer.sample, x, y);

                if (underline) {
                    const metrics = ctx.measureText(layer.sample);
                    const lineWidth = metrics.width;
                    const lineY = y + sizePx * 0.5;
                    ctx.beginPath();
                    ctx.strokeStyle = settings.textColor;
                    ctx.lineWidth = sizePx * 0.05;
                    ctx.moveTo(x - lineWidth / 2, lineY);
                    ctx.lineTo(x + lineWidth / 2, lineY);
                    ctx.stroke();
                }
            });
        };
    }, [formData, view]);

    if (view === 'editor') {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Editor Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{editingId ? 'Edit Certificate' : 'Create New Certificate'}</h2>
                            <p className="text-sm text-gray-500">Design your certificate layout with live preview</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 ${saving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'} text-white px-6 py-2.5 rounded-lg font-medium transition-all active:scale-95 w-full sm:w-auto justify-center`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Certificate
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Properties */}
                    <div className="lg:col-span-5 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2 custom-scrollbar">
                        {/* Basic Details */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Layout className="h-4 w-4 text-teal-500" />
                                Basic Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CERTIFICATE NAME</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. React Workshop Completion"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">UPLOAD TEMPLATE</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="cert-upload"
                                            accept="image/*"
                                        />
                                        <label
                                            htmlFor="cert-upload"
                                            className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-teal-500 hover:bg-teal-50 transition-all cursor-pointer"
                                        >
                                            <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-teal-500" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700">Click to upload template</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG recommended (1200x800)</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Text Layer Components */}
                        {[
                            { id: 'studentName', label: 'Student Name', sample: 'Gunjan Rathore' },
                            { id: 'assessmentName', label: 'Assessment Name', sample: 'DigiCoders' },
                            { id: 'assessmentCode', label: 'Assessment Code', sample: 'dct-2026' },
                            { id: 'collegeName', label: 'College Name', sample: 'MMIT Kushinagar' },
                            { id: 'date', label: 'Date', sample: '27/01/2026' }
                        ].map((layer) => (
                            <div key={layer.id} className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                        <Type className="h-4 w-4 text-teal-500" />
                                        {layer.label}
                                    </h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData[layer.id].status}
                                            onChange={(e) => updateNestedState(layer.id, 'status', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                {formData[layer.id].status && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-2">
                                        {/* Font Family and Font Style on same line */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Font Family</label>
                                            <select
                                                value={formData[layer.id].fontFamily}
                                                onChange={(e) => updateNestedState(layer.id, 'fontFamily', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            >
                                                {fontFamilies.map(f => (
                                                    <option key={f.name} value={f.name}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Font Style Options */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Font Style</label>
                                            <div className="flex gap-1 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => updateNestedState(layer.id, 'bold', !formData[layer.id].bold)}
                                                    className={`px-3 py-1.5 text-xs font-bold border rounded transition-colors ${formData[layer.id].bold
                                                        ? 'bg-teal-500 text-white border-teal-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-500'
                                                        }`}
                                                >
                                                    B
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateNestedState(layer.id, 'italic', !formData[layer.id].italic)}
                                                    className={`px-3 py-1.5 text-xs italic border rounded transition-colors ${formData[layer.id].italic
                                                        ? 'bg-teal-500 text-white border-teal-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-500'
                                                        }`}
                                                >
                                                    I
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateNestedState(layer.id, 'underline', !formData[layer.id].underline)}
                                                    className={`px-3 py-1.5 text-xs underline border rounded transition-colors ${formData[layer.id].underline
                                                        ? 'bg-teal-500 text-white border-teal-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-500'
                                                        }`}
                                                >
                                                    U
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Font Size</label>
                                            <input
                                                type="text"
                                                value={formData[layer.id].fontSize}
                                                onChange={(e) => updateNestedState(layer.id, 'fontSize', e.target.value)}
                                                placeholder="e.g. 30px or 2rem"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Text Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={formData[layer.id].textColor}
                                                    onChange={(e) => updateNestedState(layer.id, 'textColor', e.target.value)}
                                                    className="w-12 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer bg-white"
                                                    style={{ minWidth: '40px' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={formData[layer.id].textColor}
                                                    onChange={(e) => updateNestedState(layer.id, 'textColor', e.target.value)}
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase font-serif">Vertical Position</label>
                                            <input
                                                type="text"
                                                value={formData[layer.id].verticalPosition}
                                                onChange={(e) => updateNestedState(layer.id, 'verticalPosition', e.target.value)}
                                                placeholder="e.g. 50% or 100px"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Horizontal Position</label>
                                            <input
                                                type="text"
                                                value={formData[layer.id].horizontalPosition}
                                                onChange={(e) => updateNestedState(layer.id, 'horizontalPosition', e.target.value)}
                                                placeholder="e.g. 50% or 200px"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Live Preview */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Grid className="h-4 w-4 text-teal-500" />
                                    Live Preview
                                </div>
                            </h3>

                            <div className="bg-slate-100 rounded-lg border-4 border-slate-200 overflow-hidden relative flex items-center justify-center p-1">
                                {formData.image ? (
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-auto object-contain shadow-sm bg-white"
                                        style={{ maxHeight: '70vh' }}
                                    />
                                ) : (
                                    <div className="text-center p-12 w-full">
                                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">Upload a template image to begin</p>
                                        <p className="text-xs text-gray-400 mt-2">Recommended size: 2000x1414px (A4 Landscape)</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                                <h4 className="text-xs font-bold text-teal-700 uppercase mb-2">Editor Hub Tip:</h4>
                                <p className="text-xs text-teal-600 leading-relaxed">
                                    Use the Vertical and Horizontal position sliders to align text over the specific placeholders in your certificate image. Changes reflect instantly in the preview above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800"></h2>
                    <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-teal-600 font-semibold cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Manage Certificate</span>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    New Certificate
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 min-h-[400px]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-gray-700 font-bold uppercase text-xs tracking-widest">Available Templates</h3>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-teal-500 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#319795] mb-4" />
                        <p className="text-gray-500 font-medium font-inter">Loading certificates...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-gray-100 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Certificate Identity</th>
                                    <th className="px-6 py-4">Visual Preview</th>
                                    <th className="px-6 py-4">Assignments</th>
                                    <th className="px-6 py-4">Enrollment</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(() => {
                                    const filtered = certificates.filter(cert =>
                                        cert.certificateName.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
                                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                                    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                                    if (paginated.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                                                        <p className="text-lg font-bold">No Certificates Available</p>
                                                        <p className="text-sm">Adjust your search or create a new template.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <>
                                            {paginated.map((cert, index) => (
                                                <tr key={cert._id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800">{cert.certificateName}</div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">ID: {cert._id.slice(-6).toUpperCase()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded overflow-hidden flex items-center justify-center relative group-hover:ring-2 ring-teal-500/20 transition-all">
                                                            {cert.certificateImage ? (
                                                                <img src={cert.certificateImage} alt="cert" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-slate-300" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs font-medium border border-slate-200">
                                                            {cert.usedIn || 0} Assessments
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs">{new Date(cert.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={cert.status}
                                                                onChange={() => toggleStatus(cert._id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                                                        </label>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                                            <button
                                                                onClick={() => handlePreviewModal(cert)}
                                                                className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 p-2 rounded-lg transition-all"
                                                                title="Preview Full Size"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(cert)}
                                                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                                                                title="Edit Template"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(cert._id)}
                                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                                title="Delete Template"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Pagination Footer - Added inside tbody to span columns or moved outside if structure allows */}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls outside overflow container */}
                {(() => {
                    const filtered = certificates.filter(cert =>
                        cert.certificateName.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                    if (totalPages <= 1) return null;

                    return (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                            <p className="text-xs text-gray-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} templates
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-teal-600"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1.5 bg-teal-500 text-white rounded font-medium text-sm">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-teal-600"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Canvas Preview Modal */}
            {isPreviewOpen && selectedImage && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedImage.certificateName}</h3>
                            {/* Canvas element for preview */}
                            <canvas
                                ref={canvas => {
                                    if (!canvas) return;
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.crossOrigin = "anonymous";
                                    img.src = selectedImage.certificateImage;
                                    img.onload = () => {
                                        const width = selectedImage.width || img.width;
                                        const height = selectedImage.height || img.height;
                                        canvas.width = width;
                                        canvas.height = height;
                                        ctx.clearRect(0, 0, width, height);
                                        ctx.drawImage(img, 0, 0, width, height);
                                        const layers = [
                                            { id: 'studentName', sample: 'Gunajan Rathore' },
                                            { id: 'assessmentName', sample: 'Html&Jquery' },
                                            { id: 'assessmentCode', sample: 'dct-2026' },
                                            { id: 'collegeName', sample: 'MMIT Kushinaagr' },
                                            { id: 'date', sample: '27/01/2026' }
                                        ];
                                        layers.forEach(layer => {
                                            const settings = selectedImage[layer.id];
                                            if (!settings) return;
                                            const fontDetail = fontFamilies.find(f => f.name === settings.fontFamily);
                                            const fontStyle = fontDetail ? fontDetail.value : 'inherit';
                                            const weight = settings.bold ? 'bold' : 'normal';
                                            const italic = settings.italic ? 'italic' : '';
                                            const sizePx = parseFloat(settings.fontSize);
                                            ctx.font = `${weight} ${italic} ${sizePx}px ${fontStyle}`;
                                            ctx.fillStyle = settings.textColor || '#000';
                                            ctx.textAlign = 'center';
                                            const x = settings.horizontalPosition.includes('%')
                                                ? (parseFloat(settings.horizontalPosition) / 100) * width
                                                : parseFloat(settings.horizontalPosition);
                                            const yBase = settings.verticalPosition.includes('%')
                                                ? (parseFloat(settings.verticalPosition) / 100) * height
                                                : parseFloat(settings.verticalPosition);
                                            const y = yBase + sizePx * 0.35;
                                            ctx.fillText(layer.sample, x, y);
                                        });
                                    };
                                }}
                                style={{ maxWidth: '100%', border: '1px solid #e5e7eb' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
