import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdBusiness, MdPhone, MdSchool, MdLogout, MdCheckCircle, MdDelete, MdSearch, MdArrowDropDown, MdAdminPanelSettings } from 'react-icons/md';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const SuperAdminPanel = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        faculty: '',
        department: ''
    });
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [formError, setFormError] = useState('');

    // List state
    const [admins, setAdmins] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFaculties();
        fetchAdmins();
    }, []);

    useEffect(() => {
        if (formData.faculty) {
            fetchDepartments(formData.faculty);
        } else {
            setDepartments([]);
            setFormData(prev => ({ ...prev, department: '' }));
        }
    }, [formData.faculty]);

    const fetchFaculties = async () => {
        try {
            const res = await authApi.getFaculties();
            if (res.success) setFaculties(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchDepartments = async (faculty) => {
        try {
            const res = await authApi.getDepartments(faculty);
            if (res.success) setDepartments(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchAdmins = async () => {
        setListLoading(true);
        try {
            const res = await authApi.getAllUsers({ role: 'deptadmin' });
            if (res.success) setAdmins(res.data);
        } catch (e) { console.error(e); }
        finally { setListLoading(false); }
    };

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
                fetchAdmins();
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
            fetchAdmins();
        } catch { alert('Failed to delete.'); }
    };

    const handleToggle = async (userId) => {
        try {
            await authApi.toggleUserStatus(userId);
            fetchAdmins();
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Top Bar */}
            <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                            <MdSchool className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Uni LMS</h1>
                            <p className="text-xs text-slate-400">Super Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">{user.fullName || 'Super Admin'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg transition-all duration-200 text-sm"
                        >
                            <MdLogout className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Page Title */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <MdAdminPanelSettings className="w-7 h-7 text-amber-500" />
                        <h2 className="text-2xl font-bold text-white">Department Admin Accounts</h2>
                    </div>
                    <p className="text-slate-400 ml-10">
                        Create admin accounts for university departments. Each admin receives an email to set their password.
                    </p>
                </div>

                {/* ========== CREATE FORM ========== */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Create New Department Admin</h3>

                    {formSuccess && (
                        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                            <MdCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <p className="text-sm text-emerald-300">{formSuccess}</p>
                        </div>
                    )}

                    {formError && (
                        <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                                <div className="relative">
                                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Dr. Ahmed Khan"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address *</label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="ahmed.khan@qau.edu.pk"
                                    />
                                </div>
                            </div>

                            {/* Faculty */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Faculty *</label>
                                <div className="relative">
                                    <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                    <select
                                        name="faculty" value={formData.faculty} onChange={handleChange} required
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">Select Faculty</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={f.name}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Department *</label>
                                <div className="relative">
                                    <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                    <select
                                        name="department" value={formData.department} onChange={handleChange} required
                                        disabled={!formData.faculty}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">{formData.faculty ? 'Select Department' : 'Select Faculty First'}</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Phone (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone <span className="text-slate-500">(optional)</span></label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="+92 300 1234567"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                            {formLoading ? 'Creating...' : 'Create Account & Send Invite'}
                        </button>
                    </form>
                </div>

                {/* ========== ADMINS LIST ========== */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                        <h3 className="text-lg font-semibold text-white">
                            Existing Admins <span className="text-slate-500 font-normal text-sm">({admins.length})</span>
                        </h3>
                        <div className="relative w-full sm:w-72">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text" placeholder="Search..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {listLoading ? (
                        <p className="text-slate-500 text-center py-8">Loading...</p>
                    ) : filteredAdmins.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No department admins found.</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredAdmins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm">
                                                {(admin.full_name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{admin.full_name}</p>
                                            <p className="text-xs text-slate-400">{admin.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm text-slate-300">{admin.department_name || '—'}</p>
                                            <p className="text-xs text-slate-500">{admin.faculty_name || '—'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(admin.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                admin.is_active
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                        >
                                            {admin.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <MdDelete className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminPanel;
