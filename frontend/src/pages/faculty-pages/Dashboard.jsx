import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdSchool, MdScience, MdSettings, MdArrowForward, MdViewList, MdViewModule } from 'react-icons/md';

// Component for Batch Cards - Matching exact design
const BatchCard = ({ year, batch, courses, students, icon: Icon, gradientColor, batchId, to }) => {
    return (
        <Link
            to={to}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
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
                    <span className="inline-flex items-center text-blue-600 font-semibold text-sm group">
                        View Details 
                        <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>
        </Link>
    );
};

const Dashboard = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    const icons = [MdSchool, MdScience, MdSettings];
    const gradients = [
        "bg-gradient-to-br from-purple-600 to-purple-400",
        "bg-gradient-to-br from-green-600 to-green-400",
        "bg-gradient-to-br from-orange-500 to-orange-400",
        "bg-gradient-to-br from-blue-600 to-blue-400"
    ];

    useEffect(() => {
        const fetchAssignedCourses = async () => {
            try {
                // We need to import { courseApi } from '../../services/api'; at the top of the file
                const { courseApi } = await import('../../services/api');
                const response = await courseApi.getAssigned();
                if (response.success) {
                    // Group assignments by batch
                    const groupedBatches = {};
                    response.data.forEach(assignment => {
                        if (!groupedBatches[assignment.batch_id]) {
                            groupedBatches[assignment.batch_id] = {
                                id: assignment.batch_id,
                                year: new Date(assignment.start_date).getFullYear(), // Just an approximation
                                batch: assignment.batch_name,
                                courses: [],
                                studentsCount: 0,
                            };
                        }
                        groupedBatches[assignment.batch_id].courses.push(`${assignment.title} (${assignment.code})`);
                        // Assume student_count is the total students enrolled in this course for this batch.
                        // We take the max of student counts across courses as a rough estimate for the batch students.
                        groupedBatches[assignment.batch_id].studentsCount = Math.max(
                            groupedBatches[assignment.batch_id].studentsCount,
                            assignment.student_count
                        );
                    });

                    // Format to array for mapping
                    const formattedBatches = Object.values(groupedBatches).map((b, idx) => ({
                        ...b,
                        year: `Year ${new Date().getFullYear() - b.year + 1 > 0 ? new Date().getFullYear() - b.year + 1 : 1}`, // Roughly compute year (Year 1, Year 2)
                        students: `${b.studentsCount} Students`,
                        icon: icons[idx % icons.length],
                        gradientColor: gradients[idx % gradients.length]
                    }));

                    setBatches(formattedBatches);
                }
            } catch (error) {
                console.error("Error fetching assigned courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedCourses();
    }, []);

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
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'} text-gray-600 hover:text-gray-800 transition-colors`}>
                            <MdViewList className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border ${viewMode === 'grid' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'} text-gray-600 hover:text-gray-800 transition-colors`}>
                            <MdViewModule className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Batch Cards Grid - Responsive */}
                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading assigned batches...</div>
                ) : batches.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No batches assigned to you yet.</div>
                ) : (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'grid-cols-1 gap-4'}`}>
                        {batches.map((batch) => (
                            <BatchCard
                                key={batch.id}
                                year={batch.year}
                                batch={batch.batch}
                                courses={batch.courses}
                                students={batch.students}
                                icon={batch.icon}
                                gradientColor={batch.gradientColor}
                                batchId={batch.id}
                                to={`/faculty-batch/${batch.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

