import React, { useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdPerson, MdSchool, MdEmail, MdBadge, MdPhone, MdDescription, MdAdd, MdChevronRight, MdFileUpload, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import { studentApi } from '../../services/api';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const RegisterStudent = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();
    const fileInputRef = useRef(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        studentId: '',
        phoneNumber: '',
        email: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        matricMarks: '',
        fscMarks: '',
        background: '',
        sendWelcomeEmail: true
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const queryClient = useQueryClient();

    const registerMutation = useMutation({
        mutationFn: (data) => studentApi.facultyRegisterStudent(assignmentId, data),
        onSuccess: (response) => {
            toast.success('Student registered successfully!');
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', String(assignmentId)] });
            queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
            queryClient.invalidateQueries({ queryKey: ['facultyAssignedCourse', String(assignmentId)] });
            navigate(-1);
        },
        onError: (error) => {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || 'Failed to register student');
        }
    });

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phoneNumber,
            student_id_number: formData.studentId,
            parent_name: formData.parentName,
            parent_email: formData.parentEmail,
            parent_phone: formData.parentPhone,
            matric_marks: formData.matricMarks ? Number(formData.matricMarks) : null,
            fsc_marks: formData.fscMarks ? Number(formData.fscMarks) : null,
            background: formData.background || null
        };

        registerMutation.mutate(payload);
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(-1);
    };

    const handleImportClick = () => setShowImportModal(true);
    const triggerFileInput = () => {
        setShowImportModal(false);
        fileInputRef.current?.click();
    };



    const importMutation = useMutation({
        mutationFn: (file) => studentApi.facultyImportStudents(assignmentId, file),
        onSuccess: (response) => {
            const imported = response.data?.imported || 0;
            const skipped = response.data?.skipped || 0;
            
            if (skipped > 0) {
                const firstError = response.data?.errors?.[0]?.error || 'Unknown error';
                toast.warn(`Imported ${imported} students. Skipped ${skipped}. First error: ${firstError}`);
            } else {
                toast.success(`Imported and enrolled ${imported} students successfully!`);
            }
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', String(assignmentId)] });
            queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
            queryClient.invalidateQueries({ queryKey: ['facultyAssignedCourse', String(assignmentId)] });
            navigate(-1);
        },
        onError: (error) => {
            console.error('Import error:', error);
            toast.error(error.response?.data?.message || 'Failed to import students');
        },
        onSettled: () => {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImporting(true);
            importMutation.mutate(file);
        } else {
            e.target.value = '';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <OverlayLoader isLoading={isImporting} text="Importing and enrolling students..." />
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                    Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-400">Intro to CS</span>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">Add Student</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                        Register New Student
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Fill in the information below to manually enroll a student into the course. To add multiple students, use the CSV import tool.
                    </p>
                </div>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button type="button" onClick={handleImportClick} className="flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm whitespace-nowrap">
                    <MdDescription className="w-5 h-5 mr-2" />
                    Import CSV
                </button>
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                {/* Student Information Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <MdPerson className="w-5 h-5 text-gray-600" />
                        <h2 className="text-xl font-bold text-gray-800">Student Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="e.g. Sara"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="e.g. Malik"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                            />
                        </div>

                        {/* Roll Number */}
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
                                Roll Number
                            </label>
                            <div className="relative">
                                <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    id="studentId"
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="e.g. 04162213027"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {/* Email Address - Full Width */}
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                University Email Address
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="sara.malik@university.edu"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                                Must be a valid .edu email address
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Information Section */}
                <div className="mb-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                        <MdDescription className="w-5 h-5 text-gray-600" />
                        <h2 className="text-xl font-bold text-gray-800">Additional Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="parentName" className="block text-sm font-semibold text-gray-700 mb-2">
                                Parent Name <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="parentName"
                                name="parentName"
                                value={formData.parentName}
                                onChange={handleChange}
                                placeholder="Parent's full name"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="parentPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                                Parent Phone <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                id="parentPhone"
                                name="parentPhone"
                                value={formData.parentPhone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="parentEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                                Parent Email <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="email"
                                id="parentEmail"
                                name="parentEmail"
                                value={formData.parentEmail}
                                onChange={handleChange}
                                placeholder="parent@example.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="matricMarks" className="block text-sm font-semibold text-gray-700 mb-2">
                                Matric Marks <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                id="matricMarks"
                                name="matricMarks"
                                value={formData.matricMarks}
                                onChange={handleChange}
                                placeholder="e.g. 950"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="fscMarks" className="block text-sm font-semibold text-gray-700 mb-2">
                                FSc Marks <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                id="fscMarks"
                                name="fscMarks"
                                value={formData.fscMarks}
                                onChange={handleChange}
                                placeholder="e.g. 900"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="background" className="block text-sm font-semibold text-gray-700 mb-2">
                                Academic Background <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <select
                                id="background"
                                name="background"
                                value={formData.background}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                            >
                                <option value="">Select background...</option>
                                <option value="pre-med">Pre-Medical</option>
                                <option value="pre-engineering">Pre-Engineering</option>
                                <option value="ics">ICS</option>
                            </select>
                        </div>
                    </div>
                </div>


                {/* Form Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={registerMutation.isPending}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {registerMutation.isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Registering...
                            </>
                        ) : (
                            <>
                                <MdAdd className="w-5 h-5 mr-1.5" />
                                Add Student
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import Students
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="font-semibold text-slate-800 mb-2">Excel File Format Requirements</h4>
                            <p className="text-sm text-slate-600 mb-4">Please ensure your Excel file (.xlsx or .csv) contains the following column headers exactly as shown:</p>
                            
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                                <ul className="text-sm text-slate-600 space-y-2 font-mono">
                                    <li><span className="font-bold text-emerald-600">roll_number</span> (Required, Unique)</li>
                                    <li><span className="font-bold text-emerald-600">first_name</span> (Required)</li>
                                    <li><span className="font-bold text-emerald-600">last_name</span> (Required)</li>
                                    <li><span className="font-bold text-emerald-600">email</span> (Required)</li>
                                    <li><span className="text-slate-500">phone</span> (Optional)</li>
                                    <li><span className="text-slate-500">parent_name</span> (Optional)</li>
                                    <li><span className="text-slate-500">parent_email</span> (Optional)</li>
                                    <li><span className="text-slate-500">parent_phone</span> (Optional)</li>
                                    <li><span className="text-slate-500">matric_marks</span> (Optional, Number)</li>
                                    <li><span className="text-slate-500">fsc_marks</span> (Optional, Number)</li>
                                    <li><span className="text-slate-500">background</span> (Optional: 'pre-med', 'pre-engineering', or 'ics')</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                                <button onClick={triggerFileInput} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg font-medium flex items-center justify-center gap-2">
                                    <MdFileUpload className="w-5 h-5" /> Select File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterStudent;