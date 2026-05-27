import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdMenuBook, MdDelete, MdSchool, MdLibraryBooks, MdGroups } from 'react-icons/md';
import { curriculumApi } from '../../services/api';
import { toast } from 'react-toastify';

const ManageCurricula = () => {
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

    const [searchQuery, setSearchQuery] = useState('');
    const [curricula, setCurricula] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCurriculum, setNewCurriculum] = useState({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });
    const [departments, setDepartments] = useState([]);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const colorPalette = [
        "from-indigo-500 to-blue-600",
        "from-violet-500 to-purple-600",
        "from-emerald-500 to-teal-600",
        "from-amber-500 to-orange-600",
        "from-pink-500 to-rose-600",
        "from-cyan-500 to-sky-600"
    ];

    useEffect(() => {
        fetchCurricula();
        fetchDepartments();
    }, []);

    const fetchCurricula = async () => {
        try {
            setLoading(true);
            const response = await curriculumApi.getAll();
            if (response.success) {
                setCurricula(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching curricula:', error);
            toast.error('Failed to load curricula');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { departmentApi } = await import('../../services/api');
            const res = await departmentApi.getAll();
            if (res.success) setDepartments(res.data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const handleDelete = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this curriculum? All semester-course mappings will be removed.')) {
            setDeletingId(id);
            try {
                await curriculumApi.delete(id);
                toast.success('Curriculum deleted successfully');
                fetchCurricula();
            } catch (error) {
                console.error('Error deleting curriculum:', error);
                toast.error('Failed to delete curriculum');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleCreate = async () => {
        if (!newCurriculum.name || !newCurriculum.department_id) {
            toast.error('Name and department are required');
            return;
        }
        setCreating(true);
        try {
            await curriculumApi.create(newCurriculum);
            toast.success('Curriculum created with 8 semesters!');
            setShowCreateDialog(false);
            setNewCurriculum({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });
            fetchCurricula();
        } catch (error) {
            console.error('Error creating curriculum:', error);
            toast.error(error.response?.data?.message || 'Failed to create curriculum');
        } finally {
            setCreating(false);
        }
    };

    const filteredCurricula = curricula.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Manage Curricula
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${curricula.length} curricula found`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Curriculum
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search curricula by name or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredCurricula.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MdMenuBook className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                            {searchQuery ? 'No curricula match your search' : 'No curricula yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first curriculum to define course structures'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium rounded-xl"
                            >
                                <MdAdd className="w-5 h-5" />
                                Add Curriculum
                            </button>
                        )}
                    </div>
                ) : (
                    /* Curriculum Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCurricula.map((curr, index) => (
                            <Link
                                key={curr.id}
                                to={`/admin-curricula/${curr.id}`}
                                className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Card Header */}
                                <div className={`bg-gradient-to-r ${colorPalette[index % colorPalette.length]} p-6`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MdMenuBook className="w-6 h-6 text-white/90" />
                                            <h3 className="text-xl font-bold text-white truncate">{curr.name}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(curr.id, e)}
                                            disabled={deletingId === curr.id}
                                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                                            title="Delete curriculum"
                                        >
                                            <MdDelete className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <p className="text-white/80 text-sm mt-1">
                                        {curr.department_name || 'No Department'}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MdSchool className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium">{curr.total_semesters || 8} Semesters</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MdLibraryBooks className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium">{curr.total_courses || 0} Courses</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MdGroups className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium">{curr.batch_count || 0} Batches</span>
                                        </div>
                                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold
                                            ${curr.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                        >
                                            {curr.status === 'active' ? 'Active' : 'Archived'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Curriculum Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800">Create New Curriculum</h2>
                            </div>
                            <button onClick={() => setShowCreateDialog(false)} disabled={creating} className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
                                <span className="text-slate-500 text-xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Curriculum Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newCurriculum.name}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., BS Physics 2024"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-700"
                                />
                            </div>
                            {!isDeptAdmin ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                                    <select
                                        value={newCurriculum.department_id}
                                        onChange={(e) => setNewCurriculum(prev => ({ ...prev, department_id: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-700"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Department</label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
                                        {user.department || 'Your Department'}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    value={newCurriculum.description}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this curriculum..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-700 resize-none"
                                />
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
                                <strong>Note:</strong> 8 empty semesters will be automatically created. You can then add courses to each semester.
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                            <button onClick={() => setShowCreateDialog(false)} disabled={creating} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-white transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newCurriculum.name || !newCurriculum.department_id || creating}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdAdd className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Curriculum'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCurricula;
