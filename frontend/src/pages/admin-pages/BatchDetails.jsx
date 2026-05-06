import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdEdit, MdAdd, MdArrowBack, MdCalendarToday, MdArrowForward, MdPeople, MdSchool, MdAccessTime, MdClose, MdSave } from 'react-icons/md';
import { batchApi } from '../../services/api';
import { toast } from 'react-toastify';

const BatchDetails = () => {
    const { id } = useParams();
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(true);

    // PLO Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedPlos, setEditedPlos] = useState([]);
    const [currentPlos, setCurrentPlos] = useState([]);

    // Add Semester Dialog State
    const [isAddSemesterDialogOpen, setIsAddSemesterDialogOpen] = useState(false);
    const [currentSemesters, setCurrentSemesters] = useState([]);
    const [newSemester, setNewSemester] = useState({
        name: '', semester_number: '', start_date: '', end_date: ''
    });

    const colorPalette = [
        "from-amber-500 to-orange-600",
        "from-emerald-500 to-teal-600",
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-600",
        "from-pink-500 to-rose-600",
        "from-cyan-500 to-teal-600"
    ];

    useEffect(() => {
        fetchBatchDetails();
    }, [id]);

    const fetchBatchDetails = async () => {
        try {
            setLoading(true);
            const response = await batchApi.getById(id);
            if (response.success) {
                setBatchData(response.data);
                const ploDescriptions = (response.data.plos || []).map(p => p.description);
                setCurrentPlos(ploDescriptions);
                setCurrentSemesters(response.data.semesters || []);
            }
        } catch (error) {
            console.error('Error fetching batch:', error);
            toast.error('Failed to load batch details');
        } finally {
            setLoading(false);
        }
    };

    // PLO Handlers
    const handleOpenEditDialog = () => {
        setEditedPlos([...currentPlos]);
        setIsEditDialogOpen(true);
    };
    const handleCloseEditDialog = () => setIsEditDialogOpen(false);
    const handlePloChange = (index, value) => {
        const updated = [...editedPlos];
        updated[index] = value;
        setEditedPlos(updated);
    };
    const handleSavePlos = async () => {
        try {
            // Save each PLO to backend
            const plos = batchData.plos || [];
            for (let i = 0; i < editedPlos.length; i++) {
                if (plos[i]) {
                    await batchApi.updatePLO(id, plos[i].id, { description: editedPlos[i] });
                }
            }
            setCurrentPlos([...editedPlos]);
            setIsEditDialogOpen(false);
            toast.success('PLOs updated successfully');
            fetchBatchDetails();
        } catch (error) {
            console.error('Error saving PLOs:', error);
            toast.error('Failed to save PLOs');
        }
    };

    // Semester Handlers
    const handleOpenAddSemesterDialog = () => {
        setNewSemester({ name: '', semester_number: '', start_date: '', end_date: '' });
        setIsAddSemesterDialogOpen(true);
    };
    const handleCloseAddSemesterDialog = () => setIsAddSemesterDialogOpen(false);
    const handleSemesterFieldChange = (field, value) => {
        setNewSemester(prev => ({ ...prev, [field]: value }));
    };
    const handleAddSemester = async () => {
        try {
            await batchApi.addSemester(id, {
                name: newSemester.name,
                semester_number: parseInt(newSemester.semester_number) || currentSemesters.length + 1,
                start_date: newSemester.start_date,
                end_date: newSemester.end_date
            });
            setIsAddSemesterDialogOpen(false);
            toast.success('Semester added successfully');
            fetchBatchDetails();
        } catch (error) {
            console.error('Error adding semester:', error);
            toast.error(error.response?.data?.message || 'Failed to add semester');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                        <div className="grid grid-cols-3 gap-5 mb-10">
                            {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                        </div>
                        <div className="h-48 bg-slate-200 rounded-2xl mb-10"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!batchData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-600 mb-2">Batch not found</h2>
                    <Link to="/admin-managebatches" className="text-blue-600 hover:underline">Back to Batches</Link>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Total Students', value: batchData.student_count || 0, icon: MdPeople, color: 'from-blue-500 to-indigo-600', link: `/admin-managebatches/${id}/students` },
        { label: 'Total Semesters', value: currentSemesters.length, icon: MdSchool, color: 'from-emerald-500 to-teal-600' },
        { label: 'Status', value: batchData.status || 'active', icon: MdAccessTime, color: 'from-violet-500 to-purple-600' },
    ];

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
                                {batchData.name}
                            </h1>
                        </div>
                        <div className="ml-5 flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                {batchData.status || 'Active'}
                            </span>
                            <span className="text-sm text-slate-500">{batchData.department_name}</span>
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
                        <button onClick={handleOpenEditDialog} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all">
                            <MdEdit className="w-4 h-4" /> Edit
                        </button>
                    </div>
                    {currentPlos.length === 0 ? (
                        <p className="text-slate-400 text-sm">No PLOs defined yet. Click Edit to add them.</p>
                    ) : (
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
                    )}
                </div>

                {/* Semesters */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Semesters</h3>
                        </div>
                        <button onClick={handleOpenAddSemesterDialog} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm">
                            <MdAdd className="w-5 h-5" /> Add Semester
                        </button>
                    </div>

                    {currentSemesters.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                            <p className="text-slate-400">No semesters yet. Click "Add Semester" to create one.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {currentSemesters.map((sem, index) => (
                                <Link
                                    to={`/admin-managebatches/${id}/semester/${sem.id}`}
                                    key={sem.id}
                                    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                                >
                                    <div className={`h-24 bg-gradient-to-br ${colorPalette[index % colorPalette.length]} relative`}>
                                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-slate-700 shadow">
                                            Sem {sem.semester_number}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {sem.name || `Semester ${sem.semester_number}`}
                                        </h4>
                                        <p className="text-sm text-slate-500 mb-3">{sem.course_count || 0} Courses</p>
                                        {sem.start_date && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100">
                                                <MdCalendarToday className="w-4 h-4" />
                                                <span>{new Date(sem.start_date).toLocaleDateString()} - {sem.end_date ? new Date(sem.end_date).toLocaleDateString() : 'Present'}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* PLO Edit Dialog */}
                {isEditDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-800">Edit Program Learning Outcomes</h2>
                                </div>
                                <button onClick={handleCloseEditDialog} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
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
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                                <button onClick={handleCloseEditDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-white transition-all">Cancel</button>
                                <button onClick={handleSavePlos} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm">
                                    <MdSave className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Semester Dialog */}
                {isAddSemesterDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-800">Add New Semester</h2>
                                </div>
                                <button onClick={handleCloseAddSemesterDialog} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Semester Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={newSemester.name} onChange={(e) => handleSemesterFieldChange('name', e.target.value)} placeholder="e.g., Semester 7" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Semester Number <span className="text-red-500">*</span></label>
                                    <input type="number" value={newSemester.semester_number} onChange={(e) => handleSemesterFieldChange('semester_number', e.target.value)} placeholder="e.g., 7" min="1" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Start Date <span className="text-red-500">*</span></label>
                                        <input type="date" value={newSemester.start_date} onChange={(e) => handleSemesterFieldChange('start_date', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">End Date <span className="text-red-500">*</span></label>
                                        <input type="date" value={newSemester.end_date} onChange={(e) => handleSemesterFieldChange('end_date', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                                <button onClick={handleCloseAddSemesterDialog} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-white transition-all">Cancel</button>
                                <button onClick={handleAddSemester} disabled={!newSemester.name || !newSemester.start_date || !newSemester.end_date} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    <MdAdd className="w-4 h-4" /> Add Semester
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