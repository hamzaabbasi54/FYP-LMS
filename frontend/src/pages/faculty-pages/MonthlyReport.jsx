import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PiArrowLeft as MdArrowBack,
    PiCaretLeft as MdChevronLeft,
    PiCaretRight as MdChevronRight,
    PiCheckCircle as MdCheckCircle,
    PiClock as MdAccessTime,
    PiDownloadSimple as MdDownload,
    PiFloppyDisk as MdSave,
    PiMagnifyingGlass as MdSearch,
    PiCircle as MdRadioButtonUnchecked,
    PiX as MdClose
} from 'react-icons/pi';
import { useCourse } from '../../context/CourseContext';
import { studentApi, attendanceApi } from '../../services/api';

const MonthlyReport = () => {
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({}); // { `${studentId}-${day}`: newStatus }
    const headerScrollRef = useRef(null);
    const bodyScrollRef = useRef(null);
    const syncLock = useRef(false);

    // Avatar color options
    const avatarColors = [
        "bg-sky-50 text-sky-700",
        "bg-sky-50 text-sky-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-50 text-amber-700",
        "bg-sky-50 text-sky-700",
        "bg-blue-100 text-sky-700",
        "bg-red-50 text-red-700",
        "bg-amber-50 text-amber-700",
        "bg-sky-50 text-sky-700",
        "bg-sky-50 text-sky-700"
    ];

    const getAvatarColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return avatarColors[Math.abs(hash) % avatarColors.length];
    };

    // Generate days for the current month
    const generateDays = () => {
        const days = [];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.year, currentMonth.month - 1, day);
            const dayOfWeek = date.getDay();
            const dayName = dayNames[dayOfWeek];

            days.push({
                day: day,
                dayName: dayName,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6
            });
        }
        return days;
    };

    const weekdays = generateDays();

    // Fetch enrolled students and monthly attendance data
    useEffect(() => {
        const fetchData = async () => {
            if (!courseAssignmentId) return;

            try {
                setLoading(true);
                setPendingChanges({});
                setSaveMessage(null);

                // Fetch enrolled students
                const enrolledRes = await studentApi.getEnrolledStudents(courseAssignmentId);
                const enrolledStudents = enrolledRes.success ? (enrolledRes.data || []) : [];

                // Fetch monthly attendance
                let monthlyRecords = [];
                try {
                    const monthlyRes = await attendanceApi.getMonthly(courseAssignmentId, currentMonth.month, currentMonth.year);
                    if (monthlyRes.success) {
                        monthlyRecords = monthlyRes.data || [];
                    }
                } catch (err) {
                    // No attendance data yet
                }

                // Build attendance map: { studentId: { day: status } }
                const attendanceMap = {};
                monthlyRecords.forEach(record => {
                    const studentId = record.student_id;
                    if (!attendanceMap[studentId]) attendanceMap[studentId] = {};
                    const day = new Date(record.date).getDate();
                    attendanceMap[studentId][day] = record.status;
                });

                // Merge students with attendance
                const mergedStudents = enrolledStudents.map(student => {
                    const fullName = `${student.first_name} ${student.last_name}`;
                    const initials = `${(student.first_name || '')[0] || ''}${(student.last_name || '')[0] || ''}`.toUpperCase();

                    return {
                        id: student.id,
                        name: fullName,
                        studentId: student.student_id_number,
                        initials: initials,
                        avatarColor: getAvatarColor(fullName),
                        attendance: attendanceMap[student.id] || {}
                    };
                });

                setStudents(mergedStudents);
            } catch (err) {
                console.error('Error fetching monthly data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseAssignmentId, currentMonth.month, currentMonth.year]);

    const toggleAttendance = (studentId, day) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const currentStatus = student.attendance[day] || 'na';
        let nextStatus;
        if (currentStatus === 'present') nextStatus = 'absent';
        else if (currentStatus === 'absent') nextStatus = 'late';
        else if (currentStatus === 'late') nextStatus = 'na';
        else nextStatus = 'present';

        setStudents(students.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    attendance: {
                        ...s.attendance,
                        [day]: nextStatus
                    }
                };
            }
            return s;
        }));

        // Track this change for saving
        setPendingChanges(prev => ({
            ...prev,
            [`${studentId}-${day}`]: { studentId, day, status: nextStatus }
        }));

        setSaveMessage(null);
    };

    // Save pending changes to the database
    const handleSaveChanges = async () => {
        if (!courseAssignmentId) return;
        const changes = Object.values(pendingChanges);
        if (changes.length === 0) {
            setSaveMessage({ type: 'info', text: 'No changes to save.' });
            return;
        }

        try {
            setSaving(true);
            setSaveMessage(null);

            // Group changes by date
            const changesByDate = {};
            changes.forEach(change => {
                const dateStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(change.day).padStart(2, '0')}`;
                if (!changesByDate[dateStr]) changesByDate[dateStr] = [];
                changesByDate[dateStr].push({
                    student_id: change.studentId,
                    status: change.status === 'na' ? 'absent' : change.status,
                    remarks: ''
                });
            });

            // Save each date's changes
            let savedCount = 0;
            for (const [date, records] of Object.entries(changesByDate)) {
                await attendanceApi.saveCourseAttendance(courseAssignmentId, { date, records });
                savedCount += records.length;
            }

            setPendingChanges({});
            setSaveMessage({ type: 'success', text: `Saved ${savedCount} attendance change(s) successfully!` });
        } catch (err) {
            console.error('Error saving monthly attendance:', err);
            setSaveMessage({ type: 'error', text: 'Failed to save attendance changes.' });
        } finally {
            setSaving(false);
        }
    };

    // Export monthly attendance as Excel
    const handleExportCSV = async () => {
        if (!courseAssignmentId) return;
        try {
            setExporting(true);
            const blob = await attendanceApi.exportMonthly(courseAssignmentId, currentMonth.month, currentMonth.year);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${monthNames[currentMonth.month - 1]}_${currentMonth.year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            setSaveMessage({ type: 'error', text: 'Failed to export. Make sure there is data to export.' });
        } finally {
            setExporting(false);
        }
    };

    const calculateStats = (student) => {
        const attendanceDays = weekdays.filter(d => !d.isWeekend).map(d => d.day);
        const presentDays = attendanceDays.filter(day => {
            const status = student.attendance[day] || 'na';
            return status === 'present' || status === 'late';
        }).length;
        return attendanceDays.length > 0 ? Math.round((presentDays / attendanceDays.length) * 100) : 0;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <MdCheckCircle className="w-5 h-5 text-emerald-600" />;
            case 'absent':
                return <MdClose className="w-5 h-5 text-red-600" />;
            case 'late':
                return <MdAccessTime className="w-5 h-5 text-amber-600" />;
            case 'na':
            default:
                return <MdRadioButtonUnchecked className="w-5 h-5 text-slate-400" />;
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const handlePreviousMonth = () => {
        if (currentMonth.month === 1) {
            setCurrentMonth({ month: 12, year: currentMonth.year - 1 });
        } else {
            setCurrentMonth({ ...currentMonth, month: currentMonth.month - 1 });
        }
    };

    const handleNextMonth = () => {
        if (currentMonth.month === 12) {
            setCurrentMonth({ month: 1, year: currentMonth.year + 1 });
        } else {
            setCurrentMonth({ ...currentMonth, month: currentMonth.month + 1 });
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery)
    );

    const syncHorizontalScroll = (source) => {
        if (syncLock.current) return;
        syncLock.current = true;

        const sourceEl = source === 'header' ? headerScrollRef.current : bodyScrollRef.current;
        const targetEl = source === 'header' ? bodyScrollRef.current : headerScrollRef.current;

        if (sourceEl && targetEl) {
            targetEl.scrollLeft = sourceEl.scrollLeft;
        }

        requestAnimationFrame(() => {
            syncLock.current = false;
        });
    };

    const backUrl = courseAssignmentId
        ? `/faculty-mycourses/${courseAssignmentId}/attendance`
        : '/faculty-attendance';

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                        Monthly Attendance Report {selectedCourse ? selectedCourse.code : ''}
                    </h1>
                </div>
                <Link
                    to={backUrl}
                    className="flex items-center text-sky-700 hover:text-sky-700 font-medium text-sm whitespace-nowrap"
                >
                    <MdArrowBack className="w-5 h-5 mr-1" />
                    Back to Daily View
                </Link>
            </div>

            {/* Controls Section */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    {/* Left Side - Date Selector and Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                        {/* Date Selector */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePreviousMonth}
                                className="p-2 rounded-3xl border border-sky-100 hover:bg-sky-50/45 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                <MdChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-2 border border-sky-100 rounded-3xl bg-white min-w-[180px] text-center shadow-sm">
                                <span className="text-sm font-semibold text-slate-700">
                                    {monthNames[currentMonth.month - 1]} {currentMonth.year}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 rounded-3xl border border-sky-100 hover:bg-sky-50/45 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                <MdChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-sky-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Right Side - Legend and Export */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <MdCheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-slate-600">Present</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdClose className="w-4 h-4 text-red-600" />
                                <span className="text-slate-600">Absent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdAccessTime className="w-4 h-4 text-amber-600" />
                                <span className="text-slate-600">Late</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdRadioButtonUnchecked className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">N/A</span>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="flex items-center px-4 py-2 bg-white text-slate-700 border border-sky-100 rounded-3xl hover:bg-sky-50/45 shadow-sm transition-colors font-semibold text-sm whitespace-nowrap"
                        >
                            <MdDownload className="w-5 h-5 mr-2" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-sky-100 border-t-sky-600 rounded-3xl animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading attendance data...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && students.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 text-sm font-medium">No students enrolled in this course.</p>
                    </div>
                )}

                {/* Table */}
                {!loading && students.length > 0 && (
                    <>
                        <div className="monthly-report-grid">
                            <div className="monthly-report-fixed-head">
                                STUDENT DETAILS
                            </div>

                            <div
                                ref={headerScrollRef}
                                className="monthly-report-header-scroll"
                                onScroll={() => syncHorizontalScroll('header')}
                            >
                                <div className="monthly-report-date-row">
                                    {weekdays.map((day) => (
                                        <div
                                            key={day.day}
                                            className="monthly-report-date-cell"
                                        >
                                            <span>{day.dayName}</span>
                                            <span className="font-semibold">{day.day.toString().padStart(2, '0')}</span>
                                        </div>
                                    ))}
                                    <div className="monthly-report-stat-head">
                                        STATS
                                    </div>
                                </div>
                            </div>

                            <div className="monthly-report-body-scroll">
                                <div className="monthly-report-fixed-students">
                                    {filteredStudents.map((student, rowIndex) => {
                                        const isEvenRow = rowIndex % 2 === 0;
                                        return (
                                            <div
                                                key={student.id}
                                                className={`monthly-report-student-row ${isEvenRow ? 'bg-white' : 'bg-sky-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-3xl ${student.avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                        <span className="font-bold text-sm">{student.initials}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 text-sm leading-snug">{student.name}</p>
                                                        <p className="text-slate-500 text-xs font-medium">ID: {student.studentId}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div
                                    ref={bodyScrollRef}
                                    className="monthly-report-attendance-scroll"
                                    onScroll={() => syncHorizontalScroll('body')}
                                >
                                    {filteredStudents.map((student, rowIndex) => {
                                        const isEvenRow = rowIndex % 2 === 0;
                                        return (
                                            <div
                                                key={student.id}
                                                className={`monthly-report-attendance-row ${isEvenRow ? 'bg-white' : 'bg-sky-50/45'}`}
                                            >
                                                {weekdays.map((day) => (
                                                    <button
                                                        type="button"
                                                        key={day.day}
                                                        className={`monthly-report-attendance-cell ${day.isWeekend
                                                                ? 'bg-sky-50 cursor-default'
                                                                : 'hover:bg-sky-50 cursor-pointer'
                                                            }`}
                                                        onClick={() => !day.isWeekend && toggleAttendance(student.id, day.day)}
                                                        disabled={day.isWeekend}
                                                    >
                                                        {day.isWeekend ? (
                                                            <span className="text-slate-300 text-xs">•</span>
                                                        ) : (
                                                            getStatusIcon(student.attendance[day.day] || 'na')
                                                        )}
                                                    </button>
                                                ))}
                                                <div className="monthly-report-stat-cell">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {calculateStats(student)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-6 border-t border-sky-100">
                            {/* Save Message */}
                            {saveMessage && (
                                <div className={`mb-4 px-4 py-3 rounded-3xl text-sm font-medium ${saveMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : saveMessage.type === 'info'
                                            ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                            : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {saveMessage.text}
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <p className="text-xs text-slate-500 font-medium">
                                    Click on any cell to toggle attendance status.
                                    {Object.keys(pendingChanges).length > 0 && (
                                        <span className="ml-2 text-sky-700 font-bold">
                                            ({Object.keys(pendingChanges).length} unsaved change{Object.keys(pendingChanges).length !== 1 ? 's' : ''})
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(backUrl)}
                                        className="px-6 py-2 bg-white text-slate-700 border border-sky-100 rounded-3xl hover:bg-sky-50/45 shadow-sm transition-colors font-semibold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={saving || Object.keys(pendingChanges).length === 0}
                                        className={`flex items-center px-6 py-2 rounded-3xl shadow-sm transition-colors font-medium text-sm ${saving || Object.keys(pendingChanges).length === 0
                                                ? 'bg-blue-400 text-white cursor-not-allowed'
                                                : 'bg-sky-600 text-white hover:bg-sky-700'
                                            }`}
                                    >
                                        <MdSave className="w-5 h-5 mr-2" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MonthlyReport;
