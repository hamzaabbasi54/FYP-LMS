import React, { useState } from 'react';
import { MdExpandMore, MdExpandLess, MdTrendingUp, MdCheckCircle, MdWarning, MdSchool, MdBook, MdCloudDownload } from 'react-icons/md';
import { obeApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

const OBEReports = () => {
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [expandedSemester, setExpandedSemester] = useState(null);

    const { data: batches = [], isLoading: loading } = useQuery({
        queryKey: ['obeReports'],
        queryFn: async () => {
            const res = await obeApi.getReports();
            if (res.success) return res.data || [];
            throw new Error('Failed to fetch OBE reports');
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes (this is an expensive query)
        onError: () => toast.error('Failed to fetch OBE reports')
    });

    const getAchievementColor = (percentage) => {
        if (percentage >= 70) return 'text-emerald-700 bg-emerald-100';
        if (percentage >= 40) return 'text-amber-700 bg-amber-100';
        return 'text-red-700 bg-red-100';
    };

    const getAchievementBadge = (percentage) => {
        if (percentage >= 70) return { icon: MdCheckCircle, color: 'text-emerald-500', label: 'Excellent' };
        if (percentage >= 40) return { icon: MdTrendingUp, color: 'text-amber-500', label: 'Average' };
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

    if (loading) {
        return (
            <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                    <div className="h-40 bg-gray-200 rounded-2xl mt-6"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">OBE Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Outcome-Based Education - PLO & CLO Achievement Tracking</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                            <MdSchool className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{batches.length}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Batches</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                            <MdTrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">
                            {batches.length > 0 ? Math.round(batches.reduce((acc, b) => acc + b.overallAchievement, 0) / batches.length) : 0}%
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Average Achievement</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-purple-50 text-purple-500 p-2 rounded-lg">
                            <MdBook className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{batches.reduce((acc, b) => acc + (b.totalPLOs || 0), 0)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total PLOs</p>
                </div>
            </div>

            {/* Batches List */}
            <div className="space-y-4">
                {batches.map((batch) => {
                    const badge = getAchievementBadge(batch.overallAchievement);
                    const BadgeIcon = badge.icon;

                    return (
                        <div key={batch.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-3">
                            {/* Batch Header */}
                            <div
                                onClick={() => toggleBatch(batch.id)}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                        <MdSchool className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-semibold text-slate-800">{batch.name}</h3>
                                        <p className="text-xs text-slate-400">{batch.year} • {batch.totalPLOs} PLOs</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                                            <span className="text-lg font-bold text-slate-800">{batch.overallAchievement}%</span>
                                        </div>
                                        <p className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${getAchievementColor(batch.overallAchievement)}`}>{badge.label}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDownloadPLO(e, batch.name)}
                                        className="p-2 hover:bg-slate-200 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"
                                        title="Download PLO Report"
                                    >
                                        <MdCloudDownload className="w-5 h-5" />
                                    </button>
                                    {expandedBatch === batch.id ? (
                                        <MdExpandLess className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <MdExpandMore className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                            </div>

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
                                                    <div
                                                        onClick={() => toggleSemester(semester.id)}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                                                <MdBook className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-semibold text-gray-800">{semester.name}</p>
                                                                <p className="text-xs text-gray-400">{semester.courses?.length || 0} Courses</p>
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
                                                    </div>

                                                    {/* Courses & CLOs */}
                                                    {expandedSemester === semester.id && (
                                                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                                                            {semester.courses.map((course) => (
                                                                <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                                    <div className="w-full p-3 bg-gray-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-bold text-gray-800">{course.code}</span>
                                                                            <span className="text-sm text-gray-600">- {course.title}</span>
                                                                        </div>
                                                                        <span className={`text-sm font-bold px-2 py-1 rounded ${getAchievementColor(course.achievement)}`}>
                                                                            Course Avg: {course.achievement}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="p-3 space-y-2">
                                                                        {course.clos.map((clo) => (
                                                                            <div key={clo.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                                                <div className="flex items-start justify-between mb-2">
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <span className="text-xs font-bold text-emerald-600">{clo.id}</span>
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
