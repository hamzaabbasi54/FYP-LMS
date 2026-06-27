import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    PiArrowRight as MdChevronRight,
    PiDotsThreeVertical as MdMoreVert,
    PiEnvelopeSimple as MdEmail,
    PiMagnifyingGlass as MdSearch,
    PiPhone as MdPhone,
    PiPlus as MdAdd,
    PiUsersThree as MdPeople
} from 'react-icons/pi';
import { useCourse } from '../../context/CourseContext';
import { studentApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import OverlayLoader from '../../components/common/OverlayLoader';

const ManageStudents = () => {
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [isPaginating, setIsPaginating] = useState(false);
    const limit = 10;
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const { data: students = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['enrolledStudents', String(courseAssignmentId)],
        enabled: !!courseAssignmentId,
        queryFn: async () => {
            const response = await studentApi.getEnrolledStudents(courseAssignmentId);
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch students');
            }
            return response.data || [];
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000
    });

    const error = !courseAssignmentId ? 'No course selected' : (queryError?.message || null);

    const filteredStudents = students.filter(student => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) ||
            student.student_id_number?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query);
    });

    const totalPages = Math.ceil(filteredStudents.length / limit);
    const paginatedStudents = filteredStudents.slice((page - 1) * limit, page * limit);

    const handlePageChange = (newPage) => {
        setIsPaginating(true);
        // Small delay to allow the loading screen to render, as requested by user
        setTimeout(() => {
            setPage(newPage);
            setIsPaginating(false);
        }, 400); 
    };

    // Generate avatar color based on student name
    const getAvatarColor = (name) => {
        const colors = [
            'bg-sky-50 text-sky-700',
            'bg-blue-100 text-sky-700',
            'bg-emerald-100 text-emerald-700',
            'bg-amber-50 text-amber-700',
            'bg-sky-50 text-sky-700',
            'bg-sky-50 text-sky-700',
            'bg-amber-50 text-amber-700',
            'bg-sky-50 text-sky-700',
            'bg-sky-50 text-sky-700',
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


    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            <OverlayLoader isLoading={isPaginating} text="Loading page..." />
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 font-medium">
                <Link to={selectedCourse ? `/faculty-mycourses/${courseAssignmentId}` : '/faculty-dashboard'} className="hover:text-sky-700 transition-colors">
                    My Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <span className="text-slate-800 font-semibold">
                    {selectedCourse ? selectedCourse.code : 'Course'} - Manage Students
                </span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Manage Students</h1>
                    <p className="text-slate-600 text-sm font-medium">
                        View and manage students enrolled in{' '}
                        <span className="font-bold text-slate-800">{selectedCourse ? selectedCourse.title : 'this course'}</span>
                    </p>
                </div>
                <Link
                    to={`/faculty-mycourses/${courseAssignmentId}/register-student`}
                    className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 shadow-sm transition-colors font-medium text-sm"
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    Add Student
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-3xl bg-blue-100 flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-sky-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{students.length}</p>
                            <p className="text-sm font-medium text-slate-500">Total Enrolled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-sky-100">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-sky-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent font-medium text-slate-800 placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-sky-100 border-t-sky-600 rounded-3xl animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading enrolled students...</p>
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
                        <MdPeople className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm font-medium">No students enrolled in this course yet.</p>
                        <Link
                            to={`/faculty-mycourses/${courseAssignmentId}/register-student`}
                            className="inline-flex items-center mt-4 px-4 py-2 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 text-sm font-medium transition-colors"
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
                            <thead className="bg-sky-50/45 border-b border-sky-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Enrolled
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedStudents.map((student) => {
                                    const fullName = `${student.first_name} ${student.last_name}`;
                                    const initials = getInitials(student.first_name, student.last_name);
                                    const avatarColor = getAvatarColor(fullName);

                                    return (
                                        <tr key={student.id} className="hover:bg-sky-50/45 transition-colors">
                                            {/* Student Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-3xl ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                        <span className="font-bold text-sm">{initials}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{fullName}</p>
                                                        <p className="text-slate-500 text-xs font-medium">ID: {student.student_id_number}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1 text-slate-600 mb-1 font-medium">
                                                        <MdEmail className="w-4 h-4 text-slate-400" />
                                                        <span className="truncate max-w-[200px]">{student.email}</span>
                                                    </div>
                                                    {student.phone && (
                                                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                                                            <MdPhone className="w-4 h-4 text-slate-400" />
                                                            <span>{student.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Enrolled Date */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 font-medium">{formatDate(student.enrolled_at)}</span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-3xl transition-colors">
                                                    <MdMoreVert className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredStudents.length === 0 && students.length > 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-sm font-medium">
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination Controls */}
                {!loading && !error && filteredStudents.length > 0 && (
                    <div className="px-6 py-4 border-t border-sky-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-800">{((page - 1) * limit) + 1}</span> to <span className="font-bold text-slate-800">{Math.min(page * limit, filteredStudents.length)}</span> of <span className="font-bold text-slate-800">{filteredStudents.length}</span> students
                        </p>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1 || isPaginating}
                                    className="px-3 py-1.5 border border-sky-100 rounded-3xl text-sm font-semibold text-slate-600 hover:bg-sky-50/45 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-600 font-semibold px-2">
                                    Page {page} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages || isPaginating}
                                    className="px-3 py-1.5 border border-sky-100 rounded-3xl text-sm font-semibold text-slate-600 hover:bg-sky-50/45 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageStudents;
