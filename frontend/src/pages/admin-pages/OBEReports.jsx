import React, { useState } from 'react';
import { MdExpandMore, MdExpandLess, MdTrendingUp, MdCheckCircle, MdWarning, MdSchool, MdBook, MdCloudDownload } from 'react-icons/md';

const OBEReports = () => {
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [expandedSemester, setExpandedSemester] = useState(null);

    // Mock data for batches with PLO achievements
    const batches = [
        {
            id: 1,
            name: 'Batch 2023-2027',
            year: 'Year 1',
            totalPLOs: 12,
            overallAchievement: 78,
            plos: [
                { id: 'PLO-1', name: 'Engineering Knowledge', achievement: 85, status: 'good' },
                { id: 'PLO-2', name: 'Problem Analysis', achievement: 72, status: 'average' },
                { id: 'PLO-3', name: 'Design/Development', achievement: 68, status: 'average' },
                { id: 'PLO-4', name: 'Investigation', achievement: 90, status: 'good' },
                { id: 'PLO-5', name: 'Modern Tool Usage', achievement: 75, status: 'good' },
                { id: 'PLO-6', name: 'Engineering & Society', achievement: 82, status: 'good' },
            ],
            semesters: [
                {
                    id: 1,
                    name: 'Fall 2023',
                    achievement: 76,
                    clos: [
                        { id: 'CLO-1', course: 'CS-101', name: 'Understand programming fundamentals', achievement: 88, plo: 'PLO-1' },
                        { id: 'CLO-2', course: 'CS-101', name: 'Apply problem-solving techniques', achievement: 75, plo: 'PLO-2' },
                        { id: 'CLO-3', course: 'MA-102', name: 'Apply discrete mathematics', achievement: 70, plo: 'PLO-1' },
                        { id: 'CLO-4', course: 'MA-102', name: 'Solve logical problems', achievement: 65, plo: 'PLO-2' },
                    ]
                },
                {
                    id: 2,
                    name: 'Spring 2024',
                    achievement: 80,
                    clos: [
                        { id: 'CLO-5', course: 'CS-102', name: 'Design data structures', achievement: 82, plo: 'PLO-3' },
                        { id: 'CLO-6', course: 'CS-102', name: 'Implement algorithms', achievement: 78, plo: 'PLO-4' },
                        { id: 'CLO-7', course: 'CS-103', name: 'Use modern IDEs', achievement: 85, plo: 'PLO-5' },
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Batch 2022-2026',
            year: 'Year 2',
            totalPLOs: 12,
            overallAchievement: 82,
            plos: [
                { id: 'PLO-1', name: 'Engineering Knowledge', achievement: 88, status: 'good' },
                { id: 'PLO-2', name: 'Problem Analysis', achievement: 80, status: 'good' },
                { id: 'PLO-3', name: 'Design/Development', achievement: 75, status: 'good' },
                { id: 'PLO-4', name: 'Investigation', achievement: 85, status: 'good' },
                { id: 'PLO-5', name: 'Modern Tool Usage', achievement: 82, status: 'good' },
                { id: 'PLO-6', name: 'Engineering & Society', achievement: 78, status: 'good' },
            ],
            semesters: [
                {
                    id: 3,
                    name: 'Fall 2024',
                    achievement: 84,
                    clos: [
                        { id: 'CLO-8', course: 'CS-201', name: 'Advanced data structures', achievement: 90, plo: 'PLO-1' },
                        { id: 'CLO-9', course: 'CS-201', name: 'Algorithm optimization', achievement: 82, plo: 'PLO-2' },
                        { id: 'CLO-10', course: 'CS-204', name: 'Computer architecture concepts', achievement: 80, plo: 'PLO-1' },
                    ]
                },
                {
                    id: 4,
                    name: 'Spring 2025',
                    achievement: 80,
                    clos: [
                        { id: 'CLO-11', course: 'CS-202', name: 'Database design', achievement: 85, plo: 'PLO-3' },
                        { id: 'CLO-12', course: 'CS-202', name: 'SQL query optimization', achievement: 75, plo: 'PLO-4' },
                    ]
                }
            ]
        },
        {
            id: 3,
            name: 'Batch 2021-2025',
            year: 'Year 3',
            totalPLOs: 12,
            overallAchievement: 85,
            plos: [
                { id: 'PLO-1', name: 'Engineering Knowledge', achievement: 92, status: 'excellent' },
                { id: 'PLO-2', name: 'Problem Analysis', achievement: 85, status: 'good' },
                { id: 'PLO-3', name: 'Design/Development', achievement: 88, status: 'good' },
                { id: 'PLO-4', name: 'Investigation', achievement: 82, status: 'good' },
                { id: 'PLO-5', name: 'Modern Tool Usage', achievement: 90, status: 'excellent' },
                { id: 'PLO-6', name: 'Engineering & Society', achievement: 75, status: 'good' },
            ],
            semesters: [
                {
                    id: 5,
                    name: 'Fall 2024',
                    achievement: 87,
                    clos: [
                        { id: 'CLO-13', course: 'CS-302', name: 'Operating system concepts', achievement: 90, plo: 'PLO-1' },
                        { id: 'CLO-14', course: 'CS-302', name: 'Process management', achievement: 85, plo: 'PLO-2' },
                        { id: 'CLO-15', course: 'CS-303', name: 'Software engineering practices', achievement: 88, plo: 'PLO-3' },
                    ]
                }
            ]
        }
    ];

    const getAchievementColor = (percentage) => {
        if (percentage >= 85) return 'text-green-600 bg-green-50';
        if (percentage >= 70) return 'text-blue-600 bg-blue-50';
        if (percentage >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const getAchievementBadge = (percentage) => {
        if (percentage >= 85) return { icon: MdCheckCircle, color: 'text-green-500', label: 'Excellent' };
        if (percentage >= 70) return { icon: MdTrendingUp, color: 'text-blue-500', label: 'Good' };
        if (percentage >= 60) return { icon: MdWarning, color: 'text-amber-500', label: 'Average' };
        return { icon: MdWarning, color: 'text-red-500', label: 'Needs Improvement' };
    };

    const toggleBatch = (batchId) => {
        setExpandedBatch(expandedBatch === batchId ? null : batchId);
        setExpandedSemester(null);
    };

    const toggleSemester = (semesterId) => {
        setExpandedSemester(expandedSemester === semesterId ? null : semesterId);
    };

    const handleDownloadPLO = (e, batchName) => {
        e.stopPropagation();
        // Simulate download
        alert(`Downloading PLO Report for ${batchName}...`);
    };

    const handleDownloadCLO = (e, semesterName, batchName) => {
        e.stopPropagation();
        // Simulate download
        alert(`Downloading CLO Report for ${batchName} - ${semesterName}...`);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">OBE Reports</h1>
                    <p className="text-gray-500 text-sm mt-1">Outcome-Based Education - PLO & CLO Achievement Tracking</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <MdSchool className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{batches.length}</span>
                    </div>
                    <p className="text-sm opacity-90">Active Batches</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <MdTrendingUp className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">
                            {Math.round(batches.reduce((acc, b) => acc + b.overallAchievement, 0) / batches.length)}%
                        </span>
                    </div>
                    <p className="text-sm opacity-90">Average Achievement</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <MdBook className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">12</span>
                    </div>
                    <p className="text-sm opacity-90">Total PLOs</p>
                </div>
            </div>

            {/* Batches List */}
            <div className="space-y-4">
                {batches.map((batch) => {
                    const badge = getAchievementBadge(batch.overallAchievement);
                    const BadgeIcon = badge.icon;

                    return (
                        <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Batch Header */}
                            <button
                                onClick={() => toggleBatch(batch.id)}
                                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                        <MdSchool className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-800">{batch.name}</h3>
                                        <p className="text-sm text-gray-500">{batch.year} • {batch.totalPLOs} PLOs</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <BadgeIcon className={`w-5 h-5 ${badge.color}`} />
                                            <span className="text-2xl font-bold text-gray-800">{batch.overallAchievement}%</span>
                                        </div>
                                        <p className="text-xs text-gray-400">{badge.label}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDownloadPLO(e, batch.name)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-indigo-500 hover:text-indigo-700 transition-colors"
                                        title="Download PLO Report"
                                    >
                                        <MdCloudDownload className="w-6 h-6" />
                                    </button>
                                    {expandedBatch === batch.id ? (
                                        <MdExpandLess className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <MdExpandMore className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* PLOs Section */}
                            {expandedBatch === batch.id && (
                                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                                    <h4 className="font-semibold text-gray-700 mb-3">Program Learning Outcomes (PLOs)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {batch.plos.map((plo) => (
                                            <div key={plo.id} className="bg-white rounded-xl p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-indigo-600">{plo.id}</span>
                                                    <span className={`text-lg font-bold ${getAchievementColor(plo.achievement).split(' ')[0]}`}>
                                                        {plo.achievement}%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-3">{plo.name}</p>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${plo.achievement >= 85 ? 'bg-green-500' :
                                                            plo.achievement >= 70 ? 'bg-blue-500' :
                                                                plo.achievement >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${plo.achievement}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Semesters Section */}
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-700 mb-3">Semester-wise CLO Achievement</h4>
                                        <div className="space-y-3">
                                            {batch.semesters.map((semester) => (
                                                <div key={semester.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSemester(semester.id)}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                                                <MdBook className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-semibold text-gray-800">{semester.name}</p>
                                                                <p className="text-xs text-gray-400">{semester.clos.length} CLOs</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => handleDownloadCLO(e, semester.name, batch.name)}
                                                                className="p-1.5 hover:bg-gray-200 rounded-full text-emerald-600 hover:text-emerald-700 transition-colors"
                                                                title="Download CLO Report"
                                                            >
                                                                <MdCloudDownload className="w-5 h-5" />
                                                            </button>
                                                            <span className="text-lg font-bold text-gray-800">{semester.achievement}%</span>
                                                            {expandedSemester === semester.id ? (
                                                                <MdExpandLess className="w-5 h-5 text-gray-400" />
                                                            ) : (
                                                                <MdExpandMore className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* CLOs */}
                                                    {expandedSemester === semester.id && (
                                                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
                                                            {semester.clos.map((clo) => (
                                                                <div key={clo.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-xs font-bold text-emerald-600">{clo.id}</span>
                                                                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                                                                    {clo.course}
                                                                                </span>
                                                                                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                                                                                    Maps to {clo.plo}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-gray-700">{clo.name}</p>
                                                                        </div>
                                                                        <span className={`text-base font-bold ml-3 ${getAchievementColor(clo.achievement).split(' ')[0]}`}>
                                                                            {clo.achievement}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className={`h-1.5 rounded-full ${clo.achievement >= 85 ? 'bg-green-500' :
                                                                                clo.achievement >= 70 ? 'bg-blue-500' :
                                                                                    clo.achievement >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                                                }`}
                                                                            style={{ width: `${clo.achievement}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OBEReports;
