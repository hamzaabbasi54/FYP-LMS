import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MdSearch, MdChevronRight, MdCheckCircle, MdWarning, MdError, MdSave, MdHelp } from 'react-icons/md';

const GradeAssignment = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [scores, setScores] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});

    // Mock assignment data
    const assignment = {
        id: assignmentId || '2',
        label: "ASSIGNMENT 3",
        title: "OOP Concepts Essay",
        description: "Grading submissions for the introductory essay on Object Oriented Programming principles.",
        dueDate: "Oct 24, 2023",
        dueTime: "11:59 PM",
        maxScore: 100,
        gradedCount: 4,
        totalStudents: 118
    };

    // Mock student submissions data
    const [students, setStudents] = useState([
        {
            id: 1,
            name: "Ayesha Khan",
            studentId: "2023001",
            initials: "AK",
            avatarColor: "bg-purple-100 text-purple-700",
            status: "Submitted",
            statusColor: "text-green-600",
            statusIcon: MdCheckCircle,
            submittedDate: "Oct 24, 10:45 AM",
            submissionFile: "essay_ayesha.pdf",
            score: 92
        },
        {
            id: 2,
            name: "Bilal Ahmed",
            studentId: "2023015",
            initials: "BA",
            avatarColor: "bg-pink-100 text-pink-700",
            status: "Late Submission",
            statusColor: "text-yellow-600",
            statusIcon: MdWarning,
            submittedDate: "Oct 25, 09:12 AM",
            submissionFile: "oop_essay_bilal.docx",
            score: null
        },
        {
            id: 3,
            name: "Chaudhry Nazeer",
            studentId: "2023042",
            initials: "CN",
            avatarColor: "bg-green-100 text-green-700",
            status: "Missing",
            statusColor: "text-red-600",
            statusIcon: MdError,
            submittedDate: "Due Oct 24",
            submissionFile: null,
            score: 0
        },
        {
            id: 4,
            name: "Dua Khalid",
            studentId: "2023089",
            initials: "DK",
            avatarColor: "bg-yellow-100 text-yellow-700",
            status: "Submitted",
            statusColor: "text-green-600",
            statusIcon: MdCheckCircle,
            submittedDate: "Oct 23, 04:20 PM",
            submissionFile: "essay_dua.pdf",
            score: null
        },
        {
            id: 5,
            name: "Ehab Latif",
            studentId: "2023102",
            initials: "EL",
            avatarColor: "bg-indigo-100 text-indigo-700",
            status: "Submitted",
            statusColor: "text-green-600",
            statusIcon: MdCheckCircle,
            submittedDate: "Oct 24, 11:15 AM",
            submissionFile: "oop_assign3_ehab.pdf",
            score: 88
        }
    ]);

    // Initialize scores state
    React.useEffect(() => {
        const initialScores = {};
        students.forEach(student => {
            initialScores[student.id] = student.score !== null ? student.score : '';
        });
        setScores(initialScores);
    }, []);

    // Handle score change
    const handleScoreChange = (studentId, value) => {
        const numValue = value === '' ? '' : parseInt(value);
        setScores(prev => ({
            ...prev,
            [studentId]: numValue
        }));

        // Track unsaved changes
        const originalScore = students.find(s => s.id === studentId)?.score;
        const hasChanged = originalScore !== (numValue === '' ? null : numValue);

        setUnsavedChanges(prev => {
            const newChanges = { ...prev };
            if (hasChanged) {
                newChanges[studentId] = true;
            } else {
                delete newChanges[studentId];
            }
            return newChanges;
        });
    };

    // Handle save
    const handleSave = () => {
        console.log('Saving grades:', scores);
        // In a real app, you would send this to an API
        alert('Grades saved successfully!');
        setUnsavedChanges({});
        // Update students with new scores
        setStudents(prevStudents =>
            prevStudents.map(student => ({
                ...student,
                score: scores[student.id] !== '' ? scores[student.id] : null
            }))
        );
    };

    // Handle cancel
    const handleCancel = () => {
        // Reset scores to original values
        const originalScores = {};
        students.forEach(student => {
            originalScores[student.id] = student.score !== null ? student.score : '';
        });
        setScores(originalScores);
        setUnsavedChanges({});
    };

    // Filter students based on search
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery)
    );

    const unsavedCount = Object.keys(unsavedChanges).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                    CS-101
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to="/faculty-mycourses/grading" className="hover:text-blue-600 transition-colors">
                    Grades
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">{assignment.title}</span>
            </div>

            {/* Assignment Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Assignment Info */}
                    <div className="flex-1">
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {assignment.label}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="text-sm text-gray-600">
                                Due {assignment.dueDate} at {assignment.dueTime}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                            {assignment.title}
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">
                            {assignment.description}
                        </p>
                    </div>

                    {/* Right Side - Max Score and Summary */}
                    <div className="flex flex-col gap-4 lg:items-end">
                        {/* Max Score Card */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm w-full lg:w-auto lg:min-w-[150px]">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                MAX SCORE
                            </p>
                            <p className="text-2xl font-bold text-gray-800">
                                {assignment.maxScore} <span className="text-lg font-normal text-gray-600">pts</span>
                            </p>
                        </div>

                        {/* Grading Summary */}
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-800">{assignment.gradedCount}</span> graded / <span className="font-semibold text-gray-800">{assignment.totalStudents}</span> students
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Submissions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    STUDENT
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    SUBMISSION STATUS
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    SUBMISSION
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    SCORE
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => {
                                const StatusIcon = student.statusIcon;
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Student Info */}
                                        <td className="px-6 py-4">
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

                                        {/* Submission Status */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`w-5 h-5 ${student.statusColor}`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${student.statusColor}`}>
                                                        {student.status}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{student.submittedDate}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Submission File */}
                                        <td className="px-6 py-4">
                                            {student.submissionFile ? (
                                                <a
                                                    href="#"
                                                    className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        // In a real app, this would download/open the file
                                                        console.log('Opening file:', student.submissionFile);
                                                    }}
                                                >
                                                    {student.submissionFile}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">No file submitted</span>
                                            )}
                                        </td>

                                        {/* Score Input */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={assignment.maxScore}
                                                    value={scores[student.id] !== undefined ? scores[student.id] : ''}
                                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                    className={`w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                                        }`}
                                                    placeholder="0"
                                                />
                                                <span className="text-sm text-gray-600">/ {assignment.maxScore}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Action Bar */}
                {unsavedCount > 0 && (
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <p className="text-sm text-gray-600">
                                Unsaved changes for <span className="font-semibold text-gray-800">{unsavedCount}</span> {unsavedCount === 1 ? 'student' : 'students'}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                                >
                                    <MdSave className="w-5 h-5 mr-2" />
                                    Save Grades
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeAssignment;

