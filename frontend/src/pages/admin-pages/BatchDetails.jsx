import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdEdit, MdAdd, MdArrowBack, MdCalendarToday, MdArrowForward } from 'react-icons/md';

const BatchDetails = () => {
    const { id } = useParams();

    // Mock Data
    const batchData = {
        id: id,
        title: "Computer Science - Class of 2027",
        status: "Active",
        stats: {
            students: 124,
            semesters: 8,
            duration: "4 Years"
        },
        plos: [
            "Analyze a complex computing problem and to apply principles of computing.",
            "Design, implement, and evaluate a computing-based solution.",
            "Communicate effectively in a variety of professional contexts.",
            "Recognize professional responsibilities and ethical principles.",
            "Function effectively as a member or leader of a team."
        ],
        semesters: [
            { id: 1, name: "Semester 1", term: "Fall 2023", date: "Aug 2023 - Dec 2023", courses: 5, img: "bg-orange-400" },
            { id: 2, name: "Semester 2", term: "Spring 2024", date: "Jan 2024 - May 2024", courses: 6, img: "bg-green-600" },
            { id: 3, name: "Semester 3", term: "Fall 2024", date: "Aug 2024 - Dec 2024", courses: 5, img: "bg-yellow-500" },
            { id: 4, name: "Semester 4", term: "Spring 2025", date: "Jan 2025 - May 2025", courses: 5, img: "bg-emerald-700" },
            { id: 5, name: "Semester 5", term: "Fall 2025", date: "Aug 2025 - Dec 2025", courses: 6, img: "bg-orange-500" },
            { id: 6, name: "Semester 6", term: "Spring 2026", date: "Jan 2026 - May 2026", courses: 5, img: "bg-lime-600" },
        ]
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">

            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Link to="/admin-managebatches" className="hover:text-blue-600 flex items-center">
                    <MdArrowBack className="mr-1" /> Back to Batches
                </Link>
                <span>/</span>
                <span className="text-gray-800 font-semibold">{batchData.title}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {batchData.title}
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              {batchData.status}
            </span>
                    </h1>
                </div>

                <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 outline-none">
                    <option value="Active">Status: Active</option>
                    <option value="Graduated">Status: Graduated</option>
                </select>
            </div>

            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Clickable Student Card */}
                <Link
                    to={`/admin-managebatches/${id}/students`}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1 group-hover:text-blue-600 transition-colors">Total Students</p>
                            <h3 className="text-4xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{batchData.stats.students}</h3>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                            <MdArrowForward />
                        </div>
                    </div>
                    <p className="text-xs text-blue-500 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View Student List &rarr;</p>
                </Link>

                {/* Static Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-semibold mb-1">Total Semesters</p>
                    <h3 className="text-4xl font-bold text-gray-800">{batchData.stats.semesters}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-semibold mb-1">Duration</p>
                    <h3 className="text-4xl font-bold text-gray-800">{batchData.stats.duration}</h3>
                </div>
            </div>

            {/* PLO Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Program Learning Outcomes (PLOs)</h3>
                    <button className="flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-600 px-3 py-1.5 rounded transition-all">
                        <MdEdit className="mr-2" /> Edit
                    </button>
                </div>
                <ul className="space-y-4">
                    {batchData.plos.map((plo, index) => (
                        <li key={index} className="flex items-start text-gray-600 text-sm leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                {index + 1}
              </span>
                            {plo}
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- Semesters Grid (UPDATED with Links) --- */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Semesters</h3>
                    <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm text-sm font-medium transition-colors">
                        <MdAdd className="w-5 h-5 mr-1" /> Add Semester
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batchData.semesters.map((sem) => (
                        <Link
                            to={`/admin-managebatches/${id}/semester/${sem.id}`}
                            key={sem.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer block"
                        >
                            <div className={`h-28 w-full ${sem.img} relative`}>
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm">
                                    {sem.term}
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                    {sem.name}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium mb-4 flex items-center">
                                    {sem.courses} Courses
                                </p>
                                <div className="text-xs text-gray-400 font-medium flex items-center border-t border-gray-100 pt-3">
                                    <MdCalendarToday className="mr-1.5 w-3.5 h-3.5" />
                                    {sem.date}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default BatchDetails;