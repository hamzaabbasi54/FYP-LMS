import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEdit, MdPeople, MdCheckCircle, MdAssignment, MdArrowForward, MdArrowBack, MdSchedule, MdMenuBook, MdAccessTime, MdWbSunny, MdNightsStay, MdOpenInNew, MdFileDownload } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { batchApi, getFileUrl } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

// Component for Course Management Cards
const ManagementCard = ({ icon: Icon, title, description, buttonText, iconColor, buttonColor, iconBgColor, to = "#" }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor} mb-4 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow leading-relaxed">
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
    const { data: schedule = [], isLoading: loadingSchedule } = useQuery({
        queryKey: ['courseSchedule', String(selectedCourse?.batch_id), String(selectedCourse?.course_id)],
        enabled: !!selectedCourse?.batch_id && !!selectedCourse?.course_id,
        queryFn: async () => {
            const res = await batchApi.getCourseSchedule(selectedCourse.batch_id, selectedCourse.course_id);
            if (res.success) return res.data || [];
            throw new Error('Failed to fetch schedule');
        }
    });

    const { data: files = [], isLoading: loadingFiles } = useQuery({
        queryKey: ['courseFiles', String(selectedCourse?.batch_id), String(selectedCourse?.course_id)],
        enabled: !!selectedCourse?.batch_id && !!selectedCourse?.course_id,
        queryFn: async () => {
            const res = await batchApi.getCourseDetailsForBatch(selectedCourse.batch_id, selectedCourse.course_id);
            if (res.success) return res.data?.files || [];
            throw new Error('Failed to fetch files');
        }
    });

    // If no course is selected, redirect back to dashboard
    if (!selectedCourse) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-12 text-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Course Selected</h3>
                    <p className="text-slate-500 mb-4">Please select a course from the dashboard first.</p>
                    <button
                        onClick={() => navigate('/faculty-dashboard')}
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
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
                className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
                <MdArrowBack className="w-4 h-4 mr-1" />
                Back to Dashboard
            </button>

            {/* Course Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                {/* Course Title and Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        {course.title}
                    </h1>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-bold tracking-wider px-2 py-0.5 rounded">
                        {course.code}
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Course Info */}
                    <div className="flex-1">
                        {/* Course Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                            <span>{course.batch_name}</span>
                            <span className="text-slate-300">•</span>
                            <span>{course.semester_name}</span>
                            <span className="text-slate-300">•</span>
                            <span>{course.credit_hours} Credits</span>
                        </div>

                        {/* Course Description */}
                        {course.description && (
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
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
                                className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                <MdEdit className="w-4 h-4 mr-2" />
                                Edit Syllabus
                            </Link>
                        </div>

                        {/* Student Count */}
                        <div className="flex items-center text-slate-600 text-sm">
                            <MdPeople className="w-5 h-5 mr-2 text-slate-400" />
                            <span className="font-semibold">{course.student_count} Total Students</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule & Syllabus Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                            <MdSchedule className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Class Schedule</h3>
                            <p className="text-xs text-slate-500">Weekly schedule set by admin</p>
                        </div>
                    </div>

                    <div className="p-5">
                        {loadingSchedule ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        ) : sortedSchedule.length > 0 ? (
                            <div className="space-y-2.5">
                                {sortedSchedule.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className="w-20 text-sm font-bold text-slate-700">
                                                {DAY_LABELS[entry.day_of_week] || entry.day_of_week}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <MdAccessTime className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{formatTime(entry.start_time)}</span>
                                                <span className="text-slate-300">—</span>
                                                <span>{formatTime(entry.end_time)}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                                            entry.shift === 'morning'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                            {entry.shift === 'morning' ? <MdWbSunny className="w-3 h-3" /> : <MdNightsStay className="w-3 h-3" />}
                                            {entry.shift === 'morning' ? 'Morning' : 'Evening'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                                <MdSchedule className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No schedule has been set for this course yet.</p>
                                <p className="text-xs text-slate-400 mt-1">The admin will set the weekly schedule.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course Content / Syllabus Files */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                            <MdMenuBook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Course Content</h3>
                            <p className="text-xs text-slate-500">Syllabus & files uploaded by admin</p>
                        </div>
                    </div>

                    <div className="p-5">
                        {loadingFiles ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        ) : files.length > 0 ? (
                            <div className="space-y-2.5">
                                {files.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <MdMenuBook className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{f.file_name}</p>
                                                <p className="text-xs text-slate-500">{f.file_type || 'Document'}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={getFileUrl(f.file_path)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 shadow-sm rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex-shrink-0"
                                        >
                                            <MdOpenInNew className="w-3.5 h-3.5" />
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                                <MdMenuBook className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No course content uploaded yet.</p>
                                <p className="text-xs text-slate-400 mt-1">The admin will upload syllabus and files.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Management Section */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Course Management</h2>

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
