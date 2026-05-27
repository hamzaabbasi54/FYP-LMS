import React, { useState, useEffect } from 'react';
import { MdPerson, MdEmail, MdBusiness, MdPhone, MdSave, MdCancel, MdCheckCircle, MdArrowDropDown } from 'react-icons/md';
import { authApi } from '../../services/api';

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

    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch faculties on mount
    useEffect(() => {
        fetchFaculties();
    }, []);

    // Fetch departments when faculty changes
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
            const response = await authApi.getFaculties();
            if (response.success) {
                setFaculties(response.data);
            }
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }
    };

    const fetchDepartments = async (faculty) => {
        try {
            const response = await authApi.getDepartments(faculty);
            if (response.success) {
                setDepartments(response.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isDeptAdmin = currentUser.role === 'deptadmin';

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



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.role) {
            setError('Please select a role');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authApi.createAccount(formData);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    setFormData({
                        fullName: '',
                        email: '',
                        role: '',
                        department: '',
                        faculty: '',
                        phoneNumber: '',
                        isActive: true
                    });
                    setSuccess(false);
                }, 3000);
            }
        } catch (err) {
            console.error('Create account error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to create account. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Create New Account
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5">
                        Create accounts with custom role and permission assignments
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 flex items-center gap-4 animate-fade-in">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <MdCheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-800">Account Created Successfully!</h3>
                            <p className="text-sm text-emerald-600">An invite email has been sent. The user can set their own password.</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-600">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="john.doe@university.edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Role & Department */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Role & Department Assignment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Role *
                                </label>
                                <div className="relative">
                                    <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                                            <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                            <select
                                                name="faculty"
                                                value={formData.faculty}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                                            <MdBusiness className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                                disabled={!formData.faculty}
                                                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                                        <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                        <select
                                            name="employment_type"
                                            value={formData.employment_type}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.role}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MdSave className="w-5 h-5" />
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
                            className="px-6 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            <MdCancel className="w-5 h-5" />
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAccount;
