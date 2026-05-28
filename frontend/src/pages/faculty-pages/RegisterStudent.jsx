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
        course: 'CS101: Intro to Computer Science',
        semester: 'Fall 2024',
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

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // In a real app, you would send this data to an API
        alert('Student registered successfully!');
        // Navigate back or to student list
        navigate(-1);
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

    const queryClient = useQueryClient();

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
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', assignmentId] });
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

                        {/* Student ID */}
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
                                Student ID
                            </label>
                            <div className="relative">
                                <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    id="studentId"
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="e.g. 2024-8849"
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

                {/* Enrollment Details Section */}
                <div className="mb-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                        <MdSchool className="w-5 h-5 text-gray-600" />
                        <h2 className="text-xl font-bold text-gray-800">Enrollment Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assign Course */}
                        <div>
                            <label htmlFor="course" className="block text-sm font-semibold text-gray-700 mb-2">
                                Assign Course
                            </label>
                            <div className="relative">
                                <select
                                    id="course"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
                                    required
                                >
                                    <option value="CS101: Intro to Computer Science">CS101: Intro to Computer Science</option>
                                    <option value="CS102: Data Structures">CS102: Data Structures</option>
                                    <option value="CS201: Algorithms">CS201: Algorithms</option>
                                    <option value="CS301: Database Systems">CS301: Database Systems</option>
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Semester */}
                        <div>
                            <label htmlFor="semester" className="block text-sm font-semibold text-gray-700 mb-2">
                                Semester
                            </label>
                            <div className="relative">
                                <select
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
                                    required
                                >
                                    <option value="Fall 2024">Fall 2024</option>
                                    <option value="Spring 2024">Spring 2024</option>
                                    <option value="Summer 2024">Summer 2024</option>
                                    <option value="Fall 2023">Fall 2023</option>
                                    <option value="Spring 2023">Spring 2023</option>
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Send Welcome Email Checkbox */}
                    <div className="mt-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="sendWelcomeEmail"
                                checked={formData.sendWelcomeEmail}
                                onChange={handleChange}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-semibold text-gray-700">
                                    Send welcome email
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    The student will receive an email with their temporary password and login instructions immediately.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-sm transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        Add Student
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
                                    <li><span className="font-bold text-emerald-600">first_name</span> (Required)</li>
                                    <li><span className="font-bold text-emerald-600">last_name</span> (Required)</li>
                                    <li><span className="font-bold text-emerald-600">email</span> (Required, Unique)</li>
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