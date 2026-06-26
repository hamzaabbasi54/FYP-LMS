import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdBusiness, MdPhone, MdLogout, MdCheckCircle, MdDelete, MdSearch, MdArrowDropDown, MdAdminPanelSettings, MdGroups, MdDomain, MdVerifiedUser } from 'react-icons/md';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import campusFlowLogo from '../../assets/campus-flow-logo-clean.svg';

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

    const activeAdmins = admins.filter(admin => admin.is_active).length;

    return (
        <div className="min-h-screen font-sans bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.28),transparent_30rem),linear-gradient(135deg,#f8fcff_0%,#eef8ff_52%,#ffffff_100%)] text-slate-900">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 border-b border-sky-100/80 bg-white/78 shadow-sm backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={campusFlowLogo} alt="Campus Flow" className="h-12 w-36 object-contain object-left" />
                        <div>
                            <h1 className="text-lg font-bold text-slate-950 leading-tight">Campus Flow</h1>
                            <p className="text-xs text-slate-500 font-medium">Super Admin Console</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800">{user.fullName || 'Super Admin'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/90 border border-slate-200 shadow-sm text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all duration-200 text-sm font-semibold"
                        >
                            <MdLogout className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-8 space-y-6">
                {/* Page Title */}
                <section className="glass-panel rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                                <MdAdminPanelSettings className="w-4 h-4" />
                                Control Center
                            </div>
                            <h2 className="mt-4 text-3xl font-bold text-slate-950">Department Admin Accounts</h2>
                            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
                                Create, activate, and manage administrative access for departments across Campus Flow.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[28rem]">
                            <div className="rounded-2xl border border-sky-100 bg-white/78 p-4 shadow-sm">
                                <MdGroups className="w-5 h-5 text-sky-700 mb-2" />
                                <p className="text-2xl font-bold text-slate-950">{admins.length}</p>
                                <p className="text-xs font-semibold text-slate-500">Admins</p>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-white/78 p-4 shadow-sm">
                                <MdVerifiedUser className="w-5 h-5 text-emerald-600 mb-2" />
                                <p className="text-2xl font-bold text-slate-950">{activeAdmins}</p>
                                <p className="text-xs font-semibold text-slate-500">Active</p>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-white/78 p-4 shadow-sm">
                                <MdDomain className="w-5 h-5 text-cyan-700 mb-2" />
                                <p className="text-2xl font-bold text-slate-950">{faculties.length}</p>
                                <p className="text-xs font-semibold text-slate-500">Faculties</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== CREATE FORM ========== */}
                <div className="bg-white/90 backdrop-blur border border-sky-100 rounded-3xl shadow-sm p-6 md:p-8">
                    <div className="mb-6 border-b border-sky-100 pb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Access setup</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-950">Create New Department Admin</h3>
                    </div>

                    {formSuccess && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-emerald-800">{formSuccess}</p>
                        </div>
                    )}

                    {formError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm font-medium text-red-800">
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 text-slate-800 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors text-sm"
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 text-slate-800 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors text-sm"
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
                                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-sky-100 text-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors appearance-none text-sm"
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
                                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-sky-100 text-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors appearance-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 text-slate-800 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors text-sm"
                                        placeholder="+92 300 1234567"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="px-6 py-3 bg-sky-600 text-white font-semibold text-sm rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-sky-700/20"
                            >
                                {formLoading ? 'Creating...' : 'Create Account & Send Invite'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ========== ADMINS LIST ========== */}
                <div className="bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="p-6 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-sky-50/60">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-950">Existing Admins</h3>
                            <span className="px-2.5 py-0.5 bg-white text-sky-700 border border-sky-100 font-semibold text-xs rounded-full">
                                {admins.length} Total
                            </span>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text" placeholder="Search admins by name, email or department..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 text-slate-800 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors text-sm shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="p-0">
                        {listLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="w-8 h-8 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
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
                                    <li key={admin.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 hover:bg-sky-50/60 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-sky-700 font-bold text-sm">
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
