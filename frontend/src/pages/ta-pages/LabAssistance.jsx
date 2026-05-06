import React, { useState } from 'react';
import { MdScience, MdCheck, MdClose, MdSave, MdPerson } from 'react-icons/md';

const LabAssistance = () => {
    // Mock data for lab sessions
    const [sessions] = useState([
        { id: 1, name: 'Software Engineering Lab - Group A', course: 'CS-301', time: 'Today, 2:00 PM - 5:00 PM', experiment: 'Experiment 5: Unit Testing' },
        { id: 2, name: 'Database Systems Lab - Group B', course: 'CS-302', time: 'Tomorrow, 10:00 AM - 1:00 PM', experiment: 'Experiment 3: SQL Joins' },
    ]);

    // Mock students for grading
    const [students, setStudents] = useState([
        { id: 1, name: 'Ahmed Khan', rollNo: 'CS-2023-001', attendance: null, conduct: '', results: '' },
        { id: 2, name: 'Sara Ali', rollNo: 'CS-2023-002', attendance: null, conduct: '', results: '' },
        { id: 3, name: 'Hamza Abbasi', rollNo: 'CS-2023-003', attendance: null, conduct: '', results: '' },
        { id: 4, name: 'Fatima Zahra', rollNo: 'CS-2023-004', attendance: null, conduct: '', results: '' },
    ]);

    // Dialog state
    const [showGradingDialog, setShowGradingDialog] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [saveStep, setSaveStep] = useState(0); // 0: editing, 1: saving, 2: complete

    const handleOpenGrading = (session) => {
        setSelectedSession(session);
        setShowGradingDialog(true);
        setSaveStep(0);
    };

    const handleCloseGrading = () => {
        setShowGradingDialog(false);
        setSelectedSession(null);
        setSaveStep(0);
    };

    const handleAttendanceChange = (studentId, status) => {
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, attendance: status } : s
        ));
    };

    const handleScoreChange = (studentId, field, value) => {
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, [field]: value } : s
        ));
    };

    const handleSubmit = () => {
        setSaveStep(1);
        setTimeout(() => {
            setSaveStep(2);
        }, 1500);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Lab Sessions</h1>
                <p className="text-gray-500 text-sm mt-1">Conduct lab sessions and record student performance</p>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                                    <MdScience className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{session.name}</h3>
                                    <p className="text-sm text-gray-500">{session.course} • {session.time}</p>
                                    <p className="text-sm text-sky-600 font-medium mt-1">{session.experiment}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleOpenGrading(session)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-sky-500/25 transition-all"
                            >
                                <MdSave className="w-5 h-5" />
                                Enter Scores
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grading Dialog - Simulates UC-9 Sequence */}
            {showGradingDialog && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{selectedSession.name}</h2>
                                <p className="text-sm text-gray-500">{selectedSession.experiment}</p>
                            </div>
                            <button onClick={handleCloseGrading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MdClose className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {saveStep === 0 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">Mark attendance and enter rubric-based scores for each student.</p>

                                    {/* Student Rows */}
                                    {students.map((student) => (
                                        <div key={student.id} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                                {/* Student Info */}
                                                <div className="flex items-center gap-3 lg:w-48">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <MdPerson className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{student.name}</p>
                                                        <p className="text-xs text-gray-400">{student.rollNo}</p>
                                                    </div>
                                                </div>

                                                {/* Attendance */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.id, 'present')}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${student.attendance === 'present'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                                                            }`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${student.attendance === 'absent'
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
                                                            }`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>

                                                {/* Scores (only if present) */}
                                                {student.attendance === 'present' && (
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500 mb-1 block">Conduct (0-10)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.conduct}
                                                                onChange={(e) => handleScoreChange(student.id, 'conduct', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                                placeholder="0-10"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500 mb-1 block">Results (0-10)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.results}
                                                                onChange={(e) => handleScoreChange(student.id, 'results', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                                placeholder="0-10"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Save Progress */}
                            {saveStep > 0 && (
                                <div className="space-y-4 py-8">
                                    <h3 className="text-sm font-semibold text-gray-600 text-center mb-6">Saving Session Data</h3>

                                    <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 1 ? 'bg-sky-50' : 'bg-gray-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep >= 2 ? 'bg-green-500' : 'bg-sky-500'}`}>
                                            {saveStep >= 2 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">1</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">POST /lab-sessions/{'{id}'}/grades</p>
                                            <p className="text-xs text-gray-400">Sending grades to Lab Controller...</p>
                                        </div>
                                        {saveStep === 1 && <div className="ml-auto w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />}
                                    </div>

                                    <div className={`flex items-center gap-3 p-4 rounded-lg ${saveStep >= 2 ? 'bg-green-50' : 'bg-gray-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${saveStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            {saveStep >= 2 ? <MdCheck className="w-4 h-4 text-white" /> : <span className="text-white text-sm">2</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Update Document in Database</p>
                                            <p className="text-xs text-gray-400">Saving student grades to LabSession Model...</p>
                                        </div>
                                    </div>

                                    {saveStep === 2 && (
                                        <div className="text-center pt-6">
                                            <p className="text-green-600 font-medium text-lg">✓ Session data saved successfully!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                            {saveStep === 0 && (
                                <>
                                    <button
                                        onClick={handleCloseGrading}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
                                    >
                                        <MdSave className="w-4 h-4" />
                                        Submit/Save
                                    </button>
                                </>
                            )}
                            {saveStep === 2 && (
                                <button
                                    onClick={handleCloseGrading}
                                    className="px-5 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all text-sm"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabAssistance;
