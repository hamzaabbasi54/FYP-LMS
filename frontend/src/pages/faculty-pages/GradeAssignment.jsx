import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdSearch, MdChevronRight, MdSave, MdDownload, MdUploadFile } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi, gradeApi, studentApi } from '../../services/api';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const GradeAssignment = () => {
    const { assignmentId, gradeAssignmentId } = useParams();
    const { selectedCourse } = useCourse();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
    const courseCode = selectedCourse?.code || 'Course';

    const [searchQuery, setSearchQuery] = useState('');
    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [scores, setScores] = useState({});
    const [questionScores, setQuestionScores] = useState({});
    const [remarks, setRemarks] = useState({});
    const [originalScores, setOriginalScores] = useState({});
    const [originalQuestionScores, setOriginalQuestionScores] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewErrors, setPreviewErrors] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Avatar color options
    const avatarColors = [
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
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

    const queryClient = useQueryClient();

    // Fetch assessment details
    const { data: assessmentData, isLoading: loadingAssessment } = useQuery({
        queryKey: ['assessmentDetails', gradeAssignmentId],
        enabled: !!gradeAssignmentId,
        queryFn: async () => {
            const res = await assessmentApi.getById(gradeAssignmentId);
            return res.success ? res.data : null;
        }
    });

    // Fetch enrolled students
    const { data: enrolledStudents = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['enrolledStudents', courseAssignmentId],
        enabled: !!courseAssignmentId,
        queryFn: async () => {
            const res = await studentApi.getEnrolledStudents(courseAssignmentId);
            return res.success ? (res.data || []) : [];
        }
    });

    // Fetch existing grades
    const { data: existingGrades = [], isLoading: loadingGrades } = useQuery({
        queryKey: ['assessmentGrades', gradeAssignmentId],
        enabled: !!gradeAssignmentId,
        queryFn: async () => {
            const res = await gradeApi.getByAssessment(gradeAssignmentId, { limit: 500 });
            return res.data || [];
        }
    });

    // Sync to local form state
    useEffect(() => {
        if (loadingAssessment || loadingStudents || loadingGrades) {
            setLoading(true);
            return;
        }

        if (assessmentData) setAssessment(assessmentData);

        const gradeMap = {};
        existingGrades.forEach(g => {
            gradeMap[g.student_id] = { score: g.score, remarks: g.remarks || '', question_scores: g.question_scores || {} };
        });

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
                remarks: grade?.remarks || '',
                question_scores: grade?.question_scores || {}
            };
        });

        setStudents(mergedStudents);

        const initialScores = {};
        const initialQuestionScores = {};
        const initialRemarks = {};
        mergedStudents.forEach(s => {
            initialScores[s.id] = s.score !== null ? s.score : '';
            initialQuestionScores[s.id] = s.question_scores || {};
            initialRemarks[s.id] = s.remarks || '';
        });

        setScores(initialScores);
        setQuestionScores(initialQuestionScores);
        setRemarks(initialRemarks);
        setOriginalScores({ ...initialScores });
        setOriginalQuestionScores(JSON.parse(JSON.stringify(initialQuestionScores)));
        setLoading(false);
    }, [assessmentData, enrolledStudents, existingGrades, loadingAssessment, loadingStudents, loadingGrades]);

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

    // Handle question score change
    const handleQuestionScoreChange = (studentId, questionNum, value) => {
        const numValue = value === '' ? '' : parseFloat(value);
        
        setQuestionScores(prev => {
            const studentQ = { ...prev[studentId] };
            studentQ[`q${questionNum}`] = numValue;
            
            // Auto sum total score
            let sum = 0;
            let hasAny = false;
            Object.values(studentQ).forEach(v => {
                if (v !== '' && v !== null && v !== undefined) {
                    sum += parseFloat(v);
                    hasAny = true;
                }
            });

            // Update total score silently
            setScores(sPrev => ({
                ...sPrev,
                [studentId]: hasAny ? sum : ''
            }));

            return { ...prev, [studentId]: studentQ };
        });

        setUnsavedChanges(prev => ({
            ...prev,
            [studentId]: true
        }));
        
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
    const saveGradesMutation = useMutation({
        mutationFn: (gradesPayload) => gradeApi.save(gradeAssignmentId, gradesPayload),
        onSuccess: (response) => {
            setSaveMessage({ type: 'success', text: response.message || 'Grades saved successfully!' });
            setUnsavedChanges({});
            // Update original scores
            setOriginalScores({ ...scores });
            setOriginalQuestionScores(JSON.parse(JSON.stringify(questionScores)));
            // Update students with new scores
            setStudents(prev =>
                prev.map(student => ({
                    ...student,
                    score: scores[student.id] !== '' ? parseFloat(scores[student.id]) : null,
                    remarks: remarks[student.id] || '',
                    question_scores: questionScores[student.id] || {}
                }))
            );
            
            // Invalidate existing grades cache
            queryClient.invalidateQueries({ queryKey: ['assessmentGrades', gradeAssignmentId] });
            queryClient.invalidateQueries({ queryKey: ['assessments', courseAssignmentId] });
        },
        onError: (err) => {
            console.error('Error saving grades:', err);
            setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save grades. Please try again.' });
        },
        onSettled: () => {
            setSaving(false);
        }
    });

    const handleSave = () => {
        setSaving(true);
        setSaveMessage(null);

        // Build grades array from all students that have scores
        const gradesPayload = students
            .filter(s => scores[s.id] !== '' && scores[s.id] !== undefined)
            .map(s => ({
                student_id: s.id,
                score: parseFloat(scores[s.id]),
                remarks: remarks[s.id] || null,
                question_scores: questionScores[s.id] || {}
            }));

        if (gradesPayload.length === 0) {
            setSaveMessage({ type: 'info', text: 'No scores to save.' });
            setSaving(false);
            return;
        }

        saveGradesMutation.mutate(gradesPayload);
    };


    // Handle cancel
    const handleCancel = () => {
        setScores({ ...originalScores });
        setQuestionScores(JSON.parse(JSON.stringify(originalQuestionScores)));
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
            
            // First call the preview endpoint
            const result = await gradeApi.importGradesPreview(gradeAssignmentId, file);
            if (result.success) {
                setPreviewData(result.data.preview);
                setPreviewErrors(result.data.errors || []);
                setSelectedFile(file);
            } else {
                setImportResult({ success: false, message: result.message || 'Failed to generate preview.' });
            }
        } catch (err) {
            console.error('Import preview error:', err);
            setImportResult({ success: false, message: 'Failed to read file. Please check the format.' });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Confirm and save grades
    const handleConfirmImport = async () => {
        if (!selectedFile) return;
        try {
            setImporting(true);
            const result = await gradeApi.importGrades(gradeAssignmentId, selectedFile);
            setImportResult(result);
            setPreviewData(null);
            setSelectedFile(null);
            
            if (result.success && result.data?.imported > 0) {
                const gradesRes = await gradeApi.getByAssessment(gradeAssignmentId, { limit: 500 });
                const existingGrades = gradesRes.data || [];
                const gradeMap = {};
                existingGrades.forEach(g => {
                    gradeMap[g.student_id] = { score: g.score, remarks: g.remarks || '', question_scores: g.question_scores || {} };
                });
                const newScores = {};
                const newQuestionScores = {};
                const newRemarks = {};
                students.forEach(s => {
                    const grade = gradeMap[s.id];
                    newScores[s.id] = grade?.score ?? '';
                    newQuestionScores[s.id] = grade?.question_scores || {};
                    newRemarks[s.id] = grade?.remarks || '';
                });
                setScores(newScores);
                setQuestionScores(newQuestionScores);
                setRemarks(newRemarks);
                setOriginalScores({ ...newScores });
                setOriginalQuestionScores(JSON.parse(JSON.stringify(newQuestionScores)));
                setStudents(prev => prev.map(s => ({
                    ...s,
                    score: newScores[s.id] !== '' ? parseFloat(newScores[s.id]) : null,
                    question_scores: newQuestionScores[s.id] || {},
                    remarks: newRemarks[s.id] || ''
                })));
                setUnsavedChanges({});
            }
        } catch (err) {
            console.error('Import error:', err);
            setImportResult({ success: false, message: 'Failed to save imported grades.' });
        } finally {
            setImporting(false);
        }
    };

    const handleCancelImport = () => {
        setPreviewData(null);
        setSelectedFile(null);
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
                    <p className="text-slate-500 text-sm ml-4">Loading assessment data...</p>
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="text-center py-20">
                    <p className="text-slate-500 text-sm">Assessment not found.</p>
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
            <OverlayLoader isLoading={saving || importing} text={saving ? "Saving grades to database..." : "Importing grades..."} />
            
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
                <Link to={`/faculty-mycourses/${courseAssignmentId}`} className="hover:text-blue-600 transition-colors">
                    {courseCode}
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <Link to={`/faculty-mycourses/${courseAssignmentId}/grading`} className="hover:text-blue-600 transition-colors">
                    Grades
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <span className="text-slate-800 font-semibold">{assessment.title}</span>
            </div>

            {/* Assignment Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Assignment Info */}
                    <div className="flex-1">
                        <div className="mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {formatTypeLabel(assessment.type)}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="text-sm text-slate-600 font-medium">
                                Due {dueDate} at {dueTime}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                            {assessment.title}
                        </h1>
                        {assessment.description && (
                            <p className="text-slate-600 text-sm sm:text-base">
                                {assessment.description}
                            </p>
                        )}
                    </div>

                    {/* Right Side - Max Score and Summary */}
                    <div className="flex flex-col gap-4 lg:items-end">
                        {/* Max Score Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm w-full lg:w-auto lg:min-w-[150px]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                MAX SCORE
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {assessment.max_score} <span className="text-lg font-normal text-slate-500">pts</span>
                            </p>
                        </div>

                        {/* Grading Summary */}
                        <div className="text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">{gradedCount}</span> graded / <span className="font-semibold text-slate-800">{students.length}</span> students
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Download & Import Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Excel Grading</h3>
                        <p className="text-sm text-slate-500">Download a template, fill in scores, and import back.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            disabled={downloading}
                            className="flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            <MdDownload className="w-5 h-5 mr-2" />
                            {downloading ? 'Downloading...' : 'Get Template'}
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex items-center px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-6 border-b border-slate-200">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                                    STUDENT
                                </th>
                                {assessment.questions && assessment.questions.length > 0 ? (
                                    assessment.questions.map(q => (
                                        <th key={q.id} className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[120px]">
                                            Q{q.question_number} <span className="text-slate-400 font-normal">({q.max_marks})</span>
                                            {q.clo_title && <div className="text-[10px] text-blue-500 mt-1 font-semibold">{q.clo_title}</div>}
                                        </th>
                                    ))
                                ) : null}
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {assessment.questions && assessment.questions.length > 0 ? 'TOTAL SCORE' : 'SCORE'}
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    REMARKS
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    {/* Student Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${student.avatarColor} flex items-center justify-center flex-shrink-0`}>
                                                <span className="font-bold text-sm">{student.initials}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                                                <p className="text-slate-500 text-xs">ID: {student.studentId}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Question Inputs (if any) */}
                                    {assessment.questions && assessment.questions.length > 0 ? (
                                        assessment.questions.map(q => (
                                            <td key={q.id} className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={q.max_marks}
                                                    step="0.5"
                                                    value={questionScores[student.id]?.[`q${q.question_number}`] !== undefined ? questionScores[student.id][`q${q.question_number}`] : ''}
                                                    onChange={(e) => handleQuestionScoreChange(student.id, q.question_number, e.target.value)}
                                                    className={`w-16 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                        ))
                                    ) : null}

                                    {/* Total Score Input */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={assessment.max_score}
                                                step="0.5"
                                                value={scores[student.id] !== undefined ? scores[student.id] : ''}
                                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                disabled={assessment.questions && assessment.questions.length > 0}
                                                className={`w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                                                    assessment.questions && assessment.questions.length > 0 
                                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-semibold'
                                                        : `focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`
                                                }`}
                                                placeholder="0"
                                            />
                                            <span className="text-sm text-slate-500 font-medium">/ {assessment.max_score}</span>
                                        </div>
                                    </td>

                                    {/* Remarks Input */}
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={remarks[student.id] || ''}
                                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                            className={`w-full max-w-xs px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${unsavedChanges[student.id] ? 'border-amber-400 bg-amber-50' : 'border-slate-300'
                                                }`}
                                            placeholder="Add remarks..."
                                        />
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500 text-sm">
                                        {students.length === 0 ? 'No students enrolled in this course.' : 'No students found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    {/* Save Message */}
                    {saveMessage && (
                        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                            saveMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : saveMessage.type === 'info'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {saveMessage.text}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-sm text-slate-600">
                            {unsavedCount > 0 ? (
                                <>Unsaved changes for <span className="font-semibold text-slate-800">{unsavedCount}</span> {unsavedCount === 1 ? 'student' : 'students'}</>
                            ) : (
                                <span className="text-slate-500">Enter scores and click Save Grades.</span>
                            )}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={saving || unsavedCount === 0}
                                className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
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

            {/* Preview Modal */}
            {previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">Preview Import Results</h2>
                            <p className="text-sm text-slate-500 mt-1">Review the grades and calculated CLO achievements before saving.</p>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {previewErrors.length > 0 && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="font-semibold text-red-800 mb-2">Warning: Some rows had errors</h4>
                                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                        {previewErrors.map((e, idx) => (
                                            <li key={idx}>Row {e.row}: {e.student ? `(Student ${e.student}) ` : ''}{e.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3">Registration #</th>
                                            <th className="px-4 py-3">Student Name</th>
                                            <th className="px-4 py-3">Total Score</th>
                                            <th className="px-4 py-3">CLO Achievements</th>
                                            <th className="px-4 py-3">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{row.student_id_number}</td>
                                                <td className="px-4 py-3 text-slate-700">{row.student_name}</td>
                                                <td className="px-4 py-3 font-bold text-blue-600">
                                                    {row.total_score} / {row.max_score}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.clos && row.clos.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {row.clos.map((c, i) => (
                                                                <span key={i} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    c.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                                    c.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                                                    c.percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                    CLO-{c.clo_number}: {c.percentage}%
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No mapped CLOs</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{row.remarks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={handleCancelImport}
                                disabled={importing}
                                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={importing}
                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                {importing ? 'Saving...' : 'Confirm & Save to Database'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeAssignment;