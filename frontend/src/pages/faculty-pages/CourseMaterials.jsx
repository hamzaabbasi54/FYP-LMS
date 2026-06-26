import React, { useState } from 'react';
import { MdUpload, MdFolder, MdPictureAsPdf, MdVideoLibrary, MdDescription, MdVisibility, MdVisibilityOff, MdCheck, MdClose, MdCloudUpload } from 'react-icons/md';

const CourseMaterials = () => {
    // Mock data for existing materials
    const [materials] = useState([
        { id: 1, title: 'Week 1 - Introduction to Programming', type: 'pdf', category: 'Lecture Slides', visible: true, uploadDate: '2024-01-15' },
        { id: 2, title: 'Lab 1 - Setup Guide', type: 'pdf', category: 'Lab Manual', visible: true, uploadDate: '2024-01-16' },
        { id: 3, title: 'Tutorial Video - Variables', type: 'video', category: 'Video', visible: false, uploadDate: '2024-01-18' },
        { id: 4, title: 'Assignment 1 Guidelines', type: 'doc', category: 'Assignment', visible: true, uploadDate: '2024-01-20' },
    ]);

    // Upload dialog state
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [uploadStep, setUploadStep] = useState(0); // 0: initial, 1: validating, 2: uploading, 3: saving, 4: complete
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileTitle, setFileTitle] = useState('');
    const [fileCategory, setFileCategory] = useState('Lecture Slides');
    const [fileVisibility, setFileVisibility] = useState(true);

    const categories = ['Lecture Slides', 'Lab Manual', 'Assignment', 'Video', 'Reference Material'];

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return <MdPictureAsPdf className="w-6 h-6 text-red-500" />;
            case 'video': return <MdVideoLibrary className="w-6 h-6 text-purple-500" />;
            default: return <MdDescription className="w-6 h-6 text-blue-500" />;
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileTitle(file.name.split('.')[0]);
        }
    };

    const simulateUpload = () => {
        // Step 1: Validate
        setUploadStep(1);
        setTimeout(() => {
            // Step 2: Upload to Storage
            setUploadStep(2);
            setTimeout(() => {
                // Step 3: Save Metadata
                setUploadStep(3);
                setTimeout(() => {
                    // Step 4: Complete
                    setUploadStep(4);
                }, 1000);
            }, 1500);
        }, 800);
    };

    const resetUpload = () => {
        setShowUploadDialog(false);
        setUploadStep(0);
        setSelectedFile(null);
        setFileTitle('');
        setFileCategory('Lecture Slides');
        setFileVisibility(true);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Course Materials</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and upload course materials for students</p>
                </div>
                <button
                    onClick={() => setShowUploadDialog(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors text-sm"
                >
                    <MdUpload className="w-5 h-5" />
                    Upload Material
                </button>
            </div>

            {/* Materials List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <MdFolder className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800">All Materials</h3>
                    <span className="ml-auto text-sm text-slate-400">{materials.length} files</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {materials.map((material) => (
                        <div key={material.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                {getFileIcon(material.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-800 truncate">{material.title}</h4>
                                <p className="text-sm text-slate-500">{material.category} <span className="text-slate-300">•</span> {material.uploadDate}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {material.visible ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                        <MdVisibility className="w-3 h-3" /> Visible
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded">
                                        <MdVisibilityOff className="w-3 h-3" /> Hidden
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Dialog - Simulates UC-8 Sequence */}
            {showUploadDialog && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden border border-slate-200">
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Upload Course Material</h2>
                            <button onClick={resetUpload} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <MdClose className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="p-5 space-y-4">
                            {uploadStep === 0 && (
                                <>
                                    {/* File Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Select File</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50"
                                            onClick={() => document.getElementById('fileInput').click()}>
                                            <MdCloudUpload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                                            {selectedFile ? (
                                                <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-sm text-slate-500">Click to select a file</p>
                                            )}
                                            <input
                                                id="fileInput"
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                                            />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Title</label>
                                        <input
                                            type="text"
                                            value={fileTitle}
                                            onChange={(e) => setFileTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 shadow-sm"
                                            placeholder="Enter material title"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Category</label>
                                        <select
                                            value={fileCategory}
                                            onChange={(e) => setFileCategory(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 shadow-sm"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Visibility Toggle */}
                                    <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">Visibility</p>
                                            <p className="text-xs text-slate-500">Students can see this material</p>
                                        </div>
                                        <button
                                            onClick={() => setFileVisibility(!fileVisibility)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${fileVisibility ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${fileVisibility ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Upload Progress Steps - Simulating Sequence Diagram */}
                            {uploadStep > 0 && (
                                <div className="space-y-4 py-4">
                                    <h3 className="text-sm font-bold text-slate-600 text-center mb-4">Upload Progress</h3>

                                    {/* Step 1: Validate */}
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${uploadStep >= 1 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadStep > 1 ? 'bg-emerald-500' : uploadStep === 1 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            {uploadStep > 1 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm font-bold">1</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Validate File Type/Size</p>
                                            <p className="text-xs text-slate-500">Checking file requirements...</p>
                                        </div>
                                        {uploadStep === 1 && <div className="ml-auto w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                    </div>

                                    {/* Step 2: Upload to Storage */}
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${uploadStep >= 2 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadStep > 2 ? 'bg-emerald-500' : uploadStep === 2 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            {uploadStep > 2 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm font-bold">2</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Upload to Storage Service</p>
                                            <p className="text-xs text-slate-500">Uploading file to cloud...</p>
                                        </div>
                                        {uploadStep === 2 && <div className="ml-auto w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                    </div>

                                    {/* Step 3: Save Metadata */}
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${uploadStep >= 3 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadStep > 3 ? 'bg-emerald-500' : uploadStep === 3 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            {uploadStep > 3 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm font-bold">3</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Save Metadata to Database</p>
                                            <p className="text-xs text-slate-500">Storing title, category, visibility...</p>
                                        </div>
                                        {uploadStep === 3 && <div className="ml-auto w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                    </div>

                                    {/* Step 4: Complete */}
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${uploadStep >= 4 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadStep >= 4 ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            {uploadStep >= 4 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm font-bold">4</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Upload Complete</p>
                                            <p className="text-xs text-slate-500">Material added to course list</p>
                                        </div>
                                    </div>

                                    {uploadStep === 4 && (
                                        <div className="text-center pt-4">
                                            <p className="text-emerald-600 font-bold">✓ Material uploaded successfully!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50">
                            {uploadStep === 0 && (
                                <>
                                    <button
                                        onClick={resetUpload}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={simulateUpload}
                                        disabled={!selectedFile || !fileTitle}
                                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MdUpload className="w-4 h-4" />
                                        Upload
                                    </button>
                                </>
                            )}
                            {uploadStep === 4 && (
                                <button
                                    onClick={resetUpload}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-medium hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseMaterials;
