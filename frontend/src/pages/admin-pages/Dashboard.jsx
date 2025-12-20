import React from 'react';
import { Link } from 'react-router-dom';
import { MdPeople, MdLibraryBooks, MdSchool, MdAssignmentLate, MdArrowForward } from 'react-icons/md';

// 1. Component for the Top Statistics Cards
const StatCard = ({ icon: Icon, label, value, iconColor, bgColor }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} ${iconColor} mb-2`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
            </div>
        </div>
    );
};

// 2. Component for the Quick Action Cards (Bottom row)
const ActionCard = ({ title, description, to, colorClass }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            {/* Decorative Top Banner (Simulating the images in your screenshot) */}
            <div className={`h-32 w-full ${colorClass}`}></div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                    {description}
                </p>

                <Link
                    to={to}
                    className="inline-flex items-center text-blue-600 font-semibold text-sm hover:text-blue-700 hover:underline"
                >
                    Access Module <MdArrowForward className="ml-1 w-4 h-4" />
                </Link>
            </div>
        </div>
    );
};

const Dashboard = () => {
    return (
        <div className="p-2 space-y-8">

            {/* --- Top Stats Section --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={MdPeople}
                    label="Total Active Students"
                    value="1,204"
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={MdLibraryBooks}
                    label="Total Published Courses"
                    value="86"
                    iconColor="text-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    icon={MdSchool}
                    label="Total Active Faculty"
                    value="45"
                    iconColor="text-purple-600"
                    bgColor="bg-purple-50"
                />
                <StatCard
                    icon={MdAssignmentLate}
                    label="Pending Requests"
                    value="12"
                    iconColor="text-orange-600"
                    bgColor="bg-orange-50"
                />
            </div>

            {/* --- Quick Actions Section --- */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ActionCard
                        title="Manage Batches"
                        description="Manage student groups, academic years, and batch assignments efficiently."
                        to="/admin-managebatches"
                        colorClass="bg-gradient-to-br from-orange-100 to-amber-200" // Beige look
                    />
                    <ActionCard
                        title="Course Assignment"
                        description="Configure academic terms and assign instructors to specific courses."
                        to="/admin-courseassignment"
                        colorClass="bg-gradient-to-br from-teal-500 to-emerald-700" // Teal/Green look
                    />
                    <ActionCard
                        title="Manage Courses"
                        description="Add, edit, categorize and update course syllabuses and materials."
                        to="/admin-managecourses"
                        colorClass="bg-gradient-to-br from-green-600 to-lime-600" // Green look
                    />
                    <ActionCard
                        title="Manage Faculty"
                        description="Oversee instructor profiles, permissions, and department allocations."
                        to="/admin-managefaculty"
                        colorClass="bg-gradient-to-br from-pink-200 to-rose-300" // Pink look
                    />
                </div>
            </div>

        </div>
    );
};

export default Dashboard;