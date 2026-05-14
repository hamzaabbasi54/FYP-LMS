import React, { useState, useEffect } from 'react';
import { MdSearch, MdCheck, MdSwapHoriz } from 'react-icons/md';
import { courseApi, approvalApi } from '../../services/api';
import { toast } from 'react-toastify';

const CourseAssignment = () => {
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');
    const [courses, setCourses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    const colorPalette = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-indigo-600",
        "from-amber-500 to-orange-600",
        "from-teal-500 to-emerald-600",
        "from-pink-500 to-rose-600",
        "from-cyan-500 to-blue-600",
        "from-emerald-500 to-teal-600"
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, facultyRes] = await Promise.all([
                courseApi.getAssignments(),
                approvalApi.getUsersByRole('faculty')
            ]);
            if (coursesRes.success) setCourses(coursesRes.data || []);
            if (facultyRes.success) setFaculty(facultyRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const toggleCourseSelection = (assignmentId) => {
        setSelectedCourseIds(prev =>
            prev.includes(assignmentId)
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        );
    };

    const handleAssign = async () => {
        if (selectedCourseIds.length === 0 || !selectedFacultyId) return;
        
        setAssigning(true);
        try {
            const prof = faculty.find(f => f.id === selectedFacultyId);
            const profName = prof?.full_name || prof?.fullName || 'Faculty';

            // Assign each selected course to the selected faculty
            let successCount = 0;
            for (const assignmentId of selectedCourseIds) {
                try {
                    await courseApi.updateAssignmentFaculty(assignmentId, selectedFacultyId);
                    successCount++;
                } catch (err) {
                    const course = courses.find(c => c.assignment_id === assignmentId);
                    console.error(`Failed to assign ${course?.title}:`, err);
                }
            }

            if (successCount > 0) {
                toast.success(`Assigned ${successCount} course(s) to ${profName}`);
            }
            setSelectedCourseIds([]);
            setSelectedFacultyId(null);
            fetchData();
        } catch (error) {
            console.error('Error assigning courses:', error);
            toast.error(error.response?.data?.message || 'Failed to assign courses');
        } finally {
            setAssigning(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        (c.title || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(courseSearch.toLowerCase())
    );

    const filteredFaculty = faculty.filter(f => {
        const name = f.full_name || f.fullName || '';
        const dept = f.department || '';
        return name.toLowerCase().includes(facultySearch.toLowerCase()) ||
               dept.toLowerCase().includes(facultySearch.toLowerCase());
    });

    const selectedFac = faculty.find(f => f.id === selectedFacultyId);

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Course Assignment
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 mt-1">Select multiple courses and assign them to a faculty member</p>
                </div>

                {/* Selection Preview */}
                {(selectedCourseIds.length > 0 || selectedFacultyId) && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-center gap-4">
                            <div className={`px-4 py-2 rounded-xl ${selectedCourseIds.length > 0 ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} course(s) selected` : 'Select courses'}
                            </div>
                            <MdSwapHoriz className="w-6 h-6 text-slate-400" />
                            <div className={`px-4 py-2 rounded-xl ${selectedFac ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {selectedFac ? (selectedFac.full_name || selectedFac.fullName) : 'Select faculty'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Left: Courses */}
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                Available Courses ({courses.length})
                            </h3>
                            <div className="relative mb-4">
                                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {loading ? (
                                    <p className="text-center py-8 text-slate-400">Loading courses...</p>
                                ) : filteredCourses.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400">No courses found</p>
                                ) : (
                                    filteredCourses.map((course, index) => {
                                        const isSelected = selectedCourseIds.includes(course.assignment_id);
                                        return (
                                            <div key={course.assignment_id} onClick={() => toggleCourseSelection(course.assignment_id)}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    isSelected ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorPalette[index % colorPalette.length]} flex items-center justify-center`}>
                                                        <span className="text-white text-xs font-bold">{(course.code || '').slice(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm line-clamp-1" title={course.title}>{course.title}</p>
                                                        <p className="text-xs text-slate-500">{course.code} • {course.semester_name}</p>
                                                        {course.faculty_name && <p className="text-xs text-indigo-500 font-medium mt-0.5">Assigned: {course.faculty_name}</p>}
                                                    </div>
                                                </div>
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                                                }`}>
                                                    {isSelected && <MdCheck className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Faculty */}
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Select Faculty ({faculty.length})
                            </h3>
                            <div className="relative mb-4">
                                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Search faculty..." value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {loading ? (
                                    <p className="text-center py-8 text-slate-400">Loading faculty...</p>
                                ) : filteredFaculty.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400">No faculty found</p>
                                ) : (
                                    filteredFaculty.map((fac) => {
                                        const name = fac.full_name || fac.fullName || 'Unknown';
                                        return (
                                            <div key={fac.id} onClick={() => setSelectedFacultyId(fac.id)}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    selectedFacultyId === fac.id ? 'bg-emerald-50 border-2 border-emerald-500' : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">{getInitials(name)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{name}</p>
                                                        <p className="text-xs text-slate-400">{fac.department || fac.designation || 'Faculty'}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    selectedFacultyId === fac.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                                                }`}>
                                                    {selectedFacultyId === fac.id && <MdCheck className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assign Button */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                        <button onClick={handleAssign} disabled={selectedCourseIds.length === 0 || !selectedFacultyId || assigning}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                selectedCourseIds.length > 0 && selectedFacultyId
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}>
                            {assigning ? 'Assigning...' : `Assign ${selectedCourseIds.length > 0 ? selectedCourseIds.length : ''} Course(s) to Faculty`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseAssignment;