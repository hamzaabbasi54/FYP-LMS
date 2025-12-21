import React from 'react';
import { Link } from 'react-router-dom';
import { MdSchool, MdScience, MdSettings, MdArrowForward, MdViewList, MdViewModule } from 'react-icons/md';

// Component for Batch Cards - Matching exact design
const BatchCard = ({ year, batch, courses, students, icon: Icon, gradientColor }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            {/* Top Colored Section */}
            <div className={`h-24 ${gradientColor} relative`}>
                <div className="absolute top-4 left-4">
                    <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="absolute top-4 right-4 text-right">
                    <p className="text-sm font-bold text-white">{year}</p>
                    <p className="text-xs text-white text-opacity-90">{batch}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-grow flex flex-col">
                {/* Assigned Courses */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ASSIGNED COURSES</p>
                    <div className="space-y-2">
                        {courses.map((course, index) => (
                            <p key={index} className="text-sm font-semibold text-gray-800 leading-tight">
                                {course}
                            </p>
                        ))}
                        {courses.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No other courses assigned</p>
                        )}
                    </div>
                </div>

                {/* Bottom Section with Students and View Details */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{students}</p>
                    <Link
                        to="#"
                        className="inline-flex items-center text-blue-600 font-semibold text-sm hover:text-blue-700 hover:underline group"
                    >
                        View Details 
                        <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    // Mock Data for Batches - Matching exact design colors
    const batches = [
        {
            id: 1,
            year: "Year 1",
            batch: "Batch 2023-2027",
            courses: [
                "Introduction to Pr... (CS-101)",
                "Discrete Mathe... (MA-102)"
            ],
            students: "120 Students",
            icon: MdSchool,
            gradientColor: "bg-gradient-to-br from-purple-600 to-purple-400"
        },
        {
            id: 2,
            year: "Year 2",
            batch: "Batch 2022-2026",
            courses: [
                "Data Structures ... (CS-201)",
                "Computer Archit... (CS-204)"
            ],
            students: "115 Students",
            icon: MdScience,
            gradientColor: "bg-gradient-to-br from-green-600 to-green-400"
        },
        {
            id: 3,
            year: "Year 3",
            batch: "Batch 2021-2025",
            courses: [
                "Operating Syst... (CS-302)"
            ],
            students: "108 Students",
            icon: MdSettings,
            gradientColor: "bg-gradient-to-br from-purple-600 to-purple-400"
        },
        {
            id: 4,
            year: "Masters",
            batch: "Batch 2023-2025",
            courses: [
                "Advanced Machi... (CS-501)"
            ],
            students: "24 Students",
            icon: MdSettings,
            gradientColor: "bg-gradient-to-br from-orange-500 to-orange-400"
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* --- Batches Taught Section --- */}
            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Batches Taught</h2>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Manage courses and students across your active academic batches.
                        </p>
                    </div>
                    {/* View Toggle Icons */}
                    <div className="flex items-center space-x-2">
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors">
                            <MdViewList className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors">
                            <MdViewModule className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Batch Cards Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {batches.map((batch) => (
                        <BatchCard
                            key={batch.id}
                            year={batch.year}
                            batch={batch.batch}
                            courses={batch.courses}
                            students={batch.students}
                            icon={batch.icon}
                            gradientColor={batch.gradientColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

