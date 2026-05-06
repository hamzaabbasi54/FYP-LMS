import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdChevronRight, MdPeople, MdEmail, MdPhone, MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';

const ManageStudents = () => {
    const { selectedCourse } = useCourse();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock students data with Pakistani names
    const students = [
        {
            id: 1,
            name: 'Ayesha Khan',
            studentId: '2023001',
            email: 'ayesha.khan@university.edu.pk',
            phone: '+92 300 1234567',
            initials: 'AK',
            avatarColor: 'bg-purple-100 text-purple-700',
            status: 'Active',
            enrolledDate: 'Aug 15, 2024',
            attendance: 92
        },
        {
            id: 2,
            name: 'Bilal Ahmed',
            studentId: '2023002',
            email: 'bilal.ahmed@university.edu.pk',
            phone: '+92 301 2345678',
            initials: 'BA',
            avatarColor: 'bg-blue-100 text-blue-700',
            status: 'Active',
            enrolledDate: 'Aug 15, 2024',
            attendance: 88
        },
        {
            id: 3,
            name: 'Chaudhry Nazeer',
            studentId: '2023003',
            email: 'chaudhry.nazeer@university.edu.pk',
            phone: '+92 302 3456789',
            initials: 'CN',
            avatarColor: 'bg-green-100 text-green-700',
            status: 'Active',
            enrolledDate: 'Aug 15, 2024',
            attendance: 95
        },
        {
            id: 4,
            name: 'Dua Khalid',
            studentId: '2023004',
            email: 'dua.khalid@university.edu.pk',
            phone: '+92 303 4567890',
            initials: 'DK',
            avatarColor: 'bg-yellow-100 text-yellow-700',
            status: 'Active',
            enrolledDate: 'Aug 16, 2024',
            attendance: 90
        },
        {
            id: 5,
            name: 'Ehab Latif',
            studentId: '2023005',
            email: 'ehab.latif@university.edu.pk',
            phone: '+92 304 5678901',
            initials: 'EL',
            avatarColor: 'bg-indigo-100 text-indigo-700',
            status: 'Active',
            enrolledDate: 'Aug 15, 2024',
            attendance: 85
        },
        {
            id: 6,
            name: 'Fatima Zahra',
            studentId: '2023006',
            email: 'fatima.zahra@university.edu.pk',
            phone: '+92 305 6789012',
            initials: 'FZ',
            avatarColor: 'bg-pink-100 text-pink-700',
            status: 'Active',
            enrolledDate: 'Aug 17, 2024',
            attendance: 98
        },
        {
            id: 7,
            name: 'Ghulam Abbas',
            studentId: '2023007',
            email: 'ghulam.abbas@university.edu.pk',
            phone: '+92 306 7890123',
            initials: 'GA',
            avatarColor: 'bg-orange-100 text-orange-700',
            status: 'Inactive',
            enrolledDate: 'Aug 15, 2024',
            attendance: 65
        },
        {
            id: 8,
            name: 'Hira Malik',
            studentId: '2023008',
            email: 'hira.malik@university.edu.pk',
            phone: '+92 307 8901234',
            initials: 'HM',
            avatarColor: 'bg-teal-100 text-teal-700',
            status: 'Active',
            enrolledDate: 'Aug 16, 2024',
            attendance: 91
        },
        {
            id: 9,
            name: 'Imran Hussain',
            studentId: '2023009',
            email: 'imran.hussain@university.edu.pk',
            phone: '+92 308 9012345',
            initials: 'IH',
            avatarColor: 'bg-cyan-100 text-cyan-700',
            status: 'Active',
            enrolledDate: 'Aug 15, 2024',
            attendance: 94
        },
        {
            id: 10,
            name: 'Javeria Siddiqui',
            studentId: '2023010',
            email: 'javeria.siddiqui@university.edu.pk',
            phone: '+92 309 0123456',
            initials: 'JS',
            avatarColor: 'bg-rose-100 text-rose-700',
            status: 'Active',
            enrolledDate: 'Aug 18, 2024',
            attendance: 87
        }
    ];

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = students.filter(s => s.status === 'Active').length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500">
                <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                    My Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">
                    {selectedCourse ? selectedCourse.code : 'CS-101'} - Manage Students
                </span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Manage Students</h1>
                    <p className="text-gray-600 text-sm">
                        View and manage students enrolled in{' '}
                        <span className="font-semibold">{selectedCourse ? selectedCourse.title : 'Introduction to Programming'}</span>
                    </p>
                </div>
                <Link
                    to="/faculty-mycourses/register-student"
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
                            <p className="text-sm text-gray-500">Total Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
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
                                {Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length)}%
                            </p>
                            <p className="text-sm text-gray-500">Avg Attendance</p>
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

                {/* Table */}
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
                                    Attendance
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
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Student Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${student.avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                <span className="font-bold text-sm">{student.initials}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                                                <p className="text-gray-500 text-xs">ID: {student.studentId}</p>
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
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <MdPhone className="w-4 h-4 text-gray-400" />
                                                <span>{student.phone}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Enrolled Date */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{student.enrolledDate}</span>
                                    </td>

                                    {/* Attendance */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${student.attendance >= 90 ? 'bg-green-500' :
                                                        student.attendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${student.attendance}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{student.attendance}%</span>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${student.status === 'Active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MdMoreVert className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageStudents;