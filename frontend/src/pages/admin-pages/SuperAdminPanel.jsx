import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdBusiness, MdPhone, MdSchool, MdLogout, MdCheckCircle, MdDelete, MdSearch, MdArrowDropDown, MdAdminPanelSettings } from 'react-icons/md';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SuperAdminPanel = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        faculty: '',
        department: ''
    });
    const [departments, setDepartments] = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [formError, setFormError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Cached faculties list
    const { data: faculties = [] } = useQuery({
        queryKey: ['faculties'],
        queryFn: async () => {
            const res = await authApi.getFaculties();
            if (res.success) return res.data;
            throw new Error('Failed');
        },
        staleTime: 10 * 60 * 1000 // 10 minutes
    });

    // Cached admins list
    const { data: admins = [], isLoading: listLoading } = useQuery({
        queryKey: ['deptAdmins'],
        queryFn: async () => {
            const res = await authApi.getAllUsers({ role: 'deptadmin' });
            if (res.success) return res.data;
            throw new Error('Failed');
        }
    });

    useEffect(() => {
        if (formData.faculty) {
            const fetchDepts = async () => {
                try {
                    const res = await authApi.getDepartments(formData.faculty);
                    if (res.success) setDepartments(res.data);
                } catch (e) { console.error(e); }
            };
            fetchDepts();
        } else {
            setDepartments([]);
            setFormData(prev => ({ ...prev, department: '' }));
        }
    }, [formData.faculty]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');
        try {
            const res = await authApi.createAccount({
                fullName: formData.fullName,
                email: formData.email,
                role: 'deptadmin',
                department: formData.department,
                faculty: formData.faculty,
                phoneNumber: formData.phoneNumber,
                permissions: [],
                isActive: true
            });
            if (res.success) {
                setFormSuccess(`Account created for ${formData.fullName}. Invite email sent to ${formData.email}.`);
                setFormData({ fullName: '', email: '', phoneNumber: '', faculty: '', department: '' });
                queryClient.invalidateQueries({ queryKey: ['deptAdmins'] });
                setTimeout(() => setFormSuccess(''), 6000);
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create account.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this department admin?')) return;
        try {
            await authApi.deleteUser(userId);
            queryClient.invalidateQueries({ queryKey: ['deptAdmins'] });
        } catch { alert('Failed to delete.'); }
    };

    const handleToggle = async (userId) => {
        try {
            await authApi.toggleUserStatus(userId);
            queryClient.invalidateQueries({ queryKey: ['deptAdmins'] });
        } catch { alert('Failed to toggle status.'); }
    };

    const handleLogout = () => {
        logout();
    };

    const filteredAdmins = admins.filter(a =>
        (a.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.department_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MdSchool className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">Uni LMS</h1>
                            <p className="text-xs text-slate-500 font-medium">Super Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800">{user.fullName || 'Super Admin'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 shadow-sm text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                            <MdLogout className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Page Title */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <MdAdminPanelSettings className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Department Admin Accounts</h2>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base ml-14">
                        Create and manage administrative accounts for university departments.
                    </p>
                </div>

                {/* ========== CREATE FORM ========== */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Create New Department Admin</h3>

                    {formSuccess && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                            <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-emerald-800">{formSuccess}</p>
                        </div>
                    )}

                    {formError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-medium text-red-800">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                                        placeholder="Dr. Ahmed Khan"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                                        placeholder="ahmed.khan@qau.edu.pk"
                                    />
                                </div>
                            </div>

                            {/* Faculty */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <select
                                        name="faculty" value={formData.faculty} onChange={handleChange} required
                                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none text-sm"
                                    >
                                        <option value="" disabled>Select Faculty</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={f.name}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <select
                                        name="department" value={formData.department} onChange={handleChange} required
                                        disabled={!formData.faculty}
                                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="" disabled>{formData.faculty ? 'Select Department' : 'Select Faculty First'}</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Phone (optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                                        placeholder="+92 300 1234567"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                            >
                                {formLoading ? 'Creating...' : 'Create Account & Send Invite'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ========== ADMINS LIST ========== */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-800">Existing Admins</h3>
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-semibold text-xs rounded-full">
                                {admins.length} Total
                            </span>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text" placeholder="Search admins by name, email or department..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="p-0">
                        {listLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : filteredAdmins.length === 0 ? (
                            <div className="text-center py-12">
                                <MdPerson className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No department admins found.</p>
                                {searchTerm && <p className="text-slate-400 text-sm mt-1">Try adjusting your search term.</p>}
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {filteredAdmins.map((admin) => (
                                    <li key={admin.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 hover:bg-slate-50/80 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-700 font-bold text-sm">
                                                    {(admin.full_name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{admin.full_name}</p>
                                                <p className="text-sm text-slate-500">{admin.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                            <div className="text-left md:text-right">
                                                <p className="text-sm font-medium text-slate-700">{admin.department_name || '—'}</p>
                                                <p className="text-xs text-slate-500">{admin.faculty_name || '—'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(admin.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                                                        admin.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {admin.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(admin.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Delete Admin"
                                                >
                                                    <MdDelete className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminPanel;
