import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdSearch, MdCheckCircle, MdRadioButtonUnchecked, MdFilterList, MdDownload, MdCalendarToday, MdChevronLeft, MdChevronRight, MdSave, MdGridOn } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { studentApi, attendanceApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Attendance = () => {
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const calendarRef = useRef(null);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };

        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);

    // Format date for API calls (YYYY-MM-DD)
    const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dateStr = formatDateForApi(selectedDate);
    const queryClient = useQueryClient();

    // Fetch enrolled students
    const { data: enrolledStudents = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['enrolledStudents', courseAssignmentId],
        enabled: !!courseAssignmentId,
        queryFn: async () => {
            const res = await studentApi.getEnrolledStudents(courseAssignmentId);
            return res.success ? (res.data || []) : [];
        }
    });

    // Fetch existing attendance
    const { data: existingAttendance = [], isLoading: loadingAttendance } = useQuery({
        queryKey: ['attendanceRecords', courseAssignmentId, dateStr],
        enabled: !!courseAssignmentId && !!dateStr,
        queryFn: async () => {
            const res = await attendanceApi.getByCourse(courseAssignmentId, { date: dateStr });
            return res.success ? (res.data || []) : [];
        }
    });

    // Sync to local state
    useEffect(() => {
        if (loadingStudents || loadingAttendance) {
            setLoading(true);
            return;
        }

        const attendanceMap = {};
        existingAttendance.forEach(record => {
            attendanceMap[record.student_id] = {
                status: record.status || 'present',
                remarks: record.remarks || ''
            };
        });

        const mergedStudents = enrolledStudents.map(student => {
            const existing = attendanceMap[student.id];
            const fullName = `${student.first_name} ${student.last_name}`;
            const initials = `${(student.first_name || '')[0] || ''}${(student.last_name || '')[0] || ''}`.toUpperCase();

            return {
                id: student.id,
                name: fullName,
                studentId: student.student_id_number,
                initials: initials,
                status: existing ? existing.status : 'present',
                remarks: existing ? existing.remarks : ''
            };
        });

        setStudents(mergedStudents);
        setLoading(false);
    }, [enrolledStudents, existingAttendance, loadingStudents, loadingAttendance]);

    // Format date for display
    const formatDate = (date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Get days in month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Navigate to previous month
    const handlePreviousMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    };

    // Navigate to next month
    const handleNextMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    };

    // Select a date
    const handleDateSelect = (day) => {
        const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        setSelectedDate(newDate);
        setShowCalendar(false);
    };

    // Go to today
    const handleToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setShowCalendar(false);
    };

    // Navigate to previous day
    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
        setCalendarMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    };

    // Navigate to next day
    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
        setCalendarMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarMonth);
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return { days, dayNames, monthName: monthNames[calendarMonth.getMonth()], year: calendarMonth.getFullYear() };
    };

    const calendarData = generateCalendarDays();
    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            calendarMonth.getMonth() === today.getMonth() &&
            calendarMonth.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        return day === selectedDate.getDate() &&
            calendarMonth.getMonth() === selectedDate.getMonth() &&
            calendarMonth.getFullYear() === selectedDate.getFullYear();
    };

    const toggleStatus = (id) => {
        setStudents(students.map(student =>
            student.id === id
                ? { ...student, status: student.status === 'present' ? 'absent' : 'present' }
                : student
        ));
        setSaveMessage(null);
    };

    const markAllPresent = () => {
        setStudents(students.map(student => ({ ...student, status: 'present' })));
        setSaveMessage(null);
    };

    const updateRemarks = (id, remarks) => {
        setStudents(students.map(student =>
            student.id === id ? { ...student, remarks } : student
        ));
        setSaveMessage(null);
    };

    // Save attendance to database
    const saveAttendanceMutation = useMutation({
        mutationFn: (payload) => attendanceApi.saveCourseAttendance(courseAssignmentId, payload),
        onSuccess: (response) => {
            setSaveMessage({ type: 'success', text: response.message || 'Attendance saved successfully!' });
            queryClient.invalidateQueries({ queryKey: ['attendanceRecords', courseAssignmentId, dateStr] });
        },
        onError: (err) => {
            console.error('Error saving attendance:', err);
            setSaveMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
        },
        onSettled: () => {
            setSaving(false);
        }
    });

    const handleSaveAttendance = () => {
        if (!courseAssignmentId || students.length === 0) return;

        setSaving(true);
        setSaveMessage(null);

        const records = students.map(student => ({
            student_id: student.id,
            status: student.status,
            remarks: student.remarks || ''
        }));

        saveAttendanceMutation.mutate({
            date: dateStr,
            records: records
        });
    };

    // Reset attendance (cancel unsaved changes by refetching)
    const handleCancel = () => {
        // Re-trigger fetch by toggling a reload
        const currentDate = new Date(selectedDate);
        setSelectedDate(new Date(currentDate));
        setSaveMessage(null);
    };

    // Export monthly attendance as Excel
    const handleExportCSV = async () => {
        if (!courseAssignmentId) return;
        try {
            setExporting(true);
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();
            const blob = await attendanceApi.exportMonthly(courseAssignmentId, month, year);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            link.setAttribute('download', `attendance_${monthNames[month - 1]}_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            setSaveMessage({ type: 'error', text: 'Failed to export attendance. Make sure there is data to export.' });
        } finally {
            setExporting(false);
        }
    };

    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const totalStudents = students.length;
    const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery)
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        Attendance Management
                    </h1>
                    <span className="bg-blue-50 text-blue-700 text-sm font-bold tracking-wider uppercase px-3 py-1 rounded">
                        {selectedCourse ? selectedCourse.code : 'Course'}
                    </span>
                </div>
                <Link
                    to="#"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
                >
                    View History
                </Link>
            </div>

            {/* Session Date and Summary Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Select Session Date</h2>

                {/* Date Picker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="relative flex items-center gap-2" ref={calendarRef}>
                        <button
                            onClick={handlePreviousDay}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            <MdChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <div
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setShowCalendar(!showCalendar)}
                            >
                                <MdCalendarToday className="w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formatDate(selectedDate)}
                                    readOnly
                                    className="text-sm font-medium text-slate-700 focus:outline-none w-32 cursor-pointer bg-transparent"
                                />
                            </div>

                            {/* Calendar Dropdown */}
                            {showCalendar && (
                                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-80 p-4">
                                    {/* Calendar Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={handlePreviousMonth}
                                            className="p-1 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <MdChevronLeft className="w-5 h-5 text-slate-600" />
                                        </button>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            {calendarData.monthName} {calendarData.year}
                                        </h3>
                                        <button
                                            onClick={handleNextMonth}
                                            className="p-1 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <MdChevronRight className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>

                                    {/* Day Names */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {calendarData.dayNames.map((dayName) => (
                                            <div key={dayName} className="text-xs font-bold text-slate-400 text-center py-1">
                                                {dayName}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarData.days.map((day, index) => {
                                            if (day === null) {
                                                return <div key={`empty-${index}`} className="aspect-square"></div>;
                                            }
                                            const isTodayDate = isToday(day);
                                            const isSelectedDate = isSelected(day);

                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => handleDateSelect(day)}
                                                    className={`aspect-square flex items-center justify-center text-sm rounded transition-colors ${isSelectedDate
                                                        ? 'bg-blue-600 text-white font-semibold'
                                                        : isTodayDate
                                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                                            : 'hover:bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Calendar Footer */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={handleToday}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                                        >
                                            Today
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleNextDay}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            <MdChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                        >
                            Today
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm">
                            Jump to Last Session
                        </button>
                    </div>
                </div>

                {/* Attendance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <p className="text-sm font-bold text-emerald-700 mb-2 tracking-wider uppercase">PRESENT</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-emerald-600">{presentCount}</span>
                            <span className="text-lg font-semibold text-emerald-600">{presentPercentage}%</span>
                        </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-sm font-bold text-red-700 mb-2 tracking-wider uppercase">ABSENT</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-red-600">{absentCount}</span>
                            <span className="text-lg font-semibold text-red-600">{absentPercentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Attendance List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header with Search and Actions */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search student by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={markAllPresent}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                            >
                                <MdCheckCircle className="w-5 h-5 mr-2" />
                                Mark All Present
                            </button>
                            <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                                <MdFilterList className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                                <MdDownload className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading students...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && students.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 text-sm">No students enrolled in this course.</p>
                    </div>
                )}

                {/* Student Table */}
                {!loading && students.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        STUDENT DETAILS
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        STATUS
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        REMARKS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                        {/* Student Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-700 font-bold text-sm">{student.initials}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                                                    <p className="text-slate-500 text-xs">ID: {student.studentId}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(student.id)}
                                                className="focus:outline-none"
                                            >
                                                {student.status === 'present' ? (
                                                    <MdCheckCircle className="w-6 h-6 text-emerald-500" />
                                                ) : (
                                                    <MdRadioButtonUnchecked className="w-6 h-6 text-slate-400 hover:text-slate-600" />
                                                )}
                                            </button>
                                        </td>

                                        {/* Remarks */}
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                placeholder="Add note..."
                                                value={student.remarks}
                                                onChange={(e) => updateRemarks(student.id, e.target.value)}
                                                className="text-sm text-slate-700 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 w-full max-w-xs placeholder-slate-400"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer with Pagination and Actions */}
                {!loading && students.length > 0 && (
                    <div className="p-6 border-t border-slate-200">
                        {/* Save Message */}
                        {saveMessage && (
                            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${saveMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {saveMessage.text}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-800">{filteredStudents.length}</span> of <span className="font-semibold text-slate-800">{totalStudents}</span> students
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAttendance}
                                    disabled={saving}
                                    className={`flex items-center px-6 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm ${saving
                                            ? 'bg-blue-400 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    <MdSave className="w-5 h-5 mr-2" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Attendance History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Attendance History</h2>
                        <p className="text-slate-500 text-sm">
                            View past attendance records, identify trends, and export monthly reports.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            to={courseAssignmentId ? `/faculty-mycourses/${courseAssignmentId}/attendance/monthly-report` : '/faculty-attendance/monthly-report'}
                            className="flex items-center justify-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm"
                        >
                            <MdGridOn className="w-5 h-5 mr-2" />
                            View Monthly Report
                        </Link>
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="flex items-center justify-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm"
                        >
                            <MdDownload className="w-5 h-5 mr-2" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;