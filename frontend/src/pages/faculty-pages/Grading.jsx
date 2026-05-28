import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdSearch, MdChevronRight, MdAdd, MdEdit, MdDelete, MdMoreVert, MdNotificationsActive, MdGrade, MdDescription, MdHelpOutline, MdStar, MdDiamond } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi, studentApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Grading = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;

    const [activeTab, setActiveTab] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAssessmentDropdown, setShowNewAssessmentDropdown] = useState(false);
    const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
        queryKey: ['assessments', courseAssignmentId],
        enabled: !!courseAssignmentId,
        queryFn: async () => {
            const assessmentRes = await assessmentApi.getByCourse(courseAssignmentId, { limit: 100 });
            return assessmentRes.success !== false ? (assessmentRes.data || []) : [];
        }
    });

    const { data: totalStudents = 0, isLoading: loadingStudents } = useQuery({
        queryKey: ['totalStudents', courseAssignmentId],
        enabled: !!courseAssignmentId,
        queryFn: async () => {
            const studentRes = await studentApi.getEnrolledStudents(courseAssignmentId);
            return studentRes.success ? (studentRes.data || []).length : 0;
        }
    });

    const loading = loadingAssessments || loadingStudents;

    const dropdownRef = useRef(null);
    const courseCode = selectedCourse?.code || 'Course';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNewAssessmentDropdown(false);
            }
        };

        if (showNewAssessmentDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNewAssessmentDropdown]);

    // Map DB type to display type label
    const getTypeLabel = (type, index) => {
        const typeLabels = {
            quiz: 'Quiz',
            assignment: 'Assignment',
            midterm: 'Midterm',
            final: 'Final',
            project: 'Project'
        };
        return typeLabels[type] || type;
    };

    // Get icon and color based on type
    const getTypeStyle = (type) => {
        switch (type) {
            case 'midterm':
                return { icon: MdDescription, iconColor: 'bg-orange-100 text-orange-600' };
            case 'final':
                return { icon: MdStar, iconColor: 'bg-blue-100 text-blue-600' };
            case 'quiz':
                return { icon: MdHelpOutline, iconColor: 'bg-purple-100 text-purple-600' };
            case 'assignment':
                return { icon: MdDescription, iconColor: 'bg-blue-100 text-blue-600' };
            case 'project':
                return { icon: MdStar, iconColor: 'bg-green-100 text-green-600' };
            default:
                return { icon: MdDescription, iconColor: 'bg-gray-100 text-gray-600' };
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'graded': return 'bg-purple-100 text-purple-700';
            case 'needs_grading': return 'bg-red-100 text-red-700';
            case 'published': return 'bg-green-100 text-green-700';
            case 'scheduled': return 'bg-yellow-100 text-yellow-700';
            case 'draft': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Format status for display
    const formatStatus = (status) => {
        const labels = {
            graded: 'Graded',
            needs_grading: 'Needs Grading',
            published: 'Published',
            scheduled: 'Scheduled',
            draft: 'Draft'
        };
        return labels[status] || status;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return { date: 'No date', time: '' };
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return { date: formattedDate, time: formattedTime };
    };

    // Delete assessment
    const deleteMutation = useMutation({
        mutationFn: (assessmentId) => assessmentApi.delete(assessmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments', courseAssignmentId] });
        },
        onError: (err) => {
            console.error('Error deleting assessment:', err);
            alert('Failed to delete assessment. Please try again.');
        }
    });

    const handleDelete = (assessmentId, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all grades for this assessment.`)) {
            return;
        }
        deleteMutation.mutate(assessmentId);
    };

    const tabs = ['All', 'Quizzes', 'Assignments', 'Midterms', 'Finals'];
    const statusOptions = ['All', 'Graded', 'Needs Grading', 'Published', 'Scheduled', 'Draft'];

    // Map tab names to DB type values
    const tabToType = {
        'Quizzes': 'quiz',
        'Assignments': 'assignment',
        'Midterms': 'midterm',
        'Finals': 'final'
    };

    // Map status filter to DB status
    const statusFilterToDb = {
        'Graded': 'graded',
        'Needs Grading': 'needs_grading',
        'Published': 'published',
        'Scheduled': 'scheduled',
        'Draft': 'draft'
    };

    // Filter assessments based on active tab, status, and search
    const filteredAssessments = assessments.filter(assessment => {
        const matchesTab = activeTab === 'All' || assessment.type === tabToType[activeTab];
        const matchesStatus = statusFilter === 'All' || assessment.status === statusFilterToDb[statusFilter];
        const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             assessment.type.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesTab && matchesStatus && matchesSearch;
    });

    const handleNewAssessment = (type) => {
        setShowNewAssessmentDropdown(false);
        navigate(`/faculty-mycourses/${courseAssignmentId}/grading/new?type=${type}`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                        Grading & Assessments
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MdDiamond className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{courseCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdGrade className="w-4 h-4 text-gray-400" />
                            <span>{totalStudents} Students</span>
                        </div>
                    </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowNewAssessmentDropdown(!showNewAssessmentDropdown)}
                        className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        New Assessment
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showNewAssessmentDropdown && (
                        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px] py-2">
                            <button 
                                onClick={() => handleNewAssessment('quiz')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Quiz
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('assignment')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Assignment
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('midterm')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Midterm Exam
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('final')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Final Exam
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Status and Search Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Status Dropdown */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer pr-8"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Filter list..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Assessments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading assessments...</p>
                    </div>
                )}

                {/* Table */}
                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ASSESSMENT NAME
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        DUE DATE
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        WEIGHT
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        STATUS
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAssessments.map((assessment) => {
                                    const { icon: Icon, iconColor } = getTypeStyle(assessment.type);
                                    const { date: dueDate, time: dueTime } = formatDate(assessment.due_date);
                                    const statusColor = getStatusColor(assessment.status);
                                    const typeLabel = getTypeLabel(assessment.type);

                                    const dateToCheck = assessment.conducted_date || assessment.due_date;
                                    const isDatePassed = dateToCheck ? new Date(dateToCheck) < new Date() : false;
                                    const canGrade = assessment.status !== 'scheduled' || isDatePassed;

                                    return (
                                        <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Assessment Name */}
                                            <td className="px-6 py-4">
                                                <Link 
                                                    to={`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}/details`}
                                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm hover:text-blue-600 transition-colors">{assessment.title}</p>
                                                        <p className="text-gray-500 text-xs">{typeLabel}</p>
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Due Date */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-800 font-medium">{dueDate}</p>
                                                    <p className="text-xs text-gray-500">{dueTime}</p>
                                                </div>
                                            </td>

                                            {/* Weight */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {assessment.weight ? `${assessment.weight}%` : '-'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                                    {formatStatus(assessment.status)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!canGrade ? (
                                                        <span
                                                            className="flex items-center px-3 py-1.5 bg-gray-300 text-gray-500 rounded-lg text-xs font-medium cursor-not-allowed"
                                                            title="Cannot grade a scheduled assignment before its due date"
                                                        >
                                                            Grade Now
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            to={`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}`}
                                                            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                                                        >
                                                            Grade Now
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}/edit`)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit assessment"
                                                    >
                                                        <MdEdit className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(assessment.id, assessment.title)}
                                                        disabled={deleteMutation.isPending && deleteMutation.variables === assessment.id}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAssessments.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                                            {assessments.length === 0 ? 'No assessments created yet. Click "New Assessment" to get started.' : 'No assessments match your filters.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filteredAssessments.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-700">{filteredAssessments.length}</span> of <span className="font-semibold text-gray-700">{assessments.length}</span> assessments
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Grading;
