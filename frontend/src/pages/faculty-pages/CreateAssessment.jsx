import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdChevronRight, MdCalendarToday, MdAccessTime, MdInfo, MdHelpOutline, MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdLink } from 'react-icons/md';

const CreateAssessment = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();
    const [courseInfo, setCourseInfo] = useState({ code: 'Loading...' });
    
    // Form state
    const [formData, setFormData] = useState({
        assessmentType: 'Quiz',
        title: '',
        description: '',
        dueDate: '',
        releaseGradesOn: '',
        maxScore: '100',
        weight: '',
        duration: ''
    });

    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { courseApi } = await import('../../services/api');
                const res = await courseApi.getAssignmentDetails(assignmentId);
                if (res.success) {
                    setCourseInfo({ code: res.data.code });
                }
            } catch (err) {
                console.error("Error fetching course data:", err);
            }
        };
        if (assignmentId) fetchCourse();
    }, [assignmentId]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { assessmentApi } = await import('../../services/api');
            const payload = {
                course_assignment_id: parseInt(assignmentId),
                type: formData.assessmentType,
                title: formData.title,
                description: formData.description,
                due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                release_grades_on: formData.releaseGradesOn ? new Date(formData.releaseGradesOn).toISOString() : null,
                max_score: parseFloat(formData.maxScore),
                weight: formData.weight ? parseFloat(formData.weight) : null,
                duration_minutes: formData.duration ? parseInt(formData.duration) : null,
                status: 'scheduled'
            };

            const response = await assessmentApi.create(payload);
            if (response.success) {
                alert('Assessment created successfully!');
                navigate(`/faculty-mycourses/${assignmentId}/grading`);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            alert('Failed to create assessment');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(`/faculty-mycourses/${assignmentId}/grading`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to="/faculty-mycourses" className="hover:text-blue-600 transition-colors">
                    Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to={`/faculty-mycourses/${assignmentId}/grading`} className="hover:text-blue-600 transition-colors">
                    {courseInfo.code}
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link to={`/faculty-mycourses/${assignmentId}/grading`} className="hover:text-blue-600 transition-colors">
                    Grading
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-700 font-medium">New Assessment</span>
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Create New Assessment
                </h1>
            </div>

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
                                <option value="Quiz">Quiz</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Midterm Exam">Midterm Exam</option>
                                <option value="Final Exam">Final Exam</option>
                                <option value="Project">Project</option>
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
                        className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-sm transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                    >
                        Create Assessment
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAssessment;

