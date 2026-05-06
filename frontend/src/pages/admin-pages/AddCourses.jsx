import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete, MdSave, MdRefresh, MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { courseApi, authApi } from '../../services/api';
import { toast } from 'react-toastify';

const AddCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [courseData, setCourseData] = useState({
        title: '', code: '', department_id: '', credit_hours: '',
        semester_level: '', prerequisites: '', description: ''
    });

    const [clos, setClos] = useState([
        { id: 1, title: '', description: '', cognitiveLevel: '', mapping: '' }
    ]);

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
        setClos([...clos, { id: newId, title: '', description: '', cognitiveLevel: '', mapping: '' }]);
    };

    const removeClo = (id) => {
        if (clos.length === 1) return;
        setClos(clos.filter(clo => clo.id !== id));
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
                    bloom_level: c.cognitiveLevel,
                    plo_mapping: c.mapping
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
        setClos([{ id: 1, title: '', description: '', cognitiveLevel: '', mapping: '' }]);
        setSelectedFaculty('');
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

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Course</h2>

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
                                        <input type="text" value={clo.mapping} onChange={(e) => handleCloChange(clo.id, 'mapping', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded bg-white outline-none" placeholder="e.g. PLO-1" />
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
        </div>
    );
};

export default AddCourse;