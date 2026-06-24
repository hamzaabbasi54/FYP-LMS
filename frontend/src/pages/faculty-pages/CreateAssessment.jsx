import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    PiCaretRight as MdChevronRight,
    PiClock as MdAccessTime,
    PiCalendarBlank as MdCalendarToday,
    PiInfo as MdInfo,
    PiQuestion as MdHelpOutline,
    PiTextB as MdFormatBold,
    PiTextItalic as MdFormatItalic,
    PiTextUnderline as MdFormatUnderlined,
    PiLinkSimple as MdLink,
    PiPlus as MdAdd,
    PiTrash as MdDelete
} from 'react-icons/pi';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi } from '../../services/api';

const CreateAssessment = () => {
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const { assignmentId, gradeAssignmentId } = useParams();
    const [searchParams] = useSearchParams();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
    const courseCode = selectedCourse?.code || 'Course';
    const courseIdFromContext = selectedCourse?.course_id;
    const [effectiveCourseId, setEffectiveCourseId] = useState(courseIdFromContext);

    const isEditMode = !!gradeAssignmentId;

    const typeMap = { quiz: 'quiz', assignment: 'assignment', midterm: 'midterm', final: 'final', project: 'project' };
    const preselectedType = typeMap[searchParams.get('type')] || 'quiz';
    
    const [formData, setFormData] = useState({
        assessmentType: preselectedType,
        title: '',
        description: '',
        dueDate: '',
        conductedDate: '',
        releaseGradesOn: '',
        maxScore: '100',
        weight: '',
        duration: ''
    });

    const [questions, setQuestions] = useState([]);
    const [availableCLOs, setAvailableCLOs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(isEditMode);
    const [error, setError] = useState(null);

    // Fetch CLOs for this course
    // Keep effectiveCourseId in sync with context changes
    useEffect(() => {
        if (courseIdFromContext) setEffectiveCourseId(courseIdFromContext);
    }, [courseIdFromContext]);

    useEffect(() => {
        const fetchCLOs = async () => {
            if (!effectiveCourseId) return;
            try {
                const res = await assessmentApi.getCLOsForCourse(effectiveCourseId);
                if (res.success) setAvailableCLOs(res.data || []);
            } catch (err) {
                console.error('Error fetching CLOs:', err);
            }
        };
        fetchCLOs();
    }, [effectiveCourseId]);

    // Fetch existing assessment data when editing
    useEffect(() => {
        const fetchAssessment = async () => {
            if (!isEditMode) return;
            try {
                setLoadingEdit(true);
                const res = await assessmentApi.getById(gradeAssignmentId);
                if (res.success && res.data) {
                    const a = res.data;
                    const formatDT = (dt) => {
                        if (!dt) return '';
                        const d = new Date(dt);
                        const pad = (n) => String(n).padStart(2, '0');
                        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    };
                    setFormData({
                        assessmentType: a.type || 'quiz',
                        title: a.title || '',
                        description: a.description || '',
                        dueDate: formatDT(a.due_date),
                        conductedDate: formatDT(a.conducted_date),
                        releaseGradesOn: formatDT(a.release_grades_on),
                        maxScore: String(a.max_score || 100),
                        weight: a.weight ? String(a.weight) : '',
                        duration: a.duration_minutes ? String(a.duration_minutes) : ''
                    });
                    if (a.questions && a.questions.length > 0) {
                        setQuestions(a.questions.map(q => ({
                            description: q.description || '',
                            max_marks: String(q.max_marks || 10),
                            weightage: q.weightage ? String(q.weightage) : '',
                            clo_id: q.clo_id ? String(q.clo_id) : ''
                        })));
                    } else {
                        setQuestions([]);
                    }
                    // Backfill courseId from fetched assessment for CLO loading
                    if (a.course_id) setEffectiveCourseId(a.course_id);
                }
            } catch (err) {
                console.error('Error fetching assessment for edit:', err);
                setError('Failed to load assessment data');
            } finally {
                setLoadingEdit(false);
            }
        };
        fetchAssessment();
    }, [gradeAssignmentId, isEditMode]);

    // Determine which date fields to show
    const showConductedDate = ['quiz', 'midterm', 'final'].includes(formData.assessmentType);
    const showDueDate = ['assignment', 'project'].includes(formData.assessmentType);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    // Question management
    const addQuestion = () => {
        setQuestions(prev => [...prev, { description: '', max_marks: '10', weightage: '', clo_id: '' }]);
    };

    const updateQuestion = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate totals for validation
    // Use the same normalization as submit payload (fallback to 10 for marks)
    const calculatedMaxScore = questions.length > 0
        ? questions.reduce((sum, q) => sum + (parseFloat(q.max_marks) || 10), 0)
        : 0;

    const calculatedWeightage = questions.length > 0
        ? questions.reduce((sum, q) => sum + (parseFloat(q.weightage) || 0), 0)
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) { setError('Title is required'); return; }
        if (showDueDate && !formData.dueDate) { setError('Due date is required'); return; }
        if (showConductedDate && !formData.conductedDate) { setError('Conducted date is required'); return; }

        if (questions.length > 0) {
            if (calculatedMaxScore > parseFloat(formData.maxScore || 0)) {
                setError('Total question marks cannot exceed the overall max score.');
                return;
            }
            if (formData.weight && calculatedWeightage > parseFloat(formData.weight)) {
                setError('Total question weightage cannot exceed the overall weightage.');
                return;
            }
        }

        try {
            setSaving(true);
            setError(null);

            const chosenDate = showDueDate ? formData.dueDate : (showConductedDate ? formData.conductedDate : null);
            const calculatedStatus = (chosenDate && new Date(chosenDate) < new Date()) ? 'needs_grading' : 'scheduled';

            const payload = {
                course_assignment_id: parseInt(courseAssignmentId),
                type: formData.assessmentType,
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                due_date: showDueDate ? (formData.dueDate || null) : null,
                conducted_date: showConductedDate ? (formData.conductedDate || null) : null,
                release_grades_on: showDueDate ? (formData.releaseGradesOn || null) : null,
                max_score: parseInt(formData.maxScore) || 100,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                duration_minutes: formData.duration ? parseInt(formData.duration) : null,
                status: calculatedStatus,
                questions: questions.length > 0 ? questions.map(q => ({
                    description: q.description || null,
                    max_marks: parseFloat(q.max_marks) || 10,
                    weightage: q.weightage ? parseFloat(q.weightage) : null,
                    clo_id: q.clo_id ? parseInt(q.clo_id) : null
                })) : []
            };

            let response;
            if (isEditMode) {
                response = await assessmentApi.update(gradeAssignmentId, payload);
            } else {
                response = await assessmentApi.create(payload);
            }
            if (response.success) {
                navigate(`/faculty-mycourses/${courseAssignmentId}/grading`);
            } else {
                setError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} assessment`);
            }
        } catch (err) {
            console.error(`${isEditMode ? 'Update' : 'Create'} assessment error:`, err);
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} assessment. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => navigate(`/faculty-mycourses/${courseAssignmentId}/grading`);

    const typeDisplayNames = { quiz: 'Quiz', assignment: 'Assignment', midterm: 'Midterm Exam', final: 'Final Exam', project: 'Project' };

    if (loadingEdit) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <Link to={`/faculty-mycourses/${courseAssignmentId}`} className="hover:text-sky-700 transition-colors">{courseCode}</Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <Link to={`/faculty-mycourses/${courseAssignmentId}/grading`} className="hover:text-sky-700 transition-colors">Grading</Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <span className="text-slate-700 font-medium">{isEditMode ? `Edit ${formData.title || typeDisplayNames[formData.assessmentType]}` : `New ${typeDisplayNames[formData.assessmentType]}`}</span>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{isEditMode ? 'Edit' : 'Create New'} {typeDisplayNames[formData.assessmentType]}</h1>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-3xl text-sm font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assessment Details Card */}
                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-6 pb-4 border-b border-sky-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Assessment Details</h2>
                            <p className="text-sm text-slate-600">Configure general settings, grading criteria, and visibility options.</p>
                        </div>
                        <button type="button" className="text-sky-700 hover:text-sky-700 p-2 rounded-3xl hover:bg-sky-50 transition-colors">
                            <MdHelpOutline className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Row 1: Assessment Type + Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="assessmentType" className="block text-sm font-semibold text-slate-700 mb-2">Assessment Type</label>
                                <div className="relative">
                                    <select id="assessmentType" name="assessmentType" value={formData.assessmentType} onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm appearance-none bg-white cursor-pointer pr-8">
                                        <option value="quiz">Quiz</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="midterm">Midterm Exam</option>
                                        <option value="final">Final Exam</option>
                                        <option value="project">Project</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5">Selected type determines the available configuration fields.</p>
                            </div>
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">Title <span className="text-red-500">*</span></label>
                                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Chapter 4 Quiz: Algorithms" className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" required />
                            </div>
                        </div>

                        {/* Row 2: Description (full width) */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">Description / Instructions</label>
                            <div className="flex items-center gap-2 mb-2 p-2 bg-sky-50/45 border border-sky-100 rounded-t-lg">
                                <button type="button" className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Bold"><MdFormatBold className="w-4 h-4 text-slate-700" /></button>
                                <button type="button" className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Italic"><MdFormatItalic className="w-4 h-4 text-slate-700" /></button>
                                <button type="button" className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Underline"><MdFormatUnderlined className="w-4 h-4 text-slate-700" /></button>
                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                <button type="button" className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Insert Link"><MdLink className="w-4 h-4 text-slate-700" /></button>
                            </div>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Write the instructions here..." rows={4}
                                className="w-full px-4 py-2.5 border border-sky-100 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm resize-y" />
                        </div>

                        {/* Row 3: Date fields (conditional) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {showDueDate && (
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-semibold text-slate-700 mb-2">Due Date <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input type="datetime-local" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" required />
                                    </div>
                                </div>
                            )}
                            {showConductedDate && (
                                <div>
                                    <label htmlFor="conductedDate" className="block text-sm font-semibold text-slate-700 mb-2">Conducted Date <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input type="datetime-local" id="conductedDate" name="conductedDate" value={formData.conductedDate} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" required />
                                    </div>
                                </div>
                            )}
                            {showDueDate && (
                                <div>
                                    <label htmlFor="releaseGradesOn" className="block text-sm font-semibold text-slate-700 mb-2">Release Grades On</label>
                                    <div className="relative">
                                        <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input type="datetime-local" id="releaseGradesOn" name="releaseGradesOn" value={formData.releaseGradesOn} onChange={handleChange}
                                            className="w-full pl-10 pr-12 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" />
                                        <MdAccessTime className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">If blank, grades will be released manually.</p>
                                </div>
                            )}
                            {showConductedDate && (
                                <div>
                                    <label htmlFor="duration" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        Duration (Minutes)
                                        <button type="button" className="text-slate-400 hover:text-slate-600" title="Duration information"><MdInfo className="w-4 h-4" /></button>
                                    </label>
                                    <div className="relative">
                                        <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 60" min="1"
                                            className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm pr-16" />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">min</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Row 4: Max Score + Weight */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="maxScore" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Max Score <span className="text-red-500">*</span>
                                    {questions.length > 0 && (
                                        <span className={`text-xs ml-2 ${calculatedMaxScore > parseFloat(formData.maxScore || 0) ? 'text-red-600' : 'text-sky-700'}`}>
                                            (Questions Total: {calculatedMaxScore})
                                        </span>
                                    )}
                                </label>
                                <input type="number" id="maxScore" name="maxScore" value={formData.maxScore}
                                    onChange={handleChange} min="1"
                                    className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="weight" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Weight (%)
                                    {questions.length > 0 && (
                                        <span className={`text-xs ml-2 ${calculatedWeightage > parseFloat(formData.weight || 0) ? 'text-red-600' : 'text-sky-700'}`}>
                                            (Questions Total: {calculatedWeightage}%)
                                        </span>
                                    )}
                                </label>
                                <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 15" min="0" max="100"
                                    className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm" />
                            </div>
                        </div>

                        {/* Row 5: Duration for assignment/project */}
                        {showDueDate && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="duration" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        Duration (Minutes)
                                        <button type="button" className="text-slate-400 hover:text-slate-600" title="Duration information"><MdInfo className="w-4 h-4" /></button>
                                    </label>
                                    <div className="relative">
                                        <input type="number" id="duration2" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 60" min="1"
                                            className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm pr-16" />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">min</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Questions Section */}
                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-sky-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Questions</h2>
                            <p className="text-sm text-slate-600">Add questions with marks, weightage, and CLO mapping.</p>
                        </div>
                        <button type="button" onClick={addQuestion}
                            className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 shadow-sm transition-colors font-medium text-sm">
                            <MdAdd className="w-5 h-5 mr-1" /> Add Question
                        </button>
                    </div>

                    {questions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <MdHelpOutline className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm">No questions added yet. Click "Add Question" to start.</p>
                            <p className="text-xs text-slate-400 mt-1">Questions are optional — you can add them later.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div key={index} className="border border-sky-100 rounded-3xl p-4 bg-sky-50/45 hover:bg-white transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-700 bg-blue-100 text-sky-700 px-3 py-1 rounded-3xl">Q{index + 1}</span>
                                        <button type="button" onClick={() => removeQuestion(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-3xl transition-colors" title="Remove question">
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {/* Question description */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Question Description</label>
                                        <input type="text" value={q.description} onChange={(e) => updateQuestion(index, 'description', e.target.value)}
                                            placeholder="e.g. Explain the concept of polymorphism..."
                                            className="w-full px-3 py-2 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm" />
                                    </div>
                                    {/* Max Marks + Weightage + CLO */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Max Marks <span className="text-red-500">*</span></label>
                                            <input type="number" value={q.max_marks} onChange={(e) => updateQuestion(index, 'max_marks', e.target.value)}
                                                min="1" placeholder="10" className="w-full px-3 py-2 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Weightage (%)</label>
                                            <input type="number" value={q.weightage} onChange={(e) => updateQuestion(index, 'weightage', e.target.value)}
                                                min="0" max="100" placeholder="e.g. 20" className="w-full px-3 py-2 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">CLO Mapping</label>
                                            <div className="relative">
                                                <select value={q.clo_id} onChange={(e) => updateQuestion(index, 'clo_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm appearance-none bg-white cursor-pointer pr-8">
                                                    <option value="">Select CLO</option>
                                                    {availableCLOs.map(clo => (
                                                        <option key={clo.id} value={clo.id}>{clo.title} — {clo.description?.substring(0, 40) || 'No description'}...</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Summary */}
                            <div className="mt-4 p-3 bg-sky-50 rounded-3xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">{questions.length}</span> question{questions.length !== 1 ? 's' : ''} — Total marks: <span className={`font-semibold ${calculatedMaxScore > parseFloat(formData.maxScore || 0) ? 'text-red-600' : ''}`}>{calculatedMaxScore}</span>
                                    {calculatedWeightage > 0 && <span> | Total weightage: <span className={`font-semibold ${calculatedWeightage > parseFloat(formData.weight || 0) ? 'text-red-600' : ''}`}>{calculatedWeightage}%</span></span>}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={handleCancel} disabled={saving}
                        className="px-6 py-2.5 bg-white border border-sky-100 text-slate-700 rounded-3xl hover:bg-sky-50/45 shadow-sm transition-colors font-medium text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50">
                        {saving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Assessment' : 'Create Assessment')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAssessment;
