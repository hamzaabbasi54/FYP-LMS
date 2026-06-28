import React, { useState, useEffect } from 'react';
import { PiCaretDown, PiCaretUp, PiChartPieSlice, PiCheckCircle, PiDownloadSimple, PiGraph, PiInfo, PiListChecks, PiStack, PiTarget, PiTrendUp, PiWarningCircle } from 'react-icons/pi';
import { obeApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

const OBEReports = () => {
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [expandedSemester, setExpandedSemester] = useState(null);

    const { data: batches = [], isLoading: loading, isError } = useQuery({
        queryKey: ['obeReports'],
        queryFn: async () => {
            const res = await obeApi.getReports();
            if (res.success) return res.data || [];
            throw new Error('Failed to fetch OBE reports');
        },
        staleTime: 1000 * 60 * 10, // 10 minutes - OBE data changes infrequently but should eventually refresh
    });

    useEffect(() => {
        if (isError) {
            toast.error('Failed to fetch OBE reports');
        }
    }, [isError]);

    const getAchievementColor = (percentage) => {
        if (percentage >= 70) return 'text-emerald-700 bg-emerald-100';
        if (percentage >= 40) return 'text-amber-700 bg-amber-100';
        return 'text-red-700 bg-red-100';
    };

    const getAchievementBadge = (percentage) => {
        if (percentage >= 70) return { icon: PiCheckCircle, color: 'text-emerald-500', label: 'Excellent' };
        if (percentage >= 40) return { icon: PiTrendUp, color: 'text-amber-500', label: 'Average' };
        return { icon: PiWarningCircle, color: 'text-red-500', label: 'Needs Improvement' };
    };

    const toggleBatch = (batchId) => {
        setExpandedBatch(expandedBatch === batchId ? null : batchId);
        setExpandedSemester(null);
    };

    const toggleSemester = (semesterId) => {
        setExpandedSemester(expandedSemester === semesterId ? null : semesterId);
    };

    // FIX Issue #7: Replace alert() stubs with actual download calls
    const handleDownloadPLO = async (e, batchId, batchName) => {
        e.stopPropagation();
        try {
            await obeApi.downloadPLOReport(batchId, batchName);
            toast.success(`PLO Report for ${batchName} downloaded`);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to download PLO report');
        }
    };

    const handleDownloadCLO = async (e, batchId, batchName, semesterId) => {
        e.stopPropagation();
        try {
            await obeApi.downloadCLOReport(batchId, batchName, semesterId);
            toast.success('CLO Report downloaded');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to download CLO report');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-116px)] space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>)}
                    </div>
                    <div className="h-40 bg-gray-200 rounded-3xl mt-6"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="campus-detail-page min-h-[calc(100vh-116px)] space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">OBE Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Outcome-Based Education - PLO & CLO Achievement Tracking</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="campus-stat-grid grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="campus-icon-tile bg-blue-50 text-sky-700 p-2 rounded-lg">
                            <PiStack className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{batches.length}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Batches</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="campus-icon-tile bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                            <PiChartPieSlice className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">
                            {batches.length > 0 ? Math.round(batches.reduce((acc, b) => acc + b.overallAchievement, 0) / batches.length) : 0}%
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Average Achievement</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="campus-icon-tile bg-purple-50 text-purple-500 p-2 rounded-lg">
                            <PiTarget className="w-6 h-6" />
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
                        <div key={batch.id} className="campus-section-card bg-white rounded-3xl border border-slate-200 overflow-hidden mb-3">
                            {/* Batch Header */}
                            <div
                                onClick={() => toggleBatch(batch.id)}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 text-sky-700 p-2 rounded-lg">
                                        <PiGraph className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-semibold text-slate-800">{batch.name}</h3>
                                        {/* FIX Issue #8: Show warning when no PLOs attached */}
                                        <p className="text-xs text-slate-400">
                                            {batch.year} • {batch.totalPLOs > 0 ? `${batch.totalPLOs} PLOs` : <span className="text-amber-500 font-medium">No PLOs attached</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                                            <span className="text-lg font-bold text-slate-800">{batch.overallAchievement}%</span>
                                        </div>
                                        <p className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block mt-1 ${getAchievementColor(batch.overallAchievement)}`}>{badge.label}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDownloadPLO(e, batch.id, batch.name)}
                                        className="p-2 hover:bg-slate-200 rounded-lg text-sky-700 hover:text-blue-700 transition-colors"
                                        title="Download PLO Report"
                                    >
                                        <PiDownloadSimple className="w-5 h-5" />
                                    </button>
                                    {expandedBatch === batch.id ? (
                                        <PiCaretUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <PiCaretDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* PLOs Section */}
                            {expandedBatch === batch.id && (
                                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                                    {/* FIX Issue #1: Display unmapped question warnings */}
                                    {batch.warnings && batch.warnings.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <PiWarningCircle className="w-5 h-5 text-amber-500" />
                                                <span className="text-sm font-semibold text-amber-700">Unmapped Questions Detected</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {batch.warnings.map((warning, idx) => (
                                                    <li key={idx} className="text-xs text-amber-600">{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <h4 className="font-semibold text-gray-700 mb-3">Program Learning Outcomes (PLOs)</h4>

                                    {/* FIX Issue #8: Show notice when no PLOs attached */}
                                    {batch.totalPLOs === 0 && (
                                        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 flex items-center gap-3">
                                            <PiInfo className="w-5 h-5 text-slate-400" />
                                            <p className="text-sm text-slate-500">No PLOs are attached to this batch. Attach PLOs in the Batch Details page to see OBE data.</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {batch.plos.map((plo) => (
                                            <div key={plo.id} className="bg-white rounded-3xl p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-indigo-600">{plo.id}</span>
                                                    {/* FIX Issue #4: Show "Not Yet Assessed" badge for ungraded PLOs */}
                                                    {plo.notAssessed ? (
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                                            Not Yet Assessed
                                                        </span>
                                                    ) : (
                                                        <span className={`text-lg font-bold ${getAchievementColor(plo.achievement).split(' ')[0]}`}>
                                                            {plo.achievement}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 mb-3">{plo.name}</p>
                                                {/* FIX Issue #4: Only show progress bar for assessed PLOs */}
                                                {!plo.notAssessed && (
                                                    <div className="w-full bg-gray-200 rounded-md h-2">
                                                        <div
                                                            className={`h-2 rounded-md ${plo.achievement >= 85 ? 'bg-green-500' :
                                                                plo.achievement >= 70 ? 'bg-blue-500' :
                                                                    plo.achievement >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${plo.achievement}%` }}
                                                        />
                                                    </div>
                                                )}
                                                {plo.notAssessed && (
                                                    <div className="w-full bg-gray-100 rounded-md h-2">
                                                        <div className="h-2 rounded-md bg-gray-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.3)_4px,rgba(148,163,184,0.3)_8px)]" style={{ width: '100%' }} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Semesters Section */}
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-700 mb-3">Semester-wise CLO Achievement</h4>
                                        <div className="space-y-3">
                                            {batch.semesters.map((semester) => (
                                                <div key={semester.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
                                                    <div
                                                        onClick={() => toggleSemester(semester.id)}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg border border-sky-100 bg-sky-50 flex items-center justify-center">
                                                                <PiListChecks className="w-5 h-5 text-sky-700" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-semibold text-gray-800">{semester.name}</p>
                                                                <p className="text-xs text-gray-400">{semester.courses?.length || 0} Courses</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => handleDownloadCLO(e, batch.id, batch.name, semester.id)}
                                                                className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-700 hover:text-sky-800 transition-colors"
                                                                title="Download CLO Report"
                                                            >
                                                                <PiDownloadSimple className="w-5 h-5" />
                                                            </button>
                                                            <span className="text-lg font-bold text-gray-800">{semester.achievement}%</span>
                                                            {expandedSemester === semester.id ? (
                                                                <PiCaretUp className="w-5 h-5 text-gray-400" />
                                                            ) : (
                                                                <PiCaretDown className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Courses & CLOs */}
                                                    {expandedSemester === semester.id && (
                                                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                                                            {semester.courses.map((course) => (
                                                                <div key={course.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
                                                                    <div className="w-full p-3 bg-gray-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-bold text-gray-800">{course.code}</span>
                                                                            <span className="text-sm text-gray-600">- {course.title}</span>
                                                                        </div>
                                                                        <span className={`text-sm font-bold px-2 py-1 rounded-md ${getAchievementColor(course.achievement)}`}>
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
                                                                                            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md font-medium">
                                                                                                Maps to {clo.plo}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-700">{clo.name}</p>
                                                                                    </div>
                                                                                    <span className={`text-base font-bold ml-3 ${getAchievementColor(clo.achievement).split(' ')[0]}`}>
                                                                                        {clo.achievement}%
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-full bg-gray-200 rounded-md h-1.5">
                                                                                    <div
                                                                                        className={`h-1.5 rounded-md ${clo.achievement >= 85 ? 'bg-green-500' :
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
