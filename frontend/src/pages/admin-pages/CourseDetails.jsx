import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdAccessTime, MdInfoOutline, MdAccountBalance } from 'react-icons/md';
import { courseApi } from '../../services/api';

import { useQuery } from '@tanstack/react-query';

const CourseDetails = () => {
    const { id } = useParams();

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
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <MdAccountBalance className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Course Learning Outcomes (CLOs)</h2>
                            <p className="text-sm text-slate-500">Skills and knowledge students will acquire</p>
                        </div>
                    </div>

                    {clos.length === 0 ? (
                        <div className="text-center py-10 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-slate-200 border-dashed">
                            <p className="text-slate-500">No CLOs have been defined for this course.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {clos.map((clo, index) => (
                                <div key={clo.id || index} className="group relative bg-white border-2 border-slate-300 shadow-sm rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold border border-indigo-100">
                                                CLO {clo.clo_number}
                                            </span>
                                            <h3 className="font-bold text-slate-800">{clo.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4 h-10 overflow-hidden line-clamp-2" title={clo.description}>
                                        {clo.description || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                                        {clo.cognitive_level && (
                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                                {clo.cognitive_level}
                                            </span>
                                        )}
                                        {clo.plo_mapping && (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">
                                                Mapped to: {clo.plo_mapping}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
