import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdMenuBook, MdDelete, MdSchool, MdLibraryBooks, MdGroups } from 'react-icons/md';
import { curriculumApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

const ManageCurricula = () => {
    const { user } = useAuth();
    
    const deptId = user?.department_id;
    const isDeptAdmin = user?.role === 'deptadmin';

    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCurriculum, setNewCurriculum] = useState({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });
    const [deletingId, setDeletingId] = useState(null);

    const colorPalette = [
        "from-indigo-500 to-blue-600",
        "from-violet-500 to-purple-600",
        "from-emerald-500 to-teal-600",
        "from-amber-500 to-orange-600",
        "from-pink-500 to-rose-600",
        "from-cyan-500 to-sky-600"
    ];

    const { data: curricula = [], isLoading: loading } = useQuery({
        queryKey: ['curricula'],
        queryFn: async () => {
            const response = await curriculumApi.getAll();
            if (response.success) return response.data || [];
            throw new Error('Failed to fetch curricula');
        }
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { departmentApi } = await import('../../services/api');
            const res = await departmentApi.getAll();
            if (res.success) return res.data || [];
            return [];
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => curriculumApi.delete(id),
        onSuccess: () => {
            toast.success('Curriculum deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['curricula'] });
        },
        onError: (error) => {
            console.error('Error deleting curriculum:', error);
            toast.error('Failed to delete curriculum');
        },
        onSettled: () => setDeletingId(null)
    });

    const handleDelete = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this curriculum? All semester-course mappings will be removed.')) {
            setDeletingId(id);
            deleteMutation.mutate(id);
        }
    };

    const createMutation = useMutation({
        mutationFn: (data) => curriculumApi.create(data),
        onSuccess: () => {
            toast.success('Curriculum created with 8 semesters!');
            setShowCreateDialog(false);
            setNewCurriculum({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });
            queryClient.invalidateQueries({ queryKey: ['curricula'] });
        },
        onError: (error) => {
            console.error('Error creating curriculum:', error);
            toast.error(error.response?.data?.message || 'Failed to create curriculum');
        }
    });

    const handleCreate = () => {
        if (!newCurriculum.name || !newCurriculum.department_id) {
            toast.error('Name and department are required');
            return;
        }
        createMutation.mutate(newCurriculum);
    };

    const filteredCurricula = curricula.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Manage Curricula
                        </h1>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${curricula.length} curricula found`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                    >
                        <MdAdd className="w-4 h-4" />
                        Add Curriculum
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search curricula by name or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                            >
                                <MdAdd className="w-4 h-4" />
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
                                className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                            >
                                {/* Card Header */}
                                <div className="bg-slate-50 border-b border-slate-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MdMenuBook className="w-5 h-5 text-slate-400" />
                                            <h3 className="text-base font-semibold text-slate-800 truncate hover:text-blue-600 transition-colors">{curr.name}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(curr.id, e)}
                                            disabled={deletingId === curr.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete curriculum"
                                        >
                                            <MdDelete className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-slate-500 text-xs mt-1 ml-7">
                                        {curr.department_name || 'No Department'}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <MdSchool className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium">{curr.total_semesters || 8} Semesters</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <MdLibraryBooks className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium">{curr.total_courses || 0} Courses</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <MdGroups className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium">{curr.batch_count || 0} Batches</span>
                                        </div>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">Create New Curriculum</h2>
                            <button onClick={() => setShowCreateDialog(false)} disabled={createMutation.isPending} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50">
                                <MdDelete className="hidden" /> {/* just to keep import used if not elsewhere */}
                                <span className="text-slate-500 text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Curriculum Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newCurriculum.name}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., BS Physics 2024"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                />
                            </div>
                            {!isDeptAdmin ? (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                                    <select
                                        value={newCurriculum.department_id}
                                        onChange={(e) => setNewCurriculum(prev => ({ ...prev, department_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none bg-white transition-all"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Department</label>
                                    <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                                        {user.department || 'Your Department'}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    value={newCurriculum.description}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this curriculum..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                                <strong>Note:</strong> 8 empty semesters will be automatically created. You can then add courses to each semester.
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => setShowCreateDialog(false)} disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 bg-white">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newCurriculum.name || !newCurriculum.department_id || createMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdAdd className="w-4 h-4" /> {createMutation.isPending ? 'Creating...' : 'Create Curriculum'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCurricula;
