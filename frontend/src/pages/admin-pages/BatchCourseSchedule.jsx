import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdMenuBook, MdPerson, MdSchool, MdSave, MdSchedule, MdWbSunny, MdNightsStay, MdAccessTime, MdCheckCircle, MdAdd, MdEdit, MdDelete, MdClose, MdExpandMore } from 'react-icons/md';
import { batchApi, approvalApi, courseApi, getFileUrl } from '../../services/api';
import { toast } from 'react-toastify';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useDraftStore from '../../stores/useDraftStore';
import UnsavedBanner from '../../components/common/UnsavedBanner';

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
    const queryClient = useQueryClient();
    const [courseData, setCourseData] = useState(null);
    const [saving, setSaving] = useState(false);

    // Draft store integration
    const { saveDraft, getDraft, hasDraft, clearDraft } = useDraftStore();
    const scheduleDraftKey = `schedule:${batchId}:${courseId}`;
    const mappingsDraftKey = `mappings:${batchId}:${courseId}`;

    // Track server state for dirty-checking
    const serverScheduleRef = useRef(null);
    const serverMappingsRef = useRef(null);
    const isRestoringDraft = useRef(false); // prevent draft-save during restore

    // schedule state: { monday: { active, start_time, end_time, shift }, ... }
    const [schedule, setSchedule] = useState(() => {
        const init = {};
        DAYS.forEach(d => { init[d.key] = { active: false, ...DEFAULT_ENTRY }; });
        return init;
    });

    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // CLO-PLO Mapping State
    const [cloMappings, setCloMappings] = useState({}); // { cloId: [ploId1, ploId2] }
    const [savingMappings, setSavingMappings] = useState(false);

    // CLO CRUD Modal State
    const [isCloModalOpen, setIsCloModalOpen] = useState(false);
    const [editingClo, setEditingClo] = useState(null);
    const [cloForm, setCloForm] = useState({ title: '', description: '', cognitive_level: 'C1' });
    const [savingClo, setSavingClo] = useState(false);
    
    const [cloModalTab, setCloModalTab] = useState('select'); // 'select' or 'create'
    const [selectedGlobalClos, setSelectedGlobalClos] = useState([]);
    const [openPloDropdowns, setOpenPloDropdowns] = useState({}); // Track which PLO dropdowns are open

    const { data: globalClos = [] } = useQuery({
        queryKey: ['globalClos'],
        queryFn: async () => {
            const res = await courseApi.getAllClos();
            return res.success ? (res.data || []) : [];
        },
        staleTime: Infinity
    });

    const { data: facultyList = [] } = useQuery({
        queryKey: ['facultyList'],
        queryFn: async () => {
            const res = await approvalApi.getUsersByRole('faculty');
            return res.success ? (res.data || []) : [];
        }
    });

    const { data: batchPlos = [] } = useQuery({
        queryKey: ['batchPlos', batchId],
        queryFn: async () => {
            const res = await batchApi.getPLOs(batchId);
            return res.success ? (res.data || []) : [];
        },
        staleTime: Infinity
    });

    const { data: courseDataDetails, isLoading: loading } = useQuery({
        queryKey: ['batchCourseDetails', batchId, courseId],
        queryFn: async () => {
            const [detailsRes, scheduleRes] = await Promise.all([
                batchApi.getCourseDetailsForBatch(batchId, courseId),
                batchApi.getCourseSchedule(batchId, courseId),
            ]);
            
            let details = null;
            let scheduleData = null;
            if (detailsRes.success) details = detailsRes.data;
            if (scheduleRes.success) scheduleData = scheduleRes.data;
            
            return { details, scheduleData };
        },
        staleTime: Infinity
    });

    useEffect(() => {
        if (courseDataDetails) {
            isRestoringDraft.current = true;
            setCourseData(courseDataDetails.details);
            
            // Build server mappings
            let serverMappings = {};
            if (courseDataDetails.details?.clos) {
                courseDataDetails.details.clos.forEach(clo => {
                    if (clo.mapped_plo_ids) {
                        serverMappings[clo.id] = clo.mapped_plo_ids.split(',').map(Number);
                    } else {
                        serverMappings[clo.id] = [];
                    }
                });
            }
            serverMappingsRef.current = JSON.parse(JSON.stringify(serverMappings));

            // Build server schedule
            const serverSchedule = {};
            DAYS.forEach(d => { serverSchedule[d.key] = { active: false, ...DEFAULT_ENTRY }; });
            if (courseDataDetails.scheduleData) {
                courseDataDetails.scheduleData.forEach(entry => {
                    if (serverSchedule[entry.day_of_week] !== undefined) {
                        serverSchedule[entry.day_of_week] = {
                            active: true,
                            start_time: entry.start_time?.substring(0, 5) || '09:00',
                            end_time: entry.end_time?.substring(0, 5) || '10:30',
                            shift: entry.shift || 'morning',
                        };
                    }
                });
            }
            serverScheduleRef.current = JSON.parse(JSON.stringify(serverSchedule));

            if (courseDataDetails.details?.assignment) {
                setSelectedFaculty(courseDataDetails.details.assignment.faculty_id || '');
            } else {
                setSelectedFaculty('');
            }

            // Try to restore drafts, otherwise use server state
            const scheduleDraft = getDraft(scheduleDraftKey);
            const mappingsDraft = getDraft(mappingsDraftKey);

            setSchedule(scheduleDraft || serverSchedule);
            setCloMappings(mappingsDraft || serverMappings);

            // Allow auto-save after a tick
            setTimeout(() => { isRestoringDraft.current = false; }, 100);
        }
    }, [courseDataDetails]);

    // --- Draft auto-save: schedule ---
    const isScheduleDirty = useCallback(() => {
        if (!serverScheduleRef.current) return false;
        return JSON.stringify(schedule) !== JSON.stringify(serverScheduleRef.current);
    }, [schedule]);

    useEffect(() => {
        if (isRestoringDraft.current || !serverScheduleRef.current) return;
        if (isScheduleDirty()) {
            saveDraft(scheduleDraftKey, schedule);
        } else {
            clearDraft(scheduleDraftKey);
        }
    }, [schedule, isScheduleDirty, saveDraft, clearDraft, scheduleDraftKey]);

    // --- Draft auto-save: CLO-PLO mappings ---
    const isMappingsDirty = useCallback(() => {
        if (!serverMappingsRef.current) return false;
        return JSON.stringify(cloMappings) !== JSON.stringify(serverMappingsRef.current);
    }, [cloMappings]);

    useEffect(() => {
        if (isRestoringDraft.current || !serverMappingsRef.current) return;
        if (isMappingsDirty()) {
            saveDraft(mappingsDraftKey, cloMappings);
        } else {
            clearDraft(mappingsDraftKey);
        }
    }, [cloMappings, isMappingsDirty, saveDraft, clearDraft, mappingsDraftKey]);

    // --- Discard handlers ---
    const discardScheduleDraft = useCallback(() => {
        if (serverScheduleRef.current) {
            setSchedule(JSON.parse(JSON.stringify(serverScheduleRef.current)));
        }
        clearDraft(scheduleDraftKey);
        toast.info('Schedule changes discarded');
    }, [clearDraft, scheduleDraftKey]);

    const discardMappingsDraft = useCallback(() => {
        if (serverMappingsRef.current) {
            setCloMappings(JSON.parse(JSON.stringify(serverMappingsRef.current)));
        }
        clearDraft(mappingsDraftKey);
        toast.info('Mapping changes discarded');
    }, [clearDraft, mappingsDraftKey]);

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
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] }); // Refresh details
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to assign faculty');
        } finally {
            setAssigningFaculty(false);
        }
    };

    const [assigningFaculty, setAssigningFaculty] = useState(false);
    const [unassigningFaculty, setUnassigningFaculty] = useState(false);

    const handleUnassignFaculty = async () => {
        if (!window.confirm(`Remove ${courseData?.assignment?.faculty_name || 'faculty'} from this course? All course data (students, grades, attendance) will be preserved.`)) return;
        if (!courseData?.semester_number) {
            toast.error('Semester information not found for this course');
            return;
        }

        try {
            setUnassigningFaculty(true);
            const res = await batchApi.assignFaculty(batchId, courseData.semester_number, courseId, null);
            if (res.success) {
                toast.success('Faculty unassigned successfully');
                setSelectedFaculty('');
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to unassign faculty');
        } finally {
            setUnassigningFaculty(false);
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
                // Update server ref and clear draft
                serverScheduleRef.current = JSON.parse(JSON.stringify(schedule));
                clearDraft(scheduleDraftKey);
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
                // Update server ref and clear draft
                serverMappingsRef.current = JSON.parse(JSON.stringify(cloMappings));
                clearDraft(mappingsDraftKey);
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
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
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] }); // Refresh to get files
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const openAddCloModal = () => {
        setEditingClo(null);
        setCloForm({ title: '', description: '', cognitive_level: 'C1' });
        setCloModalTab('select');
        setSelectedGlobalClos([]);
        setIsCloModalOpen(true);
    };

    const handleMapSelectedClos = async () => {
        if (selectedGlobalClos.length === 0) {
            toast.error('Please select at least one CLO to add');
            return;
        }
        try {
            setSavingClo(true);
            const res = await courseApi.mapClosToCourse(courseId, selectedGlobalClos);
            if (res.success) {
                toast.success('CLOs mapped successfully');
                setIsCloModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to map CLOs');
        } finally {
            setSavingClo(false);
        }
    };

    const openEditCloModal = (clo) => {
        setEditingClo(clo);
        setCloForm({
            title: `CLO-${clo.clo_number}`,
            description: clo.description || '',
            cognitive_level: clo.cognitive_level || 'C1'
        });
        setCloModalTab('create');
        setIsCloModalOpen(true);
    };

    const handleSaveClo = async (e) => {
        e.preventDefault();
        try {
            setSavingClo(true);
            if (editingClo) {
                const res = await courseApi.updateClo(editingClo.id, cloForm);
                if (res.success) {
                    toast.success('CLO updated successfully');
                    setIsCloModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
                }
            } else {
                const res = await courseApi.addSingleClo(courseId, cloForm);
                if (res.success) {
                    toast.success('CLO added successfully');
                    setIsCloModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save CLO');
        } finally {
            setSavingClo(false);
        }
    };

    const handleDeleteClo = async (cloId) => {
        if (!window.confirm('Are you sure you want to delete this CLO? This will affect all batches taking this course.')) return;
        try {
            const res = await courseApi.deleteClo(cloId);
            if (res.success) {
                toast.success('CLO deleted successfully');
                queryClient.invalidateQueries({ queryKey: ['batchCourseDetails', batchId, courseId] });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete CLO');
        }
    };

    if (loading) return (
        <div className="min-h-full bg-[#eff8ff] p-4 sm:p-8">
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
        <div className="min-h-full bg-[#eff8ff]">
            <OverlayLoader isLoading={savingMappings || uploading} text={savingMappings ? "Saving CLO-PLO mappings..." : "Uploading syllabus file..."} />
            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to={`/admin-managebatches/${batchId}`} className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 text-sm font-semibold transition-colors">
                        <MdArrowBack className="w-4 h-4" /> Back to Batch
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-7 rounded-[8px] border border-sky-100 bg-gradient-to-r from-white via-[#f4fbff] to-[#e5f6ff] p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700">
                            <MdSchedule className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Course Schedule
                        </h1>
                    </div>
                    <p className="ml-0 mt-2 text-sm text-slate-600 sm:ml-14 sm:mt-0">
                        Set the weekly class schedule for this course.
                    </p>
                </div>

                {/* Course Info Card */}
                {courseData && (
                    <div className="mb-8 rounded-[8px] border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start gap-6">
                            {/* Course icon + info */}
                            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700">
                                    <MdMenuBook className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">{courseData.code}</span>
                                        <h2 className="text-xl font-bold text-slate-800">{courseData.title}</h2>
                                    </div>
                                    <p className="text-sm text-slate-500">{courseData.credit_hours} Credit Hours • {courseData.department_name}</p>
                                </div>
                            </div>
                            {/* Meta pills */}
                            <div className="flex flex-wrap gap-3">
                                {courseData.batch && (
                                    <div className="flex items-center gap-2 rounded-[8px] border border-sky-100 bg-sky-50/60 px-3 py-2">
                                        <MdSchool className="w-4 h-4 text-sky-600" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Batch</p>
                                            <p className="text-sm font-medium text-slate-700">{courseData.batch.batch_name}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-[8px] border border-sky-100 bg-sky-50/60 px-3 py-2">
                                    <MdSchedule className="w-4 h-4 text-sky-600" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Days Active</p>
                                        <p className="text-sm font-medium text-slate-700">{activeDayCount} / 7</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Faculty Assignment & Course Content Divider */}
                        <div className="my-6 border-t border-sky-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Faculty Assignment */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdPerson className="w-4 h-4 text-sky-600" /> {courseData.assignment?.faculty_id ? 'Assigned Faculty' : 'Assign Faculty'}
                                </h3>
                                {courseData.assignment?.faculty_id ? (
                                    /* Faculty is assigned — show info + Unassign button */
                                    <div>
                                        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-sky-100 bg-sky-50/60 p-3">
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">Currently Assigned</p>
                                                <p className="text-sm font-bold text-sky-800">{courseData.assignment.faculty_name}</p>
                                            </div>
                                            <button onClick={handleUnassignFaculty} disabled={unassigningFaculty}
                                                className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50">
                                                {unassigningFaculty ? 'Removing...' : 'Unassign'}
                                            </button>
                                        </div>
                                        <p className="mt-2 text-[11px] text-slate-400 italic">Unassigning preserves all course data (students, grades, attendance).</p>
                                    </div>
                                ) : (
                                    /* No faculty — show dropdown + Assign button */
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Select Faculty</label>
                                            <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}
                                                className="w-full appearance-none rounded-[8px] border border-sky-100 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                                                <option value="">-- Choose Faculty --</option>
                                                {facultyList.map(f => (
                                                    <option key={f.id} value={f.id}>{f.full_name || f.fullName} ({f.department || 'No Dept'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button onClick={handleAssignFaculty} disabled={assigningFaculty} className="rounded-full bg-[#0798e7] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:opacity-50">
                                            {assigningFaculty ? 'Saving...' : 'Assign'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Course Content / Files */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdMenuBook className="w-4 h-4 text-sky-600" /> Course Content
                                </h3>
                                <div className="flex items-end gap-3 mb-3">
                                    <div className="flex-1">
                                        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Upload File (PDF/Word)</label>
                                        <input type="file" onChange={(e) => setUploadFile(e.target.files[0])}
                                            className="w-full cursor-pointer rounded-[8px] border border-sky-100 bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100" />
                                    </div>
                                    <button onClick={handleUploadFile} disabled={uploading || !uploadFile} className="rounded-full bg-[#0798e7] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:opacity-50">
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                                
                                {courseData.files && courseData.files.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {courseData.files.map(f => (
                                            <div key={f.id} className="flex items-center justify-between rounded-[8px] border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm">
                                                <span className="text-slate-700 truncate mr-3 flex-1">{f.file_name}</span>
                                                <a href={`/document-viewer?url=${encodeURIComponent(getFileUrl(f.file_path))}&name=${encodeURIComponent(f.file_name)}`} target="_blank" rel="noreferrer" className="flex-shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-900">View</a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No files uploaded yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* Weekly Schedule Section */}
                {isScheduleDirty() && (
                    <UnsavedBanner
                        onSave={handleSave}
                        onDiscard={discardScheduleDraft}
                        saving={saving}
                    />
                )}
                <div className="mb-8 overflow-hidden rounded-[8px] border border-sky-100 bg-white shadow-sm">
                    {/* Section header */}
                    <div className="flex flex-col gap-4 border-b border-sky-100 bg-gradient-to-r from-white to-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700"><MdSchedule className="h-4 w-4" /></div>
                            <h3 className="text-lg font-semibold text-slate-800">Weekly Schedule</h3>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{activeDayCount} day(s) selected</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 rounded-full bg-[#0798e7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:cursor-not-allowed disabled:opacity-50"
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
                                        className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                                            isActive
                                                ? 'border-sky-300 bg-sky-50/50 shadow-sm'
                                                : 'border-sky-100 bg-white hover:border-sky-200'
                                        }`}
                                    >
                                        {/* Day toggle header */}
                                        <button
                                            onClick={() => toggleDay(day.key)}
                                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                                                isActive
                                                    ? 'bg-sky-50 text-sky-800 border-b border-sky-200'
                                                    : 'bg-white text-slate-700 hover:bg-sky-50'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm">{day.label}</span>
                                            {isActive ? (
                                                <MdCheckCircle className="w-5 h-5 text-sky-600" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white"></div>
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
                                                            className="w-full rounded-[8px] border border-sky-100 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
                                                            className="w-full rounded-[8px] border border-sky-100 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Shift Toggle */}
                                                <div>
                                                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                                        Shift
                                                    </label>
                                                    <div className="flex gap-1 rounded-[8px] bg-sky-50 p-1">
                                                        <button
                                                            onClick={() => updateDay(day.key, 'shift', 'morning')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                entry.shift === 'morning'
                                                                    ? 'border border-sky-200 bg-white text-sky-700 shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                        >
                                                            <MdWbSunny className="w-3.5 h-3.5" />
                                                            Morning
                                                        </button>
                                                        <button
                                                            onClick={() => updateDay(day.key, 'shift', 'evening')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                entry.shift === 'evening'
                                                                    ? 'border border-sky-200 bg-white text-sky-700 shadow-sm'
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
                            <div className="mt-6 rounded-[8px] border border-sky-100 bg-sky-50/40 p-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Schedule Summary</h4>
                                <div className="space-y-2">
                                    {DAYS.filter(d => schedule[d.key].active).map(d => {
                                        const entry = schedule[d.key];
                                        return (
                                            <div key={d.key} className="flex items-center gap-3 text-sm">
                                                <span className="font-semibold text-slate-700 w-24">{d.label}</span>
                                                <span className="text-slate-500">
                                                    {entry.start_time} — {entry.end_time}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                    entry.shift === 'morning'
                                                        ? 'bg-white text-sky-700 border border-sky-200'
                                                        : 'bg-white text-sky-700 border border-sky-200'
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
                            <div className="mt-6 rounded-[8px] border border-dashed border-sky-200 bg-sky-50/30 py-12 text-center">
                                <MdSchedule className="mx-auto mb-3 h-10 w-10 text-sky-300" />
                                <p className="text-slate-400 text-sm">Click on a day above to set its class time</p>
                            </div>
                        )}
                    </div>
                </div>

                {courseData && (
                    <div className="mb-8 rounded-[8px] border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
                        {/* Course CLOs Section */}
                        <div>
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700">
                                        <MdCheckCircle className="h-4 w-4" />
                                    </span>
                                    Course Learning Outcomes (CLOs)
                                </h3>
                                <button onClick={openAddCloModal} className="flex items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-50">
                                    <MdAdd className="w-4 h-4" /> Add CLO
                                </button>
                            </div>
                            
                            {courseData.clos && courseData.clos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {courseData.clos.map(clo => (
                                        <div key={clo.id} className="rounded-[8px] border border-sky-100 bg-gradient-to-r from-white to-sky-50/50 p-4 transition-colors hover:border-sky-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800 text-sm">{clo.title}</h4>
                                                    <button onClick={() => openEditCloModal(clo)} className="rounded-full border border-sky-100 bg-white p-1.5 text-sky-600 transition-colors hover:bg-sky-50" title="Edit CLO">
                                                        <MdEdit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClo(clo.id)} className="rounded-full border border-rose-100 bg-white p-1.5 text-rose-500 transition-colors hover:bg-rose-50" title="Delete CLO">
                                                        <MdDelete className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {clo.mapped_plo_ids ? (
                                                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-sky-700">
                                                        MAPPED
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-500">
                                                        UNMAPPED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{clo.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[8px] border border-dashed border-sky-200 bg-sky-50/30 p-8 text-center">
                                    <MdCheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 font-medium">No CLOs attached to this course.</p>
                                    <button onClick={openAddCloModal} className="mt-3 rounded-full bg-[#0798e7] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5]">
                                        Add First CLO
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CLO-PLO Mapping */}
                        {courseData.clos && courseData.clos.length > 0 && (
                            <>
                                <div className="my-6 border-t border-sky-100"></div>
                                {isMappingsDirty() && (
                                    <UnsavedBanner
                                        onSave={handleSaveMappings}
                                        onDiscard={discardMappingsDraft}
                                        saving={savingMappings}
                                    />
                                )}
                                <div>
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700"><MdSchool className="h-4 w-4" /></span> Map CLOs to Batch PLOs
                                        </h3>
                                        <button onClick={handleSaveMappings} disabled={savingMappings} className="rounded-full bg-[#0798e7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:opacity-50">
                                            {savingMappings ? 'Saving...' : 'Save Mappings'}
                                        </button>
                                    </div>
                                    {batchPlos.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">No PLOs have been attached to this batch. Please manage PLOs in the Batch Details page first.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {courseData.clos.map(clo => (
                                                <div key={clo.id} className="rounded-[8px] border border-sky-100 bg-gradient-to-r from-white to-sky-50/40 p-4">
                                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800 text-sm">CLO {clo.clo_number}: {clo.title}</h4>
                                                            <p className="text-sm text-slate-600 mt-1">{clo.description}</p>
                                                        </div>
                                                        <div className="w-full md:w-64 flex-shrink-0">
                                                            <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Map to PLOs:</label>
                                                            <div className="relative">
                                                                <div 
                                                                    className="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-[8px] border border-sky-100 bg-white px-3 py-1.5 transition-colors hover:border-sky-300"
                                                                    onClick={() => setOpenPloDropdowns(prev => ({...prev, [clo.id]: !prev[clo.id]}))}
                                                                >
                                                                    {(() => {
                                                                        const mappedIds = cloMappings[clo.id] || [];
                                                                        if (mappedIds.length === 0) return <span className="text-sm text-slate-400">Select PLOs...</span>;
                                                                        
                                                                        return mappedIds.map(ploId => {
                                                                            const plo = batchPlos.find(p => p.id === ploId);
                                                                            if (!plo) return null;
                                                                            return (
                                                                                <span key={ploId} className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                                                                                    PLO {plo.plo_number}
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="text-sky-400 hover:text-sky-700 focus:outline-none"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setCloMappings(prev => ({
                                                                                                ...prev,
                                                                                                [clo.id]: prev[clo.id].filter(id => id !== ploId)
                                                                                            }));
                                                                                        }}
                                                                                    >
                                                                                        <MdClose className="w-3 h-3" />
                                                                                    </button>
                                                                                </span>
                                                                            );
                                                                        });
                                                                    })()}
                                                                    <MdExpandMore className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${openPloDropdowns[clo.id] ? 'rotate-180' : ''}`} />
                                                                </div>

                                                                {openPloDropdowns[clo.id] && (
                                                                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[8px] border border-sky-100 bg-white shadow-lg">
                                                                        <div className="max-h-60 overflow-y-auto py-1">
                                                                            {batchPlos.map(plo => {
                                                                                const isMapped = (cloMappings[clo.id] || []).includes(plo.id);
                                                                                return (
                                                                                    <label key={plo.id} className="flex cursor-pointer items-start px-4 py-2.5 hover:bg-sky-50">
                                                                                        <div className="flex h-5 items-center">
                                                                                            <input 
                                                                                                type="checkbox" 
                                                                                                checked={isMapped}
                                                                                                onChange={(e) => {
                                                                                                    const checked = e.target.checked;
                                                                                                    setCloMappings(prev => {
                                                                                                        const current = prev[clo.id] || [];
                                                                                                        if (checked) return { ...prev, [clo.id]: [...current, plo.id] };
                                                                                                        return { ...prev, [clo.id]: current.filter(id => id !== plo.id) };
                                                                                                    });
                                                                                                }}
                                                                                                className="h-4 w-4 rounded border-sky-300 accent-[#0798e7] focus:ring-sky-500" 
                                                                                            />
                                                                                        </div>
                                                                                        <div className="ml-3 text-sm">
                                                                                            <span className="font-medium text-slate-700">PLO {plo.plo_number}</span>
                                                                                            <p className="text-slate-500 text-[10px] leading-tight mt-0.5 line-clamp-1">{plo.description}</p>
                                                                                        </div>
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
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
            </div>

            {/* Add/Edit CLO Modal */}
            {isCloModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[8px] border border-sky-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-white to-sky-50 p-4 sm:p-5">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingClo ? 'Edit CLO' : 'Add CLO'}
                            </h3>
                            <button onClick={() => setIsCloModalOpen(false)} className="rounded-full border border-sky-100 bg-white p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {!editingClo && (
                            <div className="grid grid-cols-2 gap-2 border-b border-sky-100 bg-sky-50/40 p-3">
                                <button 
                                    className={`rounded-full border px-3 py-2.5 text-sm font-semibold transition-colors ${cloModalTab === 'select' ? 'border-sky-300 bg-white text-sky-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}
                                    onClick={() => setCloModalTab('select')}
                                >
                                    Select Existing
                                </button>
                                <button 
                                    className={`rounded-full border px-3 py-2.5 text-sm font-semibold transition-colors ${cloModalTab === 'create' ? 'border-sky-300 bg-white text-sky-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}
                                    onClick={() => setCloModalTab('create')}
                                >
                                    Create New
                                </button>
                            </div>
                        )}

                        {cloModalTab === 'select' && !editingClo ? (
                            <div className="p-4 sm:p-5 overflow-y-auto flex flex-col">
                                <p className="text-sm text-slate-600 mb-4">Select CLOs from the global list to add to this course.</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-1">
                                    {globalClos.filter(g => !courseData?.clos?.some(c => c.id === g.id)).length === 0 ? (
                                        <p className="text-sm text-slate-500 italic text-center py-4">No unmapped CLOs available.</p>
                                    ) : (
                                        globalClos.filter(g => !courseData?.clos?.some(c => c.id === g.id)).map(clo => (
                                            <label key={clo.id} className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-sky-100 bg-white p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                                                <input 
                                                    type="checkbox" 
                                                    className="mt-0.5 rounded border-sky-300 accent-[#0798e7] focus:ring-sky-500"
                                                    checked={selectedGlobalClos.includes(clo.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedGlobalClos([...selectedGlobalClos, clo.id]);
                                                        else setSelectedGlobalClos(selectedGlobalClos.filter(id => id !== clo.id));
                                                    }}
                                                />
                                                <div>
                                                    <span className="font-semibold text-slate-800 text-sm">{clo.title}</span>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{clo.description}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <div className="mt-auto flex gap-3">
                                    <button type="button" onClick={() => setIsCloModalOpen(false)} className="flex-1 rounded-full border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleMapSelectedClos} disabled={savingClo || selectedGlobalClos.length === 0} className="flex-1 rounded-full bg-[#0798e7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:opacity-50">
                                        {savingClo ? 'Adding...' : `Add Selected (${selectedGlobalClos.length})`}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveClo} className="p-4 sm:p-5 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">CLO Title *</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="e.g. CLO-1"
                                            value={cloForm.title}
                                            onChange={(e) => setCloForm({...cloForm, title: e.target.value})}
                                            className="w-full rounded-[8px] border border-sky-100 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Must be in format CLO-X (e.g., CLO-1, CLO-2)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                        <textarea 
                                            rows="3"
                                            placeholder="What will students learn?"
                                            value={cloForm.description}
                                            onChange={(e) => setCloForm({...cloForm, description: e.target.value})}
                                            className="w-full resize-none rounded-[8px] border border-sky-100 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Cognitive Level</label>
                                        <select
                                            value={cloForm.cognitive_level}
                                            onChange={(e) => setCloForm({...cloForm, cognitive_level: e.target.value})}
                                            className="w-full appearance-none rounded-[8px] border border-sky-100 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                        >
                                            <option value="C1">C1 - Knowledge</option>
                                            <option value="C2">C2 - Comprehension</option>
                                            <option value="C3">C3 - Application</option>
                                            <option value="C4">C4 - Analysis</option>
                                            <option value="C5">C5 - Synthesis</option>
                                            <option value="C6">C6 - Evaluation</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button type="button" onClick={() => setIsCloModalOpen(false)} className="flex-1 rounded-full border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={savingClo} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0798e7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0078c5] disabled:opacity-50">
                                        {savingClo ? 'Saving...' : 'Save CLO'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchCourseSchedule;
