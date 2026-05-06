import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdEmail, MdMoreHoriz, MdDelete, MdCheckCircle, MdCancel } from 'react-icons/md';
import { approvalApi } from '../../services/api';
import { toast } from 'react-toastify';

const ManageFaculty = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [facultyMembers, setFacultyMembers] = useState([]);
    const [pendingFaculty, setPendingFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('approved');

    useEffect(() => {
        fetchFacultyData();
    }, []);

    const fetchFacultyData = async () => {
        try {
            setLoading(true);
            const [approvedRes, pendingRes] = await Promise.all([
                approvalApi.getUsersByRole('faculty'),
                approvalApi.getPendingUsers()
            ]);
            if (approvedRes.success) {
                setFacultyMembers(approvedRes.data || []);
            }
            if (pendingRes.success) {
                setPendingFaculty(pendingRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching faculty:', error);
            toast.error('Failed to load faculty data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await approvalApi.approveUser(userId);
            toast.success('Faculty approved successfully');
            fetchFacultyData();
        } catch (error) {
            console.error('Error approving faculty:', error);
            toast.error('Failed to approve faculty');
        }
    };

    const handleReject = async (userId) => {
        try {
            await approvalApi.rejectUser(userId, 'Application rejected by Department Admin');
            toast.success('Faculty application rejected');
            fetchFacultyData();
        } catch (error) {
            console.error('Error rejecting faculty:', error);
            toast.error('Failed to reject faculty');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to remove this faculty member?')) {
            try {
                await approvalApi.deleteUser(userId);
                toast.success('Faculty member removed');
                fetchFacultyData();
            } catch (error) {
                console.error('Error deleting faculty:', error);
                toast.error('Failed to remove faculty');
            }
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

    const currentList = activeTab === 'approved' ? facultyMembers : pendingFaculty;

    const filteredFaculty = currentList.filter(member =>
        (member.full_name || member.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Faculty Management
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${facultyMembers.length} active faculty • ${pendingFaculty.length} pending`}
                        </p>
                    </div>
                    <Link
                        to="/admin-managefaculty/addfaculty"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Faculty
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            activeTab === 'approved'
                                ? 'bg-white shadow-sm text-violet-700 border border-violet-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        Active Faculty ({facultyMembers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            activeTab === 'pending'
                                ? 'bg-white shadow-sm text-amber-700 border border-amber-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        Pending Approval ({pendingFaculty.length})
                        {pendingFaculty.length > 0 && (
                            <span className="ml-2 inline-flex w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
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
                            {activeTab === 'pending' ? 'No pending applications' : 'No faculty members found'}
                        </h3>
                        <p className="text-slate-400">
                            {searchQuery ? 'Try a different search term' : activeTab === 'pending' ? 'All applications have been reviewed' : 'Add faculty members to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredFaculty.map((member) => {
                            const name = member.full_name || member.fullName || 'Unknown';
                            return (
                                <div
                                    key={member.id}
                                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
                                >
                                    {/* Avatar */}
                                    <div className="flex justify-center mb-4">
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getDesignationColor(member.designation || 'Lecturer')} flex items-center justify-center shadow-lg`}>
                                            <span className="text-white font-bold text-lg">
                                                {getInitials(name)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold text-slate-800 text-lg">{name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{member.designation || member.role || 'Faculty'}</p>
                                        {member.department && (
                                            <p className="text-xs text-slate-400 mt-1">{member.department}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
                                        <MdEmail className="w-4 h-4" />
                                        <span className="truncate">{member.email}</span>
                                    </div>

                                    {/* Actions */}
                                    {activeTab === 'pending' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(member.id)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-200 transition-colors"
                                            >
                                                <MdCheckCircle className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(member.id)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                                            >
                                                <MdCancel className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove faculty"
                                            >
                                                <MdDelete className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
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