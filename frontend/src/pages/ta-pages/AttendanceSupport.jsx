import React, { useState } from 'react';
import { MdCalendarToday, MdCheck, MdClose, MdSave, MdPerson, MdCheckCircle } from 'react-icons/md';

const AttendanceSupport = () => {
    // Mock data for students
    const [students, setStudents] = useState([
        { id: 1, name: 'Ahmed Khan', rollNo: 'CS-2023-001', status: null },
        { id: 2, name: 'Sara Ali', rollNo: 'CS-2023-002', status: null },
        { id: 3, name: 'Hamza Abbasi', rollNo: 'CS-2023-003', status: null },
        { id: 4, name: 'Fatima Zahra', rollNo: 'CS-2023-004', status: null },
        { id: 5, name: 'Usman Tariq', rollNo: 'CS-2023-005', status: null },
        { id: 6, name: 'Ayesha Siddiqui', rollNo: 'CS-2023-006', status: null },
    ]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCourse, setSelectedCourse] = useState('CS-101');
    const [saveStep, setSaveStep] = useState(0); // 0: marking, 1: validating, 2: saving, 3: updating, 4: complete
    const [showSaveProgress, setShowSaveProgress] = useState(false);

    const courses = [
        { id: 'CS-101', name: 'Introduction to Programming (Section A)' },
        { id: 'CS-202', name: 'Data Structures (Section B)' },
    ];

    const handleStatusChange = (studentId, status) => {
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, status } : s
        ));
    };

    const handleMarkAllPresent = () => {
        setStudents(students.map(s => ({ ...s, status: 'present' })));
    };

    const handleSaveAttendance = () => {
        setShowSaveProgress(true);
        setSaveStep(1);

        // Step 1: Validate Date
        setTimeout(() => {
            setSaveStep(2);
            // Step 2: Create records for each student
            setTimeout(() => {
                setSaveStep(3);
                // Step 3: Calculate Percentage
                setTimeout(() => {
                    setSaveStep(4);
                }, 1000);
            }, 1500);
        }, 800);
    };

    const handleReset = () => {
        setShowSaveProgress(false);
        setSaveStep(0);
    };

    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const attendancePercentage = students.length > 0
        ? Math.round((presentCount / students.length) * 100)
        : 0;

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Mark and verify student attendance for classes</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Date Selection */}
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                        <div className="relative">
                            <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Course Selection */}
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Select Course</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        >
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-gray-800">Mark Attendance</h3>
                        <p className="text-sm text-gray-400">{students.length} students enrolled</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            <span className="text-green-600 font-bold">{presentCount}</span> Present,
                            <span className="text-red-500 font-bold ml-1">{absentCount}</span> Absent
                        </span>
                        <button
                            onClick={handleMarkAllPresent}
                            className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                            Mark All Present
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {students.map((student) => (
                        <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <MdPerson className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{student.name}</p>
                                    <p className="text-sm text-gray-400">{student.rollNo}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleStatusChange(student.id, 'present')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${student.status === 'present'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                >
                                    Present
                                </button>
                                <button
                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${student.status === 'absent'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    Absent
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSaveAttendance}
                        disabled={students.some(s => s.status === null)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MdSave className="w-5 h-5" />
                        Save Attendance
                    </button>
                </div>
            </div>

            {/* Save Progress Dialog - Simulates UC-10 Sequence */}
            {showSaveProgress && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Saving Attendance</h2>
                            {saveStep === 4 && (
                                <button onClick={handleReset} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Step 1: Validate Date */}
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 1 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep > 1 ? 'bg-green-500' : saveStep === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    {saveStep > 1 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">1</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Validate Date</p>
                                    <p className="text-xs text-gray-400">Checking date is not future/holiday...</p>
                                </div>
                                {saveStep === 1 && <div className="ml-auto w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                            </div>

                            {/* Step 2: Create Records */}
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 2 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep > 2 ? 'bg-green-500' : saveStep === 2 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    {saveStep > 2 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">2</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Create Attendance Records</p>
                                    <p className="text-xs text-gray-400">Inserting {students.length} records to database...</p>
                                </div>
                                {saveStep === 2 && <div className="ml-auto w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                            </div>

                            {/* Step 3: Calculate Percentage */}
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 3 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep > 3 ? 'bg-green-500' : saveStep === 3 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    {saveStep > 3 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">3</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Calculate Percentage</p>
                                    <p className="text-xs text-gray-400">Updating analytics if needed...</p>
                                </div>
                                {saveStep === 3 && <div className="ml-auto w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                            </div>

                            {/* Step 4: Complete */}
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 4 ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    {saveStep >= 4 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">4</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Complete</p>
                                    <p className="text-xs text-gray-400">200 OK (Saved)</p>
                                </div>
                            </div>

                            {saveStep === 4 && (
                                <div className="text-center pt-4 space-y-2">
                                    <MdCheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                                    <p className="text-green-600 font-medium text-lg">Attendance Saved Successfully!</p>
                                    <p className="text-sm text-gray-500">
                                        Attendance: <span className="font-bold text-green-600">{attendancePercentage}%</span>
                                        ({presentCount}/{students.length} present)
                                    </p>
                                </div>
                            )}
                        </div>

                        {saveStep === 4 && (
                            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
                                <button
                                    onClick={handleReset}
                                    className="px-5 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceSupport;
