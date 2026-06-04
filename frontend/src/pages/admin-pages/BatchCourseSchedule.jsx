import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdMenuBook, MdPerson, MdSchool, MdSave, MdSchedule, MdWbSunny, MdNightsStay, MdAccessTime, MdCheckCircle, MdAdd, MdEdit, MdDelete, MdClose, MdExpandMore } from 'react-icons/md';
import { batchApi, approvalApi, courseApi, getFileUrl } from '../../services/api';
import { toast } from 'react-toastify';
import OverlayLoader from '../../components/common/OverlayLoader';

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

    // CLO CRUD Modal State
    const [isCloModalOpen, setIsCloModalOpen] = useState(false);
    const [editingClo, setEditingClo] = useState(null);
    const [cloForm, setCloForm] = useState({ title: '', description: '', cognitive_level: 'C1' });
    const [savingClo, setSavingClo] = useState(false);
    
    const [globalClos, setGlobalClos] = useState([]);
    const [cloModalTab, setCloModalTab] = useState('select'); // 'select' or 'create'
    const [selectedGlobalClos, setSelectedGlobalClos] = useState([]);
    const [openPloDropdowns, setOpenPloDropdowns] = useState({}); // Track which PLO dropdowns are open

    useEffect(() => {
        fetchData();
        fetchFaculty();
        fetchBatchPlos();
        fetchGlobalClos();
    }, [batchId, courseId]);

    const fetchGlobalClos = async () => {
        try {
            const res = await courseApi.getAllClos();
            if (res.success) {
                setGlobalClos(res.data || []);
            }
        } catch(e) {
            console.error(e);
        }
    };

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
                fetchData();
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
                fetchData();
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
                    fetchData();
                }
            } else {
                const res = await courseApi.addSingleClo(courseId, cloForm);
                if (res.success) {
                    toast.success('CLO added successfully');
                    setIsCloModalOpen(false);
                    fetchData();
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
                fetchData();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete CLO');
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
            <OverlayLoader isLoading={savingMappings || uploading} text={savingMappings ? "Saving CLO-PLO mappings..." : "Uploading syllabus file..."} />
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
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-8">
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
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-slate-200">
                                        <MdSchool className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Batch</p>
                                            <p className="text-sm font-medium text-slate-700">{courseData.batch.batch_name}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-slate-200">
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
                                    <MdPerson className="w-4 h-4 text-slate-400" /> {courseData.assignment?.faculty_id ? 'Assigned Faculty' : 'Assign Faculty'}
                                </h3>
                                {courseData.assignment?.faculty_id ? (
                                    /* Faculty is assigned — show info + Unassign button */
                                    <div>
                                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">Currently Assigned</p>
                                                <p className="text-sm font-bold text-emerald-700">{courseData.assignment.faculty_name}</p>
                                            </div>
                                            <button onClick={handleUnassignFaculty} disabled={unassigningFaculty}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
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
                                                className="w-full px-4 py-2 border-2 border-slate-300 shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white">
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
                                            className="w-full px-3 py-1.5 border-2 border-slate-300 shadow-sm rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 cursor-pointer" />
                                    </div>
                                    <button onClick={handleUploadFile} disabled={uploading || !uploadFile} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50">
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                                
                                {courseData.files && courseData.files.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {courseData.files.map(f => (
                                            <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm">
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <MdCheckCircle className="w-4 h-4 text-emerald-500" /> Course Learning Outcomes (CLOs)
                                </h3>
                                <button onClick={openAddCloModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                    <MdAdd className="w-4 h-4" /> Add CLO
                                </button>
                            </div>
                            
                            {courseData.clos && courseData.clos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {courseData.clos.map(clo => (
                                        <div key={clo.id} className="p-4 bg-white border-2 border-slate-300 shadow-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800 text-sm">{clo.title}</h4>
                                                    <button onClick={() => openEditCloModal(clo)} className="p-1 text-slate-400 hover:text-blue-500 rounded bg-slate-50 hover:bg-blue-50 transition-colors" title="Edit CLO">
                                                        <MdEdit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClo(clo.id)} className="p-1 text-slate-400 hover:text-red-500 rounded bg-slate-50 hover:bg-red-50 transition-colors" title="Delete CLO">
                                                        <MdDelete className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
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
                                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
                                    <MdCheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 font-medium">No CLOs attached to this course.</p>
                                    <button onClick={openAddCloModal} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                        Add First CLO
                                    </button>
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
                                                <div key={clo.id} className="bg-slate-50 border-2 border-slate-300 shadow-sm rounded-xl p-4">
                                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800 text-sm">CLO {clo.clo_number}: {clo.title}</h4>
                                                            <p className="text-sm text-slate-600 mt-1">{clo.description}</p>
                                                        </div>
                                                        <div className="w-full md:w-64 flex-shrink-0">
                                                            <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Map to PLOs:</label>
                                                            <div className="relative">
                                                                <div 
                                                                    className="flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-lg border-2 border-slate-300 shadow-sm bg-white px-3 py-1.5 cursor-pointer hover:border-indigo-400 transition-colors"
                                                                    onClick={() => setOpenPloDropdowns(prev => ({...prev, [clo.id]: !prev[clo.id]}))}
                                                                >
                                                                    {(() => {
                                                                        const mappedIds = cloMappings[clo.id] || [];
                                                                        if (mappedIds.length === 0) return <span className="text-sm text-slate-400">Select PLOs...</span>;
                                                                        
                                                                        return mappedIds.map(ploId => {
                                                                            const plo = batchPlos.find(p => p.id === ploId);
                                                                            if (!plo) return null;
                                                                            return (
                                                                                <span key={ploId} className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
                                                                                    PLO {plo.plo_number}
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="text-indigo-400 hover:text-indigo-600 focus:outline-none"
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
                                                                    <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 border-2 border-slate-200">
                                                                        <div className="max-h-60 overflow-y-auto py-1">
                                                                            {batchPlos.map(plo => {
                                                                                const isMapped = (cloMappings[clo.id] || []).includes(plo.id);
                                                                                return (
                                                                                    <label key={plo.id} className="flex cursor-pointer items-start px-4 py-2 hover:bg-slate-50">
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
                                                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
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

                {/* Weekly Schedule Section */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
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
                                                            className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none bg-white"
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
                                                            className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none bg-white"
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
                            <div className="mt-6 p-4 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-slate-200">
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
                            <div className="mt-6 text-center py-12 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-dashed border-slate-200">
                                <MdSchedule className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Click on a day above to set its class time</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit CLO Modal */}
            {isCloModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingClo ? 'Edit CLO' : 'Add CLO'}
                            </h3>
                            <button onClick={() => setIsCloModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {!editingClo && (
                            <div className="flex border-b border-slate-200">
                                <button 
                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${cloModalTab === 'select' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setCloModalTab('select')}
                                >
                                    Select Existing
                                </button>
                                <button 
                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${cloModalTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setCloModalTab('create')}
                                >
                                    Create New
                                </button>
                            </div>
                        )}

                        {cloModalTab === 'select' && !editingClo ? (
                            <div className="p-4 sm:p-6 overflow-y-auto flex flex-col">
                                <p className="text-sm text-slate-600 mb-4">Select CLOs from the global list to add to this course.</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                                    {globalClos.filter(g => !courseData?.clos?.some(c => c.id === g.id)).length === 0 ? (
                                        <p className="text-sm text-slate-500 italic text-center py-4">No unmapped CLOs available.</p>
                                    ) : (
                                        globalClos.filter(g => !courseData?.clos?.some(c => c.id === g.id)).map(clo => (
                                            <label key={clo.id} className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedGlobalClos.includes(clo.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedGlobalClos([...selectedGlobalClos, clo.id]);
                                                        else setSelectedGlobalClos(selectedGlobalClos.filter(id => id !== clo.id));
                                                    }}
                                                />
                                                <div>
                                                    <span className="font-bold text-slate-700 text-sm">{clo.title}</span>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{clo.description}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <div className="mt-auto flex gap-3">
                                    <button type="button" onClick={() => setIsCloModalOpen(false)} className="flex-1 px-4 py-2.5 border-2 border-slate-300 shadow-sm text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleMapSelectedClos} disabled={savingClo || selectedGlobalClos.length === 0} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                        {savingClo ? 'Adding...' : `Add Selected (${selectedGlobalClos.length})`}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveClo} className="p-4 sm:p-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">CLO Title *</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="e.g. CLO-1"
                                            value={cloForm.title}
                                            onChange={(e) => setCloForm({...cloForm, title: e.target.value})}
                                            className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                                            className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Cognitive Level</label>
                                        <select
                                            value={cloForm.cognitive_level}
                                            onChange={(e) => setCloForm({...cloForm, cognitive_level: e.target.value})}
                                            className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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

                                <div className="mt-8 flex gap-3">
                                    <button type="button" onClick={() => setIsCloModalOpen(false)} className="flex-1 px-4 py-2.5 border-2 border-slate-300 shadow-sm text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={savingClo} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
