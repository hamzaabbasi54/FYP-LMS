import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdSave, MdArrowDropDown } from 'react-icons/md';

const EditSyllabus = () => {
    const navigate = useNavigate();
    
    const [courseOverview, setCourseOverview] = useState('This course provides an introduction to the fundamental concepts of programming using Python. We will cover control structures, data types, basic algorithms, and problem-solving strategies. Students will learn to design, implement, and debug computer programs.');
    const [learningObjectives, setLearningObjectives] = useState([
        'Understand basic programming syntax and semantics.',
        'Analyze and solve computational problems.',
        'Write clean, efficient, and documented code.',
        'Work with basic data structures like lists and dictionaries.'
    ]);
    const [weeklySchedule, setWeeklySchedule] = useState([
        'Week 1: Introduction to Python & Environment Setup',
        'Week 2: Variables, Data Types, and Operators',
        'Week 3: Control Flow (If/Else, Loops)'
    ]);

    const handleObjectiveChange = (index, value) => {
        const updated = [...learningObjectives];
        updated[index] = value;
        setLearningObjectives(updated);
    };

    const handleScheduleChange = (index, value) => {
        const updated = [...weeklySchedule];
        updated[index] = value;
        setWeeklySchedule(updated);
    };

    const addObjective = () => {
        setLearningObjectives([...learningObjectives, '']);
    };

    const addScheduleItem = () => {
        setWeeklySchedule([...weeklySchedule, '']);
    };

    const handleSave = () => {
        // Handle save logic here
        const syllabusData = {
            courseOverview,
            learningObjectives,
            weeklySchedule
        };
        console.log('Saving syllabus...', syllabusData);
        // Navigate back or show success message
        navigate('/faculty-mycourses');
    };

    const handleCancel = () => {
        navigate('/faculty-mycourses');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                    Edit Syllabus
                </h1>
                <p className="text-slate-500 text-sm sm:text-base">
                    Update the course syllabus, learning objectives, and weekly schedule.
                </p>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-4">
                    {/* Text Format Dropdown */}
                    <div className="relative">
                        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50">
                            Normal Text
                            <MdArrowDropDown className="w-4 h-4 ml-1" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Format Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                            title="Bold"
                        >
                            <MdFormatBold className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                            title="Italic"
                        >
                            <MdFormatItalic className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                            title="Underline"
                        >
                            <MdFormatUnderlined className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* List Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                            title="Bullet List"
                        >
                            <MdFormatListBulleted className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                            title="Numbered List"
                        >
                            <MdFormatListNumbered className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Link Button */}
                    <button
                        className="p-2 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                        title="Insert Link"
                    >
                        <MdLink className="w-5 h-5" />
                    </button>
                </div>

                {/* Editor Content Area */}
                <div className="p-6 min-h-[500px]">
                    <div className="prose max-w-none">
                        <div className="space-y-6 text-slate-800 text-sm sm:text-base leading-relaxed">
                            {/* Course Overview Section */}
                            <div>
                                <h3 className="font-bold text-lg mb-3">Course Overview</h3>
                                <textarea
                                    value={courseOverview}
                                    onChange={(e) => setCourseOverview(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 resize-none"
                                    rows="4"
                                    placeholder="Enter course overview..."
                                />
                            </div>
                            
                            {/* Learning Objectives Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-lg">Learning Objectives</h3>
                                    <button
                                        onClick={addObjective}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        + Add Objective
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {learningObjectives.map((objective, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <span className="text-slate-400 mt-2">•</span>
                                            <input
                                                type="text"
                                                value={objective}
                                                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                                                className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                                                placeholder="Enter learning objective..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Weekly Schedule Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-lg">Weekly Schedule</h3>
                                    <button
                                        onClick={addScheduleItem}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        + Add Week
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {weeklySchedule.map((schedule, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={schedule}
                                            onChange={(e) => handleScheduleChange(index, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                                            placeholder="Enter weekly schedule item..."
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm sm:text-base"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm sm:text-base"
                >
                    <MdSave className="w-5 h-5 mr-2" />
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default EditSyllabus;

