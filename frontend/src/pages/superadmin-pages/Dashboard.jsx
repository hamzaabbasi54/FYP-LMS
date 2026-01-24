import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdSchool, MdDelete } from 'react-icons/md';
import { approvalApi } from '../../services/api';

const SuperAdminDashboard = () => {
    const [pendingDeans, setPendingDeans] = useState([]);
    const [approvedDeans, setApprovedDeans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                approvalApi.getPendingUsers(),
                approvalApi.getUsersByRole('dean')
            ]);

            if (pendingRes.success) {
                setPendingDeans(pendingRes.data);
            }
            if (approvedRes.success) {
                setApprovedDeans(approvedRes.data.filter(d => d.status === 'approved'));
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
            await approvalApi.rejectUser(userId, 'Application rejected by Super Admin');
            fetchData();
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

    const handleDelete = async (userId, deanName) => {
        if (window.confirm(`Are you sure you want to delete ${deanName}'s account? This action cannot be undone.`)) {
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
                <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
                <p className="text-gray-600">Manage deans and approve new registrations</p>
            </div>

            {/* Deans List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Deans List</h2>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : approvedDeans.length === 0 ? (
                    <div className="text-center py-8">
                        <MdSchool className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No deans registered yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Dean Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Faculty</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedDeans.map((dean) => (
                                    <tr key={dean._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{dean.fullName}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                                {dean.faculty}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{dean.email}</td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDelete(dean._id, dean.fullName)}
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
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Dean Approvals</h2>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : pendingDeans.length === 0 ? (
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
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Faculty</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingDeans.map((dean) => (
                                    <tr key={dean._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-800">{dean.fullName}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{dean.email}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{dean.faculty}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(dean.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleApprove(dean._id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors mr-2"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(dean._id)}
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

export default SuperAdminDashboard;
