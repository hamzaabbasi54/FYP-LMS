import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdEmail, MdMoreHoriz, MdDelete } from 'react-icons/md';
import { approvalApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ManageFaculty = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: facultyMembers = [], isLoading: loading } = useQuery({
        queryKey: ['faculty_approved'],
        queryFn: async () => {
            const res = await approvalApi.getUsersByRole('faculty');
            if (res.success) return res.data || [];
            throw new Error('Failed to load faculty');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (userId) => approvalApi.deleteUser(userId),
        onSuccess: () => {
            toast.success('Faculty member removed');
            queryClient.invalidateQueries({ queryKey: ['faculty_approved'] });
        },
        onError: () => toast.error('Failed to remove faculty')
    });

    const handleDelete = (userId) => {
        if (window.confirm('Are you sure you want to remove this faculty member?')) {
            deleteMutation.mutate(userId);
        }
    };

    const getDesignationColor = (designation) => {
        switch (designation) {
            case 'Professor': return 'from-violet-500 to-purple-600';
            case 'Associate Professor': return 'from-blue-500 to-indigo-600';
            case 'Assistant Professor': return 'from-emerald-500 to-teal-600';
            case 'Lecturer': return 'from-amber-500 to-orange-600';
            case 'Visiting Faculty': return 'from-pink-500 to-rose-600';
            default: return 'from-slate-500 to-slate-600';
        }
    };

    const filteredFaculty = facultyMembers.filter(member =>
        (member.full_name || member.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Faculty Management
                        </h1>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${facultyMembers.length} active faculty`}
                        </p>
                    </div>
                    <Link
                        to="/admin-managefaculty/addfaculty"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium shadow-sm transition-colors"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Faculty
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Faculty Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
                                <div className="h-5 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredFaculty.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                            No faculty members found
                        </h3>
                        <p className="text-slate-400">
                            {searchQuery ? 'Try a different search term' : 'Add faculty members to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredFaculty.map((member) => {
                            const name = member.full_name || member.fullName || 'Unknown';
                            return (
                                <div
                                    key={member.id}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative"
                                >
                                    {/* Avatar */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                            <span className="text-blue-700 font-bold text-sm">
                                                {getInitials(name)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{member.designation || member.role || 'Faculty'}</p>
                                        {member.department && (
                                            <p className="text-xs text-slate-400 mt-1">{member.department}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-4 bg-slate-50 py-1.5 px-2 rounded-lg">
                                        <MdEmail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{member.email}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute top-2 right-2">
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                disabled={deleteMutation.isPending && deleteMutation.variables === member.id}
                                                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Remove faculty"
                                            >
                                                <MdDelete className="w-4 h-4" />
                                            </button>
                                        </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageFaculty;