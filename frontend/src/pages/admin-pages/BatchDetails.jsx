import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdArrowForward, MdMenuBook, MdAdd, MdDelete, MdClose, MdSearch, MdCheckCircle, MdLibraryBooks, MdInfo, MdSchedule, MdChevronRight } from 'react-icons/md';
import { PiBookOpenText, PiBooks, PiCalendarBlank, PiPulse, PiTarget, PiUsersThree } from 'react-icons/pi';
import { batchApi, curriculumApi, courseApi, obeApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BatchDetails = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    
    const [activeSemester, setActiveSemester] = useState(1);
    const [assigningCurriculum, setAssigningCurriculum] = useState(false);

    // Add Course Modal
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [courseType, setCourseType] = useState('core');
    const [addingCourses, setAddingCourses] = useState(false);
    const [removingCourseId, setRemovingCourseId] = useState(null);
    const [courseToDelete, setCourseToDelete] = useState(null);

    // PLO Modal
    const [showPloModal, setShowPloModal] = useState(false);
    const [allPlos, setAllPlos] = useState([]);
    const [selectedPloIds, setSelectedPloIds] = useState([]);
    const [savingPlos, setSavingPlos] = useState(false);

    // Curriculum Modal
    const [showCurriculumModal, setShowCurriculumModal] = useState(false);
    const [selectedCurriculumId, setSelectedCurriculumId] = useState('');

    const { data: batchData, isLoading: loading, error: batchError } = useQuery({
        queryKey: ['batch', id],
        queryFn: async () => {
            const res = await batchApi.getById(id);
            if (res.success) return res.data;
            throw new Error('Failed to load batch');
        },
        staleTime: Infinity
    });

    const { data: curricula = [] } = useQuery({
        queryKey: ['curricula'],
        queryFn: async () => {
            const res = await curriculumApi.getAll({ limit: 100 });
            if (res.success) return res.data || [];
            return [];
        }
    });

    const { data: batchCourseData, isLoading: loadingCourses, refetch: fetchBatchCourses } = useQuery({
        queryKey: ['batchCourses', id],
        queryFn: async () => {
            const res = await batchApi.getCurriculumCourses(id);
            if (res.success) return res.data;
            return null;
        },
        enabled: !!batchData?.curriculum_id,
        staleTime: Infinity
    });

    const handleCurriculumChange = async (val) => {
        setAssigningCurriculum(true);
        try {
            await batchApi.update(id, { curriculum_id: val || null });
            toast.success(val ? 'Curriculum assigned — courses copied to batch' : 'Curriculum removed');
            await queryClient.invalidateQueries({ queryKey: ['batch', id] });
            if (val) await queryClient.invalidateQueries({ queryKey: ['batchCourses', id] });
            setActiveSemester(1);
            setShowCurriculumModal(false);
        } catch (e) {
            console.error('Curriculum update error:', e.response?.data || e.message || e);
            const detail = e.response?.data?.detail || e.response?.data?.message || 'Failed to update curriculum';
            toast.error(detail);
        }
        finally { setAssigningCurriculum(false); }
    };

    const handleOpenAddCourse = async () => {
        try {
            const res = await courseApi.getAllList();
            if (res.success) setAllCourses(res.data || []);
        } catch (e) { console.error(e); }
        setSelectedCourses([]); setCourseSearch(''); setCourseType('core');
        setShowAddCourse(true);
    };

    // Add courses to THIS BATCH's semester (not the curriculum)
    const handleAddCourses = async () => {
        if (!selectedCourses.length) return;
        setAddingCourses(true);
        try {
            const res = await batchApi.addBatchCourse(id, activeSemester, {
                course_ids: selectedCourses, type: courseType
            });
            if (res.success) {
                const a = res.data?.added?.length || 0;
                if (a > 0) toast.success(`${a} course(s) added to batch`);
                res.data?.errors?.forEach(e => toast.warn(`${e.error}`));
            }
            setShowAddCourse(false);
            fetchBatchCourses();
        } catch (e) { toast.error('Failed to add courses'); }
        finally { setAddingCourses(false); }
    };

    // Remove course from THIS BATCH's semester (not the curriculum)
    const handleRemoveCourse = async () => {
        if (!courseToDelete) return;
        setRemovingCourseId(courseToDelete.course_id);
        try {
            await batchApi.removeBatchCourse(id, activeSemester, courseToDelete.course_id);
            toast.success('Course removed from batch');
            fetchBatchCourses();
            setCourseToDelete(null);
        } catch (e) { toast.error('Failed to remove'); }
        finally { setRemovingCourseId(null); }
    };

    // Check if course is already in batch
    const isCourseInBatch = (courseId) => {
        if (!batchCourseData?.semesters) return false;
        return batchCourseData.semesters.some(sem => 
            sem.courses && sem.courses.some(c => c.course_id === courseId)
        );
    };

    const handleOpenPloModal = async () => {
        try {
            const res = await departmentApi.getAllPLOs();
            if (res.success) {
                setAllPlos(res.data || []);
                const currentPloIds = (batchData?.plos || []).map(p => p.id);
                setSelectedPloIds(currentPloIds);
                setShowPloModal(true);
            }
        } catch(e) {
            toast.error('Failed to load PLOs');
        }
    };

    const handleSaveBatchPlos = async () => {
        try {
            setSavingPlos(true);
            const res = await batchApi.updateAllPLOs(id, selectedPloIds);
            if (res.success) {
                toast.success('Batch PLOs updated successfully');
                queryClient.invalidateQueries({ queryKey: ['batch', id] });
            }
        } catch(e) {
            console.error(e);
            toast.error('Failed to save PLOs');
        } finally {
            setSavingPlos(false);
            setShowPloModal(false);
        }
    };

    const getExistingCourseIds = () => {
        if (!batchCourseData?.semesters) return new Set();
        const ids = new Set();
        batchCourseData.semesters.forEach(s => s.courses?.forEach(c => ids.add(c.course_id)));
        return ids;
    };

    const filteredAvailable = () => {
        const existing = getExistingCourseIds();
        return allCourses.filter(c => {
            const match = !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase()) || c.code.toLowerCase().includes(courseSearch.toLowerCase());
            return match && !existing.has(c.id);
        });
    };

    if (loading) return (
        <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-7xl mx-auto animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                <div className="grid grid-cols-3 gap-5 mb-10">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                </div>
            </div>
        </div>
    );

    if (!batchData) return (
        <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-600 mb-2">Batch not found</h2>
                <Link to="/admin-managebatches" className="text-blue-600 hover:underline">Back to Batches</Link>
            </div>
        </div>
    );

    const activeSemData = batchCourseData?.semesters?.find(s => s.semester_number === activeSemester);
    const coreCourses = activeSemData?.courses?.filter(c => c.type === 'core') || [];
    const electiveCourses = activeSemData?.courses?.filter(c => c.type === 'elective') || [];

    return (
        <div className="campus-detail-page min-h-full bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="campus-page-inner p-8 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
                        <MdArrowBack className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-slate-800">{batchData.name}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">{batchData.status || 'Active'}</span>
                        <span className="text-sm text-slate-500">{batchData.department_name}</span>
                    </div>
                </div>

                {/* Stats & Assignment Cards */}
                <div className="campus-stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Students', value: batchData.student_count || 0, icon: PiUsersThree, color: 'from-blue-500 to-indigo-600', link: `/admin-managebatches/${id}/students` },
                        { label: 'Status', value: batchData.status || 'active', icon: PiPulse, color: 'from-violet-500 to-purple-600' },
                        { label: 'Duration', value: batchData.start_date ? `${new Date(batchData.start_date).getFullYear()} - ${batchData.end_date ? new Date(batchData.end_date).getFullYear() : '...'}` : 'N/A', icon: PiCalendarBlank, color: 'from-emerald-500 to-teal-600' },
                        { label: 'Curriculum', value: curricula.find(c => c.id === batchData.curriculum_id)?.name || 'Not Set', icon: PiBookOpenText, color: 'from-cyan-500 to-blue-600', onClick: () => { setSelectedCurriculumId(batchData.curriculum_id || ''); setShowCurriculumModal(true); } },
                        { label: 'PLOs', value: batchData.plos?.length || 0, icon: PiTarget, color: 'from-fuchsia-500 to-pink-600', onClick: handleOpenPloModal },
                    ].map((s, i) => {
                        const card = (
                            <div onClick={s.onClick} className={`group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all h-full relative ${s.link || s.onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}>
                                <div className="flex items-start justify-between h-full flex-col pr-6">
                                    <div className="w-full">
                                        <div className={`campus-icon-tile inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} mb-3 shadow-sm group-hover:shadow-lg transition-all`}>
                                            <s.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                                        <h3 className="text-base font-bold text-slate-800 leading-tight">{s.value}</h3>
                                    </div>
                                    {(s.link || s.onClick) && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors group-hover:translate-x-1 duration-200">
                                            <MdChevronRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                        return s.link ? <Link key={i} to={s.link} className="block">{card}</Link> : <div key={i} className="block">{card}</div>;
                    })}
                </div>

                {/* Info banner: explain that edits here don't affect the curriculum */}
                {batchData.curriculum_id && (
                    <div className="campus-info-banner mb-6 flex items-center gap-3 rounded-xl p-4">
                        <div className="campus-info-icon"><MdInfo className="w-5 h-5" /></div>
                        <p className="text-sm leading-6 text-sky-800">
                            Courses below are a copy from <strong>{batchCourseData?.curriculum_name || 'the curriculum'}</strong>. 
                            Adding or removing courses here only affects this batch — the original curriculum is not changed.
                        </p>
                    </div>
                )}

                {/* Semester Tabs + Courses (reads from batch_semester_courses) */}
                {loadingCourses ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium text-sm">Loading semester details...</p>
                    </div>
                ) : batchCourseData && (
                    <div className="campus-section-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Semester Tabs */}
                        <div className="campus-tabs flex overflow-x-auto border-b border-slate-200">
                            {batchCourseData.semesters?.map((sem) => {
                                const isActive = sem.semester_number === activeSemester;
                                const count = sem.courses?.length || 0;
                                return (
                                    <button key={sem.semester_number} onClick={() => setActiveSemester(sem.semester_number)}
                                        className={`relative m-1 flex-shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${isActive ? 'border-sky-200 bg-white text-sky-700 shadow-sm' : 'border-transparent text-slate-500 hover:border-sky-100 hover:bg-sky-50/60 hover:text-sky-700'}`}>
                                        <span className="flex items-center gap-2">
                                            Sem {sem.semester_number}
                                            {count > 0 && <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold ${isActive ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-transparent bg-slate-100 text-slate-600'}`}>{count}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Courses Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-800">
                                    Semester {activeSemester}
                                    <span className="text-sm font-normal text-slate-500 ml-2">({(coreCourses.length + electiveCourses.length)} courses)</span>
                                </h3>
                                <button onClick={handleOpenAddCourse} className="campus-primary-button flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors">
                                    <MdAdd className="w-4 h-4" /> Add Courses
                                </button>
                            </div>

                            {coreCourses.length === 0 && electiveCourses.length === 0 ? (
                                <div className="campus-empty-state text-center py-10 rounded-xl">
                                    <div className="campus-empty-icon"><PiBookOpenText className="w-7 h-7" /></div>
                                    <p className="text-slate-500 mb-4 text-sm font-medium">No courses in this semester</p>
                                    <button onClick={handleOpenAddCourse} className="campus-primary-button inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm shadow-sm">
                                        <MdAdd className="w-4 h-4" /> Add Courses
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Core Courses */}
                                    {coreCourses.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-sky-500"></div> Core Courses ({coreCourses.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {coreCourses.map(c => (
                                                    <div key={c.course_id} className="group flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-gradient-to-r from-white to-sky-50/55 p-3.5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
                                                        <Link to={`/admin-managebatches/${id}/course/${c.course_id}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                                                            <div className="campus-icon-tile flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                                                <PiBookOpenText className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-700">{c.code}</span>
                                                                    <h4 className="truncate text-sm font-semibold text-slate-800 group-hover:text-sky-800">{c.title}</h4>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-0.5">{c.credit_hours} Credits</p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex flex-shrink-0 items-center gap-1.5">
                                                            <Link to={`/admin-managebatches/${id}/course/${c.course_id}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-400 opacity-100 shadow-sm transition-all hover:bg-sky-50 hover:text-sky-700 sm:opacity-0 sm:group-hover:opacity-100" title="Set Schedule">
                                                                <MdSchedule className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => setCourseToDelete(c)} disabled={removingCourseId === c.course_id}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-400 opacity-100 shadow-sm transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50">
                                                                <MdDelete className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Elective Courses */}
                                    {electiveCourses.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-sky-400"></div> Elective Courses ({electiveCourses.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {electiveCourses.map(c => (
                                                    <div key={c.course_id} className="group flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-gradient-to-r from-white to-sky-50/55 p-3.5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
                                                        <Link to={`/admin-managebatches/${id}/course/${c.course_id}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                                                            <div className="campus-icon-tile flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                                                <PiBookOpenText className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-700">{c.code}</span>
                                                                    <h4 className="truncate text-sm font-semibold text-slate-800 group-hover:text-sky-800">{c.title}</h4>
                                                                    <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">Elective</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-0.5">{c.credit_hours} Credits</p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex flex-shrink-0 items-center gap-1.5">
                                                            <Link to={`/admin-managebatches/${id}/course/${c.course_id}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-400 opacity-100 shadow-sm transition-all hover:bg-sky-50 hover:text-sky-700 sm:opacity-0 sm:group-hover:opacity-100" title="Set Schedule">
                                                                <MdSchedule className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => setCourseToDelete(c)} disabled={removingCourseId === c.course_id}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-400 opacity-100 shadow-sm transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50">
                                                                <MdDelete className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Course Modal */}
            {showAddCourse && createPortal(
                <div className="campus-modal-shell fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                                <h2 className="text-lg font-bold text-slate-800">Add Courses — Semester {activeSemester}</h2>
                            </div>
                            <button onClick={() => setShowAddCourse(false)} disabled={addingCourses} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><MdClose className="w-5 h-5" /></button>
                        </div>

                        {/* Type Toggle + Search */}
                        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                            <div className="flex gap-2">
                                <button onClick={() => setCourseType('core')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${courseType === 'core' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    Core Course
                                </button>
                                <button onClick={() => setCourseType('elective')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${courseType === 'elective' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    Elective Course
                                </button>
                            </div>
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} autoFocus
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            {selectedCourses.length > 0 && <p className="text-sm text-blue-600 font-medium">{selectedCourses.length} selected</p>}
                        </div>

                        {/* Course List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredAvailable().length === 0 ? (
                                <div className="text-center py-12"><p className="text-slate-400">No courses available</p></div>
                            ) : filteredAvailable().map(c => {
                                const sel = selectedCourses.includes(c.id);
                                return (
                                    <button key={c.id} onClick={() => setSelectedCourses(p => sel ? p.filter(x => x !== c.id) : [...p, c.id])}
                                        className={`w-full text-left flex items-center justify-between p-3.5 rounded-lg border transition-colors ${sel ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border ${sel ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-300'}`}>
                                                {sel && <MdCheckCircle className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase">{c.code}</span>
                                                    <span className="font-medium text-slate-800 text-sm">{c.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{c.credit_hours} Credits • {c.department_name}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
                            <button onClick={() => setShowAddCourse(false)} disabled={addingCourses} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancel</button>
                            <button onClick={handleAddCourses} disabled={!selectedCourses.length || addingCourses}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors">
                                <MdAdd className="w-4 h-4" />
                                {addingCourses ? 'Adding...' : `Add ${selectedCourses.length} as ${courseType}`}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Manage PLOs Modal */}
            {showPloModal && createPortal(
                <div className="campus-modal-shell fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Manage Batch PLOs</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Select which PLOs apply to this specific batch</p>
                            </div>
                            <button onClick={() => setShowPloModal(false)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {allPlos.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 text-sm">No PLOs defined for your department. Please add them globally first.</p>
                            ) : (
                                <div className="space-y-2">
                                    {allPlos.map(plo => {
                                        const isSelected = selectedPloIds.includes(plo.id);
                                        return (
                                            <div key={plo.id} 
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedPloIds(prev => prev.filter(id => id !== plo.id));
                                                    } else {
                                                        setSelectedPloIds(prev => [...prev, plo.id]);
                                                    }
                                                }}
                                                data-selected={isSelected}
                                                className={`campus-choice-card flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                                                    isSelected ? 'border-sky-400 bg-sky-50' : 'border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                                                }`}
                                            >
                                                <div data-selected={isSelected} className="campus-choice-check mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all">
                                                    <MdCheckCircle className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 text-sm">PLO {plo.plo_number}</h4>
                                                    <p className="text-xs text-slate-600 mt-0.5">{plo.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setShowPloModal(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveBatchPlos} disabled={savingPlos} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium text-sm transition-colors disabled:opacity-50">
                                {savingPlos ? 'Saving...' : 'Save PLOs'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Course Delete Confirmation Modal */}
            {courseToDelete && createPortal(
                <div className="campus-modal-shell fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                <MdDelete className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Remove Course?</h3>
                            <p className="text-slate-500 text-sm mb-1">
                                Are you sure you want to remove <strong>{courseToDelete.code}</strong> from Semester {activeSemester}?
                            </p>
                            <p className="text-red-500 text-xs font-medium">This will also delete any related class schedules and attendance records.</p>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                            <button onClick={() => setCourseToDelete(null)} disabled={removingCourseId !== null} 
                                className="px-4 py-2 text-slate-700 font-medium text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleRemoveCourse} disabled={removingCourseId !== null} 
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm font-medium text-sm transition-colors disabled:opacity-50">
                                {removingCourseId !== null ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Removing...
                                    </>
                                ) : 'Remove Course'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Curriculum Selection Modal */}
            {showCurriculumModal && createPortal(
                <div className="campus-modal-shell fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div> Assign Curriculum
                            </h3>
                            <button onClick={() => setShowCurriculumModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Select Curriculum</label>
                            <select
                                value={selectedCurriculumId}
                                onChange={(e) => setSelectedCurriculumId(e.target.value)}
                                disabled={assigningCurriculum}
                                className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-700 disabled:opacity-50 appearance-none bg-white"
                            >
                                <option value="">No Curriculum</option>
                                {curricula.map(c => <option key={c.id} value={c.id}>{c.name} ({c.department_name})</option>)}
                            </select>
                            
                            {batchData.curriculum_id && selectedCurriculumId == batchData.curriculum_id && (
                                <div className="mt-4 flex items-center justify-center">
                                    <Link onClick={() => setShowCurriculumModal(false)} to={`/admin-curricula/${batchData.curriculum_id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm font-medium transition-colors">
                                        <MdMenuBook className="w-4 h-4" /> View Blueprint
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                            <button onClick={() => setShowCurriculumModal(false)} className="px-4 py-2 text-slate-700 font-medium text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleCurriculumChange(selectedCurriculumId ? parseInt(selectedCurriculumId) : null)} 
                                disabled={assigningCurriculum || (selectedCurriculumId == (batchData.curriculum_id || ''))}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {assigningCurriculum ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BatchDetails;
