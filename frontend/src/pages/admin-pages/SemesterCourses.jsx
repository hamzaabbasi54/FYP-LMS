import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdAdd, MdBook, MdClose, MdPerson, MdPersonAdd, MdCheck } from 'react-icons/md';
import { batchApi, courseApi, approvalApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SemesterCourses = () => {
    const queryClient = useQueryClient();
    const { id, semesterId } = useParams();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [facultySearch, setFacultySearch] = useState('');

    const { data: semesterDataResult, isLoading: loading } = useQuery({
        queryKey: ['semesterCourses', id, semesterId],
        queryFn: async () => {
            const response = await batchApi.getSemester(id, semesterId);
            if (response.success) {
                const semester = response.data;
                return {
                    semesterData: {
                        title: `${semester.name} Courses`,
                        batchName: semester.batchName,
                        semesterName: semester.name
                    },
                    courses: semester.courses || []
                };
            }
            throw new Error('Failed to load semester courses');
        }
    });

    const semesterData = semesterDataResult?.semesterData || null;
    const courses = semesterDataResult?.courses || [];

    const filteredCourses = courses.filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Add-Course Modal Logic ---
    const { data: availableCourses = [], isLoading: availableLoading } = useQuery({
        queryKey: ['availableCourses', id, semesterId],
        enabled: isAssignModalOpen,
        queryFn: async () => {
            const response = await courseApi.getAll({ limit: 1000 });
            if (response.success) {
                const assignedIds = courses.map(c => c.course_id || c.id);
                return (response.data || []).filter(c => !assignedIds.includes(c.id));
            }
            throw new Error('Failed to load available courses');
        }
    });

    const assignCourseMutation = useMutation({
        mutationFn: (courseId) => courseApi.assign({
            course_id: courseId,
            semester_id: parseInt(semesterId),
            faculty_id: null
        }),
        onSuccess: () => {
            toast.success('Course assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['semesterCourses', id, semesterId] });
            queryClient.invalidateQueries({ queryKey: ['availableCourses', id, semesterId] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to assign course');
        }
    });

    const handleOpenAssignModal = () => setIsAssignModalOpen(true);

    const handleAssignCourse = (courseId) => {
        assignCourseMutation.mutate(courseId);
    };

    const filteredAvailableCourses = availableCourses.filter(c =>
        (c.title || '').toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(modalSearchQuery.toLowerCase())
    );

    // --- Course Details Modal ---
    const courseIdForDetails = selectedCourse?.course_id || selectedCourse?.id;
    const { data: courseDetails, isLoading: detailsLoading } = useQuery({
        queryKey: ['courseDetails', courseIdForDetails],
        enabled: !!courseIdForDetails,
        queryFn: async () => {
            const response = await courseApi.getById(courseIdForDetails);
            if (response.success) return response.data;
            throw new Error('Failed to load course details');
        }
    });

    const handleCourseClick = (course) => {
        setSelectedCourse(course);
    };

    const closeCourseDetails = () => {
        setSelectedCourse(null);
    };

    // --- Faculty Assign Modal ---
    const { data: facultyList = [], isLoading: facultyLoading } = useQuery({
        queryKey: ['facultyList'],
        enabled: showFacultyModal,
        queryFn: async () => {
            const res = await approvalApi.getUsersByRole('faculty');
            if (res.success) return res.data || [];
            throw new Error('Failed to load faculty');
        }
    });

    const handleOpenFacultyModal = () => {
        setShowFacultyModal(true);
        setFacultySearch('');
    };

    const assignFacultyMutation = useMutation({
        mutationFn: ({ assignmentId, facultyId }) => courseApi.updateAssignmentFaculty(assignmentId, facultyId),
        onSuccess: (_, variables) => {
            const fac = facultyList.find(f => f.id === variables.facultyId);
            toast.success(`Assigned to ${fac?.full_name || fac?.fullName || 'Faculty'}`);
            setShowFacultyModal(false);
            closeCourseDetails();
            queryClient.invalidateQueries({ queryKey: ['semesterCourses', id, semesterId] });
        },
        onError: () => {
            toast.error('Failed to assign faculty');
        }
    });

    const handleAssignFaculty = (facultyId) => {
        const assignmentId = selectedCourse?.assignment_id || selectedCourse?.id;
        assignFacultyMutation.mutate({ assignmentId, facultyId });
    };

    const filteredFaculty = facultyList.filter(f => {
        const name = (f.full_name || f.fullName || '').toLowerCase();
        return name.includes(facultySearch.toLowerCase());
    });

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-6xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Link to={`/admin-managebatches/${id}`} className="hover:text-blue-600 flex items-center">
                        <MdArrowBack className="mr-1" /> Back
                    </Link>
                    <span className="mx-2">/</span>
                    <span>{semesterData?.batchName || 'Batch'}</span>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-800">{semesterData?.semesterName || 'Semester'}</span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{semesterData?.title || 'Courses'}</h2>
                        <p className="text-slate-500 mt-1">{loading ? 'Loading...' : `${courses.length} courses in this semester`}</p>
                    </div>
                    <button
                        onClick={handleOpenAssignModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                    >
                        <MdAdd className="w-5 h-5" />
                        Assign Course
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by course title or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:bg-gray-50 transition-colors"
                        />
                    </div>
                </div>

                {/* Course List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MdBook className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">No courses in this semester</h3>
                        <p className="text-slate-400 mb-6">Courses will appear here once assigned.</p>
                        <button
                            onClick={handleOpenAssignModal}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <MdAdd className="w-5 h-5 text-blue-600" />
                            Assign a Course Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCourses.map((course) => (
                            <div 
                                key={course.id} 
                                onClick={() => handleCourseClick(course)}
                                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <MdBook className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            <span className="text-gray-500 font-medium mr-2">{course.code}:</span>
                                            {course.title}
                                        </h3>
                                        <p className={`text-sm font-medium mt-0.5 ${course.instructor_name ? 'text-blue-500' : 'text-orange-500'}`}>
                                            {course.instructor_name || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">{course.credit_hours} Credits</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========== Add Course to Semester Modal ========== */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Assign Course to Semester</h2>
                                    <p className="text-sm text-slate-500 mt-1">Select a course from the catalog to add it.</p>
                                </div>
                                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MdClose className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search available courses..."
                                        value={modalSearchQuery}
                                        onChange={(e) => setModalSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredAvailableCourses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-400">No available courses found.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredAvailableCourses.map(course => (
                                            <div key={course.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                                                <div>
                                                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold mb-1">
                                                        {course.code}
                                                    </span>
                                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1" title={course.title}>
                                                        {course.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{course.credit_hours} Credits</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignCourse(course.id)}
                                                    disabled={assignCourseMutation.isPending}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
                                                    title="Assign this course"
                                                >
                                                    <MdAdd className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                                <button onClick={() => setIsAssignModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== Course Details Modal ========== */}
                {selectedCourse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedCourse.code}: {selectedCourse.title}</h2>
                                    <p className="text-sm text-blue-100 mt-1">{selectedCourse.credit_hours} Credit Hours</p>
                                </div>
                                <button onClick={closeCourseDetails} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <MdClose className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {detailsLoading ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                ) : courseDetails ? (
                                    <div className="space-y-5">
                                        {/* Faculty Status */}
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <MdPerson className="w-6 h-6 text-slate-500" />
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 font-medium">Assigned Faculty</p>
                                                <p className={`font-semibold ${selectedCourse.instructor_name ? 'text-blue-600' : 'text-orange-500'}`}>
                                                    {selectedCourse.instructor_name || 'Unassigned'}
                                                </p>
                                            </div>
                                            {!selectedCourse.instructor_name && (
                                                <button
                                                    onClick={handleOpenFacultyModal}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all"
                                                >
                                                    <MdPersonAdd className="w-4 h-4" />
                                                    Assign Faculty
                                                </button>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {courseDetails.description && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
                                                <p className="text-sm text-slate-600 leading-relaxed">{courseDetails.description}</p>
                                            </div>
                                        )}

                                        {/* Prerequisites */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-1">Prerequisites</h4>
                                            {courseDetails.prerequisite_courses && courseDetails.prerequisite_courses.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {courseDetails.prerequisite_courses.map(p => (
                                                        <span key={p.id} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                                                            {p.code}: {p.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-600">{courseDetails.prerequisites || 'None'}</p>
                                            )}
                                        </div>

                                        {/* Department */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-1">Department</h4>
                                            <p className="text-sm text-slate-600">{courseDetails.department_name}</p>
                                        </div>

                                        {/* CLOs */}
                                        {courseDetails.clos && courseDetails.clos.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Course Learning Outcomes ({courseDetails.clos.length})</h4>
                                                <div className="space-y-2">
                                                    {courseDetails.clos.map((clo, i) => (
                                                        <div key={clo.id || i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                            <p className="text-sm font-medium text-blue-800">CLO {clo.clo_number}: {clo.title}</p>
                                                            {clo.description && <p className="text-xs text-blue-600 mt-1">{clo.description}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-8">No details available.</p>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                                <button onClick={closeCourseDetails} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== Faculty Assignment Modal ========== */}
                {showFacultyModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Assign Faculty</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Select a faculty member for {selectedCourse?.code}</p>
                                </div>
                                <button onClick={() => setShowFacultyModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search faculty..."
                                        value={facultySearch}
                                        onChange={(e) => setFacultySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {filteredFaculty.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400 text-sm">No faculty found.</p>
                                ) : (
                                    filteredFaculty.map(fac => {
                                        const name = fac.full_name || fac.fullName || 'Unknown';
                                        return (
                                            <button
                                                key={fac.id}
                                                onClick={() => handleAssignFaculty(fac.id)}
                                                disabled={assignFacultyMutation.isPending}
                                                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left disabled:opacity-50"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">{getInitials(name)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800 text-sm">{name}</p>
                                                    <p className="text-xs text-slate-400">{fac.department || 'Faculty'}</p>
                                                </div>
                                                <MdCheck className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SemesterCourses;