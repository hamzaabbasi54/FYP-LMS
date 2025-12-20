import React, { useState } from 'react';
import { MdSearch, MdArrowForward, MdArrowBack, MdCheck } from 'react-icons/md';

const CourseAssignment = () => {
    // --- State for Selection ---
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);

    // --- State for Search ---
    const [courseSearch, setCourseSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');

    // --- Mock Data: Courses ---
    const courses = [
        { id: 1, title: "Introduction to Quantum Physics", code: "PHY-301" },
        { id: 2, title: "Data Structures", code: "CS-201" },
        { id: 3, title: "World History", code: "HIS-101" },
        { id: 4, title: "Flighttime Assignment", code: "AV-400" }, // Matches screenshot
        { id: 5, title: "Linear Algebra", code: "MAT-202" },
        { id: 6, title: "Organic Chemistry II", code: "CHE-202" },
        { id: 7, title: "Macroeconomics", code: "ECO-102" },
    ];

    // --- Mock Data: Faculty ---
    const faculty = [
        { id: 101, name: "Dr. Emily Carter", dept: "Physics Department" },
        { id: 102, name: "Prof. David Lee", dept: "Computer Science" },
        { id: 103, name: "Prof. Sarah Khan", dept: "History Department" },
        { id: 104, name: "Dr. James Wilson", dept: "Mathematics" },
        { id: 105, name: "Prof. Linda Chang", dept: "Chemistry" },
        { id: 106, name: "Dr. Robert Langdon", dept: "Symbolism Dept" },
    ];

    // --- Handlers ---
    const handleAssign = () => {
        if (selectedCourseId && selectedFacultyId) {
            const course = courses.find(c => c.id === selectedCourseId);
            const prof = faculty.find(f => f.id === selectedFacultyId);
            alert(`Success! Assigned "${course.title}" to ${prof.name}.`);

            // Reset selection after assignment
            setSelectedCourseId(null);
            setSelectedFacultyId(null);
        } else {
            alert("Please select both a Course and a Faculty member.");
        }
    };

    // Filter lists based on search
    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.dept.toLowerCase().includes(facultySearch.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Assignment for Faculty</h2>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full md:h-[600px] flex flex-col md:flex-row gap-6">

                {/* --- LEFT COLUMN: Available Courses --- */}
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="font-bold text-gray-700 mb-3">Available Courses</h3>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* List Container */}
                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg pr-2">
                        <ul className="space-y-2 p-2">
                            {filteredCourses.map((course) => (
                                <li
                                    key={course.id}
                                    onClick={() => setSelectedCourseId(course.id)}
                                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border transition-all duration-200
                    ${selectedCourseId === course.id
                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                  <span className={`text-sm font-medium ${selectedCourseId === course.id ? 'text-blue-800' : 'text-gray-700'}`}>
                    {course.title}
                  </span>

                                    {/* Selection Circle */}
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                    ${selectedCourseId === course.id
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                    >
                                        {selectedCourseId === course.id && <MdCheck className="w-3 h-3" />}
                                    </div>
                                </li>
                            ))}
                            {filteredCourses.length === 0 && (
                                <p className="text-gray-400 text-center text-sm py-8">No courses found</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* --- MIDDLE COLUMN: Actions --- */}
                <div className="flex flex-col items-center justify-center space-y-4 px-2">

                    {/* Arrow Buttons (Visual only based on screenshot design) */}
                    <button className="p-3 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
                        <MdArrowBack className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
                        <MdArrowForward className="w-5 h-5" />
                    </button>

                    {/* Assign Button */}
                    <button
                        onClick={handleAssign}
                        className={`px-8 py-3 rounded-lg font-semibold shadow-sm transition-all mt-4
              ${(selectedCourseId && selectedFacultyId)
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                            : 'bg-blue-300 text-white cursor-not-allowed'
                        }`}
                        disabled={!selectedCourseId || !selectedFacultyId}
                    >
                        Assign
                    </button>

                    <p className="text-xs text-gray-400 text-center w-32 leading-relaxed">
                        Select courses and faculty, then click Assign.
                    </p>
                </div>

                {/* --- RIGHT COLUMN: Select Faculty --- */}
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="font-bold text-gray-700 mb-3">Select Faculty</h3>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={facultySearch}
                            onChange={(e) => setFacultySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* List Container */}
                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg pr-2">
                        <ul className="space-y-2 p-2">
                            {filteredFaculty.map((fac) => (
                                <li
                                    key={fac.id}
                                    onClick={() => setSelectedFacultyId(fac.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all duration-200
                    ${selectedFacultyId === fac.id
                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${selectedFacultyId === fac.id ? 'text-blue-800' : 'text-gray-700'}`}>
                      {fac.name}
                    </span>
                                        <span className="text-xs text-gray-400 mt-0.5">{fac.dept}</span>
                                    </div>

                                    {/* Selection Circle */}
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                    ${selectedFacultyId === fac.id
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                    >
                                        {selectedFacultyId === fac.id && <MdCheck className="w-3 h-3" />}
                                    </div>
                                </li>
                            ))}
                            {filteredFaculty.length === 0 && (
                                <p className="text-gray-400 text-center text-sm py-8">No faculty found</p>
                            )}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CourseAssignment;