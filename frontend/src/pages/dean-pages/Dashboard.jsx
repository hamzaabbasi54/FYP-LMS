import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdSchool, MdDelete } from 'react-icons/md';
import { approvalApi } from '../../services/api';

const DeanDashboard = () => {
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [approvedAdmins, setApprovedAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                approvalApi.getPendingUsers(),
                approvalApi.getUsersByRole('deptadmin')
            ]);

            if (pendingRes.success) {
                setPendingAdmins(pendingRes.data);
            }
            if (approvedRes.success) {
                setApprovedAdmins(approvedRes.data.filter(d => d.status === 'approved'));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await approvalApi.approveUser(userId);
            fetchData();
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleReject = async (userId) => {
        try {
            await approvalApi.rejectUser(userId, 'Application rejected by Dean');
            fetchData();
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

    const handleDelete = async (userId, adminName) => {
        if (window.confirm(`Are you sure you want to delete ${adminName}'s account? This action cannot be undone.`)) {
            try {
                await approvalApi.deleteUser(userId);
                fetchData();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Dean Dashboard</h1>
                <p className="text-gray-600">Faculty of {user.faculty} - Manage department admins</p>
            </div>

            {/* Department Admins List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Admins</h2>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : approvedAdmins.length === 0 ? (
                    <div className="text-center py-8">
                        <MdSchool className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No department admins registered yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedAdmins.map((admin) => (
                                    <tr key={admin._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{admin.fullName}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {admin.department}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{admin.email}</td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDelete(admin._id, admin.fullName)}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors inline-flex items-center gap-1"
                                            >
                                                <MdDelete className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Department Admin Approvals</h2>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : pendingAdmins.length === 0 ? (
                    <div className="text-center py-8">
                        <MdCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-500">No pending approvals</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingAdmins.map((admin) => (
                                    <tr key={admin._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-800">{admin.fullName}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{admin.email}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{admin.department}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleApprove(admin._id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors mr-2"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(admin._id)}
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
                )}
            </div>
        </div>
    );
};

export default DeanDashboard;
