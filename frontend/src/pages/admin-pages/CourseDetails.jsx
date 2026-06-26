import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdAccessTime, MdInfoOutline, MdAccountBalance, MdAdd, MdDelete } from 'react-icons/md';
import { courseApi } from '../../services/api';
import MapCourseCLOModal from './MapCourseCLOModal';
import OverlayLoader from '../../components/common/OverlayLoader';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useUndoStore from '../../stores/useUndoStore';

const CourseDetails = () => {
    const { id } = useParams();
    const [showCLOModal, setShowCLOModal] = useState(false);
    const [cloToDelete, setCloToDelete] = useState(null);
    const queryClient = useQueryClient();
    
    const enqueueUndo = useUndoStore(s => s.enqueue);
    const pendingDeletions = useUndoStore(s => s.pendingDeletions);
    
    // Check if any CLO from this course is currently waiting in the undo queue
    const isDeletingCLO = pendingDeletions.some(p => p.id.startsWith(`delete-clo-${id}-`));

    const confirmDelete = () => {
        if (!cloToDelete) return;
        const cloId = cloToDelete.id;
        const cloTitle = cloToDelete.title || `CLO-${cloToDelete.clo_number}`;
        setCloToDelete(null);

        // Optimistically remove from UI
        const previousData = queryClient.getQueryData(['course', String(id)]);
        queryClient.setQueryData(['course', String(id)], old => {
            if (!old) return old;
            return {
                ...old,
                clos: old.clos.filter(c => c.id !== cloId)
            };
        });

        enqueueUndo({
            id: `delete-clo-${id}-${cloId}`,
            type: 'Course CLO',
            label: cloTitle,
            apiCall: async () => {
                await courseApi.deleteCLO(id, cloId);
                queryClient.invalidateQueries({ queryKey: ['course', String(id)] });
            },
            onUndo: () => {
                queryClient.setQueryData(['course', String(id)], previousData);
            }
        });
    };

    const { data: course, isLoading: loading } = useQuery({
        queryKey: ['course', id],
        queryFn: async () => {
            const response = await courseApi.getById(id);
            if (response.success) return response.data;
            throw new Error('Failed to load course details');
        }
    });

    if (loading) {
        return (
            <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center">
                <div className="text-slate-500 font-medium">Loading course details...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center flex-col gap-4">
                <div className="text-slate-500 font-medium text-lg">Course not found</div>
                <Link to="/admin-managecourses" className="text-blue-600 hover:underline">Return to Course Catalog</Link>
            </div>
        );
    }

    const { clos = [] } = course;

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Link to="/admin-managecourses" className="hover:text-blue-600 flex items-center">
                        <MdArrowBack className="mr-1" /> Back to Courses
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-800">{course.code}</span>
                </div>

                {/* Header Section */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wide">
                                    {course.code}
                                </span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                    {course.department_name || 'No Department'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{course.title}</h1>
                            <p className="text-slate-600 leading-relaxed max-w-3xl">
                                {course.description || 'No description provided for this course.'}
                            </p>
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-4 bg-slate-50 p-5 rounded-xl border-2 border-slate-200 min-w-[200px]">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <MdAccessTime className="w-4 h-4" /> Credit Hours
                                </p>
                                <p className="text-2xl font-bold text-slate-800">{course.credit_hours}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <MdInfoOutline className="w-4 h-4" /> Prerequisites
                                </p>
                                {course.prerequisite_courses && course.prerequisite_courses.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {course.prerequisite_courses.map(p => (
                                            <Link key={p.id} to={`/admin-managecourses/${p.id}`}
                                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                                                {p.code}
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-slate-800">{course.prerequisites || 'None'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CLO Section */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                <MdAccountBalance className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Course Learning Outcomes (CLOs)</h2>
                                <p className="text-sm text-slate-500">Skills and knowledge students will acquire</p>
                            </div>
                        </div>
                        {clos.length > 0 && (
                            <button 
                                onClick={() => setShowCLOModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-xl font-semibold text-sm transition-colors border border-indigo-200"
                            >
                                <MdAdd className="w-4 h-4" /> Manage CLOs
                            </button>
                        )}
                    </div>

                    {clos.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl shadow-sm">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <MdAccountBalance className="w-8 h-8 text-indigo-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No CLOs Defined</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                This course doesn't have any global Learning Outcomes. Add them here to serve as the blueprint for all future semesters.
                            </p>
                            <button 
                                onClick={() => setShowCLOModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all"
                            >
                                <MdAdd className="w-5 h-5" /> Add CLOs to Course
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {clos.map((clo, index) => (
                                <div key={clo.id || index} className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 hover:shadow-sm transition-all gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                                {clo.title || `CLO-${clo.clo_number}`}
                                            </span>
                                            {clo.cognitive_level && (
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                                                    {clo.cognitive_level}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                                        <p className="text-sm text-slate-600 truncate flex-1" title={clo.description}>
                                            {clo.description || 'No description provided.'}
                                        </p>
                                    </div>
                                    {(clo.plo_mapping || (clo.mapped_plos && clo.mapped_plos.length > 0)) && (
                                        <div className="shrink-0 flex items-center gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium">PLOs:</span>
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold mr-2">
                                                {clo.plo_mapping || clo.mapped_plos?.length || 0}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setCloToDelete(clo)}
                                        className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove CLO from course"
                                    >
                                        <MdDelete className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <OverlayLoader isLoading={isDeletingCLO} text="Removing CLO from course..." />

            {/* Custom Confirmation Modal */}
            {cloToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4 text-red-600">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <MdDelete className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Remove CLO</h3>
                            </div>
                            <p className="text-slate-600 mb-2">
                                Are you sure you want to remove <strong>{cloToDelete.title || `CLO-${cloToDelete.clo_number}`}</strong> from this course?
                            </p>
                            <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                This action only detaches it from the global catalog blueprint. Previous semesters using this CLO will remain unaffected.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={() => setCloToDelete(null)}
                                className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Yes, Remove It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MapCourseCLOModal 
                isOpen={showCLOModal}
                onClose={() => setShowCLOModal(false)}
                courseId={course.id}
                existingClos={clos}
            />
        </div>
    );
};

export default CourseDetails;
