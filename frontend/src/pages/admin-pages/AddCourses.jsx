import React, { useState } from 'react';
import { MdAdd, MdDelete, MdSave, MdRefresh } from 'react-icons/md';

const AddCourse = () => {
    // State for basic course details
    const [courseData, setCourseData] = useState({
        title: '',
        code: '',
        department: '',
        creditHours: '',
        semesterLevel: '',
        prerequisites: '',
        lastUpdated: '',
        description: ''
    });

    // State for dynamic CLOs
    const [clos, setClos] = useState([
        { id: 1, title: '', description: '', cognitiveLevel: '', mapping: '' }
    ]);

    // Handle Basic Input Changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData({ ...courseData, [name]: value });
    };

    // --- CLO Logic ---

    // Update a specific field in a specific CLO
    const handleCloChange = (id, field, value) => {
        const updatedClos = clos.map((clo) =>
            clo.id === id ? { ...clo, [field]: value } : clo
        );
        setClos(updatedClos);
    };

    // Add a new empty CLO
    const addClo = () => {
        const newId = clos.length > 0 ? Math.max(...clos.map(c => c.id)) + 1 : 1;
        setClos([...clos, { id: newId, title: '', description: '', cognitiveLevel: '', mapping: '' }]);
    };

    // Remove a CLO
    const removeClo = (id) => {
        if (clos.length === 1) return; // Prevent deleting the last one if desired
        setClos(clos.filter((clo) => clo.id !== id));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                {/* Header */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Course</h2>

                {/* --- Top Form Section --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

                    {/* Course Title */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title</label>
                        <input
                            type="text"
                            name="title"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Introduction to Computer Science"
                        />
                    </div>

                    {/* Course Code */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course Code</label>
                        <input
                            type="text"
                            name="code"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. CS-101"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Select Department</option>
                            <option value="cs">Computer Science</option>
                            <option value="se">Software Engineering</option>
                            <option value="it">Information Technology</option>
                        </select>
                    </div>

                    {/* Credit Hours */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Hours</label>
                        <input
                            type="number"
                            name="creditHours"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 3"
                        />
                    </div>

                    {/* Semester Level */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Semester Level</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Select Semester Level</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                            <option value="3">3rd Semester</option>
                        </select>
                    </div>

                    {/* Prerequisites */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prerequisites</label>
                        <input
                            type="text"
                            name="prerequisites"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. None"
                        />
                    </div>

                    {/* Last Updated */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Updated</label>
                        <input
                            type="date"
                            name="lastUpdated"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Course Description - Full Width */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
                        <textarea
                            rows="4"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Enter a detailed description of the course content..."
                        ></textarea>
                    </div>
                </div>

                <hr className="my-8 border-gray-200" />

                {/* --- CLO Section --- */}
                <h3 className="text-lg font-bold text-gray-800 mb-4">Course Learning Outcomes (CLOs)</h3>

                <div className="space-y-6">
                    {clos.map((clo, index) => (
                        <div key={clo.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative group">

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                {/* CLO Title */}
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={clo.title}
                                        onChange={(e) => handleCloChange(clo.id, 'title', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded bg-white focus:border-blue-500 outline-none"
                                        placeholder={`CLO ${index + 1}`}
                                    />
                                    <span className="text-xs font-bold text-gray-400 mt-1 block">CLO {index + 1}</span>
                                </div>

                                {/* CLO Description */}
                                <div className="md:col-span-8">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        rows="2"
                                        value={clo.description}
                                        onChange={(e) => handleCloChange(clo.id, 'description', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded bg-white focus:border-blue-500 outline-none resize-none"
                                        placeholder="Describe the learning outcome..."
                                    ></textarea>
                                </div>

                                {/* Cognitive Level */}
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cognitive Level</label>
                                    <select
                                        value={clo.cognitiveLevel}
                                        onChange={(e) => handleCloChange(clo.id, 'cognitiveLevel', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded bg-white outline-none"
                                    >
                                        <option value="">Select Cognitive Level</option>
                                        <option value="c1">C1 - Remember</option>
                                        <option value="c2">C2 - Understand</option>
                                        <option value="c3">C3 - Apply</option>
                                    </select>
                                </div>

                                {/* Mapping */}
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mapping</label>
                                    <input
                                        type="text"
                                        value={clo.mapping}
                                        onChange={(e) => handleCloChange(clo.id, 'mapping', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded bg-white outline-none"
                                        placeholder="e.g. PLO-1"
                                    />
                                </div>

                                {/* Actions for this specific CLO */}
                                <div className="md:col-span-4 flex items-end justify-end space-x-3">
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                                    >
                                        Add CLO
                                    </button>
                                    <button
                                        onClick={() => removeClo(clo.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded hover:bg-red-100 transition"
                                    >
                                        Delete CLO
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New CLO Button (Global) */}
                <div className="mt-6">
                    <button
                        onClick={addClo}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                        <MdAdd className="mr-2" /> Add New CLO
                    </button>
                </div>

                {/* Footer Buttons */}
                <div className="mt-10 flex items-center space-x-4">
                    <button className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all">
                        <MdSave className="mr-2" /> Add Course
                    </button>
                    <button className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 border border-gray-200 transition-all">
                        <MdRefresh className="mr-2" /> Reset Form
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddCourse;