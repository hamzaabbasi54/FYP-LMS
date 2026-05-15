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
        permissions: [],
        isActive: true
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

    const roles = [
        { value: 'faculty', label: 'Faculty (Teacher)' },
        { value: 'deptadmin', label: 'Department Admin' }
    ];

    const availablePermissions = [
        {
            category: 'Academic Structure',
            permissions: [
                { code: 'batches.view', label: 'View Batches', module: 'Batch Management' },
                { code: 'batches.create', label: 'Create Batches', module: 'Batch Management' },
                { code: 'batches.edit', label: 'Edit Batches', module: 'Batch Management' },
                { code: 'batches.delete', label: 'Delete Batches', module: 'Batch Management' },
                { code: 'semesters.view', label: 'View Semesters', module: 'Semester Management' },
                { code: 'semesters.create', label: 'Create Semesters', module: 'Semester Management' },
                { code: 'semesters.edit', label: 'Edit Semesters', module: 'Semester Management' },
                { code: 'plos.view', label: 'View PLOs', module: 'PLO Management' },
                { code: 'plos.create', label: 'Create PLOs', module: 'PLO Management' }
            ]
        },
        {
            category: 'Course Management',
            permissions: [
                { code: 'courses.view', label: 'View Courses', module: 'Course Catalog' },
                { code: 'courses.create', label: 'Create Courses', module: 'Course Catalog' },
                { code: 'courses.edit', label: 'Edit Courses', module: 'Course Catalog' },
                { code: 'courses.delete', label: 'Delete Courses', module: 'Course Catalog' },
                { code: 'courses.assign', label: 'Assign Faculty to Courses', module: 'Course Assignment' },
                { code: 'materials.upload', label: 'Upload Course Materials', module: 'Course Materials' },
                { code: 'materials.view', label: 'View Course Materials', module: 'Course Materials' }
            ]
        },
        {
            category: 'Assessment & Grading',
            permissions: [
                { code: 'assignments.view', label: 'View Assignments', module: 'Assignment Management' },
                { code: 'assignments.create', label: 'Create Assignments', module: 'Assignment Management' },
                { code: 'assignments.grade', label: 'Grade Assignments', module: 'Grading' },
                { code: 'grades.view', label: 'View Grades', module: 'Grading' },
                { code: 'grades.submit', label: 'Submit Final Grades', module: 'Grading' }
            ]
        },
        {
            category: 'Attendance',
            permissions: [
                { code: 'attendance.view', label: 'View Attendance', module: 'Attendance Tracking' },
                { code: 'attendance.mark', label: 'Mark Attendance', module: 'Attendance Tracking' },
                { code: 'attendance.edit', label: 'Edit Attendance', module: 'Attendance Tracking' }
            ]
        },
        {
            category: 'Student Management',
            permissions: [
                { code: 'students.view', label: 'View Students', module: 'Student Management' },
                { code: 'students.create', label: 'Add Students', module: 'Student Management' },
                { code: 'students.edit', label: 'Edit Student Info', module: 'Student Management' },
                { code: 'students.import', label: 'Bulk Import Students', module: 'Student Management' }
            ]
        },
        {
            category: 'Lab Management',
            permissions: [
                { code: 'labs.view', label: 'View Lab Sessions', module: 'Lab Management' },
                { code: 'labs.manage', label: 'Manage Lab Sessions', module: 'Lab Management' },
                { code: 'labs.grade', label: 'Grade Lab Work', module: 'Lab Management' }
            ]
        },
        {
            category: 'Reports & Analytics',
            permissions: [
                { code: 'reports.view', label: 'View Reports', module: 'Reports Dashboard' },
                { code: 'reports.department', label: 'Department Reports', module: 'Reports Dashboard' },
                { code: 'reports.course', label: 'Course Reports', module: 'Reports Dashboard' }
            ]
        }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePermissionChange = (permissionCode) => {
        setFormData(prev => {
            const permissions = prev.permissions.includes(permissionCode)
                ? prev.permissions.filter(p => p !== permissionCode)
                : [...prev.permissions, permissionCode];
            return { ...prev, permissions };
        });
    };

    const selectAllInCategory = (category) => {
        const categoryPermissions = availablePermissions
            .find(c => c.category === category)
            ?.permissions.map(p => p.code) || [];

        const allSelected = categoryPermissions.every(code =>
            formData.permissions.includes(code)
        );

        if (allSelected) {
            setFormData(prev => ({
                ...prev,
                permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                permissions: [...new Set([...prev.permissions, ...categoryPermissions])]
            }));
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.role) {
            setError('Please select a role');
            return;
        }

        if (formData.permissions.length === 0) {
            setError('Please select at least one permission');
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
                        permissions: [],
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
                        </div>
                    </div>

                    {/* Permissions Selection */}
                    {formData.role && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Assign Permissions</h2>
                                <span className="text-sm text-slate-500">
                                    {formData.permissions.length} permission(s) selected
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-6">
                                Select which modules this user can access. Only checked modules will be visible on their dashboard.
                            </p>

                            <div className="space-y-6">
                                {availablePermissions.map((category) => {
                                    const categoryPermissions = category.permissions.map(p => p.code);
                                    const allSelected = categoryPermissions.every(code =>
                                        formData.permissions.includes(code)
                                    );

                                    return (
                                        <div key={category.category} className="border border-slate-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-slate-800">{category.category}</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => selectAllInCategory(category.category)}
                                                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${allSelected
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {allSelected ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {category.permissions.map((permission) => (
                                                    <label
                                                        key={permission.code}
                                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissions.includes(permission.code)}
                                                            onChange={() => handlePermissionChange(permission.code)}
                                                            className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {permission.label}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Module: {permission.module}
                                                            </p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.role || formData.permissions.length === 0}
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
                                    permissions: [],
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
