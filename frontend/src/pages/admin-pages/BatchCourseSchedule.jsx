import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdMenuBook, MdPerson, MdSchool, MdSave, MdSchedule, MdWbSunny, MdNightsStay, MdAccessTime, MdCheckCircle } from 'react-icons/md';
import { batchApi, approvalApi, getFileUrl } from '../../services/api';
import { toast } from 'react-toastify';

const DAYS = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_ENTRY = { start_time: '09:00', end_time: '10:30', shift: 'morning' };

const BatchCourseSchedule = () => {
    const { batchId, courseId } = useParams();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // schedule state: { monday: { active, start_time, end_time, shift }, ... }
    const [schedule, setSchedule] = useState(() => {
        const init = {};
        DAYS.forEach(d => { init[d.key] = { active: false, ...DEFAULT_ENTRY }; });
        return init;
    });

    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [assigningFaculty, setAssigningFaculty] = useState(false);

    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // CLO-PLO Mapping State
    const [batchPlos, setBatchPlos] = useState([]);
    const [cloMappings, setCloMappings] = useState({}); // { cloId: [ploId1, ploId2] }
    const [savingMappings, setSavingMappings] = useState(false);

    useEffect(() => {
        fetchData();
        fetchFaculty();
        fetchBatchPlos();
    }, [batchId, courseId]);

    const fetchFaculty = async () => {
        try {
            const res = await approvalApi.getUsersByRole('faculty');
            if (res.success) {
                setFacultyList(res.data || []);
            }
        } catch(e) {
            console.error(e);
        }
    };

    const fetchBatchPlos = async () => {
        try {
            const plosRes = await batchApi.getPLOs(batchId);
            if (plosRes.success) {
                setBatchPlos(plosRes.data || []);
            }
        } catch(e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [detailsRes, scheduleRes] = await Promise.all([
                batchApi.getCourseDetailsForBatch(batchId, courseId),
                batchApi.getCourseSchedule(batchId, courseId),
            ]);

            if (detailsRes.success) {
                setCourseData(detailsRes.data);
                
                // Initialize cloMappings from fetched data
                if (detailsRes.data.clos) {
                    const initialMappings = {};
                    detailsRes.data.clos.forEach(clo => {
                        if (clo.mapped_plo_ids) {
                            initialMappings[clo.id] = clo.mapped_plo_ids.split(',').map(Number);
                        } else {
                            initialMappings[clo.id] = [];
                        }
                    });
                    setCloMappings(initialMappings);
                }

                if (detailsRes.data.assignment) {
                    setSelectedFaculty(detailsRes.data.assignment.faculty_id || '');
                }
            }

            if (scheduleRes.success && scheduleRes.data) {
                const newSchedule = {};
                DAYS.forEach(d => { newSchedule[d.key] = { active: false, ...DEFAULT_ENTRY }; });
                scheduleRes.data.forEach(entry => {
                    if (newSchedule[entry.day_of_week] !== undefined) {
                        newSchedule[entry.day_of_week] = {
                            active: true,
                            start_time: entry.start_time?.substring(0, 5) || '09:00',
                            end_time: entry.end_time?.substring(0, 5) || '10:30',
                            shift: entry.shift || 'morning',
                        };
                    }
                });
                setSchedule(newSchedule);
            }
        } catch (e) {
            toast.error('Failed to load course details');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignFaculty = async () => {
        if (!selectedFaculty) {
            toast.error('Please select a faculty member');
            return;
        }
        if (!courseData?.semester_number) {
            toast.error('Semester information not found for this course');
            return;
        }

        try {
            setAssigningFaculty(true);
            const res = await batchApi.assignFaculty(batchId, courseData.semester_number, courseId, selectedFaculty);
            if (res.success) {
                toast.success('Faculty assigned successfully');
                fetchData(); // Refresh details
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to assign faculty');
        } finally {
            setAssigningFaculty(false);
        }
    };

    const activeDayCount = Object.values(schedule).filter(d => d.active).length;

    const toggleDay = (dayKey) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], active: !prev[dayKey].active }
        }));
    };

    const updateDay = (dayKey, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value }
        }));
    };

    const handleSave = async () => {
        if (!courseData?.semester_number) {
            toast.error('Semester information not found');
            return;
        }

        try {
            setSaving(true);
            const activeEntries = Object.entries(schedule)
                .filter(([_, data]) => data.active)
                .map(([day, data]) => ({
                    day_of_week: day,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    shift: data.shift
                }));

            const res = await batchApi.saveCourseSchedule(batchId, courseId, { schedule: activeEntries });
            if (res.success) {
                toast.success('Schedule saved successfully');
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMappings = async () => {
        try {
            setSavingMappings(true);
            const mappings = [];
            Object.keys(cloMappings).forEach(cloId => {
                cloMappings[cloId].forEach(ploId => {
                    mappings.push({ clo_id: parseInt(cloId), plo_id: ploId });
                });
            });
            const res = await batchApi.saveCLOPLOMappings(batchId, courseId, mappings);
            if (res.success) {
                toast.success('Mappings saved successfully');
                fetchData();
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to save mappings');
        } finally {
            setSavingMappings(false);
        }
    };

    const handleUploadFile = async () => {
        if (!uploadFile) return;
        if (!courseData?.semester_number) {
            toast.error('Semester information not found for this course');
            return;
        }

        try {
            setUploading(true);
            const res = await batchApi.uploadCourseFile(batchId, courseData.semester_number, courseId, uploadFile);
            if (res.success) {
                toast.success('File uploaded successfully');
                setUploadFile(null);
                fetchData(); // Refresh to get files
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-5xl mx-auto animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-48 mb-8"></div>
                <div className="h-48 bg-slate-200 rounded-2xl mb-8"></div>
                <div className="grid grid-cols-7 gap-3">
                    {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to={`/admin-managebatches/${batchId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
                        <MdArrowBack className="w-4 h-4" /> Back to Batch
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Course Schedule
                        </h1>
                    </div>
                    <p className="ml-5 text-sm text-slate-500">
                        Set the weekly class schedule for this course
                    </p>
                </div>

                {/* Course Info Card */}
                {courseData && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
                        <div className="flex flex-wrap items-start gap-6">
                            {/* Course icon + info */}
                            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                                    <MdMenuBook className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">{courseData.code}</span>
                                        <h2 className="text-xl font-bold text-slate-800">{courseData.title}</h2>
                                    </div>
                                    <p className="text-sm text-slate-500">{courseData.credit_hours} Credit Hours • {courseData.department_name}</p>
                                </div>
                            </div>
                            {/* Meta pills */}
                            <div className="flex flex-wrap gap-3">
                                {courseData.batch && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <MdSchool className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Batch</p>
                                            <p className="text-sm font-medium text-slate-700">{courseData.batch.batch_name}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <MdSchedule className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Days Active</p>
                                        <p className="text-sm font-medium text-slate-700">{activeDayCount} / 7</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Faculty Assignment & Course Content Divider */}
                        <div className="my-6 border-t border-slate-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Faculty Assignment */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdPerson className="w-4 h-4 text-slate-400" /> Assign Faculty
                                </h3>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Select Faculty</label>
                                        <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white">
                                            <option value="">-- Choose Faculty --</option>
                                            {facultyList.map(f => (
                                                <option key={f.id} value={f.id}>{f.full_name || f.fullName} ({f.department || 'No Dept'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={handleAssignFaculty} disabled={assigningFaculty} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50">
                                        {assigningFaculty ? 'Saving...' : 'Assign'}
                                    </button>
                                </div>
                                {courseData.assignment && (
                                    <p className="mt-3 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                        Currently Assigned: <span className="font-bold">{courseData.assignment.faculty_name}</span>
                                    </p>
                                )}
                            </div>

                            {/* Course Content / Files */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdMenuBook className="w-4 h-4 text-slate-400" /> Course Content
                                </h3>
                                <div className="flex items-end gap-3 mb-3">
                                    <div className="flex-1">
                                        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Upload File (PDF/Word)</label>
                                        <input type="file" onChange={(e) => setUploadFile(e.target.files[0])}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 cursor-pointer" />
                                    </div>
                                    <button onClick={handleUploadFile} disabled={uploading || !uploadFile} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50">
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                                
                                {courseData.files && courseData.files.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {courseData.files.map(f => (
                                            <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                                                <span className="text-slate-700 truncate mr-3 flex-1">{f.file_name}</span>
                                                <a href={getFileUrl(f.file_path)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex-shrink-0 text-xs font-medium">View</a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No files uploaded yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Course CLOs Divider */}
                        <div className="my-6 border-t border-slate-100"></div>

                        {/* Course CLOs Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MdCheckCircle className="w-4 h-4 text-emerald-500" /> Course Learning Outcomes (CLOs)
                            </h3>
                            
                            {courseData.clos && courseData.clos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {courseData.clos.map(clo => (
                                        <div key={clo.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-slate-800 text-sm">{clo.title}</h4>
                                                {clo.mapped_plo_ids ? (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold tracking-wide">
                                                        MAPPED
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold tracking-wide">
                                                        UNMAPPED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{clo.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
                                    <MdCheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 font-medium">No CLOs attached to this course.</p>
                                    <p className="text-xs text-slate-400 mt-1">CLOs are managed in the curriculum blueprint.</p>
                                </div>
                            )}
                        </div>

                        {/* CLO-PLO Mapping */}
                        {courseData.clos && courseData.clos.length > 0 && (
                            <>
                                <div className="my-6 border-t border-slate-100"></div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <MdSchool className="w-4 h-4 text-slate-400" /> Map CLOs to Batch PLOs
                                        </h3>
                                        <button onClick={handleSaveMappings} disabled={savingMappings} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50">
                                            {savingMappings ? 'Saving...' : 'Save Mappings'}
                                        </button>
                                    </div>
                                    {batchPlos.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">No PLOs have been attached to this batch. Please manage PLOs in the Batch Details page first.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {courseData.clos.map(clo => (
                                                <div key={clo.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800 text-sm">CLO {clo.clo_number}: {clo.title}</h4>
                                                            <p className="text-sm text-slate-600 mt-1">{clo.description}</p>
                                                        </div>
                                                        <div className="w-full md:w-64 flex-shrink-0">
                                                            <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Map to PLOs:</label>
                                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                                {batchPlos.map(plo => {
                                                                    const isMapped = (cloMappings[clo.id] || []).includes(plo.id);
                                                                    return (
                                                                        <label key={plo.id} className="flex items-start gap-2 cursor-pointer group">
                                                                            <input type="checkbox" checked={isMapped}
                                                                                onChange={(e) => {
                                                                                    const checked = e.target.checked;
                                                                                    setCloMappings(prev => {
                                                                                        const current = prev[clo.id] || [];
                                                                                        if (checked) return { ...prev, [clo.id]: [...current, plo.id] };
                                                                                        return { ...prev, [clo.id]: current.filter(id => id !== plo.id) };
                                                                                    });
                                                                                }}
                                                                                className="mt-0.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" 
                                                                            />
                                                                            <span className="text-sm text-slate-700 group-hover:text-slate-900">PLO {plo.plo_number}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Weekly Schedule Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Weekly Schedule</h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{activeDayCount} day(s) selected</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MdSave className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>

                    {/* Day cards */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {DAYS.map((day) => {
                                const entry = schedule[day.key];
                                const isActive = entry.active;

                                return (
                                    <div
                                        key={day.key}
                                        className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                                            isActive
                                                ? 'border-indigo-300 bg-indigo-50/40 shadow-md'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Day toggle header */}
                                        <button
                                            onClick={() => toggleDay(day.key)}
                                            className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="font-bold text-sm">{day.label}</span>
                                            {isActive ? (
                                                <MdCheckCircle className="w-5 h-5" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                                            )}
                                        </button>

                                        {/* Expanded inputs */}
                                        {isActive && (
                                            <div className="p-4 space-y-3">
                                                {/* Start Time */}
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                                        Start Time
                                                    </label>
                                                    <div className="relative">
                                                        <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="time"
                                                            value={entry.start_time}
                                                            onChange={(e) => updateDay(day.key, 'start_time', e.target.value)}
                                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* End Time */}
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                                        End Time
                                                    </label>
                                                    <div className="relative">
                                                        <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="time"
                                                            value={entry.end_time}
                                                            onChange={(e) => updateDay(day.key, 'end_time', e.target.value)}
                                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Shift Toggle */}
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                                        Shift
                                                    </label>
                                                    <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                                                        <button
                                                            onClick={() => updateDay(day.key, 'shift', 'morning')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                                                                entry.shift === 'morning'
                                                                    ? 'bg-amber-400 text-white shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                        >
                                                            <MdWbSunny className="w-3.5 h-3.5" />
                                                            Morning
                                                        </button>
                                                        <button
                                                            onClick={() => updateDay(day.key, 'shift', 'evening')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                                                                entry.shift === 'evening'
                                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                        >
                                                            <MdNightsStay className="w-3.5 h-3.5" />
                                                            Evening
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        {activeDayCount > 0 && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Schedule Summary</h4>
                                <div className="space-y-2">
                                    {DAYS.filter(d => schedule[d.key].active).map(d => {
                                        const entry = schedule[d.key];
                                        return (
                                            <div key={d.key} className="flex items-center gap-3 text-sm">
                                                <span className="font-semibold text-slate-700 w-24">{d.label}</span>
                                                <span className="text-slate-500">
                                                    {entry.start_time} — {entry.end_time}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    entry.shift === 'morning'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                    {entry.shift === 'morning' ? <MdWbSunny className="w-3 h-3" /> : <MdNightsStay className="w-3 h-3" />}
                                                    {entry.shift === 'morning' ? 'Morning' : 'Evening'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeDayCount === 0 && (
                            <div className="mt-6 text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <MdSchedule className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Click on a day above to set its class time</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchCourseSchedule;
