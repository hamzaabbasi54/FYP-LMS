import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdAdd, MdArrowForward, MdBook, MdClose } from 'react-icons/md';
import { batchApi, courseApi } from '../../services/api';
import { toast } from 'react-toastify';

const SemesterCourses = () => {
    const { id, semesterId } = useParams();
    const [semesterData, setSemesterData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [assigningLoading, setAssigningLoading] = useState(false);

    useEffect(() => {
        fetchSemesterCourses();
    }, [id, semesterId]);

    const fetchSemesterCourses = async () => {
        try {
            setLoading(true);
            // Fetch semester details with courses
            const response = await batchApi.getSemester(id, semesterId);
            if (response.success) {
                const semester = response.data;
                setSemesterData({
                    title: `${semester.name} Courses`,
                    batchName: semester.batchName,
                    semesterName: semester.name
                });
                setCourses(semester.courses || []);
            }
        } catch (error) {
            console.error('Error fetching semester courses:', error);
            toast.error('Failed to load semester courses');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenAssignModal = async () => {
        setIsAssignModalOpen(true);
        try {
            const response = await courseApi.getAll({ limit: 1000 });
            if (response.success) {
                const assignedIds = courses.map(c => c.course_id || c.id);
                const available = (response.data || []).filter(c => !assignedIds.includes(c.id));
                setAvailableCourses(available);
            }
        } catch (error) {
            console.error('Error fetching available courses:', error);
            toast.error('Failed to load available courses');
        }
    };

    const handleAssignCourse = async (courseId) => {
        if (assigningLoading) return;
        setAssigningLoading(true);
        try {
            const response = await courseApi.assign({
                course_id: courseId,
                semester_id: parseInt(semesterId),
                faculty_id: null
            });
            if (response.success) {
                toast.success('Course assigned successfully');
                setAvailableCourses(prev => prev.filter(c => c.id !== courseId));
                fetchSemesterCourses();
            }
        } catch (error) {
            console.error('Error assigning course:', error);
            toast.error(error.response?.data?.message || 'Failed to assign course');
        } finally {
            setAssigningLoading(false);
        }
    };

    const filteredAvailableCourses = availableCourses.filter(c =>
        (c.title || '').toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(modalSearchQuery.toLowerCase())
    );

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
                            <div key={course.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow group">
                                <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <MdBook className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            <span className="text-gray-500 font-medium mr-2">{course.code}:</span>
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-blue-500 font-medium mt-0.5">{course.instructor_name || 'Unassigned'}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">{course.credit_hours} Credits</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assign Course Modal */}
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
                                                    disabled={assigningLoading}
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
            </div>
        </div>
    );
};

export default SemesterCourses;