import React, { useState, useEffect } from 'react';
import { PiCheckCircle, PiEnvelopeSimple, PiIdentificationBadge, PiLock, PiShieldCheck, PiUserCircle, PiWarningCircle } from 'react-icons/pi';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Settings = () => {
    const { user, setUser } = useAuth();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fullName, setFullName] = useState(user?.fullName || '');

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const { data: userProfile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const userData = await authApi.getProfile();
            return userData.data;
        }
    });

    useEffect(() => {
        if (userProfile) {
            setUser(userProfile);
            setFullName(userProfile.fullName);
        }
    }, [userProfile, setUser]);

    const updateProfileMutation = useMutation({
        mutationFn: (data) => authApi.updateProfile(data),
        onSuccess: (response) => {
            setUser(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        },
        onError: (error) => {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data) => authApi.changePassword(data),
        onSuccess: () => {
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        },
        onError: (error) => {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        }
    });

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        updateProfileMutation.mutate({ fullName });
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwords.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        changePasswordMutation.mutate({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
        });
    };

    const loading = updateProfileMutation.isPending || changePasswordMutation.isPending;

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-950">Account Settings</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Manage your profile and security preferences.</p>
                    </div>
                </section>

                {message.text && (
                    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${message.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <PiCheckCircle className="h-5 w-5" /> : <PiWarningCircle className="h-5 w-5" />}
                        <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-3xl border border-sky-100 bg-white/92 p-5 text-center shadow-sm lg:sticky lg:top-6 lg:self-start">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                            <span className="text-2xl font-bold">
                                {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-950">{user.fullName}</h2>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                            <PiShieldCheck className="h-4 w-4" />
                            {user.role?.replace('_', ' ')}
                        </div>
                        {user.faculty && (
                            <p className="mt-3 text-xs text-slate-400">{user.faculty}</p>
                        )}
                    </div>

                    <div className="rounded-3xl border border-sky-100 bg-white/92 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-sky-100 p-5">
                            <PiUserCircle className="h-5 w-5 text-sky-700" />
                            <h3 className="font-bold text-slate-950">Profile Information</h3>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="flex h-[calc(100%-65px)] flex-col justify-between space-y-4 p-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                    <div className="relative">
                                        <PiIdentificationBadge className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100" placeholder="Enter full name" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                    <div className="relative">
                                        <PiEnvelopeSimple className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input type="email" value={user.email} disabled className="h-11 w-full cursor-not-allowed rounded-xl border border-sky-100 bg-sky-50/60 pl-10 pr-4 text-sm text-slate-500" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="mt-4 w-full rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <div className="rounded-3xl border border-sky-100 bg-white/92 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-sky-100 p-5">
                            <PiLock className="h-5 w-5 text-sky-700" />
                            <h3 className="font-bold text-slate-950">Security Settings</h3>
                        </div>
                        <form onSubmit={handlePasswordChange} className="flex h-[calc(100%-65px)] flex-col justify-between space-y-4 p-5">
                            <div className="space-y-4">
                                {[
                                    ['Current Password', 'currentPassword', 'Enter current password'],
                                    ['New Password', 'newPassword', 'Enter new password'],
                                    ['Confirm Password', 'confirmPassword', 'Confirm new password'],
                                ].map(([label, key, placeholder]) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">{label}</label>
                                        <div className="relative">
                                            <PiLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <input type="password" value={passwords[key]} onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100" placeholder={placeholder} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" disabled={loading || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
