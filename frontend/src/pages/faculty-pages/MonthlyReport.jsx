import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdSearch, MdCheckCircle, MdClose, MdAccessTime, MdRadioButtonUnchecked, MdChevronLeft, MdChevronRight, MdDownload, MdSave, MdArrowBack } from 'react-icons/md';

const MonthlyReport = () => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState({ month: 10, year: 2023 });
    const [searchQuery, setSearchQuery] = useState('');

    // Generate days for October 2023 (full month)
    const generateDays = () => {
        const days = [];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        // Generate all 31 days of October 2023
        const daysInMonth = 31;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(2023, 9, day); // Month is 0-indexed (9 = October)
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

    // Helper function to generate random attendance data for all days
    const generateAttendanceData = () => {
        const attendance = {};
        weekdays.forEach((dayObj) => {
            if (!dayObj.isWeekend) {
                const random = Math.random();
                if (random < 0.7) attendance[dayObj.day] = 'present';
                else if (random < 0.85) attendance[dayObj.day] = 'absent';
                else if (random < 0.95) attendance[dayObj.day] = 'late';
                else attendance[dayObj.day] = 'na';
            }
        });
        return attendance;
    };

    // Avatar color options
    const avatarColors = [
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
        "bg-green-100 text-green-700",
        "bg-yellow-100 text-yellow-700",
        "bg-indigo-100 text-indigo-700",
        "bg-blue-100 text-blue-700",
        "bg-red-100 text-red-700",
        "bg-orange-100 text-orange-700",
        "bg-teal-100 text-teal-700",
        "bg-cyan-100 text-cyan-700"
    ];

    // Mock student data with attendance for each day
    const [students, setStudents] = useState([
        { id: 1, name: "Alice Smith", studentId: "2023001", initials: "AS", avatarColor: avatarColors[0], attendance: generateAttendanceData() },
        { id: 2, name: "Bob Jones", studentId: "2023002", initials: "BJ", avatarColor: avatarColors[1], attendance: generateAttendanceData() },
        { id: 3, name: "Charlie Miller", studentId: "2023003", initials: "CM", avatarColor: avatarColors[2], attendance: generateAttendanceData() },
        { id: 4, name: "David Kim", studentId: "2023004", initials: "DK", avatarColor: avatarColors[3], attendance: generateAttendanceData() },
        { id: 5, name: "Eva Sanchez", studentId: "2023005", initials: "ES", avatarColor: avatarColors[4], attendance: generateAttendanceData() },
        { id: 6, name: "Frank White", studentId: "2023006", initials: "FW", avatarColor: avatarColors[5], attendance: generateAttendanceData() },
        { id: 7, name: "Grace Lee", studentId: "2023007", initials: "GL", avatarColor: avatarColors[6], attendance: generateAttendanceData() },
        { id: 8, name: "Henry Brown", studentId: "2023008", initials: "HB", avatarColor: avatarColors[7], attendance: generateAttendanceData() },
        { id: 9, name: "Isabella Garcia", studentId: "2023009", initials: "IG", avatarColor: avatarColors[8], attendance: generateAttendanceData() },
        { id: 10, name: "Jack Wilson", studentId: "2023010", initials: "JW", avatarColor: avatarColors[9], attendance: generateAttendanceData() },
        { id: 11, name: "Katherine Taylor", studentId: "2023011", initials: "KT", avatarColor: avatarColors[0], attendance: generateAttendanceData() },
        { id: 12, name: "Liam Martinez", studentId: "2023012", initials: "LM", avatarColor: avatarColors[1], attendance: generateAttendanceData() },
        { id: 13, name: "Mia Anderson", studentId: "2023013", initials: "MA", avatarColor: avatarColors[2], attendance: generateAttendanceData() },
        { id: 14, name: "Noah Thomas", studentId: "2023014", initials: "NT", avatarColor: avatarColors[3], attendance: generateAttendanceData() },
        { id: 15, name: "Olivia Jackson", studentId: "2023015", initials: "OJ", avatarColor: avatarColors[4], attendance: generateAttendanceData() },
        { id: 16, name: "Paul Harris", studentId: "2023016", initials: "PH", avatarColor: avatarColors[5], attendance: generateAttendanceData() },
        { id: 17, name: "Quinn Thompson", studentId: "2023017", initials: "QT", avatarColor: avatarColors[6], attendance: generateAttendanceData() },
        { id: 18, name: "Rachel Davis", studentId: "2023018", initials: "RD", avatarColor: avatarColors[7], attendance: generateAttendanceData() },
        { id: 19, name: "Samuel Moore", studentId: "2023019", initials: "SM", avatarColor: avatarColors[8], attendance: generateAttendanceData() },
        { id: 20, name: "Tina Clark", studentId: "2023020", initials: "TC", avatarColor: avatarColors[9], attendance: generateAttendanceData() },
        { id: 21, name: "Victor Lewis", studentId: "2023021", initials: "VL", avatarColor: avatarColors[0], attendance: generateAttendanceData() },
        { id: 22, name: "Wendy Walker", studentId: "2023022", initials: "WW", avatarColor: avatarColors[1], attendance: generateAttendanceData() },
        { id: 23, name: "Xavier Hall", studentId: "2023023", initials: "XH", avatarColor: avatarColors[2], attendance: generateAttendanceData() },
        { id: 24, name: "Yara Young", studentId: "2023024", initials: "YY", avatarColor: avatarColors[3], attendance: generateAttendanceData() },
        { id: 25, name: "Zoe King", studentId: "2023025", initials: "ZK", avatarColor: avatarColors[4], attendance: generateAttendanceData() }
    ]);

    const toggleAttendance = (studentId, day) => {
        setStudents(students.map(student => {
            if (student.id === studentId) {
                const currentStatus = student.attendance[day] || 'na';
                let nextStatus;
                if (currentStatus === 'present') nextStatus = 'absent';
                else if (currentStatus === 'absent') nextStatus = 'late';
                else if (currentStatus === 'late') nextStatus = 'na';
                else nextStatus = 'present';
                
                return {
                    ...student,
                    attendance: {
                        ...student.attendance,
                        [day]: nextStatus
                    }
                };
            }
            return student;
        }));
    };

    const calculateStats = (student) => {
        const attendanceDays = weekdays.filter(d => !d.isWeekend).map(d => d.day.toString());
        const presentDays = attendanceDays.filter(day => {
            const status = student.attendance[day] || 'na';
            return status === 'present' || status === 'late';
        }).length;
        return attendanceDays.length > 0 ? Math.round((presentDays / attendanceDays.length) * 100) : 0;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <MdCheckCircle className="w-5 h-5 text-green-600" />;
            case 'absent':
                return <MdClose className="w-5 h-5 text-red-600" />;
            case 'late':
                return <MdAccessTime className="w-5 h-5 text-orange-600" />;
            case 'na':
            default:
                return <MdRadioButtonUnchecked className="w-5 h-5 text-gray-400" />;
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        Monthly Attendance Report CS-101
                    </h1>
                </div>
                <Link
                    to="/faculty-attendance"
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
                >
                    <MdArrowBack className="w-5 h-5 mr-1" />
                    Back to Daily View
                </Link>
            </div>

            {/* Controls Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    {/* Left Side - Date Selector and Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                        {/* Date Selector */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePreviousMonth}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <MdChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-[180px] text-center">
                                <span className="text-sm font-semibold text-gray-700">
                                    {monthNames[currentMonth.month - 1]} {currentMonth.year}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <MdChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Side - Legend and Export */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <MdCheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">Present</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdClose className="w-4 h-4 text-red-600" />
                                <span className="text-gray-600">Absent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdAccessTime className="w-4 h-4 text-orange-600" />
                                <span className="text-gray-600">Late</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MdRadioButtonUnchecked className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">N/A</span>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm whitespace-nowrap">
                            <MdDownload className="w-5 h-5 mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-sm">
                                    STUDENT DETAILS
                                </th>
                                {weekdays.map((day) => (
                                    <th
                                        key={day.day}
                                        className={`px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px] ${
                                            day.isWeekend ? 'bg-gray-100' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span>{day.dayName}</span>
                                            <span className="font-normal">{day.day.toString().padStart(2, '0')}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                                    STATS
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredStudents.map((student, rowIndex) => {
                                const isEvenRow = rowIndex % 2 === 0;
                                return (
                                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                                        {/* Student Details */}
                                        <td className={`px-6 py-4 sticky left-0 z-10 border-r border-gray-200 shadow-sm ${
                                            isEvenRow ? 'bg-white' : 'bg-gray-50'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${student.avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="font-bold text-sm">{student.initials}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                                                    <p className="text-gray-500 text-xs">ID: {student.studentId}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Attendance Days */}
                                        {weekdays.map((day) => (
                                            <td
                                                key={day.day}
                                                className={`px-3 py-4 text-center ${
                                                    day.isWeekend 
                                                        ? 'bg-gray-50' 
                                                        : `cursor-pointer hover:bg-blue-50 ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`
                                                }`}
                                                onClick={() => !day.isWeekend && toggleAttendance(student.id, day.day)}
                                            >
                                                {day.isWeekend ? (
                                                    <span className="text-gray-300 text-xs">•</span>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        {getStatusIcon(student.attendance[day.day] || 'na')}
                                                    </div>
                                                )}
                                            </td>
                                        ))}

                                        {/* Stats */}
                                        <td className={`px-6 py-4 text-center ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                                            <span className="text-sm font-bold text-gray-800">
                                                {calculateStats(student)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-xs text-gray-500">
                        Click on any cell to toggle attendance status.
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/faculty-attendance')}
                            className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm">
                            <MdSave className="w-5 h-5 mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReport;

