import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdPeople, MdAccessTime, MdArrowForward, MdMenuBook, MdAdd, MdDelete, MdClose, MdSearch, MdCheckCircle, MdSchool, MdLibraryBooks, MdInfo, MdSchedule } from 'react-icons/md';
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

    // PLO Modal
    const [showPloModal, setShowPloModal] = useState(false);
    const [allPlos, setAllPlos] = useState([]);
    const [selectedPloIds, setSelectedPloIds] = useState([]);
    const [savingPlos, setSavingPlos] = useState(false);

    const semColors = [
        'from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600', 'from-cyan-500 to-sky-600',
        'from-red-500 to-orange-600', 'from-teal-500 to-green-600',
    ];

    const { data: batchData, isLoading: loading, error: batchError } = useQuery({
        queryKey: ['batch', id],
        queryFn: async () => {
            const res = await batchApi.getById(id);
            if (res.success) return res.data;
            throw new Error('Failed to load batch');
        }
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
        enabled: !!batchData?.curriculum_id
    });

    const handleCurriculumChange = async (val) => {
        setAssigningCurriculum(true);
        try {
            await batchApi.update(id, { curriculum_id: val || null });
            toast.success(val ? 'Curriculum assigned — courses copied to batch' : 'Curriculum removed');
            await queryClient.invalidateQueries(['batch', id]);
            if (val) await queryClient.invalidateQueries(['batchCourses', id]);
            setActiveSemester(1);
        } catch (e) { toast.error('Failed to update curriculum'); }
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
    const handleRemoveCourse = async (courseId) => {
        if (!window.confirm('Remove this course from this batch?')) return;
        setRemovingCourseId(courseId);
        try {
            await batchApi.removeBatchCourse(id, activeSemester, courseId);
            toast.success('Course removed from batch');
            fetchBatchCourses();
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
                queryClient.invalidateQueries(['batch', id]);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                <div className="grid grid-cols-3 gap-5 mb-10">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                </div>
            </div>
        </div>
    );

    if (!batchData) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 flex items-center justify-center">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{batchData.name}</h1>
                    </div>
                    <div className="ml-5 flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">{batchData.status || 'Active'}</span>
                        <span className="text-sm text-slate-500">{batchData.department_name}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {[
                        { label: 'Students', value: batchData.student_count || 0, icon: MdPeople, color: 'from-blue-500 to-indigo-600', link: `/admin-managebatches/${id}/students` },
                        { label: 'Status', value: batchData.status || 'active', icon: MdAccessTime, color: 'from-violet-500 to-purple-600' },
                        { label: 'Duration', value: batchData.start_date ? `${new Date(batchData.start_date).getFullYear()} - ${batchData.end_date ? new Date(batchData.end_date).getFullYear() : '...'}` : 'N/A', icon: MdSchool, color: 'from-emerald-500 to-teal-600' },
                    ].map((s, i) => {
                        const card = (
                            <div className={`group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all ${s.link ? 'cursor-pointer' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} mb-4 shadow-lg`}>
                                            <s.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <p className="text-slate-500 text-sm mb-1">{s.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{s.value}</h3>
                                    </div>
                                    {s.link && <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><MdArrowForward className="w-5 h-5" /></div>}
                                </div>
                            </div>
                        );
                        return s.link ? <Link key={i} to={s.link}>{card}</Link> : <div key={i}>{card}</div>;
                    })}
                </div>

                {/* PLOs Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Program Learning Outcomes (PLOs)</h3>
                        </div>
                        <p className="text-sm text-slate-500 ml-5">
                            {batchData.plos && batchData.plos.length > 0 
                                ? `${batchData.plos.length} PLOs attached to this batch` 
                                : 'No PLOs attached to this batch'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {batchData.plos && batchData.plos.length > 0 && (
                            <div className="flex -space-x-2">
                                {batchData.plos.slice(0, 5).map(plo => (
                                    <div key={plo.id} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm" title={plo.description}>
                                        <span className="text-xs font-bold text-white text-center leading-none">
                                            PLO<br/>{plo.plo_number}
                                        </span>
                                    </div>
                                ))}
                                {batchData.plos.length > 5 && (
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm text-slate-600 text-xs font-bold">
                                        +{batchData.plos.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={handleOpenPloModal} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                            Manage PLOs
                        </button>
                    </div>
                </div>

                {/* Curriculum Assignment */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                        <h3 className="text-xl font-bold text-slate-800">Curriculum</h3>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Assign curriculum to this batch</label>
                            <select
                                value={batchData.curriculum_id || ''}
                                onChange={(e) => handleCurriculumChange(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={assigningCurriculum}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 disabled:opacity-50"
                            >
                                <option value="">No Curriculum</option>
                                {curricula.map(c => <option key={c.id} value={c.id}>{c.name} ({c.department_name})</option>)}
                            </select>
                        </div>
                        {batchData.curriculum_id && (
                            <Link to={`/admin-curricula/${batchData.curriculum_id}`} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all whitespace-nowrap">
                                <MdMenuBook className="w-4 h-4" /> View Blueprint
                            </Link>
                        )}
                    </div>

                    {/* Info banner: explain that edits here don't affect the curriculum */}
                    {batchData.curriculum_id && (
                        <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <MdInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700">
                                Courses below are a copy from <strong>{batchCourseData?.curriculum_name || 'the curriculum'}</strong>. 
                                Adding or removing courses here only affects this batch — the original curriculum is not changed.
                            </p>
                        </div>
                    )}
                </div>

                {/* Semester Tabs + Courses (reads from batch_semester_courses) */}
                {loadingCourses ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                        <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium text-sm">Loading semester details...</p>
                    </div>
                ) : batchCourseData && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Semester Tabs */}
                        <div className="flex overflow-x-auto border-b border-slate-100">
                            {batchCourseData.semesters?.map((sem) => {
                                const isActive = sem.semester_number === activeSemester;
                                const count = sem.courses?.length || 0;
                                return (
                                    <button key={sem.semester_number} onClick={() => setActiveSemester(sem.semester_number)}
                                        className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-all relative ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                        <span className="flex items-center gap-2">
                                            Sem {sem.semester_number}
                                            {count > 0 && <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
                                        </span>
                                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Courses Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">
                                    Semester {activeSemester}
                                    <span className="text-sm font-normal text-slate-400 ml-2">({(coreCourses.length + electiveCourses.length)} courses)</span>
                                </h3>
                                <button onClick={handleOpenAddCourse} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
                                    <MdAdd className="w-5 h-5" /> Add Courses
                                </button>
                            </div>

                            {coreCourses.length === 0 && electiveCourses.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <MdLibraryBooks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 mb-4">No courses in this semester</p>
                                    <button onClick={handleOpenAddCourse} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium text-sm">
                                        <MdAdd className="w-4 h-4" /> Add Courses
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Core Courses */}
                                    {coreCourses.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Core Courses ({coreCourses.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {coreCourses.map(c => (
                                                    <div key={c.course_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                                        <Link to={`/admin-managebatches/${id}/course/${c.course_id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${semColors[(activeSemester-1) % semColors.length]} flex items-center justify-center shadow-sm`}>
                                                                <MdMenuBook className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">{c.code}</span>
                                                                    <h4 className="font-semibold text-slate-800">{c.title}</h4>
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-0.5">{c.credit_hours} Credits</p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex items-center gap-1">
                                                            <Link to={`/admin-managebatches/${id}/course/${c.course_id}`}
                                                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Set Schedule">
                                                                <MdSchedule className="w-5 h-5" />
                                                            </Link>
                                                            <button onClick={() => handleRemoveCourse(c.course_id)} disabled={removingCourseId === c.course_id}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                                <MdDelete className="w-5 h-5" />
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
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-amber-500"></div> Elective Courses ({electiveCourses.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {electiveCourses.map(c => (
                                                    <div key={c.course_id} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-white hover:shadow-md transition-all group">
                                                        <Link to={`/admin-managebatches/${id}/course/${c.course_id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                                                                <MdMenuBook className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">{c.code}</span>
                                                                    <h4 className="font-semibold text-slate-800">{c.title}</h4>
                                                                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-medium">Elective</span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-0.5">{c.credit_hours} Credits</p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex items-center gap-1">
                                                            <Link to={`/admin-managebatches/${id}/course/${c.course_id}`}
                                                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Set Schedule">
                                                                <MdSchedule className="w-5 h-5" />
                                                            </Link>
                                                            <button onClick={() => handleRemoveCourse(c.course_id)} disabled={removingCourseId === c.course_id}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                                <MdDelete className="w-5 h-5" />
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
            {showAddCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800">Add Courses — Semester {activeSemester}</h2>
                            </div>
                            <button onClick={() => setShowAddCourse(false)} disabled={addingCourses} className="p-2 hover:bg-slate-100 rounded-lg"><MdClose className="w-5 h-5 text-slate-500" /></button>
                        </div>

                        {/* Type Toggle + Search */}
                        <div className="p-4 border-b border-slate-100 space-y-3">
                            <div className="flex gap-2">
                                <button onClick={() => setCourseType('core')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${courseType === 'core' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Core Course
                                </button>
                                <button onClick={() => setCourseType('elective')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${courseType === 'elective' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Elective Course
                                </button>
                            </div>
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} autoFocus
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white" />
                            </div>
                            {selectedCourses.length > 0 && <p className="text-sm text-indigo-600 font-medium">{selectedCourses.length} selected</p>}
                        </div>

                        {/* Course List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredAvailable().length === 0 ? (
                                <div className="text-center py-12"><p className="text-slate-400">No courses available</p></div>
                            ) : filteredAvailable().map(c => {
                                const sel = selectedCourses.includes(c.id);
                                return (
                                    <button key={c.id} onClick={() => setSelectedCourses(p => sel ? p.filter(x => x !== c.id) : [...p, c.id])}
                                        className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all ${sel ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel ? 'bg-indigo-500' : 'bg-slate-100'}`}>
                                                {sel ? <MdCheckCircle className="w-5 h-5 text-white" /> : <MdMenuBook className="w-4 h-4 text-slate-400" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">{c.code}</span>
                                                    <span className="font-medium text-slate-800 text-sm">{c.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{c.credit_hours} Credits • {c.department_name}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                            <button onClick={() => setShowAddCourse(false)} disabled={addingCourses} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-xl hover:bg-white disabled:opacity-50">Cancel</button>
                            <button onClick={handleAddCourses} disabled={!selectedCourses.length || addingCourses}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all">
                                <MdAdd className="w-4 h-4" />
                                {addingCourses ? 'Adding...' : `Add ${selectedCourses.length} as ${courseType}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Manage PLOs Modal */}
            {showPloModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Manage Batch PLOs</h2>
                                <p className="text-sm text-slate-500">Select which PLOs apply to this specific batch</p>
                            </div>
                            <button onClick={() => setShowPloModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {allPlos.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No PLOs defined for your department. Please add them globally first.</p>
                            ) : (
                                <div className="space-y-3">
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
                                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isSelected ? 'border-violet-500 bg-violet-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                                                    isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 bg-white text-transparent'
                                                }`}>
                                                    <MdCheckCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">PLO {plo.plo_number}</h4>
                                                    <p className="text-sm text-slate-600 mt-1">{plo.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setShowPloModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl font-medium text-sm transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveBatchPlos} disabled={savingPlos} className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                {savingPlos ? 'Saving...' : 'Save PLOs'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchDetails;