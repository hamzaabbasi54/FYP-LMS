import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEdit, MdPeople, MdCheckCircle, MdAssignment, MdArrowForward, MdArrowBack, MdSchedule, MdMenuBook, MdAccessTime, MdWbSunny, MdNightsStay, MdOpenInNew, MdFileDownload } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { batchApi, getFileUrl } from '../../services/api';

// Component for Course Management Cards
const ManagementCard = ({ icon: Icon, title, description, buttonText, iconColor, buttonColor, iconBgColor, to = "#" }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor} mb-4 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                {description}
            </p>
            <Link
                to={to}
                className={`inline-flex items-center ${buttonColor} font-semibold text-sm hover:underline group mt-auto`}
            >
                {buttonText}
                <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

const MyCourses = () => {
    const { selectedCourse } = useCourse();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState([]);
    const [files, setFiles] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);

    useEffect(() => {
        if (selectedCourse?.batch_id && selectedCourse?.course_id) {
            fetchSchedule();
            fetchFiles();
        }
    }, [selectedCourse]);

    const fetchSchedule = async () => {
        try {
            setLoadingSchedule(true);
            const res = await batchApi.getCourseSchedule(selectedCourse.batch_id, selectedCourse.course_id);
            if (res.success) {
                setSchedule(res.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch schedule:', e);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const fetchFiles = async () => {
        try {
            setLoadingFiles(true);
            const res = await batchApi.getCourseDetailsForBatch(selectedCourse.batch_id, selectedCourse.course_id);
            if (res.success) {
                setFiles(res.data?.files || []);
            }
        } catch (e) {
            console.error('Failed to fetch files:', e);
        } finally {
            setLoadingFiles(false);
        }
    };

    // If no course is selected, redirect back to dashboard
    if (!selectedCourse) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Course Selected</h3>
                    <p className="text-gray-400 mb-4">Please select a course from the dashboard first.</p>
                    <button
                        onClick={() => navigate('/faculty-dashboard')}
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        <MdArrowBack className="w-4 h-4 mr-2" />
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const course = selectedCourse;

    // Sort schedule by day order
    const sortedSchedule = [...schedule].sort((a, b) => 
        DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week)
    );

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.substring(0, 5);
        const [h, m] = parts.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${m} ${ampm}`;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/faculty-dashboard')}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
                <MdArrowBack className="w-4 h-4 mr-1" />
                Back to Dashboard
            </button>

            {/* Course Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Course Title and Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        {course.title}
                    </h1>
                    <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {course.code}
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Course Info */}
                    <div className="flex-1">
                        {/* Course Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <span>{course.batch_name}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.semester_name}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.credit_hours} Credits</span>
                        </div>

                        {/* Course Description */}
                        {course.description && (
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                {course.description}
                            </p>
                        )}
                    </div>

                    {/* Right Side - Action Buttons and Student Count */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/register-student`}
                                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                <MdPeople className="w-4 h-4 mr-2" />
                                Add Student
                            </Link>
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/edit-syllabus`}
                                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                <MdEdit className="w-4 h-4 mr-2" />
                                Edit Syllabus
                            </Link>
                        </div>

                        {/* Student Count */}
                        <div className="flex items-center text-gray-600 text-sm">
                            <MdPeople className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="font-semibold">{course.student_count} Total Students</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule & Syllabus Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <MdSchedule className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800">Class Schedule</h3>
                            <p className="text-xs text-gray-400">Weekly schedule set by admin</p>
                        </div>
                    </div>

                    <div className="p-5">
                        {loadingSchedule ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        ) : sortedSchedule.length > 0 ? (
                            <div className="space-y-2.5">
                                {sortedSchedule.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className="w-20 text-sm font-bold text-gray-700">
                                                {DAY_LABELS[entry.day_of_week] || entry.day_of_week}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <MdAccessTime className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{formatTime(entry.start_time)}</span>
                                                <span className="text-gray-300">—</span>
                                                <span>{formatTime(entry.end_time)}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            entry.shift === 'morning'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        }`}>
                                            {entry.shift === 'morning' ? <MdWbSunny className="w-3 h-3" /> : <MdNightsStay className="w-3 h-3" />}
                                            {entry.shift === 'morning' ? 'Morning' : 'Evening'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <MdSchedule className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">No schedule has been set for this course yet.</p>
                                <p className="text-xs text-gray-300 mt-1">The admin will set the weekly schedule.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course Content / Syllabus Files */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <MdMenuBook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800">Course Content</h3>
                            <p className="text-xs text-gray-400">Syllabus & files uploaded by admin</p>
                        </div>
                    </div>

                    <div className="p-5">
                        {loadingFiles ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        ) : files.length > 0 ? (
                            <div className="space-y-2.5">
                                {files.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3.5 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <MdMenuBook className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate">{f.file_name}</p>
                                                <p className="text-xs text-gray-400">{f.file_type || 'Document'}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={getFileUrl(f.file_path)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex-shrink-0"
                                        >
                                            <MdOpenInNew className="w-3.5 h-3.5" />
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <MdMenuBook className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">No course content uploaded yet.</p>
                                <p className="text-xs text-gray-300 mt-1">The admin will upload syllabus and files.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Management Section */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Course Management</h2>

                {/* Management Cards Grid - Equal height cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <ManagementCard
                        icon={MdPeople}
                        title="Manage Students"
                        description="View the full student directory, enroll new students, and manage course access."
                        buttonText="View Student Details"
                        iconColor="text-blue-600"
                        buttonColor="text-blue-600"
                        iconBgColor="bg-blue-50"
                        to={`/faculty-mycourses/${course.assignment_id}/students`}
                    />
                    <ManagementCard
                        icon={MdCheckCircle}
                        title="Manage Attendance"
                        description="Mark daily attendance, edit past records, and export attendance sheets."
                        buttonText="Go to Attendance"
                        iconColor="text-green-600"
                        buttonColor="text-green-600"
                        iconBgColor="bg-green-50"
                        to={`/faculty-mycourses/${course.assignment_id}/attendance`}
                    />
                    <ManagementCard
                        icon={MdAssignment}
                        title="Manage Grades"
                        description="Create and edit assignments, quizzes, and manage the full gradebook."
                        buttonText="Open Gradebook"
                        iconColor="text-purple-600"
                        buttonColor="text-purple-600"
                        iconBgColor="bg-purple-50"
                        to={`/faculty-mycourses/${course.assignment_id}/grading`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MyCourses;
