import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdSave, MdRefresh, MdArrowBack, MdClose, MdFileUpload, MdFileDownload, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { courseApi, authApi } from '../../services/api';
import { toast } from 'react-toastify';

const AddCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const fileInputRef = React.useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    // Fallback: decode JWT to get department_id if it's missing in localStorage user object
    let deptId = user.department_id;
    if (!deptId && token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            deptId = payload.department_id;
        } catch(e) {}
    }
    
    const isDeptAdmin = user.role === 'deptadmin';

    const [courseData, setCourseData] = useState({
        title: '', code: '', department_id: isDeptAdmin ? (deptId || '') : '', credit_hours: '',
        semester_level: '', description: ''
    });

    // Prerequisites state
    const [selectedPrereqs, setSelectedPrereqs] = useState([]);
    const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [prereqSearch, setPrereqSearch] = useState('');

    // CLO picker state
    const [selectedClos, setSelectedClos] = useState([]);
    const [isCloModalOpen, setIsCloModalOpen] = useState(false);
    const [allClos, setAllClos] = useState([]);
    const [cloSearch, setCloSearch] = useState('');
    const [expandedCloId, setExpandedCloId] = useState(null);

    useEffect(() => {
        if (!isDeptAdmin) {
            const fetchFaculties = async () => {
                try {
                    const res = await authApi.getFaculties();
                    if (res.success) setFaculties(res.data || []);
                } catch (err) { console.error(err); }
            };
            fetchFaculties();
        }
    }, []);

    useEffect(() => {
        if (!isDeptAdmin && selectedFaculty) {
            const fetchDepts = async () => {
                try {
                    const res = await authApi.getDepartments(selectedFaculty);
                    if (res.success) setDepartments(res.data || []);
                } catch (err) { console.error(err); }
            };
            fetchDepts();
        } else if (!isDeptAdmin) {
            setDepartments([]);
        }
    }, [selectedFaculty]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData({ ...courseData, [name]: value });
    };

    // CLO picker modal
    const handleOpenCloModal = async () => {
        try {
            const res = await courseApi.getAllCLOs();
            if (res.success) setAllClos(res.data || []);
        } catch (err) { console.error(err); }
        setCloSearch('');
        setExpandedCloId(null);
        setIsCloModalOpen(true);
    };

    const addCloToCourse = (clo) => {
        if (selectedClos.some(c => c.id === clo.id)) {
            toast.info('This CLO is already added');
            return;
        }
        setSelectedClos(prev => [...prev, clo]);
        toast.success(`${clo.title} added`);
    };

    const removeCloFromCourse = (id) => {
        setSelectedClos(prev => prev.filter(c => c.id !== id));
    };

    const filteredAllClos = allClos.filter(c =>
        (c.title || '').toLowerCase().includes(cloSearch.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(cloSearch.toLowerCase())
    );

    // Prerequisites modal
    const handleOpenPrereqModal = async () => {
        try {
            const res = await courseApi.getAllList();
            if (res.success) setAllCourses(res.data || []);
        } catch (err) { console.error(err); }
        setPrereqSearch('');
        setIsPrereqModalOpen(true);
    };

    const togglePrereq = (course) => {
        setSelectedPrereqs(prev => {
            const exists = prev.find(p => p.id === course.id);
            if (exists) return prev.filter(p => p.id !== course.id);
            return [...prev, { id: course.id, code: course.code, title: course.title }];
        });
    };

    const removePrereq = (id) => {
        setSelectedPrereqs(prev => prev.filter(p => p.id !== id));
    };

    const filteredPrereqCourses = allCourses.filter(c =>
        (c.title || '').toLowerCase().includes(prereqSearch.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(prereqSearch.toLowerCase())
    );



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
                prerequisite_ids: selectedPrereqs.map(p => p.id),
                clo_ids: selectedClos.map(c => c.id),
                clos: selectedClos.map((c, i) => ({
                    clo_number: c.clo_number || i + 1,
                    title: c.title,
                    description: c.description,
                    cognitive_level: c.cognitive_level || c.cognitiveLevel,
                    mapped_plos: (c.mapped_plos || []).map(p => p.id)
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
        setCourseData({ title: '', code: '', department_id: isDeptAdmin ? (deptId || '') : '', credit_hours: '', semester_level: '', description: '' });
        setSelectedClos([]);
        if (!isDeptAdmin) setSelectedFaculty('');
        setSelectedPrereqs([]);
    };

    const handleImportClick = () => { fileInputRef.current.click(); };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const response = await courseApi.import(file);
            if (response.success) {
                toast.success(`Import successful: ${response.data.imported} added, ${response.data.skipped} skipped`);
                setTimeout(() => navigate('/admin-managecourses'), 1500);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import courses');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleExport = () => { courseApi.export(); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-6 max-w-7xl mx-auto">
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
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button type="button" onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                            <MdFileDownload className="w-5 h-5 text-slate-500" /> Export Courses
                        </button>
                        <button type="button" onClick={handleImportClick} disabled={loading}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-70">
                            <MdFileUpload className="w-5 h-5" /> Import from Excel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title <span className="text-red-500">*</span></label>
                            <input type="text" name="title" value={courseData.title} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. Introduction to Computer Science" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Code <span className="text-red-500">*</span></label>
                            <input type="text" name="code" value={courseData.code} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CS-101" />
                        </div>
                        {isDeptAdmin ? (
                            /* Dept admin: show department as read-only info */
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-slate-50 text-slate-600 font-medium">
                                    {user.department || 'Your Department'}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Course will be added to your department automatically</p>
                            </div>
                        ) : (
                            /* Super admin / other: show faculty + department dropdowns */
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                    <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setCourseData({...courseData, department_id: ''}); }}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={courseData.department_id} onChange={handleInputChange} disabled={!selectedFaculty}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100">
                                        <option value="">{selectedFaculty ? 'Select Department' : 'Select Faculty first'}</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Hours <span className="text-red-500">*</span></label>
                            <input type="number" name="credit_hours" value={courseData.credit_hours} onChange={handleInputChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 3" min="1" max="6" />
                        </div>

                        {/* Prerequisites Picker */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Prerequisites</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedPrereqs.map(p => (
                                    <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                                        {p.code}: {p.title}
                                        <button type="button" onClick={() => removePrereq(p.id)} className="ml-1 text-blue-400 hover:text-red-500">
                                            <MdClose className="w-4 h-4" />
                                        </button>
                                    </span>
                                ))}
                                {selectedPrereqs.length === 0 && <span className="text-sm text-gray-400">No prerequisites selected</span>}
                            </div>
                            <button type="button" onClick={handleOpenPrereqModal}
                                className="py-2 px-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-500 transition text-sm flex items-center">
                                <MdAdd className="mr-1" /> Add Prerequisites
                            </button>
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
                            <textarea rows="4" name="description" value={courseData.description} onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Enter a detailed description of the course content..." />
                        </div>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* CLO Section - Picker Style */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Course Learning Outcomes (CLOs)</h3>
                    <p className="text-xs text-gray-500 mb-4">Select existing CLOs from the database to attach to this course.</p>

                    {/* Selected CLOs chips */}
                    <div className="space-y-3 mb-4">
                        {selectedClos.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm">No CLOs selected yet. Click the button below to add CLOs.</p>
                            </div>
                        ) : (
                            selectedClos.map(clo => (
                                <div key={clo.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">{clo.title}</span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{clo.description || 'No description'}</p>
                                            <p className="text-xs text-gray-500">{clo.cognitive_level || 'No level set'}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeCloFromCourse(clo.id)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                                        <MdClose className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <button type="button" onClick={handleOpenCloModal}
                        className="flex items-center px-4 py-2.5 border-2 border-dashed border-amber-400 rounded-xl text-amber-700 font-medium hover:bg-amber-50 hover:border-amber-500 transition">
                        <MdAdd className="mr-2 w-5 h-5" /> Add CLOs
                    </button>

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

            {/* Prerequisites Picker Modal */}
            {isPrereqModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Select Prerequisite Courses</h2>
                            <button onClick={() => setIsPrereqModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="Search by course title or code..." value={prereqSearch}
                                    onChange={(e) => setPrereqSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredPrereqCourses.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No courses found.</p>
                            ) : (
                                filteredPrereqCourses.map(course => {
                                    const isSelected = selectedPrereqs.some(p => p.id === course.id);
                                    return (
                                        <div key={course.id} onClick={() => togglePrereq(course)}
                                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                            <div>
                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold mb-1">{course.code}</span>
                                                <h4 className="font-bold text-gray-800 text-sm">{course.title}</h4>
                                                <p className="text-xs text-gray-500">{course.credit_hours} Credits • {course.department_name}</p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600'}`}>
                                                {isSelected ? <MdClose className="w-4 h-4" /> : <MdAdd className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsPrereqModalOpen(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CLO Picker Modal */}
            {isCloModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Select CLOs</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Click on a CLO to see details. Click + to add it to the course.</p>
                            </div>
                            <button onClick={() => setIsCloModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="Search by CLO number (e.g. CLO-1), course code, or description..."
                                    value={cloSearch} onChange={(e) => setCloSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredAllClos.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No CLOs found.</p>
                            ) : (
                                filteredAllClos.map(clo => {
                                    const isAdded = selectedClos.some(c => c.id === clo.id);
                                    const isExpanded = expandedCloId === clo.id;
                                    return (
                                        <div key={clo.id} className="rounded-xl border border-gray-200 overflow-hidden">
                                            <div className={`flex items-center justify-between p-4 cursor-pointer transition-all ${isAdded ? 'bg-amber-50 border-amber-300' : 'hover:bg-gray-50'}`}
                                                onClick={() => setExpandedCloId(isExpanded ? null : clo.id)}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex-shrink-0">{clo.title}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{clo.description || 'No description'}</p>
                                                        <p className="text-xs text-gray-400">{clo.cognitive_level || 'No level'}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); isAdded ? removeCloFromCourse(clo.id) : addCloToCourse(clo); }}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${isAdded ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}>
                                                    {isAdded ? <MdClose className="w-4 h-4" /> : <MdAdd className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-2">
                                                    <p className="text-sm"><strong className="text-gray-700">Description:</strong> <span className="text-gray-600">{clo.description || 'N/A'}</span></p>
                                                    <p className="text-sm"><strong className="text-gray-700">Cognitive Level:</strong> <span className="text-gray-600">{clo.cognitive_level || 'N/A'}</span></p>
                                                    {clo.mapped_courses && clo.mapped_courses.length > 0 && (
                                                        <div>
                                                            <strong className="text-sm text-gray-700">Mapped to Courses:</strong>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {clo.mapped_courses.map(c => (
                                                                    <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">
                                                                        {c.code}: {c.title}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {clo.mapped_plos && clo.mapped_plos.length > 0 && (
                                                        <div>
                                                            <strong className="text-sm text-gray-700">Mapped PLOs:</strong>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {clo.mapped_plos.map(p => (
                                                                    <span key={p.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-200">
                                                                        PLO-{p.plo_number}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-sm text-gray-500">{selectedClos.length} CLO(s) selected</span>
                            <button onClick={() => setIsCloModalOpen(false)} className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCourse;