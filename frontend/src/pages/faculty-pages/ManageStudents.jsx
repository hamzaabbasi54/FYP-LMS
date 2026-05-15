import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdSearch, MdAdd, MdChevronRight, MdPeople, MdEmail, MdPhone, MdMoreVert } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { studentApi } from '../../services/api';

const ManageStudents = () => {
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch enrolled students from the API
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError(null);
                const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
                if (!courseAssignmentId) {
                    setError('No course selected');
                    setLoading(false);
                    return;
                }
                const response = await studentApi.getEnrolledStudents(courseAssignmentId);
                if (response.success) {
                    setStudents(response.data || []);
                } else {
                    setError(response.message || 'Failed to fetch students');
                }
            } catch (err) {
                console.error('Error fetching enrolled students:', err);
                setError('Failed to fetch enrolled students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCourse, assignmentId]);

    const filteredStudents = students.filter(student => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) ||
            student.student_id_number?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query);
    });

    // Generate avatar color based on student name
    const getAvatarColor = (name) => {
        const colors = [
            'bg-purple-100 text-purple-700',
            'bg-blue-100 text-blue-700',
            'bg-green-100 text-green-700',
            'bg-yellow-100 text-yellow-700',
            'bg-indigo-100 text-indigo-700',
            'bg-pink-100 text-pink-700',
            'bg-orange-100 text-orange-700',
            'bg-teal-100 text-teal-700',
            'bg-cyan-100 text-cyan-700',
            'bg-rose-100 text-rose-700',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getInitials = (firstName, lastName) => {
        return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500">
                <Link to={selectedCourse ? `/faculty-mycourses/${courseAssignmentId}` : '/faculty-dashboard'} className="hover:text-blue-600 transition-colors">
                    My Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">
                    {selectedCourse ? selectedCourse.code : 'Course'} - Manage Students
                </span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Manage Students</h1>
                    <p className="text-gray-600 text-sm">
                        View and manage students enrolled in{' '}
                        <span className="font-semibold">{selectedCourse ? selectedCourse.title : 'this course'}</span>
                    </p>
                </div>
                <Link
                    to={`/faculty-mycourses/${courseAssignmentId}/register-student`}
                    className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    Add Student
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                            <p className="text-sm text-gray-500">Total Enrolled</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{students.filter(s => s.is_active).length}</p>
                            <p className="text-sm text-gray-500">Active Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {students.length > 0 ? (students.reduce((acc, s) => acc + parseFloat(s.cgpa || 0), 0) / students.length).toFixed(2) : '0.00'}
                            </p>
                            <p className="text-sm text-gray-500">Avg CGPA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading enrolled students...</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="p-12 text-center">
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && students.length === 0 && (
                    <div className="p-12 text-center">
                        <MdPeople className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">No students enrolled in this course yet.</p>
                        <Link
                            to={`/faculty-mycourses/${courseAssignmentId}/register-student`}
                            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                            <MdAdd className="w-4 h-4 mr-1" />
                            Add First Student
                        </Link>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && students.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Enrolled
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        CGPA
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStudents.map((student) => {
                                    const fullName = `${student.first_name} ${student.last_name}`;
                                    const initials = getInitials(student.first_name, student.last_name);
                                    const avatarColor = getAvatarColor(fullName);

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Student Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                        <span className="font-bold text-sm">{initials}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{fullName}</p>
                                                        <p className="text-gray-500 text-xs">ID: {student.student_id_number}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                                                        <MdEmail className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate max-w-[200px]">{student.email}</span>
                                                    </div>
                                                    {student.phone && (
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <MdPhone className="w-4 h-4 text-gray-400" />
                                                            <span>{student.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Enrolled Date */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{formatDate(student.enrolled_at)}</span>
                                            </td>

                                            {/* CGPA */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${parseFloat(student.cgpa) >= 3.5 ? 'text-green-600' :
                                                            parseFloat(student.cgpa) >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {parseFloat(student.cgpa || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${student.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {student.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MdMoreVert className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredStudents.length === 0 && students.length > 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageStudents;