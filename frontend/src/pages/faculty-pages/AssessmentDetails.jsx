import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdChevronRight, MdDownload, MdQuiz, MdAssignment, MdSchool, MdDescription, MdAccessTime, MdStar, MdEdit } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi, gradeApi } from '../../services/api';

const AssessmentDetails = () => {
    const { assignmentId, gradeAssignmentId } = useParams();
    const { selectedCourse } = useCourse();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
    const courseCode = selectedCourse?.code || 'Course';

    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await assessmentApi.getById(gradeAssignmentId);
                if (res.success) {
                    setAssessment(res.data);
                    setError(null);
                } else {
                    setError('Assessment not found');
                }
            } catch (err) {
                console.error('Fetch assessment error:', err);
                setError('Failed to load assessment details');
            } finally {
                setLoading(false);
            }
        };
        if (gradeAssignmentId) fetchAssessment();
    }, [gradeAssignmentId]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await gradeApi.export(gradeAssignmentId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${assessment.title}_results.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export results. Make sure the assessment has been graded.');
        } finally {
            setExporting(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'quiz': return MdQuiz;
            case 'assignment': return MdAssignment;
            case 'midterm': return MdSchool;
            case 'final': return MdSchool;
            default: return MdDescription;
        }
    };

    const getTypeLabel = (type) => {
        const labels = { quiz: 'Quiz', assignment: 'Assignment', midterm: 'Midterm Exam', final: 'Final Exam', project: 'Project' };
        return labels[type] || type;
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'quiz': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'assignment': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'midterm': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'final': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isGraded = assessment?.grade_stats?.graded_count > 0;

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm">{error || 'Assessment not found'}</div>
            </div>
        );
    }

    const TypeIcon = getTypeIcon(assessment.type);
    const questions = assessment.questions || [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-2">
                <Link to={`/faculty-mycourses/${courseAssignmentId}`} className="hover:text-blue-600 transition-colors">{courseCode}</Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to={`/faculty-mycourses/${courseAssignmentId}/grading`} className="hover:text-blue-600 transition-colors">Grading</Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">{assessment.title}</span>
            </div>

            {/* Header with Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTypeColor(assessment.type)}`}>
                        <TypeIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{assessment.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(assessment.type)}`}>
                                {getTypeLabel(assessment.type)}
                            </span>
                            <span className="text-sm text-gray-500">{courseCode} — {assessment.course_title || ''}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {assessment.status === 'scheduled' ? (
                        <span
                            className="flex items-center px-4 py-2.5 bg-gray-300 text-gray-500 rounded-lg shadow-sm font-medium text-sm cursor-not-allowed"
                            title="Cannot grade a scheduled assignment before its due date"
                        >
                            Grade Now
                        </span>
                    ) : (
                        <Link
                            to={`/faculty-mycourses/${courseAssignmentId}/grading/${gradeAssignmentId}`}
                            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                        >
                            Grade Now
                        </Link>
                    )}
                    <Link
                        to={`/faculty-mycourses/${courseAssignmentId}/grading/${gradeAssignmentId}/edit`}
                        className="flex items-center px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-sm transition-colors font-medium text-sm"
                    >
                        <MdEdit className="w-5 h-5 mr-2" />
                        Edit
                    </Link>
                    <button
                        onClick={handleExport}
                        disabled={!isGraded || exporting}
                        title={!isGraded ? 'Assessment must be graded before exporting results' : 'Export student results to Excel'}
                        className={`flex items-center px-4 py-2.5 rounded-lg shadow-sm transition-colors font-medium text-sm ${
                            isGraded
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <MdDownload className="w-5 h-5 mr-2" />
                        {exporting ? 'Exporting...' : 'Export Results'}
                    </button>
                </div>
            </div>

            {/* Assessment Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">Assessment Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Max Score */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <MdStar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Score</p>
                            <p className="text-lg font-bold text-gray-800">{assessment.max_score} <span className="text-sm font-normal text-gray-500">pts</span></p>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <MdDescription className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weightage</p>
                            <p className="text-lg font-bold text-gray-800">{assessment.weight ? `${assessment.weight}%` : 'Not set'}</p>
                        </div>
                    </div>

                    {/* Duration */}
                    {assessment.duration_minutes && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                <MdAccessTime className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</p>
                                <p className="text-lg font-bold text-gray-800">{assessment.duration_minutes} <span className="text-sm font-normal text-gray-500">min</span></p>
                            </div>
                        </div>
                    )}

                    {/* Due Date / Conducted Date */}
                    {assessment.conducted_date && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <MdAccessTime className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conducted Date</p>
                                <p className="text-sm font-semibold text-gray-800">{formatDate(assessment.conducted_date)}</p>
                            </div>
                        </div>
                    )}
                    {assessment.due_date && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                <MdAccessTime className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
                                <p className="text-sm font-semibold text-gray-800">{formatDate(assessment.due_date)}</p>
                            </div>
                        </div>
                    )}

                    {/* Grading Status */}
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isGraded ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <MdAssignment className={`w-5 h-5 ${isGraded ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grading Status</p>
                            <p className={`text-sm font-semibold ${isGraded ? 'text-green-700' : 'text-gray-500'}`}>
                                {isGraded ? `${assessment.grade_stats.graded_count} students graded` : 'Not graded yet'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {assessment.description && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Description / Instructions</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{assessment.description}</p>
                    </div>
                )}

                {/* CLO Mappings */}
                {assessment.mapped_clos && assessment.mapped_clos.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Mapped CLOs</h3>
                        <div className="flex flex-wrap gap-2">
                            {assessment.mapped_clos.map(clo => (
                                <span key={clo.id} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                                    {clo.title || `CLO-${clo.clo_number}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Questions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">
                        Questions
                        <span className="text-sm font-normal text-gray-500 ml-2">({questions.length} question{questions.length !== 1 ? 's' : ''})</span>
                    </h2>
                    {questions.length > 0 && (
                        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            Total: {questions.reduce((sum, q) => sum + (parseFloat(q.max_marks) || 0), 0)} marks
                        </span>
                    )}
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <MdQuiz className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No questions have been added to this assessment.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1">Q#</div>
                            <div className="col-span-5">Description</div>
                            <div className="col-span-2">Max Marks</div>
                            <div className="col-span-2">Weightage</div>
                            <div className="col-span-2">CLO</div>
                        </div>

                        {questions.map((q, index) => (
                            <div key={q.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors items-center">
                                <div className="col-span-1">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                                        {q.question_number || index + 1}
                                    </span>
                                </div>
                                <div className="col-span-5">
                                    <p className="text-sm text-gray-800">{q.description || <span className="text-gray-400 italic">No description</span>}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-sm font-semibold text-gray-800">{q.max_marks} <span className="text-xs font-normal text-gray-500">marks</span></span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-sm text-gray-700">{q.weightage ? `${q.weightage}%` : '—'}</span>
                                </div>
                                <div className="col-span-2">
                                    {q.clo_title ? (
                                        <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                                            {q.clo_title}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssessmentDetails;
