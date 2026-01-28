import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MdNotifications,
    MdAssignment,
    MdSchool,
    MdAnnouncement,
    MdCheckCircle,
    MdCircle,
    MdFilterList,
    MdDone,
    MdDoneAll
} from 'react-icons/md';

const Notifications = () => {
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'assignment',
            title: 'New Assignment Submission',
            message: 'Ayesha Khan submitted Assignment 3 for CS-101 Introduction to Programming.',
            time: '10 minutes ago',
            date: 'Today',
            read: false,
            link: '/faculty-mycourses/grading/3',
            icon: MdAssignment,
            iconColor: 'bg-blue-100 text-blue-600'
        },
        {
            id: 2,
            type: 'assignment',
            title: 'New Assignment Submission',
            message: 'Bilal Ahmed submitted Assignment 3 for CS-101 Introduction to Programming.',
            time: '25 minutes ago',
            date: 'Today',
            read: false,
            link: '/faculty-mycourses/grading/3',
            icon: MdAssignment,
            iconColor: 'bg-blue-100 text-blue-600'
        },
        {
            id: 3,
            type: 'course',
            title: 'New Course Assigned',
            message: 'You have been assigned to teach CS-302 Operating Systems for Fall 2024 semester.',
            time: '2 hours ago',
            date: 'Today',
            read: false,
            link: '/faculty-dashboard',
            icon: MdSchool,
            iconColor: 'bg-green-100 text-green-600'
        },
        {
            id: 4,
            type: 'assignment',
            title: 'Late Submission',
            message: 'Chaudhry Nazeer submitted Assignment 2 late for CS-201 Data Structures.',
            time: '5 hours ago',
            date: 'Today',
            read: true,
            link: '/faculty-mycourses/grading/2',
            icon: MdAssignment,
            iconColor: 'bg-yellow-100 text-yellow-600'
        },
        {
            id: 5,
            type: 'system',
            title: 'System Announcement',
            message: 'The LMS portal will undergo scheduled maintenance tonight from 11 PM to 2 AM.',
            time: 'Yesterday',
            date: 'Yesterday',
            read: true,
            link: '#',
            icon: MdAnnouncement,
            iconColor: 'bg-purple-100 text-purple-600'
        },
        {
            id: 6,
            type: 'course',
            title: 'Course Schedule Updated',
            message: 'Your CS-101 class timing has been changed from 9 AM to 10 AM on Wednesdays.',
            time: '2 days ago',
            date: '2 days ago',
            read: true,
            link: '/faculty-schedule',
            icon: MdSchool,
            iconColor: 'bg-green-100 text-green-600'
        },
        {
            id: 7,
            type: 'assignment',
            title: 'New Assignment Submission',
            message: 'Dua Khalid submitted Quiz 1 for CS-101 Introduction to Programming.',
            time: '3 days ago',
            date: '3 days ago',
            read: true,
            link: '/faculty-mycourses/grading/1',
            icon: MdAssignment,
            iconColor: 'bg-blue-100 text-blue-600'
        }
    ]);

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
                    <p className="text-gray-600 text-sm">
                        You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread notifications
                    </p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors font-medium text-sm"
                >
                    <MdDoneAll className="w-5 h-5 mr-2" />
                    Mark All as Read
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All', icon: MdNotifications },
                        { key: 'unread', label: 'Unread', icon: MdCircle },
                        { key: 'assignment', label: 'Assignments', icon: MdAssignment },
                        { key: 'course', label: 'Courses', icon: MdSchool },
                        { key: 'system', label: 'System', icon: MdAnnouncement }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MdNotifications className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => {
                            const IconComponent = notification.icon;
                            return (
                                <Link
                                    key={notification.id}
                                    to={notification.link}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full ${notification.iconColor} flex items-center justify-center flex-shrink-0`}>
                                        <IconComponent className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                                        <p className="text-xs text-gray-400">{notification.time}</p>
                                    </div>

                                    {/* Read indicator */}
                                    <div className="flex-shrink-0">
                                        {notification.read ? (
                                            <MdDone className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <MdCircle className="w-3 h-3 text-blue-600" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
