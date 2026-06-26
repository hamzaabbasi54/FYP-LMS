import React, { useState, useEffect } from 'react';
import {
    PiBuildings,
    PiCaretDown,
    PiCheckCircle,
    PiEnvelopeSimple,
    PiFloppyDisk,
    PiPhone,
    PiUser,
    PiX
} from 'react-icons/pi';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';

const CreateAccount = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        department: '',
        faculty: '',
        phoneNumber: '',
        isActive: true,
        employment_type: 'permanent'
    });

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { data: faculties = [] } = useQuery({
        queryKey: ['faculties'],
        queryFn: async () => {
            const response = await authApi.getFaculties();
            return response.success ? response.data : [];
        }
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments', formData.faculty],
        queryFn: async () => {
            const response = await authApi.getDepartments(formData.faculty);
            return response.success ? response.data : [];
        },
        enabled: !!formData.faculty
    });

    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isDeptAdmin = currentUser?.role === 'deptadmin';

    const roles = isSuperAdmin
        ? [{ value: 'deptadmin', label: 'Department Admin' }]
        : [{ value: 'faculty', label: 'Faculty (Teacher)' }];

    // Auto-select the only available role on mount
    useEffect(() => {
        if (roles.length === 1) {
            setFormData(prev => ({ ...prev, role: roles[0].value }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };



    const createAccountMutation = useMutation({
        mutationFn: (data) => authApi.createAccount(data),
        onSuccess: () => {
            setSuccess(true);
            setTimeout(() => {
                setFormData({
                    fullName: '',
                    email: '',
                    role: '',
                    department: '',
                    faculty: '',
                    phoneNumber: '',
                    isActive: true,
                    employment_type: 'permanent'
                });
                setSuccess(false);
            }, 3000);
        },
        onError: (err) => {
            console.error('Create account error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to create account. Please try again.';
            setError(errorMessage);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.role) {
            setError('Please select a role');
            return;
        }

        setError('');
        createAccountMutation.mutate(formData);
    };
    
    const loading = createAccountMutation.isPending;
    const selectedRoleLabel = roles.find(role => role.value === formData.role)?.label || 'Select role';

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                {/* Header */}
                <section className="grid gap-5 rounded-3xl border border-white/70 bg-gradient-to-br from-white via-sky-50/70 to-blue-50 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:grid-cols-[1fr_320px] lg:p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                            <PiUser className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-950">Create New Account</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create accounts with role and department assignments.</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Account Type</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{selectedRoleLabel}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            {isSuperAdmin ? 'Super Admin creates department admin accounts.' : 'Department admin creates faculty accounts.'}
                        </p>
                    </div>
                </section>

                {/* Success Message */}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
                        <div className="w-10 h-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <PiCheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-800 text-sm">Account Created Successfully!</h3>
                            <p className="text-xs text-emerald-600 mt-0.5">An invite email has been sent. The user can set their own password.</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-medium text-red-700">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white/94 shadow-sm">
                        <div className="border-b border-sky-100 bg-sky-50/55 px-6 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Step 01</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-950">Personal Information</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <PiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <PiEnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="john.doe@university.edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <PiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Role & Department */}
                    <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white/94 shadow-sm">
                        <div className="border-b border-sky-100 bg-sky-50/55 px-6 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Step 02</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-950">Role & Department Assignment</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Role *
                                </label>
                                <div className="relative">
                                    <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-4 pr-10 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                    >
                                        <option value="">-- Select Role --</option>
                                        {roles.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Faculty and Department - Only for Super Admin */}
                            {isSuperAdmin && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Faculty *
                                        </label>
                                        <div className="relative">
                                            <PiBuildings className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                            <select
                                                name="faculty"
                                                value={formData.faculty}
                                                onChange={handleChange}
                                                required
                                                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-10 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                            >
                                                <option value="">Select Faculty</option>
                                                {faculties.map((fac) => (
                                                    <option key={fac.id} value={fac.name}>{fac.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Department *
                                        </label>
                                        <div className="relative">
                                            <PiBuildings className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                                disabled={!formData.faculty}
                                                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-10 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {formData.faculty ? 'Select Department' : 'Select Faculty First'}
                                                </option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Employment Type - Only for Faculty */}
                            {formData.role === 'faculty' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Employment Type *
                                    </label>
                                    <div className="relative">
                                        <PiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <select
                                            name="employment_type"
                                            value={formData.employment_type}
                                            onChange={handleChange}
                                            required
                                            className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-10 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        >
                                            <option value="permanent">Permanent</option>
                                            <option value="visiting">Visiting</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm sm:flex-row">
                        <button
                            type="submit"
                            disabled={loading || !formData.role}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PiFloppyDisk className="w-4 h-4" />
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    fullName: '',
                                    email: '',
                                    role: '',
                                    department: '',
                                    faculty: '',
                                    phoneNumber: '',
                                    isActive: true
                                });
                                setError('');
                            }}
                            className="px-6 py-2.5 bg-white border border-sky-100 text-slate-700 font-semibold rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <PiX className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAccount;
