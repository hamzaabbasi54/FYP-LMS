import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdEdit, MdAdd, MdArrowBack, MdCalendarToday, MdArrowForward, MdPeople, MdSchool, MdAccessTime, MdClose, MdSave } from 'react-icons/md';

const BatchDetails = () => {
    const { id } = useParams();

    const batchData = {
        id: id,
        title: "Computer Science - Class of 2027",
        status: "Active",
        stats: {
            students: 124,
            semesters: 8,
            duration: "4 Years"
        },
        plos: [
            "Analyze a complex computing problem and to apply principles of computing.",
            "Design, implement, and evaluate a computing-based solution.",
            "Communicate effectively in a variety of professional contexts.",
            "Recognize professional responsibilities and ethical principles.",
            "Function effectively as a member or leader of a team."
        ],
        semesters: [
            { id: 1, name: "Semester 1", term: "Fall 2023", date: "Aug 2023 - Dec 2023", courses: 5, color: "from-amber-500 to-orange-600" },
            { id: 2, name: "Semester 2", term: "Spring 2024", date: "Jan 2024 - May 2024", courses: 6, color: "from-emerald-500 to-teal-600" },
            { id: 3, name: "Semester 3", term: "Fall 2024", date: "Aug 2024 - Dec 2024", courses: 5, color: "from-blue-500 to-indigo-600" },
            { id: 4, name: "Semester 4", term: "Spring 2025", date: "Jan 2025 - May 2025", courses: 5, color: "from-violet-500 to-purple-600" },
            { id: 5, name: "Semester 5", term: "Fall 2025", date: "Aug 2025 - Dec 2025", courses: 6, color: "from-pink-500 to-rose-600" },
            { id: 6, name: "Semester 6", term: "Spring 2026", date: "Jan 2026 - May 2026", courses: 5, color: "from-cyan-500 to-teal-600" },
        ]
    };

    const stats = [
        { label: 'Total Students', value: batchData.stats.students, icon: MdPeople, color: 'from-blue-500 to-indigo-600', link: `/admin-managebatches/${id}/students` },
        { label: 'Total Semesters', value: batchData.stats.semesters, icon: MdSchool, color: 'from-emerald-500 to-teal-600' },
        { label: 'Duration', value: batchData.stats.duration, icon: MdAccessTime, color: 'from-violet-500 to-purple-600' },
    ];

    // PLO Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedPlos, setEditedPlos] = useState([...batchData.plos]);
    const [currentPlos, setCurrentPlos] = useState([...batchData.plos]);

    // Handlers
    const handleOpenEditDialog = () => {
        setEditedPlos([...currentPlos]);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
    };

    const handlePloChange = (index, value) => {
        const updated = [...editedPlos];
        updated[index] = value;
        setEditedPlos(updated);
    };

    const handleSavePlos = () => {
        setCurrentPlos([...editedPlos]);
        setIsEditDialogOpen(false);
        // TODO: Add API call to save PLOs to backend
        // Example: await api.put(`/batches/${id}/plos`, { plos: editedPlos });
    };

    // Add Semester Dialog State
    const [isAddSemesterDialogOpen, setIsAddSemesterDialogOpen] = useState(false);
    const [currentSemesters, setCurrentSemesters] = useState([...batchData.semesters]);
    const [newSemester, setNewSemester] = useState({
        name: '',
        term: '',
        date: '',
        courses: 0,
        color: 'from-blue-500 to-indigo-600'
    });

    // Add Semester Handlers
    const handleOpenAddSemesterDialog = () => {
        setNewSemester({
            name: '',
            term: '',
            date: '',
            courses: 0,
            color: 'from-blue-500 to-indigo-600'
        });
        setIsAddSemesterDialogOpen(true);
    };

    const handleCloseAddSemesterDialog = () => {
        setIsAddSemesterDialogOpen(false);
    };

    const handleSemesterFieldChange = (field, value) => {
        setNewSemester(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddSemester = () => {
        const semesterToAdd = {
            id: currentSemesters.length + 1,
            ...newSemester
        };
        setCurrentSemesters([...currentSemesters, semesterToAdd]);
        setIsAddSemesterDialogOpen(false);
        // TODO: Add API call to save semester to backend
        // Example: await api.post(`/batches/${id}/semesters`, semesterToAdd);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                {batchData.title}
                            </h1>
                        </div>
                        <div className="ml-5">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                {batchData.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    {stats.map((stat, index) => {
                        const content = (
                            <div className={`group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 ${stat.link ? 'cursor-pointer' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg`}>
                                            <stat.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                                    </div>
                                    {stat.link && (
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <MdArrowForward className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                        return stat.link ? (
                            <Link key={index} to={stat.link}>{content}</Link>
                        ) : (
                            <div key={index}>{content}</div>
                        );
                    })}
                </div>

                {/* PLOs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-10 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h3 className="text-lg font-bold text-slate-800">Program Learning Outcomes</h3>
                        </div>
                        <button
                            onClick={handleOpenEditDialog}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all"
                        >
                            <MdEdit className="w-4 h-4" /> Edit
                        </button>
                    </div>
                    <div className="space-y-3">
                        {currentPlos.map((plo, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow">
                                    {index + 1}
                                </span>
                                <p className="text-slate-600 text-sm leading-relaxed pt-1">{plo}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Semesters */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Semesters</h3>
                        </div>
                        <button
                            onClick={handleOpenAddSemesterDialog}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm"
                        >
                            <MdAdd className="w-5 h-5" /> Add Semester
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {currentSemesters.map((sem) => (
                            <Link
                                to={`/admin-managebatches/${id}/semester/${sem.id}`}
                                key={sem.id}
                                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                            >
                                <div className={`h-24 bg-gradient-to-br ${sem.color} relative`}>
                                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-slate-700 shadow">
                                        {sem.term}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {sem.name}
                                    </h4>
                                    <p className="text-sm text-slate-500 mb-3">{sem.courses} Courses</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100">
                                        <MdCalendarToday className="w-4 h-4" />
                                        <span>{sem.date}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* PLO Edit Dialog */}
                {isEditDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Dialog Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-800">Edit Program Learning Outcomes</h2>
                                </div>
                                <button
                                    onClick={handleCloseEditDialog}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <MdClose className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Dialog Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {editedPlos.map((plo, index) => (
                                        <div key={index} className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow">
                                                    {index + 1}
                                                </span>
                                                PLO {index + 1}
                                            </label>
                                            <textarea
                                                value={plo}
                                                onChange={(e) => handlePloChange(index, e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm text-slate-700"
                                                placeholder={`Enter PLO ${index + 1} description...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dialog Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                                <button
                                    onClick={handleCloseEditDialog}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePlos}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm"
                                >
                                    <MdSave className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Semester Dialog */}
                {isAddSemesterDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                            {/* Dialog Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-800">Add New Semester</h2>
                                </div>
                                <button
                                    onClick={handleCloseAddSemesterDialog}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <MdClose className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Dialog Content */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* Semester Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Semester Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSemester.name}
                                            onChange={(e) => handleSemesterFieldChange('name', e.target.value)}
                                            placeholder="e.g., Semester 7"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700"
                                        />
                                    </div>

                                    {/* Term */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Term <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSemester.term}
                                            onChange={(e) => handleSemesterFieldChange('term', e.target.value)}
                                            placeholder="e.g., Fall 2026"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700"
                                        />
                                    </div>

                                    {/* Date Range */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Date Range <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSemester.date}
                                            onChange={(e) => handleSemesterFieldChange('date', e.target.value)}
                                            placeholder="e.g., Aug 2026 - Dec 2026"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700"
                                        />
                                    </div>

                                    {/* Number of Courses */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Number of Courses
                                        </label>
                                        <input
                                            type="number"
                                            value={newSemester.courses}
                                            onChange={(e) => handleSemesterFieldChange('courses', parseInt(e.target.value) || 0)}
                                            placeholder="e.g., 5"
                                            min="0"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700"
                                        />
                                    </div>

                                    {/* Color Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Card Color
                                        </label>
                                        <select
                                            value={newSemester.color}
                                            onChange={(e) => handleSemesterFieldChange('color', e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700"
                                        >
                                            <option value="from-amber-500 to-orange-600">Amber/Orange</option>
                                            <option value="from-emerald-500 to-teal-600">Emerald/Teal</option>
                                            <option value="from-blue-500 to-indigo-600">Blue/Indigo</option>
                                            <option value="from-violet-500 to-purple-600">Violet/Purple</option>
                                            <option value="from-pink-500 to-rose-600">Pink/Rose</option>
                                            <option value="from-cyan-500 to-teal-600">Cyan/Teal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Dialog Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                                <button
                                    onClick={handleCloseAddSemesterDialog}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSemester}
                                    disabled={!newSemester.name || !newSemester.term || !newSemester.date}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MdAdd className="w-4 h-4" />
                                    Add Semester
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchDetails;