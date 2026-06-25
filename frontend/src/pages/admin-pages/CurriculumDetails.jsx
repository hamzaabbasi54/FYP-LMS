import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdAdd, MdDelete, MdSearch, MdClose, MdMenuBook, MdSchool, MdLibraryBooks, MdGroups, MdCheckCircle, MdChevronRight } from 'react-icons/md';
import { curriculumApi, courseApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CurriculumDetails = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [activeSemester, setActiveSemester] = useState(1);

    // Add Course Modal State
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [showBatchesModal, setShowBatchesModal] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [courseType, setCourseType] = useState('core');
    const [courseToDelete, setCourseToDelete] = useState(null);

    const semesterColors = [
        'from-indigo-500 to-blue-600',
        'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-sky-600',
        'from-red-500 to-orange-600',
        'from-teal-500 to-green-600',
    ];

    const { data: curriculum, isLoading: loading } = useQuery({
        queryKey: ['curriculum', id],
        queryFn: async () => {
            const response = await curriculumApi.getById(id);
            if (response.success) return response.data;
            throw new Error('Failed to load curriculum');
        }
    });

    const { data: allCourses = [] } = useQuery({
        queryKey: ['allCoursesList'],
        queryFn: async () => {
            const response = await courseApi.getAllList();
            if (response.success) return response.data || [];
            return [];
        },
        enabled: showAddCourse
    });

    const handleOpenAddCourse = () => {
        setSelectedCourses([]);
        setCourseSearch('');
        setCourseType('core');
        setShowAddCourse(true);
    };

    const handleToggleCourse = (courseId) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const addCoursesMutation = useMutation({
        mutationFn: (data) => curriculumApi.addCourses(id, activeSemester, data),
        onSuccess: (response) => {
            const addedCount = response.data?.added?.length || 0;
            const errorCount = response.data?.errors?.length || 0;
            if (addedCount > 0) toast.success(`${addedCount} course(s) added to Semester ${activeSemester}`);
            if (errorCount > 0) {
                response.data.errors.forEach(err => {
                    toast.warn(`Course ID ${err.course_id}: ${err.error}`);
                });
            }
            setShowAddCourse(false);
            queryClient.invalidateQueries({ queryKey: ['curriculum', id] });
        },
        onError: (error) => {
            console.error('Error adding courses:', error);
            toast.error(error.response?.data?.message || 'Failed to add courses');
        }
    });

    const handleAddCourses = () => {
        if (selectedCourses.length === 0) {
            toast.error('Select at least one course');
            return;
        }
        addCoursesMutation.mutate({ course_ids: selectedCourses, type: courseType });
    };

    const removeCourseMutation = useMutation({
        mutationFn: (courseId) => curriculumApi.removeCourse(id, activeSemester, courseId),
        onSuccess: () => {
            toast.success('Course removed');
            setCourseToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['curriculum', id] });
        },
        onError: (error) => {
            console.error('Error removing course:', error);
            toast.error('Failed to remove course');
            setCourseToDelete(null);
        }
    });

    const handleRemoveCourse = () => {
        if (!courseToDelete) return;
        removeCourseMutation.mutate(courseToDelete.course_id);
    };

    // Get all course IDs already in any semester of this curriculum
    const getExistingCourseIds = () => {
        if (!curriculum?.semesters) return new Set();
        const ids = new Set();
        curriculum.semesters.forEach(sem => {
            sem.courses?.forEach(c => ids.add(c.course_id));
        });
        return ids;
    };

    // Filter courses for the modal
    const getFilteredAvailableCourses = () => {
        const existingIds = getExistingCourseIds();
        return allCourses.filter(c => {
            const matchesSearch = !courseSearch ||
                c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                c.code.toLowerCase().includes(courseSearch.toLowerCase());
            return matchesSearch && !existingIds.has(c.id);
        });
    };

    if (loading) {
        return (
            <div className="campus-detail-page min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                        <div className="h-48 bg-slate-200 rounded-2xl mb-6"></div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!curriculum) {
        return (
            <div className="campus-detail-page min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-600 mb-2">Curriculum not found</h2>
                    <Link to="/admin-curricula" className="text-indigo-600 hover:underline">Back to Curricula</Link>
                </div>
            </div>
        );
    }

    const activeSemesterData = curriculum.semesters?.find(s => s.semester_number === activeSemester);
    const activeCourses = activeSemesterData?.courses || [];
    const coreCourses = activeCourses.filter(c => c.type === 'core');
    const electiveCourses = activeCourses.filter(c => c.type === 'elective');

    // Stats
    const totalCourses = curriculum.semesters?.reduce((sum, s) => sum + (s.courses?.length || 0), 0) || 0;
    const totalCredits = curriculum.semesters?.reduce((sum, s) => {
        return sum + (s.courses?.reduce((cSum, c) => cSum + (c.credit_hours || 0), 0) || 0);
    }, 0) || 0;

    return (
        <div className="campus-detail-page min-h-full bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-curricula" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Curricula
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            {curriculum.name}
                        </h1>
                    </div>
                    <div className="ml-5 flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
                            {curriculum.status || 'Active'}
                        </span>
                        <span className="text-sm text-slate-500">{curriculum.department_name}</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Semesters', value: curriculum.semesters?.length || 0, icon: MdSchool, color: 'from-indigo-500 to-blue-600' },
                        { label: 'Total Courses', value: totalCourses, icon: MdLibraryBooks, color: 'from-emerald-500 to-teal-600' },
                        { label: 'Total Credits', value: totalCredits, icon: MdMenuBook, color: 'from-violet-500 to-purple-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/90 rounded-2xl border border-sky-100 p-5 shadow-sm hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs mb-0.5">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Batches Using Card - Clickable */}
                    <button 
                        onClick={() => setShowBatchesModal(true)}
                        className="bg-white/90 rounded-2xl border border-sky-100 p-5 shadow-sm hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 transition-all text-left text-inherit block w-full group relative"
                    >
                        <div className="flex items-start gap-4">
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm transition-all">
                                <MdGroups className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-0.5">Batches Using</p>
                                <h3 className="text-2xl font-bold text-slate-800">{curriculum.assigned_batches?.length || 0}</h3>
                            </div>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-sky-600 transition-colors group-hover:translate-x-1 duration-200">
                            <MdChevronRight className="w-6 h-6" />
                        </div>
                    </button>
                </div>

                {/* Semester Tabs */}
                <div className="bg-white/90 rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    {/* Tab Header */}
                    <div className="flex overflow-x-auto border-b border-slate-100 scrollbar-hide">
                        {curriculum.semesters?.map((sem) => {
                            const isActive = sem.semester_number === activeSemester;
                            const courseCount = sem.courses?.length || 0;
                            return (
                                <button
                                    key={sem.id}
                                    onClick={() => setActiveSemester(sem.semester_number)}
                                    className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-all relative
                                        ${isActive
                                            ? 'text-sky-700 bg-sky-50/70'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        Sem {sem.semester_number}
                                        {courseCount > 0 && (
                                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                                                ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {courseCount}
                                            </span>
                                        )}
                                    </span>
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                Semester {activeSemester} Courses
                                <span className="text-sm font-normal text-slate-400 ml-2">
                                    ({activeCourses.length} courses, {activeCourses.reduce((s, c) => s + (c.credit_hours || 0), 0)} credit hours)
                                </span>
                            </h3>
                            <button
                                onClick={handleOpenAddCourse}
                                className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-semibold shadow-sm hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-500/20 transition-all text-sm"
                            >
                                <MdAdd className="w-5 h-5" />
                                Add Courses
                            </button>
                        </div>

                        {activeCourses.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <MdLibraryBooks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 mb-4">No courses in this semester yet</p>
                                <button
                                    onClick={handleOpenAddCourse}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-sky-700"
                                >
                                    <MdAdd className="w-4 h-4" /> Add Courses
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {coreCourses.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Core Courses ({coreCourses.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {coreCourses.map((course) => (
                                                <div key={course.course_id} className="flex items-center justify-between p-4 bg-white border border-sky-100 rounded-2xl shadow-sm hover:border-sky-200 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl border border-sky-100 bg-sky-50 flex items-center justify-center shadow-sm">
                                                            <MdMenuBook className="w-5 h-5 text-sky-700" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">{course.code}</span>
                                                                <h4 className="font-semibold text-slate-800">{course.title}</h4>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-0.5">{course.credit_hours} Credits • {course.department_name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setCourseToDelete(course)} disabled={removeCourseMutation.isPending && removeCourseMutation.variables === course.course_id}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {electiveCourses.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div> Elective Courses ({electiveCourses.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {electiveCourses.map((course) => (
                                                <div key={course.course_id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100 hover:bg-amber-50/30 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl border border-amber-100 bg-amber-50 flex items-center justify-center shadow-sm">
                                                            <MdMenuBook className="w-5 h-5 text-amber-700" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">{course.code}</span>
                                                                <h4 className="font-semibold text-slate-800">{course.title}</h4>
                                                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-medium">Elective</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-0.5">{course.credit_hours} Credits • {course.department_name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setCourseToDelete(course)} disabled={removeCourseMutation.isPending && removeCourseMutation.variables === course.course_id}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assigned Batches Section Removed from here */}
            </div>

            {/* Add Course Modal */}
            {showAddCourse && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-[1.35rem] border border-sky-100 bg-white shadow-[0_30px_90px_rgba(15,82,127,0.22)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between bg-white p-5 border-b border-sky-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 flex items-center justify-center shadow-sm">
                                    <MdMenuBook className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Add Courses to Semester {activeSemester}
                                </h2>
                            </div>
                            <button onClick={() => setShowAddCourse(false)} disabled={addCoursesMutation.isPending} className="p-2 hover:bg-white rounded-xl transition-colors disabled:opacity-50">
                                <MdClose className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Type Toggle + Search */}
                        <div className="p-5 border-b border-sky-100 space-y-3 bg-[#eff8ff]">
                            <div className="flex gap-2">
                                <button onClick={() => setCourseType('core')} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${courseType === 'core' ? 'border-transparent bg-[#0078c5] text-white shadow-[0_10px_22px_rgba(7,152,231,0.18)]' : 'border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>
                                    Core Course
                                </button>
                                <button onClick={() => setCourseType('elective')} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${courseType === 'elective' ? 'border-orange-200 bg-orange-50 text-orange-700 shadow-[0_10px_22px_rgba(251,146,60,0.12)]' : 'border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>
                                    Elective Course
                                </button>
                            </div>
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} autoFocus
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-sky-100 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 focus:bg-white transition-all" />
                            </div>
                            {selectedCourses.length > 0 && <p className="text-sm text-indigo-600 font-medium">{selectedCourses.length} selected</p>}
                        </div>

                        {/* Course List */}
                        <div className="min-h-52 flex-1 overflow-y-auto bg-white p-5 space-y-2">
                            {getFilteredAvailableCourses().length === 0 ? (
                                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-sky-100 bg-sky-50/45 text-center">
                                    <p className="text-slate-400">
                                        {courseSearch ? 'No courses match your search' : 'All courses are already assigned to this curriculum'}
                                    </p>
                                </div>
                            ) : (
                                getFilteredAvailableCourses().map(course => {
                                    const isSelected = selectedCourses.includes(course.id);
                                    return (
                                        <button
                                            key={course.id}
                                            onClick={() => handleToggleCourse(course.id)}
                                            className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all
                                                ${isSelected
                                                    ? 'border-sky-200 bg-sky-50/70 shadow-sm'
                                                    : 'border-sky-100 bg-white hover:bg-sky-50/40 hover:border-sky-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                                    ${isSelected ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                                                    {isSelected ? (
                                                        <MdCheckCircle className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <MdMenuBook className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">{course.code}</span>
                                                        <span className="font-medium text-slate-800 text-sm">{course.title}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {course.credit_hours} Credits • {course.department_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-sky-100 bg-[#eff8ff]">
                            <button onClick={() => setShowAddCourse(false)} disabled={addCoursesMutation.isPending}
                                className="rounded-xl border border-sky-100 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-sky-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleAddCourses} disabled={!selectedCourses.length || addCoursesMutation.isPending}
                                className="flex items-center gap-2 rounded-xl bg-[#0078c5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#05629f] disabled:cursor-not-allowed disabled:bg-sky-200 disabled:shadow-none">
                                <MdAdd className="w-4 h-4" />
                                {addCoursesMutation.isPending ? 'Adding...' : `Add ${selectedCourses.length} as ${courseType}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Course Delete Confirmation Modal */}
            {courseToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                <MdDelete className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Remove Course?</h3>
                            <p className="text-slate-500 text-sm mb-1">
                                Are you sure you want to remove <strong>{courseToDelete.code}</strong> from Semester {activeSemester}?
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                            <button onClick={() => setCourseToDelete(null)} disabled={removeCourseMutation.isPending} 
                                className="px-4 py-2 text-slate-700 font-medium text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleRemoveCourse} disabled={removeCourseMutation.isPending} 
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm font-medium text-sm transition-colors disabled:opacity-50">
                                {removeCourseMutation.isPending ? (
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

            {/* Batches Using Modal */}
            {showBatchesModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-sky-100 shadow-2xl shadow-sky-900/10 w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-sky-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl border border-sky-100 bg-white text-sky-700 flex items-center justify-center shadow-sm">
                                    <MdGroups className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Batches Using Curriculum
                                </h2>
                            </div>
                            <button onClick={() => setShowBatchesModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                <MdClose className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {!curriculum.assigned_batches || curriculum.assigned_batches.length === 0 ? (
                                <p className="text-center text-slate-500 py-6 text-sm">No batches are currently using this curriculum.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {curriculum.assigned_batches.map(batch => (
                                        <Link
                                            key={batch.id}
                                            to={`/admin-managebatches/${batch.id}`}
                                            onClick={() => setShowBatchesModal(false)}
                                            className="flex items-center gap-3 p-3 bg-white border border-sky-100 rounded-2xl hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-all text-slate-700 font-semibold"
                                        >
                                            <div className="w-8 h-8 rounded-xl border border-sky-100 bg-sky-50 flex items-center justify-center">
                                                <MdGroups className="w-4 h-4 text-sky-700" />
                                            </div>
                                            {batch.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CurriculumDetails;
