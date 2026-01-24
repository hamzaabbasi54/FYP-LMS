import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MdSearch, MdNotifications, MdChevronRight, MdHelp, MdLogout, MdPerson } from 'react-icons/md';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };


    const getPageTitle = (pathname) => {
        // We use 'startsWith' or 'includes' so sub-pages still show the correct Parent Title.
        if (pathname === '/faculty-dashboard' || pathname === '/faculty') return 'Overview';

        if (pathname.includes('/faculty-mycourses')) return 'My Courses';
        if (pathname.includes('/faculty-schedule')) return 'Schedule';
        if (pathname.includes('/faculty-attendance')) return 'Attendance';
        if (pathname.includes('/faculty-grades')) return 'Grades';
        if (pathname.includes('/faculty-messages')) return 'Messages';
        if (pathname.includes('/faculty-announcements')) return 'Announcements';

        return 'Overview'; // Default
    };

    const currentTitle = getPageTitle(location.pathname);
    const isBatchCoursesPage = location.pathname.includes('/faculty-batch/');
    const isMyCoursesPage = location.pathname.includes('/faculty-mycourses') && !location.pathname.includes('/edit-syllabus') && !location.pathname.includes('/register-student') && !location.pathname.includes('/grading');
    const isEditSyllabusPage = location.pathname.includes('/edit-syllabus');
    const isRegisterStudentPage = location.pathname.includes('/register-student');
    const isGradingPage = location.pathname.includes('/grading') && !location.pathname.match(/\/grading\/\d+/) && !location.pathname.includes('/grading/new');
    const isGradeAssignmentPage = location.pathname.match(/\/grading\/\d+/);
    const isCreateAssessmentPage = location.pathname.includes('/grading/new');
    const isAttendancePage = location.pathname.includes('/faculty-attendance') && !location.pathname.includes('/monthly-report');
    const isMonthlyReportPage = location.pathname.includes('/monthly-report');

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
                    ) : isMyCoursesPage ? (
                        // Breadcrumbs for My Courses page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">Batch 2023-2027</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">CS-101</span>
                        </div>
                    ) : isMonthlyReportPage ? (
                        // Breadcrumbs for Monthly Report page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">CS-101</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Monthly Report</span>
                        </div>
                    ) : isAttendancePage ? (
                        // Breadcrumbs for Attendance page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-400">CS-101</span>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">Attendance</span>
                        </div>
                    ) : isCreateAssessmentPage ? (
                        // Breadcrumbs for Create Assessment page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                My Courses
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                CS-101
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to="/faculty-mycourses/grading" className="hover:text-blue-600 transition-colors">
                                Grading
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <span className="text-gray-700 font-medium">New Assessment</span>
                        </div>
                    ) : isGradeAssignmentPage ? (
                        // Breadcrumbs for Grade Assignment page
                        <div className="flex items-center text-sm text-gray-500">
                            <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                                CS-101
                            </Link>
                            <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                            <Link to="/faculty-mycourses/grading" className="hover:text-blue-600 transition-colors">
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
                            <span className="text-gray-400">CS-101</span>
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
                                CS-101: Introduction to Programming
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
                                    Welcome back, Professor Doe. Manage your active batches.
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

                    <button className="relative text-gray-500 hover:text-blue-600 flex-shrink-0">
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2 ring-2 ring-white"></span>
                        <MdNotifications className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;

