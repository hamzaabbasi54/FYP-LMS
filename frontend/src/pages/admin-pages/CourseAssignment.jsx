import React, { useState } from 'react';
import { MdSearch, MdCheck, MdSwapHoriz } from 'react-icons/md';

const CourseAssignment = () => {
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');

    const courses = [
        { id: 1, title: "Introduction to Quantum Physics", code: "PHY-301", color: "from-violet-500 to-purple-600" },
        { id: 2, title: "Data Structures", code: "CS-201", color: "from-blue-500 to-indigo-600" },
        { id: 3, title: "World History", code: "HIS-101", color: "from-amber-500 to-orange-600" },
        { id: 4, title: "Flighttime Assignment", code: "AV-400", color: "from-teal-500 to-emerald-600" },
        { id: 5, title: "Linear Algebra", code: "MAT-202", color: "from-pink-500 to-rose-600" },
        { id: 6, title: "Organic Chemistry II", code: "CHE-202", color: "from-cyan-500 to-blue-600" },
        { id: 7, title: "Macroeconomics", code: "ECO-102", color: "from-emerald-500 to-teal-600" },
    ];

    const faculty = [
        { id: 101, name: "Dr. Emily Carter", dept: "Physics Department", avatar: "EC" },
        { id: 102, name: "Prof. David Lee", dept: "Computer Science", avatar: "DL" },
        { id: 103, name: "Prof. Sarah Khan", dept: "History Department", avatar: "SK" },
        { id: 104, name: "Dr. James Wilson", dept: "Mathematics", avatar: "JW" },
        { id: 105, name: "Prof. Linda Chang", dept: "Chemistry", avatar: "LC" },
        { id: 106, name: "Dr. Robert Langdon", dept: "Symbolism Dept", avatar: "RL" },
    ];

    const handleAssign = () => {
        if (selectedCourseId && selectedFacultyId) {
            const course = courses.find(c => c.id === selectedCourseId);
            const prof = faculty.find(f => f.id === selectedFacultyId);
            alert(`✓ Assigned "${course.title}" to ${prof.name}`);
            setSelectedCourseId(null);
            setSelectedFacultyId(null);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase())
    );

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.dept.toLowerCase().includes(facultySearch.toLowerCase())
    );

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const selectedFac = faculty.find(f => f.id === selectedFacultyId);

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
                    <p className="text-slate-500 ml-5 mt-1">Assign faculty members to courses</p>
                </div>

                {/* Selection Preview */}
                {(selectedCourseId || selectedFacultyId) && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-center gap-4">
                            <div className={`px-4 py-2 rounded-xl ${selectedCourse ? `bg-gradient-to-r ${selectedCourse.color} text-white` : 'bg-slate-100 text-slate-400'}`}>
                                {selectedCourse ? selectedCourse.title : 'Select a course'}
                            </div>
                            <MdSwapHoriz className="w-6 h-6 text-slate-400" />
                            <div className={`px-4 py-2 rounded-xl ${selectedFac ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {selectedFac ? selectedFac.name : 'Select faculty'}
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
                                Available Courses
                            </h3>

                            <div className="relative mb-4">
                                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={courseSearch}
                                    onChange={(e) => setCourseSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {filteredCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => setSelectedCourseId(course.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${selectedCourseId === course.id
                                                ? 'bg-indigo-50 border-2 border-indigo-500'
                                                : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                                                <span className="text-white text-xs font-bold">{course.code.slice(0, 2)}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{course.title}</p>
                                                <p className="text-xs text-slate-400">{course.code}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCourseId === course.id
                                                ? 'border-indigo-500 bg-indigo-500'
                                                : 'border-slate-300'
                                            }`}>
                                            {selectedCourseId === course.id && <MdCheck className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Faculty */}
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Select Faculty
                            </h3>

                            <div className="relative mb-4">
                                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search faculty..."
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {filteredFaculty.map((fac) => (
                                    <div
                                        key={fac.id}
                                        onClick={() => setSelectedFacultyId(fac.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${selectedFacultyId === fac.id
                                                ? 'bg-emerald-50 border-2 border-emerald-500'
                                                : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">{fac.avatar}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{fac.name}</p>
                                                <p className="text-xs text-slate-400">{fac.dept}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFacultyId === fac.id
                                                ? 'border-emerald-500 bg-emerald-500'
                                                : 'border-slate-300'
                                            }`}>
                                            {selectedFacultyId === fac.id && <MdCheck className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Assign Button */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                        <button
                            onClick={handleAssign}
                            disabled={!selectedCourseId || !selectedFacultyId}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${selectedCourseId && selectedFacultyId
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Assign Course to Faculty
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseAssignment;