import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdPeople, MdBarChart, MdMoreVert, MdArrowForward, MdArrowDropDown } from 'react-icons/md';

// Component for Course Cards
const CourseCard = ({ courseCode, schedule, title, description, enrolled, pendingGrades, borderColor, assignmentId }) => {
    return (
        <Link
            to={`/faculty-mycourses/${assignmentId}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 block cursor-pointer"
        >
            <div className="flex">
                {/* Colored Left Border */}
                <div className={`w-1 ${borderColor} flex-shrink-0`}></div>
                
                {/* Course Content */}
                <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        {/* Left Side - Course Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                                    {courseCode}
                                </span>
                                <span className="text-sm text-gray-500">{schedule}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                {description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="font-medium">{enrolled}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-medium">{pendingGrades}</span>
                            </div>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-start gap-3">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <MdMoreVert className="w-5 h-5" />
                            </button>
                            <span className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm whitespace-nowrap">
                                Manage Course
                                <MdArrowForward className="ml-2 w-4 h-4" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const BatchCourses = () => {
    const { batchId } = useParams();
    const [courses, setCourses] = useState([]);
    const [batchDetails, setBatchDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const borderColors = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500"];

    useEffect(() => {
        const fetchBatchCourses = async () => {
            try {
                const { courseApi } = await import('../../services/api');
                const response = await courseApi.getAssigned();
                if (response.success) {
                    // Filter courses for this specific batch
                    const batchAssignments = response.data.filter(c => c.batch_id.toString() === batchId.toString());
                    
                    if (batchAssignments.length > 0) {
                        // Extract batch info from the first assignment
                        const first = batchAssignments[0];
                        setBatchDetails({
                            id: first.batch_id,
                            name: first.batch_name,
                            year: `Year ${new Date().getFullYear() - new Date(first.start_date).getFullYear() + 1 > 0 ? new Date().getFullYear() - new Date(first.start_date).getFullYear() + 1 : 1}`,
                            type: "Full Time",
                            department: "Department", // Can be extended to fetch exact department
                            semester: first.semester_name,
                            // Use max student count as rough batch size
                            totalStudents: Math.max(...batchAssignments.map(a => a.student_count))
                        });

                        setCourses(batchAssignments.map((a, idx) => ({
                            id: a.course_id,
                            assignmentId: a.assignment_id,
                            courseCode: a.code,
                            schedule: "Schedule TBA", // Add schedule logic if present in schema
                            title: a.title,
                            description: `${a.credit_hours} Credit Hours`,
                            enrolled: `${a.student_count} Enrolled`,
                            pendingGrades: "0 Pending Grades", // Add grades logic
                            borderColor: borderColors[idx % borderColors.length]
                        })));
                    } else {
                        // Optional: Fetch batch details directly if no courses, but for now we expect courses
                    }
                }
            } catch (error) {
                console.error("Error fetching batch courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatchCourses();
    }, [batchId]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading batch courses...</div>;
    }

    if (!batchDetails && courses.length === 0) {
        return <div className="p-8 text-center text-gray-500">No courses assigned for this batch.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Batch Overview Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 sm:p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                                {batchDetails?.year}
                            </span>
                            <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                                {batchDetails?.type}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{batchDetails?.name}</h1>
                        <p className="text-blue-100 text-sm sm:text-base">
                            {batchDetails?.department} • {batchDetails?.semester}
                        </p>
                    </div>

                    {/* Right Side - Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
                            <MdPeople className="w-5 h-5 mr-2" />
                            Student List ({batchDetails?.totalStudents})
                        </button>
                        <button className="flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
                            <MdBarChart className="w-5 h-5 mr-2" />
                            Batch Performance
                        </button>
                    </div>
                </div>
            </div>

            {/* Your Courses Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                        Your Courses ({courses.length})
                    </h2>
                    <div className="relative">
                        <select className="appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option>Active Courses</option>
                            <option>All Courses</option>
                            <option>Completed Courses</option>
                        </select>
                        <MdArrowDropDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
                    </div>
                </div>

                {/* Course Cards */}
                <div className="space-y-4">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            assignmentId={course.assignmentId}
                            courseCode={course.courseCode}
                            schedule={course.schedule}
                            title={course.title}
                            description={course.description}
                            enrolled={course.enrolled}
                            pendingGrades={course.pendingGrades}
                            borderColor={course.borderColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BatchCourses;

