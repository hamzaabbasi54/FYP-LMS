import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete, MdSave, MdRefresh, MdArrowBack, MdClose, MdFileUpload, MdFileDownload } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { courseApi, authApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';

const AddCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const fileInputRef = React.useRef(null);

    const [courseData, setCourseData] = useState({
        title: '', code: '', department_id: '', credit_hours: '',
        semester_level: '', prerequisites: '', description: ''
    });

    const [clos, setClos] = useState([
        { id: 1, title: '', description: '', cognitiveLevel: '', mapped_plos: [] }
    ]);

    const [isPloModalOpen, setIsPloModalOpen] = useState(false);
    const [availablePlos, setAvailablePlos] = useState([]);
    const [activeCloId, setActiveCloId] = useState(null);

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const res = await authApi.getFaculties();
                if (res.success) setFaculties(res.data || []);
            } catch (err) { console.error(err); }
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        const fetchDepts = async () => {
            if (selectedFaculty) {
                try {
                    const res = await authApi.getDepartments(selectedFaculty);
                    if (res.success) setDepartments(res.data || []);
                } catch (err) { console.error(err); }
            } else {
                setDepartments([]);
            }
        };
        fetchDepts();
    }, [selectedFaculty]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData({ ...courseData, [name]: value });
    };

    const handleCloChange = (id, field, value) => {
        setClos(clos.map(clo => clo.id === id ? { ...clo, [field]: value } : clo));
    };

    const addClo = () => {
        const newId = clos.length > 0 ? Math.max(...clos.map(c => c.id)) + 1 : 1;
        setClos([...clos, { id: newId, title: '', description: '', cognitiveLevel: '', mapped_plos: [] }]);
    };

    const removeClo = (id) => {
        if (clos.length === 1) return;
        setClos(clos.filter(clo => clo.id !== id));
    };

    const handleOpenPloModal = async (cloId) => {
        if (!courseData.department_id) {
            toast.warning('Please select a department first');
            return;
        }
        setActiveCloId(cloId);
        try {
            const res = await departmentApi.getPLOs(courseData.department_id);
            if (res.success) setAvailablePlos(res.data || []);
            setIsPloModalOpen(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch PLOs for this department');
        }
    };

    const togglePloForClo = (plo) => {
        setClos(clos.map(clo => {
            if (clo.id === activeCloId) {
                const isMapped = clo.mapped_plos.some(p => p.id === plo.id);
                return {
                    ...clo,
                    mapped_plos: isMapped 
                        ? clo.mapped_plos.filter(p => p.id !== plo.id)
                        : [...clo.mapped_plos, { id: plo.id, number: plo.plo_number }]
                };
            }
            return clo;
        }));
    };

    const handleSubmit = async () => {
        if (!courseData.title || !courseData.code || !courseData.department_id || !courseData.credit_hours) {
            toast.error('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                title: courseData.title,
                code: courseData.code,
                department_id: parseInt(courseData.department_id),
                credit_hours: parseInt(courseData.credit_hours),
                description: courseData.description,
                clos: clos.filter(c => c.title || c.description).map((c, i) => ({
                    clo_number: i + 1,
                    title: c.title,
                    description: c.description,
                    cognitive_level: c.cognitiveLevel,
                    mapped_plos: c.mapped_plos.map(p => p.id)
                }))
            };
            const response = await courseApi.create(payload);
            if (response.success) {
                toast.success('Course created successfully!');
                navigate('/admin-managecourses');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error(error.response?.data?.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCourseData({ title: '', code: '', department_id: '', credit_hours: '', semester_level: '', prerequisites: '', description: '' });
        setClos([{ id: 1, title: '', description: '', cognitiveLevel: '', mapped_plos: [] }]);
        setSelectedFaculty('');
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await courseApi.import(file);
            if (response.success) {
                toast.success(`Import successful: ${response.data.imported} added, ${response.data.skipped} skipped`);
                if (response.data.errors && response.data.errors.length > 0) {
                    console.warn('Import warnings:', response.data.errors);
                    toast.warning('Some rows had errors. Check console for details.');
                }
                setTimeout(() => navigate('/admin-managecourses'), 1500);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error(error.response?.data?.message || 'Failed to import courses');
        } finally {
            setLoading(false);
            e.target.value = ''; // reset
        }
    };

    const handleExport = () => {
        courseApi.export();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managecourses" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Courses
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Add New Course</h1>
                        <p className="text-slate-500 mt-1">Create a new course or import bulk courses from Excel.</p>
                    </div>
                    <div className="flex gap-3">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                        />
                        <button
                            type="button"
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                        >
                            <MdFileDownload className="w-5 h-5 text-slate-500" />
                            Export Courses
                        </button>
                        <button
                            type="button"
                            onClick={handleImportClick}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-70"
                        >
                            <MdFileUpload className="w-5 h-5" />
                            Import from Excel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Course Title */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title <span className="text-red-500">*</span></label>
                            <input type="text" name="title" value={courseData.title} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. Introduction to Computer Science" />
                        </div>

                        {/* Course Code */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Code <span className="text-red-500">*</span></label>
                            <input type="text" name="code" value={courseData.code} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. CS-101" />
                        </div>

                        {/* Faculty */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                            <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setCourseData({...courseData, department_id: ''}); }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select Faculty</option>
                                {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                            <select name="department_id" value={courseData.department_id} onChange={handleInputChange} disabled={!selectedFaculty}
                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100">
                                <option value="">{selectedFaculty ? 'Select Department' : 'Select Faculty first'}</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Credit Hours */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Hours <span className="text-red-500">*</span></label>
                            <input type="number" name="credit_hours" value={courseData.credit_hours} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 3" min="1" max="6" />
                        </div>

                        {/* Prerequisites */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Prerequisites</label>
                            <input type="text" name="prerequisites" value={courseData.prerequisites} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. None" />
                        </div>

                        {/* Description */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
                            <textarea rows="4" name="description" value={courseData.description} onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Enter a detailed description of the course content..." />
                        </div>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* CLO Section */}
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Course Learning Outcomes (CLOs)</h3>
                    <div className="space-y-6">
                        {clos.map((clo, index) => (
                            <div key={clo.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative group">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                                        <input type="text" value={clo.title} onChange={(e) => handleCloChange(clo.id, 'title', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded bg-white focus:border-blue-500 outline-none"
                                            placeholder={`CLO ${index + 1}`} />
                                        <span className="text-xs font-bold text-gray-400 mt-1 block">CLO {index + 1}</span>
                                    </div>
                                    <div className="md:col-span-8">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                                        <textarea rows="2" value={clo.description} onChange={(e) => handleCloChange(clo.id, 'description', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded bg-white focus:border-blue-500 outline-none resize-none"
                                            placeholder="Describe the learning outcome..." />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cognitive Level</label>
                                        <select value={clo.cognitiveLevel} onChange={(e) => handleCloChange(clo.id, 'cognitiveLevel', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded bg-white outline-none">
                                            <option value="">Select</option>
                                            <option value="C1">C1 - Remember</option>
                                            <option value="C2">C2 - Understand</option>
                                            <option value="C3">C3 - Apply</option>
                                            <option value="C4">C4 - Analyze</option>
                                            <option value="C5">C5 - Evaluate</option>
                                            <option value="C6">C6 - Create</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">PLO Mapping</label>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {clo.mapped_plos.map(plo => (
                                                <span key={plo.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-200">
                                                    PLO-{plo.number}
                                                </span>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => handleOpenPloModal(clo.id)} className="w-full py-1.5 border border-dashed border-gray-400 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-500 transition text-sm flex items-center justify-center">
                                            <MdAdd className="mr-1" /> Add PLOs
                                        </button>
                                    </div>
                                    <div className="md:col-span-4 flex items-end justify-end">
                                        <button type="button" onClick={() => removeClo(clo.id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded hover:bg-red-100 transition">
                                            <MdDelete className="w-4 h-4 inline mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <button type="button" onClick={addClo}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
                            <MdAdd className="mr-2" /> Add New CLO
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 flex items-center space-x-4">
                        <button onClick={handleSubmit} disabled={loading}
                            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50">
                            <MdSave className="mr-2" /> {loading ? 'Saving...' : 'Add Course'}
                        </button>
                        <button onClick={handleReset} type="button"
                            className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 border border-gray-200 transition-all">
                            <MdRefresh className="mr-2" /> Reset Form
                        </button>
                    </div>
                </div>
            </div>

            {/* PLO Modal */}
            {isPloModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Map PLOs to CLO</h2>
                            <button onClick={() => setIsPloModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {availablePlos.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No PLOs defined for this department yet.</p>
                            ) : (
                                availablePlos.map(plo => {
                                    const activeClo = clos.find(c => c.id === activeCloId);
                                    const isMapped = activeClo?.mapped_plos.some(p => p.id === plo.id);
                                    return (
                                        <div key={plo.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isMapped ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`} onClick={() => togglePloForClo(plo)}>
                                            <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center border ${isMapped ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                {isMapped && <MdClose className="w-3 h-3 transform rotate-45" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">PLO-{plo.plo_number}</h4>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{plo.description}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsPloModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCourse;