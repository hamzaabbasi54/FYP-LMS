import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdSearch, MdNotifications, MdChevronRight, MdAdd, MdEdit, MdDelete, MdMoreVert, MdNotificationsActive, MdGrade, MdDescription, MdHelpOutline, MdStar, MdDiamond } from 'react-icons/md';

const Grading = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();
    const [activeTab, setActiveTab] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAssessmentDropdown, setShowNewAssessmentDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState({ code: 'Loading...', totalStudents: 0 });

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

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const { assessmentApi, courseApi } = await import('../../services/api');
                
                // Fetch course details
                const courseRes = await courseApi.getAssignmentDetails(assignmentId);
                if (courseRes.success) {
                    setCourseInfo({
                        code: courseRes.data.code,
                        totalStudents: courseRes.data.student_count
                    });
                }
                
                // Fetch assessments
                const assessRes = await assessmentApi.getByCourse(assignmentId);
                if (assessRes.success) {
                    const data = assessRes.data.data || assessRes.data;
                    const mapped = data.map(item => {
                        let icon = MdDescription;
                        let iconColor = "bg-blue-100 text-blue-600";
                        if (item.type === 'Quiz') {
                            icon = MdHelpOutline;
                            iconColor = "bg-purple-100 text-purple-600";
                        } else if (item.type === 'Midterm') {
                            iconColor = "bg-orange-100 text-orange-600";
                        } else if (item.type === 'Finals') {
                            icon = MdStar;
                        }
                        
                        let statusColor = "bg-gray-100 text-gray-700";
                        if (item.status === 'published') statusColor = "bg-green-100 text-green-700";
                        else if (item.status === 'graded') statusColor = "bg-purple-100 text-purple-700";
                        else if (item.status === 'needs_grading') statusColor = "bg-red-100 text-red-700";

                        return {
                            id: item.id,
                            name: item.title,
                            type: item.type,
                            icon,
                            iconColor,
                            dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A',
                            dueTime: item.due_date ? new Date(item.due_date).toLocaleTimeString() : '',
                            weight: item.weight ? `${item.weight}%` : 'N/A',
                            status: item.status || 'draft',
                            statusColor,
                            actions: ["edit", "grade", "delete"]
                        };
                    });
                    setAssessments(mapped);
                }
            } catch (error) {
                console.error("Error fetching grading data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            fetchAssessments();
        }
    }, [assignmentId]);

    const tabs = ['All', 'Quiz', 'Assignment', 'Midterm', 'Finals'];
    const statusOptions = ['All', 'graded', 'needs_grading', 'published', 'scheduled', 'draft'];

    // Filter assessments based on active tab and search
    const filteredAssessments = assessments.filter(assessment => {
        const matchesTab = activeTab === 'All' || assessment.type === activeTab;
        
        const matchesStatus = statusFilter === 'All' || assessment.status === statusFilter;
        const matchesSearch = assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             assessment.type.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesTab && matchesStatus && matchesSearch;
    });

    const totalAssessments = assessments.length;
    const currentPage = 1;
    const itemsPerPage = 5;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading grading data...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                    Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-400">{courseInfo.code}</span>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">Grading</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                        Grading & Assessments
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MdDiamond className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{courseInfo.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdGrade className="w-4 h-4 text-gray-400" />
                            <span>{courseInfo.totalStudents} Students</span>
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
                                onClick={() => {
                                    setShowNewAssessmentDropdown(false);
                                    navigate(`/faculty-mycourses/${assignmentId}/grading/new`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Quiz
                            </button>
                            <button 
                                onClick={() => {
                                    setShowNewAssessmentDropdown(false);
                                    navigate(`/faculty-mycourses/${assignmentId}/grading/new`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Assignment
                            </button>
                            <button 
                                onClick={() => {
                                    setShowNewAssessmentDropdown(false);
                                    navigate(`/faculty-mycourses/${assignmentId}/grading/new`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Midterm Exam
                            </button>
                            <button 
                                onClick={() => {
                                    setShowNewAssessmentDropdown(false);
                                    navigate(`/faculty-mycourses/${assignmentId}/grading/new`);
                                }}
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
                            {paginatedAssessments.map((assessment) => {
                                const Icon = assessment.icon;
                                return (
                                    <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Assessment Name */}
                                        <td className="px-6 py-4">
                                            <Link 
                                                to={`/faculty-mycourses/grading/${assessment.id}`}
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${assessment.iconColor}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm hover:text-blue-600 transition-colors">{assessment.name}</p>
                                                    <p className="text-gray-500 text-xs">{assessment.type}</p>
                                                </div>
                                            </Link>
                                        </td>

                                        {/* Due Date */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-gray-800 font-medium">{assessment.dueDate}</p>
                                                <p className="text-xs text-gray-500">{assessment.dueTime}</p>
                                            </div>
                                        </td>

                                        {/* Weight */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-800">{assessment.weight}</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${assessment.statusColor}`}>
                                                {assessment.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {assessment.actions.includes('notify') && (
                                                    <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium">
                                                        <MdNotificationsActive className="w-4 h-4 mr-1" />
                                                        Notify Students
                                                    </button>
                                                )}
                                                {assessment.actions.includes('grade') && (
                                                    <Link
                                                        to={`/faculty-mycourses/grading/${assessment.id}`}
                                                        className="flex items-center px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
                                                    >
                                                        Grade Now
                                                    </Link>
                                                )}
                                                {assessment.actions.includes('edit') && (
                                                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <MdEdit className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {assessment.actions.includes('delete') && (
                                                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {assessment.actions.includes('more') && (
                                                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                        <MdMoreVert className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedAssessments.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No assessments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-700">1</span> to <span className="font-semibold text-gray-700">{paginatedAssessments.length}</span> of <span className="font-semibold text-gray-700">{totalAssessments}</span> assessments
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Grading;

