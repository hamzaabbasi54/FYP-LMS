import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MdChevronRight, MdCalendarToday, MdAccessTime, MdInfo, MdHelpOutline, MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdLink } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { assessmentApi } from '../../services/api';

const CreateAssessment = () => {
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const { assignmentId } = useParams();
    const [searchParams] = useSearchParams();
    const courseAssignmentId = selectedCourse?.assignment_id || assignmentId;
    const courseCode = selectedCourse?.code || 'Course';

    // Map query param type to form value
    const typeMap = {
        quiz: 'quiz',
        assignment: 'assignment',
        midterm: 'midterm',
        final: 'final',
        project: 'project'
    };
    const preselectedType = typeMap[searchParams.get('type')] || 'quiz';
    
    // Form state
    const [formData, setFormData] = useState({
        assessmentType: preselectedType,
        title: '',
        description: '',
        dueDate: '',
        releaseGradesOn: '',
        maxScore: '100',
        weight: '',
        duration: ''
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!formData.dueDate) {
            setError('Due date is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const payload = {
                course_assignment_id: parseInt(courseAssignmentId),
                type: formData.assessmentType,
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                due_date: formData.dueDate || null,
                release_grades_on: formData.releaseGradesOn || null,
                max_score: parseInt(formData.maxScore) || 100,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                duration_minutes: formData.duration ? parseInt(formData.duration) : null,
                status: 'scheduled'
            };

            const response = await assessmentApi.create(payload);

            if (response.success) {
                navigate(`/faculty-mycourses/${courseAssignmentId}/grading`);
            } else {
                setError(response.message || 'Failed to create assessment');
            }
        } catch (err) {
            console.error('Create assessment error:', err);
            setError(err.response?.data?.message || 'Failed to create assessment. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(`/faculty-mycourses/${courseAssignmentId}/grading`);
    };

    // Type display names
    const typeDisplayNames = {
        quiz: 'Quiz',
        assignment: 'Assignment',
        midterm: 'Midterm Exam',
        final: 'Final Exam',
        project: 'Project'
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to={`/faculty-mycourses/${courseAssignmentId}`} className="hover:text-blue-600 transition-colors">
                    {courseCode}
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to={`/faculty-mycourses/${courseAssignmentId}/grading`} className="hover:text-blue-600 transition-colors">
                    Grading
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">New {typeDisplayNames[formData.assessmentType]}</span>
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Create New {typeDisplayNames[formData.assessmentType]}
                </h1>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Main Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Assessment Details</h2>
                        <p className="text-sm text-gray-600">
                            Configure general settings, grading criteria, and visibility options.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <MdHelpOutline className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Assessment Type */}
                    <div>
                        <label htmlFor="assessmentType" className="block text-sm font-semibold text-gray-700 mb-2">
                            Assessment Type
                        </label>
                        <div className="relative">
                            <select
                                id="assessmentType"
                                name="assessmentType"
                                value={formData.assessmentType}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer pr-8"
                            >
                                <option value="quiz">Quiz</option>
                                <option value="assignment">Assignment</option>
                                <option value="midterm">Midterm Exam</option>
                                <option value="final">Final Exam</option>
                                <option value="project">Project</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Selected type determines the available configuration fields.
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Chapter 4 Quiz: Algorithms"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                        />
                    </div>

                    {/* Description / Instructions */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                            Description / Instructions
                        </label>
                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
                            <button
                                type="button"
                                onClick={() => setIsBold(!isBold)}
                                className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${isBold ? 'bg-gray-300' : ''}`}
                                title="Bold"
                            >
                                <MdFormatBold className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsItalic(!isItalic)}
                                className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${isItalic ? 'bg-gray-300' : ''}`}
                                title="Italic"
                            >
                                <MdFormatItalic className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsUnderline(!isUnderline)}
                                className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${isUnderline ? 'bg-gray-300' : ''}`}
                                title="Underline"
                            >
                                <MdFormatUnderlined className="w-4 h-4 text-gray-700" />
                            </button>
                            <div className="w-px h-5 bg-gray-300 mx-1"></div>
                            <button
                                type="button"
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                                title="Insert Link"
                            >
                                <MdLink className="w-4 h-4 text-gray-700" />
                            </button>
                        </div>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Write the instructions here..."
                            rows={6}
                            className="w-full px-4 py-2.5 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="datetime-local"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Release Grades On */}
                    <div>
                        <label htmlFor="releaseGradesOn" className="block text-sm font-semibold text-gray-700 mb-2">
                            Release Grades On
                        </label>
                        <div className="relative">
                            <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="datetime-local"
                                id="releaseGradesOn"
                                name="releaseGradesOn"
                                value={formData.releaseGradesOn}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <MdAccessTime className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            If blank, grades will be released manually.
                        </p>
                    </div>

                    {/* Max Score and Weight Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Max Score */}
                        <div>
                            <label htmlFor="maxScore" className="block text-sm font-semibold text-gray-700 mb-2">
                                Max Score <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="maxScore"
                                name="maxScore"
                                value={formData.maxScore}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                            />
                        </div>

                        {/* Weight (%) */}
                        <div>
                            <label htmlFor="weight" className="block text-sm font-semibold text-gray-700 mb-2">
                                Weight (%)
                            </label>
                            <input
                                type="number"
                                id="weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="e.g. 15"
                                min="0"
                                max="100"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label htmlFor="duration" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            Duration (Minutes)
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                title="Duration information"
                            >
                                <MdInfo className="w-4 h-4" />
                            </button>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g. 60"
                                min="1"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-16"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                min
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-8 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        {saving ? 'Creating...' : 'Create Assessment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAssessment;
