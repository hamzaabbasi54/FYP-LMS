import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MdSearch, MdNotifications, MdChevronRight, MdHelp, MdAssignment, MdSchool, MdAnnouncement, MdCircle } from 'react-icons/md';
import { useCourse } from '../../../context/CourseContext';
import { notificationApi } from '../../../services/api';
import { toast } from 'react-toastify';

const Navbar = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);
    const { selectedCourse } = useCourse();
    const hasShownToasts = useRef(false);

    // Derive course code from context
    const courseCode = selectedCourse?.code || 'Course';
    const courseTitle = selectedCourse?.title ? `${courseCode}: ${selectedCourse.title}` : courseCode;

    // --- Real Notifications ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll();
            if (res.success) {
                setNotifications(res.data || []);
                setUnreadCount(res.unread_count || 0);

                // Show toast for unread notifications on first load
                if (!hasShownToasts.current && res.unread_count > 0) {
                    hasShownToasts.current = true;
                    const unread = (res.data || []).filter(n => !n.is_read);
                    unread.slice(0, 3).forEach(n => {
                        toast.info(n.message, { autoClose: 5000 });
                    });
                }
            }
        } catch (err) {
            console.error('Notification fetch error:', err);
        }
    };

    const handleBellClick = async () => {
        const opening = !showNotifications;
        setShowNotifications(opening);
        if (opening && unreadCount > 0) {
            try {
                await notificationApi.markAllRead();
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error('Mark read error:', err);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Icon mapping
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'course_assignment': return { icon: MdSchool, color: 'bg-green-100 text-green-600' };
            case 'assignment': return { icon: MdAssignment, color: 'bg-blue-100 text-blue-600' };
            default: return { icon: MdAnnouncement, color: 'bg-purple-100 text-purple-600' };
        }
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getPageTitle = (pathname) => {
        // We use 'startsWith' or 'includes' so sub-pages still show the correct Parent Title.
        if (pathname === '/faculty-dashboard' || pathname === '/faculty') return 'Overview';

        if (pathname.includes('/faculty-mycourses')) return 'My Courses';
        if (pathname.includes('/faculty-schedule')) return 'Schedule';
        if (pathname.includes('/faculty-attendance')) return 'Attendance';
        if (pathname.includes('/faculty-grades')) return 'Grades';
        if (pathname.includes('/faculty-messages')) return 'Messages';
        if (pathname.includes('/faculty-notifications')) return 'Notifications';

        return 'Overview'; // Default
    };

    const currentTitle = getPageTitle(location.pathname);
    const isBatchCoursesPage = location.pathname.includes('/faculty-batch/');
    const isMyCoursesPage = location.pathname.includes('/faculty-mycourses') && !location.pathname.includes('/edit-syllabus') && !location.pathname.includes('/register-student') && !location.pathname.includes('/grading') && !location.pathname.includes('/students') && !location.pathname.includes('/attendance');
    const isEditSyllabusPage = location.pathname.includes('/edit-syllabus');
    const isRegisterStudentPage = location.pathname.includes('/register-student');
    const isManageStudentsPage = location.pathname.includes('/students');
    const isGradingPage = location.pathname.includes('/grading') && !location.pathname.match(/\/grading\/\d+/) && !location.pathname.includes('/grading/new');
    const isGradeAssignmentPage = location.pathname.match(/\/grading\/\d+/);
    const isCreateAssessmentPage = location.pathname.includes('/grading/new');
    const isAttendancePage = (location.pathname.includes('/faculty-attendance') || location.pathname.includes('/attendance')) && !location.pathname.includes('/monthly-report');
    const isMonthlyReportPage = location.pathname.includes('/monthly-report');
    const isSchedulePage = location.pathname.includes('/faculty-schedule');
    const isMessagesPage = location.pathname.includes('/faculty-messages');
    const isNotificationsPage = location.pathname.includes('/faculty-notifications');

    // Extract assignmentId from URL for proper back-navigation
    const assignmentIdMatch = location.pathname.match(/\/faculty-mycourses\/(\d+)/);
    const assignmentId = assignmentIdMatch ? assignmentIdMatch[1] : null;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const professorName = user.fullName || 'Professor';

    return (
        <div className="flex flex-col h-full bg-white border-b">
            {/* Top Section: Title/Breadcrumbs and Search */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-3 sm:gap-4">
                {/* Left Side - Title or Breadcrumbs */}
                <div className="flex-1">
                    {isBatchCoursesPage ? (
                        // Breadcrumbs for Batch Courses page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">Batches Taught</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Batch 2023-2027</span>
                        </div>
                    ) : isManageStudentsPage ? (
                        // Breadcrumbs for Manage Students page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">{courseCode}</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Manage Students</span>
                        </div>
                    ) : isMonthlyReportPage ? (
                        // Breadcrumbs for Monthly Report page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">{courseCode}</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Monthly Report</span>
                        </div>
                    ) : isAttendancePage ? (
                        // Breadcrumbs for Attendance page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to={assignmentId ? `/faculty-mycourses/${assignmentId}` : '/faculty-mycourses'} className="hover:text-blue-600 transition-colors">
                                {selectedCourse?.batch_name || 'Batch 2023-2027'}
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">{courseCode}</span>
                        </div>
                    ) : isMyCoursesPage ? (
                        // Breadcrumbs for My Courses page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">{selectedCourse?.batch_name || 'Batch 2023-2027'}</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">{courseCode}</span>
                        </div>
                    ) : isCreateAssessmentPage ? (
                        // Breadcrumbs for Create Assessment page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to={assignmentId ? `/faculty-mycourses/${assignmentId}` : '/faculty-mycourses'} className="hover:text-blue-600 transition-colors">
                                {courseCode}
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to={assignmentId ? `/faculty-mycourses/${assignmentId}/grading` : '/faculty-mycourses/grading'} className="hover:text-blue-600 transition-colors">
                                Grading
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">New Assessment</span>
                        </div>
                    ) : isGradeAssignmentPage ? (
                        // Breadcrumbs for Grade Assignment page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to={assignmentId ? `/faculty-mycourses/${assignmentId}` : '/faculty-mycourses'} className="hover:text-blue-600 transition-colors">
                                {courseCode}
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to={assignmentId ? `/faculty-mycourses/${assignmentId}/grading` : '/faculty-mycourses/grading'} className="hover:text-blue-600 transition-colors">
                                Grades
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">OOP Concepts Essay</span>
                        </div>
                    ) : isGradingPage ? (
                        // Breadcrumbs for Grading page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">{courseCode}</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Grading</span>
                        </div>
                    ) : isEditSyllabusPage ? (
                        // Breadcrumbs for Edit Syllabus page
                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 text-gray-400" />
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                {courseTitle}
                            </span>
                            <MdChevronRight className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 font-medium">Edit Syllabus</span>
                        </div>
                    ) : (
                        // Regular title for other pages
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                                {currentTitle}
                            </h1>
                            {currentTitle === 'Overview' && (
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Welcome back, {professorName}. Manage your active courses.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side - Search, Help, and Notifications */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={
                                isBatchCoursesPage ? "Search courses in this batch..." :
                                    isGradingPage || isGradeAssignmentPage || isCreateAssessmentPage ? "Search grades..." :
                                        isMyCoursesPage || isEditSyllabusPage || isRegisterStudentPage || isAttendancePage || isMonthlyReportPage ? "Search..." :
                                            "Search courses or students..."
                            }
                            className="bg-gray-100 text-sm rounded-full pl-10 pr-4 py-2 w-full sm:w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {isGradeAssignmentPage && (
                        <Link
                            to="#"
                            className="text-gray-600 hover:text-blue-600 font-medium text-sm whitespace-nowrap flex items-center gap-1"
                        >
                            <MdHelp className="w-4 h-4" />
                            Help
                        </Link>
                    )}

                    {/* Notifications Dropdown */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={handleBellClick}
                            className="relative text-gray-500 hover:text-blue-600 flex-shrink-0"
                        >
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                            <MdNotifications className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                                    <Link
                                        to="/faculty-notifications"
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        View All
                                    </Link>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                            No notifications yet.
                                        </div>
                                    ) : (
                                        notifications.slice(0, 6).map((notification) => {
                                            const { icon: IconComponent, color: iconColor } = getNotificationIcon(notification.type);
                                            return (
                                                <div
                                                    key={notification.id}
                                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${!notification.is_read ? 'bg-blue-50/50' : ''
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm text-gray-800 truncate">{notification.title}</p>
                                                            {!notification.is_read && (
                                                                <MdCircle className="w-2 h-2 text-blue-600 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600 truncate">{notification.message}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.created_at)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;