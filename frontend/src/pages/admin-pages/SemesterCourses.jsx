import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdAdd, MdArrowForward, MdBook } from 'react-icons/md';
import { batchApi } from '../../services/api';
import { toast } from 'react-toastify';

const SemesterCourses = () => {
    const { id, semesterId } = useParams();
    const [semesterData, setSemesterData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSemesterCourses();
    }, [id, semesterId]);

    const fetchSemesterCourses = async () => {
        try {
            setLoading(true);
            // Fetch batch details to get semester info and courses
            const response = await batchApi.getById(id);
            if (response.success) {
                const batch = response.data;
                const semester = (batch.semesters || []).find(s => s.id === parseInt(semesterId));
                setSemesterData({
                    title: semester ? `${semester.name} Courses` : 'Semester Courses',
                    batchName: batch.name,
                    semesterName: semester?.name || `Semester ${semesterId}`
                });
                // Courses assigned to this semester will come from course_assignments
                // For now, show the semester info
                setCourses(semester?.courses || []);
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
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{semesterData?.title || 'Courses'}</h2>
                        <p className="text-slate-500 mt-1">{loading ? 'Loading...' : `${courses.length} courses in this semester`}</p>
                    </div>
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
                        <p className="text-slate-400">Courses will appear here once assigned via Course Assignment.</p>
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
            </div>
        </div>
    );
};

export default SemesterCourses;