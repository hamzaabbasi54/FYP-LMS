import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PiArrowLeft as MdArrowBack,
    PiArrowRight as MdArrowForward,
    PiBookOpen as MdMenuBook,
    PiCalendarCheck as MdSchedule,
    PiCheckCircle as MdCheckCircle,
    PiClock as MdAccessTime,
    PiClipboardText as MdAssignment,
    PiDownloadSimple as MdFileDownload,
    PiMoon as MdNightsStay,
    PiNotePencil as MdEdit,
    PiArrowSquareOut as MdOpenInNew,
    PiSun as MdWbSunny,
    PiUsersThree as MdPeople
} from 'react-icons/pi';
import { useCourse } from '../../context/CourseContext';
import { batchApi, getFileUrl } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

// Component for Course Management Cards
const ManagementCard = ({ icon: Icon, title, description, buttonText, iconColor, buttonColor, iconBgColor, to = "#" }) => {
    return (
        <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-4 flex flex-col h-full hover:shadow-md transition-shadow duration-200 sm:p-5">
            <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${iconBgColor} mb-4 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow leading-relaxed">
                {description}
            </p>
            <Link
                to={to}
                className={`mt-auto inline-flex w-fit items-center rounded-full border border-sky-100 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-sky-50 ${buttonColor} group`}
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
                <div className="bg-white/92 border border-sky-100 shadow-sm rounded-3xl p-12 text-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Course Selected</h3>
                    <p className="text-slate-500 mb-4">Please select a course from the dashboard first.</p>
                    <button
                        onClick={() => navigate('/faculty-dashboard')}
                        className="inline-flex items-center bg-sky-600 text-white px-4 py-2 rounded-3xl hover:bg-sky-700 shadow-sm transition-colors font-medium text-sm"
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
        <div className="min-h-[calc(100dvh-116px)] space-y-4 sm:space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/faculty-dashboard')}
                className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
                <MdArrowBack className="w-4 h-4 mr-1" />
                Back to Dashboard
            </button>

            {/* Course Header Section */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-4 sm:p-5">
                {/* Course Title and Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">
                        {course.title}
                    </h1>
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 text-sm font-bold tracking-wider px-2 py-0.5 rounded">
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
                    <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:items-end">
                        {/* Action Buttons */}
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/register-student`}
                                className="flex items-center justify-center rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
                            >
                                <MdPeople className="w-4 h-4 mr-2" />
                                Add Student
                            </Link>
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/edit-syllabus`}
                                className="flex items-center justify-center rounded-full border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-50/45"
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
                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                            <div className="flex items-center gap-3 p-4 border-b border-sky-100 sm:p-5">
                        <div className="w-10 h-10 rounded-3xl bg-sky-600 flex items-center justify-center shadow-sm">
                            <MdSchedule className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Class Schedule</h3>
                            <p className="text-xs text-slate-500">Weekly schedule set by admin</p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {loadingSchedule ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-sky-50 rounded-3xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : sortedSchedule.length > 0 ? (
                            <div className="space-y-2.5">
                                {sortedSchedule.map((entry, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 p-3.5 bg-sky-50/45 border border-sky-100 rounded-3xl hover:shadow-sm transition-shadow sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                                            <span className="w-20 text-sm font-bold text-slate-700 flex-shrink-0">
                                                {DAY_LABELS[entry.day_of_week] || entry.day_of_week}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <MdAccessTime className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{formatTime(entry.start_time)}</span>
                                                <span className="text-slate-300">—</span>
                                                <span>{formatTime(entry.end_time)}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] uppercase tracking-wider font-bold ${
                                            entry.shift === 'morning'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-sky-50 text-sky-700 border border-sky-100'
                                        }`}>
                                            {entry.shift === 'morning' ? <MdWbSunny className="w-3 h-3" /> : <MdNightsStay className="w-3 h-3" />}
                                            {entry.shift === 'morning' ? 'Morning' : 'Evening'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-sky-50/45 border border-dashed border-sky-100 rounded-3xl">
                                <MdSchedule className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No schedule has been set for this course yet.</p>
                                <p className="text-xs text-slate-400 mt-1">The admin will set the weekly schedule.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course Content / Syllabus Files */}
                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                            <div className="flex items-center gap-3 p-4 border-b border-sky-100 sm:p-5">
                        <div className="w-10 h-10 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-sm">
                            <MdMenuBook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Course Content</h3>
                            <p className="text-xs text-slate-500">Syllabus & files uploaded by admin</p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {loadingFiles ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-12 bg-sky-50 rounded-3xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : files.length > 0 ? (
                            <div className="space-y-2.5">
                                {files.map(f => (
                                    <div key={f.id} className="flex flex-col gap-3 p-3.5 bg-sky-50/45 border border-sky-100 rounded-3xl hover:shadow-sm transition-shadow sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <MdMenuBook className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{f.file_name}</p>
                                                <p className="text-xs text-slate-500">{f.file_type || 'Document'}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`/document-viewer?url=${encodeURIComponent(getFileUrl(f.file_path))}&name=${encodeURIComponent(f.file_name)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-50/45 sm:flex-shrink-0"
                                        >
                                            <MdOpenInNew className="w-3.5 h-3.5" />
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-sky-50/45 border border-dashed border-sky-100 rounded-3xl">
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
                        iconColor="text-sky-700"
                        buttonColor="text-sky-700"
                        iconBgColor="bg-sky-50"
                        to={`/faculty-mycourses/${course.assignment_id}/students`}
                    />
                    <ManagementCard
                        icon={MdCheckCircle}
                        title="Manage Attendance"
                        description="Mark daily attendance, edit past records, and export attendance sheets."
                        buttonText="Go to Attendance"
                        iconColor="text-emerald-600"
                        buttonColor="text-emerald-600"
                        iconBgColor="bg-emerald-50"
                        to={`/faculty-mycourses/${course.assignment_id}/attendance`}
                    />
                    <ManagementCard
                        icon={MdAssignment}
                        title="Manage Grades"
                        description="Create and edit assignments, quizzes, and manage the full gradebook."
                        buttonText="Open Gradebook"
                        iconColor="text-sky-700"
                        buttonColor="text-sky-700"
                        iconBgColor="bg-sky-50"
                        to={`/faculty-mycourses/${course.assignment_id}/grading`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MyCourses;
