import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdNotifications,
    MdAssignment,
    MdSchool,
    MdAnnouncement,
    MdCircle,
    MdDone,
    MdDoneAll,
    MdEmail,
    MdEventNote,
    MdDescription,
    MdWarning
} from 'react-icons/md';
import { notificationApi } from '../../services/api';
import { toast } from 'react-toastify';

const Notifications = () => {
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationApi.getAll();
            if (res.success) {
                setNotifications(res.data || []);
                setUnreadCount(res.unread_count || 0);
            }
        } catch (err) {
            console.error('Notification fetch error:', err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Icon and color mapping based on notification type
    const getNotificationMeta = (type) => {
        switch (type) {
            case 'course_assignment':
                return { icon: MdSchool, color: 'bg-green-100 text-green-600', label: 'course' };
            case 'course_unassignment':
                return { icon: MdSchool, color: 'bg-red-100 text-red-600', label: 'course' };
            case 'syllabus_update':
                return { icon: MdDescription, color: 'bg-indigo-100 text-indigo-600', label: 'course' };
            case 'schedule_update':
                return { icon: MdEventNote, color: 'bg-orange-100 text-orange-600', label: 'course' };
            case 'unread_messages':
                return { icon: MdEmail, color: 'bg-blue-100 text-blue-600', label: 'message' };
            case 'ungraded_assessment':
                return { icon: MdAssignment, color: 'bg-yellow-100 text-yellow-600', label: 'assignment' };
            case 'missing_attendance':
                return { icon: MdWarning, color: 'bg-red-100 text-red-600', label: 'attendance' };
            default:
                return { icon: MdAnnouncement, color: 'bg-purple-100 text-purple-600', label: 'system' };
        }
    };

    // Get the navigation link based on notification type
    const getNotificationLink = (type) => {
        switch (type) {
            case 'course_assignment':
            case 'course_unassignment':
            case 'syllabus_update':
                return '/faculty-mycourses';
            case 'schedule_update':
                return '/faculty-schedule';
            case 'unread_messages':
                return '/faculty-messages';
            case 'ungraded_assessment':
                return '/faculty-mycourses';
            case 'missing_attendance':
                return '/faculty-attendance';
            default:
                return '/faculty-dashboard';
        }
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        const days = Math.floor(diff / 86400);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.is_read;
        const meta = getNotificationMeta(n.type);
        return meta.label === filter;
    });

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (err) {
            console.error('Mark all read error:', err);
            toast.error('Failed to mark notifications as read');
        }
    };

    const handleNotificationClick = (notification) => {
        const link = getNotificationLink(notification.type);
        navigate(link);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Notifications</h1>
                    <p className="text-slate-600 text-sm">
                        You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread notifications
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors font-medium text-sm"
                    >
                        <MdDoneAll className="w-5 h-5 mr-2" />
                        Mark All as Read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All', icon: MdNotifications },
                        { key: 'unread', label: 'Unread', icon: MdCircle },
                        { key: 'assignment', label: 'Assessments', icon: MdAssignment },
                        { key: 'course', label: 'Courses', icon: MdSchool },
                        { key: 'message', label: 'Messages', icon: MdEmail },
                        { key: 'attendance', label: 'Attendance', icon: MdWarning },
                        { key: 'system', label: 'System', icon: MdAnnouncement }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <MdNotifications className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredNotifications.map((notification) => {
                            const { icon: IconComponent, color: iconColor } = getNotificationMeta(notification.type);
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                                        <IconComponent className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`font-semibold text-sm ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-1">{notification.message}</p>
                                        <p className="text-xs text-slate-400">{timeAgo(notification.created_at)}</p>
                                    </div>

                                    {/* Read indicator */}
                                    <div className="flex-shrink-0">
                                        {notification.is_read ? (
                                            <MdDone className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <MdCircle className="w-3 h-3 text-blue-600" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;