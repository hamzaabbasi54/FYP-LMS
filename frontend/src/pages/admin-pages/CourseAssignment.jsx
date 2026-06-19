import React, { useState } from 'react';
import { MdSearch, MdCheck, MdSwapHoriz } from 'react-icons/md';
import { courseApi, approvalApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const colorPalette = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-pink-600',
    'from-lime-500 to-green-600',
];

const CourseAssignment = () => {
    const queryClient = useQueryClient();
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');
    const { data: courses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ['assignments'],
        queryFn: async () => {
            const res = await courseApi.getAssignments();
            if (res.success) return res.data || [];
            throw new Error('Failed to load assignments');
        }
    });

    const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
        queryKey: ['faculty'],
        queryFn: async () => {
            const res = await approvalApi.getUsersByRole('faculty');
            if (res.success) return res.data || [];
            throw new Error('Failed to load faculty');
        }
    });

    const loading = loadingCourses || loadingFaculty;

    const toggleCourseSelection = (assignmentId) => {
        setSelectedCourseIds(prev =>
            prev.includes(assignmentId)
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        );
    };

    const assignBulkMutation = useMutation({
        mutationFn: async ({ courseIds, facultyId }) => {
            let successCount = 0;
            for (const assignmentId of courseIds) {
                try {
                    await courseApi.updateAssignmentFaculty(assignmentId, facultyId);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to assign course ${assignmentId}:`, err);
                }
            }
            return successCount;
        },
        onSuccess: (successCount, variables) => {
            if (successCount > 0) {
                const prof = faculty.find(f => f.id === variables.facultyId);
                const profName = prof?.full_name || prof?.fullName || 'Faculty';
                toast.success(`Assigned ${successCount} course(s) to ${profName}`);
            }
            setSelectedCourseIds([]);
            setSelectedFacultyId(null);
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
        },
        onError: (error) => {
            console.error('Error assigning courses:', error);
            toast.error(error.message || 'Failed to assign courses');
        }
    });

    const handleAssign = () => {
        if (selectedCourseIds.length === 0 || !selectedFacultyId) return;
        assignBulkMutation.mutate({ courseIds: selectedCourseIds, facultyId: selectedFacultyId });
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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Course Assignment
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 mt-1">Select multiple courses and assign them to a faculty member</p>
                </div>

                {/* Selection Preview */}
                {(selectedCourseIds.length > 0 || selectedFacultyId) && (
                    <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-center gap-4">
                            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCourseIds.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} course(s) selected` : 'Select courses'}
                            </div>
                            <MdSwapHoriz className="w-5 h-5 text-slate-400" />
                            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedFac ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {selectedFac ? (selectedFac.full_name || selectedFac.fullName) : 'Select faculty'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        {/* Left: Courses */}
                        <div className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Available Courses ({courses.length})
                            </h3>
                            <div className="relative mb-4">
                                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
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
                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                                    isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorPalette[index % colorPalette.length]} flex items-center justify-center`}>
                                                        <span className="text-white text-xs font-bold">{(course.code || '').slice(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm line-clamp-1" title={course.title}>{course.title}</p>
                                                        <p className="text-xs text-slate-500">{course.code} • {course.semester_name}</p>
                                                        {course.faculty_name && <p className="text-xs text-blue-600 font-medium mt-0.5">Assigned: {course.faculty_name}</p>}
                                                    </div>
                                                </div>
                                                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                                                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && <MdCheck className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Faculty */}
                        <div className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Select Faculty ({faculty.length})
                            </h3>
                            <div className="relative mb-4">
                                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Search faculty..." value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
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
                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                                    selectedFacultyId === fac.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">{getInitials(name)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{name}</p>
                                                        <p className="text-xs text-slate-500">{fac.department || fac.designation || 'Faculty'}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border ${
                                                    selectedFacultyId === fac.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {selectedFacultyId === fac.id && <MdCheck className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assign Button */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-center">
                        <button onClick={handleAssign} disabled={selectedCourseIds.length === 0 || !selectedFacultyId || assignBulkMutation.isPending}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                selectedCourseIds.length > 0 && selectedFacultyId
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}>
                            {assignBulkMutation.isPending ? 'Assigning...' : `Assign ${selectedCourseIds.length > 0 ? selectedCourseIds.length : ''} Course(s) to Faculty`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseAssignment;