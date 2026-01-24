import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdPeople, MdLibraryBooks, MdSchool, MdAssignmentLate, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import { approvalApi } from '../../services/api';

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
    const [pendingFaculty, setPendingFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchPendingFaculty();
    }, []);

    const fetchPendingFaculty = async () => {
        try {
            const response = await approvalApi.getPendingUsers();
            if (response.success) {
                setPendingFaculty(response.data);
            }
        } catch (error) {
            console.error('Error fetching pending faculty:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await approvalApi.approveUser(userId);
            fetchPendingFaculty();
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleReject = async (userId) => {
        try {
            await approvalApi.rejectUser(userId, 'Application rejected by Department Admin');
            fetchPendingFaculty();
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

    return (
        <div className="p-2 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Department Admin Dashboard</h1>
                <p className="text-gray-600">Department: {user.department || 'N/A'}</p>
            </div>

            {/* --- Top Stats Section --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={MdPeople}
                    label="Pending Approvals"
                    value={loading ? '...' : pendingFaculty.length}
                    iconColor="text-orange-600"
                    bgColor="bg-orange-50"
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
                    label="Total Active Students"
                    value="1,204"
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                />
            </div>

            {/* --- Pending Faculty Approvals --- */}
            {!loading && pendingFaculty.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Faculty Approvals</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingFaculty.map((faculty) => (
                                    <tr key={faculty._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-800">{faculty.fullName}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{faculty.email}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{faculty.phoneNumber || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(faculty.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleApprove(faculty._id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors mr-2"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(faculty._id)}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                        colorClass="bg-gradient-to-br from-orange-100 to-amber-200"
                    />
                    <ActionCard
                        title="Course Assignment"
                        description="Configure academic terms and assign instructors to specific courses."
                        to="/admin-courseassignment"
                        colorClass="bg-gradient-to-br from-teal-500 to-emerald-700"
                    />
                    <ActionCard
                        title="Manage Courses"
                        description="Add, edit, categorize and update course syllabuses and materials."
                        to="/admin-managecourses"
                        colorClass="bg-gradient-to-br from-green-600 to-lime-600"
                    />
                    <ActionCard
                        title="Manage Faculty"
                        description="Oversee instructor profiles, permissions, and department allocations."
                        to="/admin-managefaculty"
                        colorClass="bg-gradient-to-br from-pink-200 to-rose-300"
                    />
                </div>
            </div>

        </div>
    );
};

export default Dashboard;