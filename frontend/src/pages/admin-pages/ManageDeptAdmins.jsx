import React, { useState, useEffect } from 'react';
import { MdPerson, MdEmail, MdBusiness, MdPhone, MdSave, MdCheckCircle, MdDelete, MdSearch, MdAdd, MdAdminPanelSettings, MdSupervisedUserCircle, MdArrowDropDown } from 'react-icons/md';
import { authApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ManageDeptAdmins = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'

    // --- Create Form State ---
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        faculty: '',
        department: ''
    });
    const [formSuccess, setFormSuccess] = useState('');
    const [formError, setFormError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Faculties
    const { data: faculties = [] } = useQuery({
        queryKey: ['faculties'],
        queryFn: async () => {
            const res = await authApi.getFaculties();
            if (res.success) return res.data || [];
            throw new Error('Failed to load faculties');
        }
    });

    // Fetch Departments (Dependent Query)
    const { data: departments = [] } = useQuery({
        queryKey: ['departments', formData.faculty],
        queryFn: async () => {
            const res = await authApi.getDepartments(formData.faculty);
            if (res.success) return res.data || [];
            throw new Error('Failed to load departments');
        },
        enabled: !!formData.faculty
    });

    // Reset department when faculty changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, department: '' }));
    }, [formData.faculty]);

    // Fetch Admins
    const { data: admins = [], isLoading: listLoading } = useQuery({
        queryKey: ['deptAdmins'],
        queryFn: async () => {
            const res = await authApi.getAllUsers({ role: 'deptadmin' });
            if (res.success) return res.data || [];
            throw new Error('Failed to load admins');
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const createMutation = useMutation({
        mutationFn: (payload) => authApi.createAccount(payload),
        onSuccess: (res) => {
            setFormSuccess(res.message || `Department Admin account created for ${formData.fullName}. An invite email has been sent.`);
            setFormData({ fullName: '', email: '', phoneNumber: '', faculty: '', department: '' });
            queryClient.invalidateQueries({ queryKey: ['deptAdmins'] });
            setTimeout(() => setFormSuccess(''), 5000);
        },
        onError: (err) => {
            setFormError(err.response?.data?.message || 'Failed to create account.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const payload = {
            fullName: formData.fullName,
            email: formData.email,
            role: 'deptadmin',
            department: formData.department,
            faculty: formData.faculty,
            phoneNumber: formData.phoneNumber,
            permissions: [],
            isActive: true
        };
        createMutation.mutate(payload);
    };

    const deleteMutation = useMutation({
        mutationFn: (userId) => authApi.deleteUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deptAdmins'] }),
        onError: () => alert('Failed to delete admin.')
    });

    const handleDelete = (userId) => {
        if (!window.confirm('Are you sure you want to delete this department admin?')) return;
        deleteMutation.mutate(userId);
    };

    const toggleMutation = useMutation({
        mutationFn: (userId) => authApi.toggleUserStatus(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deptAdmins'] }),
        onError: () => alert('Failed to toggle status.')
    });

    const handleToggle = (userId) => {
        toggleMutation.mutate(userId);
    };

    const filteredAdmins = admins.filter(a =>
        (a.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.department_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Department Admin Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Create and manage admin accounts for each department. Admins receive an email invite to set their password.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                                <MdAdminPanelSettings className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">{admins.length}</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Admins</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                                <MdCheckCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">{admins.filter(a => a.is_active).length}</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                                <MdBusiness className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {new Set(admins.map(a => a.faculty_name).filter(Boolean)).size}
                            </h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Faculties Covered</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
                            activeTab === 'list'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <MdSupervisedUserCircle className="w-5 h-5" /> All Admins
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
                            activeTab === 'create'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <MdAdd className="w-5 h-5" /> Create New Admin
                    </button>
                </div>

                {/* ====== CREATE TAB ====== */}
                {activeTab === 'create' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-1">Create Department Admin</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            The new admin will receive an email with a link to set their password.
                        </p>

                        {formSuccess && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MdCheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-emerald-800 text-sm">Account Created!</h3>
                                    <p className="text-xs text-emerald-600 mt-0.5">{formSuccess}</p>
                                </div>
                            </div>
                        )}

                        {formError && (
                            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-600">
                                <strong>Error:</strong> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                                    <div className="relative">
                                        <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                            placeholder="Dr. Ahmed Khan"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                                    <div className="relative">
                                        <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email" name="email" value={formData.email} onChange={handleChange} required
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                            placeholder="ahmed.khan@qau.edu.pk"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                            placeholder="+92 300 1234567"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Faculty & Department */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Faculty *</label>
                                    <div className="relative">
                                        <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <select
                                            name="faculty" value={formData.faculty} onChange={handleChange} required
                                            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none bg-white transition-all"
                                        >
                                            <option value="">Select Faculty</option>
                                            {faculties.map((f) => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                                    <div className="relative">
                                        <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <select
                                            name="department" value={formData.department} onChange={handleChange} required
                                            disabled={!formData.faculty}
                                            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-all bg-white"
                                        >
                                            <option value="">{formData.faculty ? 'Select Department' : 'Select Faculty First'}</option>
                                            {departments.map((d) => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                            >
                                <MdSave className="w-4 h-4" />
                                {createMutation.isPending ? 'Creating...' : 'Create & Send Invite Email'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ====== LIST TAB ====== */}
                {activeTab === 'list' && (
                    <>
                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text" placeholder="Search by name, email, or department..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Admin</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Faculty</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Department</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {listLoading ? (
                                            <tr><td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">Loading...</td></tr>
                                        ) : filteredAdmins.length === 0 ? (
                                            <tr><td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">No department admins found</td></tr>
                                        ) : (
                                            filteredAdmins.map((admin) => (
                                                <tr key={admin.id} className="hover:bg-slate-50 transition-colors border-t border-slate-100">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                                                                <span className="font-bold text-xs">
                                                                    {(admin.full_name || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-slate-800">{admin.full_name}</p>
                                                                <p className="text-xs text-slate-500">{admin.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">{admin.faculty_name || 'N/A'}</td>
                                                    <td className="px-5 py-4 text-sm text-slate-800">{admin.department_name || 'N/A'}</td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            onClick={() => handleToggle(admin.id)}
                                                            disabled={toggleMutation.isPending && toggleMutation.variables === admin.id}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                                                                admin.is_active
                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            }`}
                                                        >
                                                            {admin.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            onClick={() => handleDelete(admin.id)}
                                                            disabled={deleteMutation.isPending && deleteMutation.variables === admin.id}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                            title="Delete admin"
                                                        >
                                                            <MdDelete className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ManageDeptAdmins;
