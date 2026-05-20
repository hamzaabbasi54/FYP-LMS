import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MdSearch, MdChevronRight, MdSave, MdDownload, MdUploadFile } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi, gradeApi, studentApi } from '../../services/api';

const GradeAssignment = () => {
    const { assignmentId, gradeAssignmentId } = useParams();
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
    const courseCode = selectedCourse?.code || 'Course';

    const [searchQuery, setSearchQuery] = useState('');
    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [scores, setScores] = useState({});
    const [remarks, setRemarks] = useState({});
    const [originalScores, setOriginalScores] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

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

    const getAvatarColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return avatarColors[Math.abs(hash) % avatarColors.length];
    };

    // Fetch assessment, enrolled students, and existing grades
    useEffect(() => {
        const fetchData = async () => {
            if (!gradeAssignmentId || !courseAssignmentId) return;

            try {
                setLoading(true);

                // Fetch assessment details
                const assessmentRes = await assessmentApi.getById(gradeAssignmentId);
                if (assessmentRes.success) {
                    setAssessment(assessmentRes.data);
                }

                // Fetch enrolled students
                const enrolledRes = await studentApi.getEnrolledStudents(courseAssignmentId);
                const enrolledStudents = enrolledRes.success ? (enrolledRes.data || []) : [];

                // Fetch existing grades
                let existingGrades = [];
                try {
                    const gradesRes = await gradeApi.getByAssessment(gradeAssignmentId, { limit: 500 });
                    existingGrades = gradesRes.data || [];
                } catch (err) {
                    // No grades yet
                }

                // Build grade lookup: { studentId: { score, remarks } }
                const gradeMap = {};
                existingGrades.forEach(g => {
                    gradeMap[g.student_id] = { score: g.score, remarks: g.remarks || '' };
                });

                // Merge students with grades
                const mergedStudents = enrolledStudents.map(student => {
                    const fullName = `${student.first_name} ${student.last_name}`;
                    const initials = `${(student.first_name || '')[0] || ''}${(student.last_name || '')[0] || ''}`.toUpperCase();
                    const grade = gradeMap[student.id];

                    return {
                        id: student.id,
                        name: fullName,
                        studentId: student.student_id_number,
                        initials,
                        avatarColor: getAvatarColor(fullName),
                        score: grade?.score ?? null,
                        remarks: grade?.remarks || ''
                    };
                });

                setStudents(mergedStudents);

                // Initialize scores
                const initialScores = {};
                const initialRemarks = {};
                mergedStudents.forEach(s => {
                    initialScores[s.id] = s.score !== null ? s.score : '';
                    initialRemarks[s.id] = s.remarks || '';
                });
                setScores(initialScores);
                setRemarks(initialRemarks);
                setOriginalScores({ ...initialScores });

            } catch (err) {
                console.error('Error fetching grading data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [gradeAssignmentId, courseAssignmentId]);

    // Handle score change
    const handleScoreChange = (studentId, value) => {
        const numValue = value === '' ? '' : parseFloat(value);
        setScores(prev => ({
            ...prev,
            [studentId]: numValue
        }));

        // Track unsaved changes
        const original = originalScores[studentId];
        const hasChanged = original !== (numValue === '' ? '' : numValue);

        setUnsavedChanges(prev => {
            const newChanges = { ...prev };
            if (hasChanged) {
                newChanges[studentId] = true;
            } else {
                delete newChanges[studentId];
            }
            return newChanges;
        });

        setSaveMessage(null);
    };

    // Handle remarks change
    const handleRemarksChange = (studentId, value) => {
        setRemarks(prev => ({
            ...prev,
            [studentId]: value
        }));

        // Mark as changed
        setUnsavedChanges(prev => ({
            ...prev,
            [studentId]: true
        }));

        setSaveMessage(null);
    };

    // Handle save — sends grades to the backend
    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);

            // Build grades array from all students that have scores
            const gradesPayload = students
                .filter(s => scores[s.id] !== '' && scores[s.id] !== undefined)
                .map(s => ({
                    student_id: s.id,
                    score: parseFloat(scores[s.id]),
                    remarks: remarks[s.id] || null
                }));

            if (gradesPayload.length === 0) {
                setSaveMessage({ type: 'info', text: 'No scores to save.' });
                setSaving(false);
                return;
            }

            const response = await gradeApi.save(gradeAssignmentId, gradesPayload);

            if (response.success) {
                setSaveMessage({ type: 'success', text: response.message || 'Grades saved successfully!' });
                setUnsavedChanges({});
                // Update original scores
                setOriginalScores({ ...scores });
                // Update students with new scores
                setStudents(prev =>
                    prev.map(student => ({
                        ...student,
                        score: scores[student.id] !== '' ? parseFloat(scores[student.id]) : null,
                        remarks: remarks[student.id] || ''
                    }))
                );
            } else {
                setSaveMessage({ type: 'error', text: response.message || 'Failed to save grades.' });
            }
        } catch (err) {
            console.error('Save grades error:', err);
            setSaveMessage({ type: 'error', text: 'Failed to save grades. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setScores({ ...originalScores });
        const originalRemarks = {};
        students.forEach(s => {
            originalRemarks[s.id] = s.remarks || '';
        });
        setRemarks(originalRemarks);
        setUnsavedChanges({});
        setSaveMessage(null);
    };

    // Handle template download
    const handleDownloadTemplate = async () => {
        try {
            setDownloading(true);
            await gradeApi.downloadTemplate(gradeAssignmentId);
        } catch (err) {
            console.error('Download template error:', err);
            setSaveMessage({ type: 'error', text: 'Failed to download template. Make sure students are enrolled.' });
        } finally {
            setDownloading(false);
        }
    };

    // Handle import grades from Excel
    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setImporting(true);
            setImportResult(null);
            const result = await gradeApi.importGrades(gradeAssignmentId, file);
            setImportResult(result);
            // Refresh data after import
            if (result.success && result.data?.imported > 0) {
                const gradesRes = await gradeApi.getByAssessment(gradeAssignmentId, { limit: 500 });
                const existingGrades = gradesRes.data || [];
                const gradeMap = {};
                existingGrades.forEach(g => {
                    gradeMap[g.student_id] = { score: g.score, remarks: g.remarks || '' };
                });
                const newScores = {};
                const newRemarks = {};
                students.forEach(s => {
                    const grade = gradeMap[s.id];
                    newScores[s.id] = grade?.score ?? '';
                    newRemarks[s.id] = grade?.remarks || '';
                });
                setScores(newScores);
                setRemarks(newRemarks);
                setOriginalScores({ ...newScores });
                setStudents(prev => prev.map(s => ({
                    ...s,
                    score: newScores[s.id] !== '' ? parseFloat(newScores[s.id]) : null,
                    remarks: newRemarks[s.id] || ''
                })));
                setUnsavedChanges({});
            }
        } catch (err) {
            console.error('Import error:', err);
            setImportResult({ success: false, message: 'Failed to import grades. Please check the file format.' });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Filter students based on search
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery)
    );

    const unsavedCount = Object.keys(unsavedChanges).length;
    const gradedCount = students.filter(s => scores[s.id] !== '' && scores[s.id] !== undefined && scores[s.id] !== null).length;

    // Format type label
    const formatTypeLabel = (type) => {
        const labels = {
            quiz: 'QUIZ',
            assignment: 'ASSIGNMENT',
            midterm: 'MIDTERM',
            final: 'FINAL',
            project: 'PROJECT'
        };
        return labels[type] || type?.toUpperCase() || '';
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return { date: 'No date', time: '' };
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return { date: formattedDate, time: formattedTime };
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-center items-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 text-sm ml-4">Loading assessment data...</p>
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="text-center py-20">
                    <p className="text-gray-500 text-sm">Assessment not found.</p>
                    <Link
                        to={`/faculty-mycourses/${courseAssignmentId}/grading`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-4 inline-block"
                    >
                        ← Back to Grading
                    </Link>
                </div>
            </div>
        );
    }

    const { date: dueDate, time: dueTime } = formatDate(assessment.due_date);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to={`/faculty-mycourses/${courseAssignmentId}`} className="hover:text-blue-600 transition-colors">
                    {courseCode}
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to={`/faculty-mycourses/${courseAssignmentId}/grading`} className="hover:text-blue-600 transition-colors">
                    Grades
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">{assessment.title}</span>
            </div>

            {/* Assignment Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Assignment Info */}
                    <div className="flex-1">
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {formatTypeLabel(assessment.type)}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="text-sm text-gray-600">
                                Due {dueDate} at {dueTime}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                            {assessment.title}
                        </h1>
                        {assessment.description && (
                            <p className="text-gray-600 text-sm sm:text-base">
                                {assessment.description}
                            </p>
                        )}
                    </div>

                    {/* Right Side - Max Score and Summary */}
                    <div className="flex flex-col gap-4 lg:items-end">
                        {/* Max Score Card */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm w-full lg:w-auto lg:min-w-[150px]">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                MAX SCORE
                            </p>
                            <p className="text-2xl font-bold text-gray-800">
                                {assessment.max_score} <span className="text-lg font-normal text-gray-600">pts</span>
                            </p>
                        </div>

                        {/* Grading Summary */}
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-800">{gradedCount}</span> graded / <span className="font-semibold text-gray-800">{students.length}</span> students
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Download & Import Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Excel Grading</h3>
                        <p className="text-sm text-gray-500">Download a template, fill in scores, and import back.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            disabled={downloading}
                            className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            <MdDownload className="w-5 h-5 mr-2" />
                            {downloading ? 'Downloading...' : 'Get Template'}
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex items-center px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            <MdUploadFile className="w-5 h-5 mr-2" />
                            {importing ? 'Importing...' : 'Import Grades'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportFile}
                            accept=".xlsx,.xls"
                            className="hidden"
                        />
                    </div>
                </div>
                {importResult && (
                    <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                        importResult.success
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        <p>{importResult.message}</p>
                        {importResult.data && (
                            <p className="mt-1 text-xs">
                                {importResult.data.imported} imported, {importResult.data.skipped} skipped
                                {importResult.data.errors?.length > 0 && (
                                    <span> — Errors: {importResult.data.errors.map(e => `Row ${e.row}: ${e.error}`).join('; ')}</span>
                                )}
                            </p>
                        )}
                    </div>
                )}
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
                                    SCORE
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    REMARKS
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
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

                                    {/* Score Input */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={assessment.max_score}
                                                step="0.5"
                                                value={scores[student.id] !== undefined ? scores[student.id] : ''}
                                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                className={`w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="0"
                                            />
                                            <span className="text-sm text-gray-600">/ {assessment.max_score}</span>
                                        </div>
                                    </td>

                                    {/* Remarks Input */}
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={remarks[student.id] || ''}
                                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                            className={`w-full max-w-xs px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                                }`}
                                            placeholder="Add remarks..."
                                        />
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        {students.length === 0 ? 'No students enrolled in this course.' : 'No students found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    {/* Save Message */}
                    {saveMessage && (
                        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                            saveMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : saveMessage.type === 'info'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {saveMessage.text}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-sm text-gray-600">
                            {unsavedCount > 0 ? (
                                <>Unsaved changes for <span className="font-semibold text-gray-800">{unsavedCount}</span> {unsavedCount === 1 ? 'student' : 'students'}</>
                            ) : (
                                <span className="text-gray-500">Enter scores and click Save Grades.</span>
                            )}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={saving || unsavedCount === 0}
                                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`flex items-center px-6 py-2.5 rounded-lg shadow-sm transition-colors font-medium text-sm ${
                                    saving
                                        ? 'bg-blue-400 text-white cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                <MdSave className="w-5 h-5 mr-2" />
                                {saving ? 'Saving...' : 'Save Grades'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradeAssignment;