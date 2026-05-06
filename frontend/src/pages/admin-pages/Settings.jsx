import React, { useState, useEffect } from 'react';
import { MdPerson, MdSecurity, MdSave, MdLock, MdEmail, MdBadge, MdCheckCircle, MdError } from 'react-icons/md';
import { authApi } from '../../services/api';

const Settings = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form states
    const [fullName, setFullName] = useState(user.fullName || '');

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const userData = await authApi.getProfile();
            setUser(userData.data);
            setFullName(userData.data.fullName);
            // Update local storage to keep it in sync
            const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...lsUser, ...userData.data }));
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await authApi.updateProfile({ fullName });
            if (response.success) {
                setUser(response.data);
                // Update local storage
                const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...lsUser, ...response.data }));

                setMessage({ type: 'success', text: 'Profile updated successfully' });

                // Clear message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        if (passwords.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            if (response.success) {
                setMessage({ type: 'success', text: 'Password changed successfully' });
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });

                // Clear message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your profile and security preferences</p>
            </div>

            {/* Notification Message */}
            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <MdCheckCircle className="w-5 h-5" /> : <MdError className="w-5 h-5" />}
                    <span className="font-medium text-sm">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - User Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center sticky top-8">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
                            <span className="text-white font-bold text-3xl">
                                {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{user.fullName}</h2>
                        <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium uppercase tracking-wider">
                                {user.role?.replace('_', ' ')}
                            </span>
                        </div>
                        {user.faculty && (
                            <p className="text-xs text-gray-400">{user.faculty}</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Settings */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <MdPerson className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-gray-800">Profile Information</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                                placeholder="Enter full name"
                                            />
                                            <MdBadge className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                                            />
                                            <MdEmail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MdSave className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <MdSecurity className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-semibold text-gray-800">Security Settings</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={passwords.currentPassword}
                                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                            placeholder="Enter current password"
                                        />
                                        <MdLock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                                placeholder="Min. 6 characters"
                                            />
                                            <MdLock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                                placeholder="Confirm new password"
                                            />
                                            <MdCheckCircle className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MdSave className="w-4 h-4" />
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;