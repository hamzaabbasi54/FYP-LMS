import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdPerson, MdSchool, MdEmail, MdBadge, MdPhone, MdDescription, MdAdd, MdChevronRight } from 'react-icons/md';

const RegisterStudent = () => {
    const navigate = useNavigate();
    const { courseId, batchId } = useParams();

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

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                <button className="flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm whitespace-nowrap">
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
                        className="flex items-center justify-center px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm transition-colors font-medium text-sm"
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        Add Student
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterStudent;

