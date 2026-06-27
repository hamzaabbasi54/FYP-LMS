import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PiBellRinging as MdNotificationsActive,
    PiCaretRight as MdChevronRight,
    PiChartBar as MdGrade,
    PiDiamond as MdDiamond,
    PiDotsThreeVertical as MdMoreVert,
    PiFileText as MdDescription,
    PiInfo as MdHelpOutline,
    PiMagnifyingGlass as MdSearch,
    PiNotePencil as MdEdit,
    PiPlus as MdAdd,
    PiStar as MdStar,
    PiTrash as MdDelete
} from 'react-icons/pi';
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
                return { icon: MdDescription, iconColor: 'bg-amber-50 text-orange-600' };
            case 'final':
                return { icon: MdStar, iconColor: 'bg-blue-100 text-sky-700' };
            case 'quiz':
                return { icon: MdHelpOutline, iconColor: 'bg-sky-50 text-sky-700' };
            case 'assignment':
                return { icon: MdDescription, iconColor: 'bg-blue-100 text-sky-700' };
            case 'project':
                return { icon: MdStar, iconColor: 'bg-emerald-50 text-emerald-600' };
            default:
                return { icon: MdDescription, iconColor: 'bg-gray-100 text-gray-600' };
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'graded': return 'bg-emerald-100 text-emerald-700';
            case 'needs_grading': return 'bg-red-50 text-red-700';
            case 'published': return 'bg-blue-100 text-sky-700';
            case 'scheduled': return 'bg-amber-50 text-amber-700';
            case 'draft': return 'bg-sky-50 text-slate-700';
            default: return 'bg-sky-50 text-slate-700';
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
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                        Grading & Assessments
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <MdDiamond className="w-4 h-4 text-sky-700" />
                            <span className="font-semibold text-slate-800">{courseCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdGrade className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{totalStudents} Students</span>
                        </div>
                    </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowNewAssessmentDropdown(!showNewAssessmentDropdown)}
                        className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        New Assessment
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showNewAssessmentDropdown && (
                        <div className="absolute top-full right-0 mt-2 bg-white border border-sky-100 rounded-3xl shadow-lg z-50 min-w-[200px] py-2">
                            <button 
                                onClick={() => handleNewAssessment('quiz')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50/45 font-medium transition-colors"
                            >
                                Quiz
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('assignment')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50/45 font-medium transition-colors"
                            >
                                Assignment
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('midterm')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50/45 font-medium transition-colors"
                            >
                                Midterm Exam
                            </button>
                            <button 
                                onClick={() => handleNewAssessment('final')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50/45 font-medium transition-colors"
                            >
                                Final Exam
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-6">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-sky-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-3xl text-sm font-semibold transition-colors ${
                                activeTab === tab
                                    ? 'bg-sky-50 text-sky-700'
                                    : 'bg-white text-slate-600 hover:bg-sky-50/45'
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
                            className="px-4 py-2 border border-sky-100 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent appearance-none bg-white cursor-pointer pr-8 text-slate-700 font-medium"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Filter list..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-sky-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Assessments Table */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-sky-100 border-t-sky-600 rounded-3xl animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading assessments...</p>
                    </div>
                )}

                {/* Table */}
                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-sky-50/45 border-b border-sky-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        ASSESSMENT NAME
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        DUE DATE
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        WEIGHT
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        STATUS
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssessments.map((assessment) => {
                                    const { icon: Icon, iconColor } = getTypeStyle(assessment.type);
                                    const { date: dueDate, time: dueTime } = formatDate(assessment.due_date);
                                    const statusColor = getStatusColor(assessment.status);
                                    const typeLabel = getTypeLabel(assessment.type);

                                    const dateToCheck = assessment.conducted_date || assessment.due_date;
                                    const isDatePassed = dateToCheck ? new Date(dateToCheck) < new Date() : false;
                                    const canGrade = assessment.status !== 'scheduled' || isDatePassed;

                                    return (
                                        <tr key={assessment.id} className="hover:bg-sky-50/45 transition-colors">
                                            {/* Assessment Name */}
                                            <td className="px-6 py-4">
                                                <Link 
                                                    to={`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}/details`}
                                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                                >
                                                    <div className={`w-10 h-10 rounded-3xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm hover:text-sky-700 transition-colors">{assessment.title}</p>
                                                        <p className="text-slate-500 text-xs">{typeLabel}</p>
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Due Date */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-slate-800 font-medium">{dueDate}</p>
                                                    <p className="text-xs text-slate-500">{dueTime}</p>
                                                </div>
                                            </td>

                                            {/* Weight */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {assessment.weight ? `${assessment.weight}%` : '-'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-3xl text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                    {formatStatus(assessment.status)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!canGrade ? (
                                                        <span
                                                            className="flex items-center px-3 py-1.5 bg-sky-50 text-slate-500 rounded-3xl text-xs font-semibold cursor-not-allowed"
                                                            title="Cannot grade a scheduled assignment before its due date"
                                                        >
                                                            Grade Now
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            to={`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}`}
                                                            className="flex items-center px-3 py-1.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 transition-colors text-xs font-medium"
                                                        >
                                                            Grade Now
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => assessment.status !== 'graded' && navigate(`/faculty-mycourses/${courseAssignmentId}/grading/${assessment.id}/edit`)}
                                                        disabled={assessment.status === 'graded'}
                                                        className={`p-2 rounded-3xl transition-colors ${
                                                            assessment.status === 'graded'
                                                                ? 'text-slate-300 cursor-not-allowed opacity-50'
                                                                : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
                                                        }`}
                                                        title={assessment.status === 'graded' ? 'Cannot edit a graded assessment' : 'Edit assessment'}
                                                    >
                                                        <MdEdit className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => assessment.status !== 'graded' && handleDelete(assessment.id, assessment.title)}
                                                        disabled={(deleteMutation.isPending && deleteMutation.variables === assessment.id) || assessment.status === 'graded'}
                                                        className={`p-2 rounded-3xl transition-colors ${
                                                            assessment.status === 'graded'
                                                                ? 'text-slate-300 cursor-not-allowed opacity-50'
                                                                : 'text-slate-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-50'
                                                        }`}
                                                        title={assessment.status === 'graded' ? 'Cannot delete a graded assessment' : 'Delete assessment'}
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
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
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
                    <div className="px-6 py-4 border-t border-sky-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-800">{filteredAssessments.length}</span> of <span className="font-semibold text-slate-800">{assessments.length}</span> assessments
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Grading;
