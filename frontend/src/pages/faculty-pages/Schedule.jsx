import React, { useState } from 'react';
import { MdSchedule, MdLocationOn, MdPeople, MdCalendarMonth, MdToday, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const Schedule = () => {
    const [viewMode, setViewMode] = useState('today'); // 'today' or 'week'
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

    // Mock schedule data
    const todaySchedule = [
        {
            id: 1,
            courseCode: 'CS-101',
            courseName: 'Introduction to Programming',
            time: '09:00 AM - 10:30 AM',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Room 101, Block A',
            students: 45,
            status: 'upcoming',
            type: 'Lecture'
        },
        {
            id: 2,
            courseCode: 'CS-201',
            courseName: 'Data Structures',
            time: '11:00 AM - 12:30 PM',
            startTime: '11:00',
            endTime: '12:30',
            room: 'Room 203, Block B',
            students: 38,
            status: 'upcoming',
            type: 'Lecture'
        },
        {
            id: 3,
            courseCode: 'CS-101',
            courseName: 'Introduction to Programming',
            time: '02:00 PM - 04:00 PM',
            startTime: '14:00',
            endTime: '16:00',
            room: 'Lab 4, Computer Science Block',
            students: 45,
            status: 'upcoming',
            type: 'Lab'
        }
    ];

    const weekSchedule = [
        { day: 'Monday', classes: todaySchedule },
        {
            day: 'Tuesday', classes: [
                {
                    id: 4,
                    courseCode: 'CS-302',
                    courseName: 'Operating Systems',
                    time: '10:00 AM - 11:30 AM',
                    room: 'Room 105, Block A',
                    students: 35,
                    type: 'Lecture'
                },
                {
                    id: 5,
                    courseCode: 'CS-201',
                    courseName: 'Data Structures',
                    time: '02:00 PM - 03:30 PM',
                    room: 'Room 203, Block B',
                    students: 38,
                    type: 'Lecture'
                }
            ]
        },
        {
            day: 'Wednesday', classes: [
                {
                    id: 6,
                    courseCode: 'CS-101',
                    courseName: 'Introduction to Programming',
                    time: '10:00 AM - 11:30 AM',
                    room: 'Room 101, Block A',
                    students: 45,
                    type: 'Lecture'
                }
            ]
        },
        {
            day: 'Thursday', classes: [
                {
                    id: 7,
                    courseCode: 'CS-302',
                    courseName: 'Operating Systems',
                    time: '09:00 AM - 10:30 AM',
                    room: 'Room 105, Block A',
                    students: 35,
                    type: 'Lecture'
                },
                {
                    id: 8,
                    courseCode: 'CS-302',
                    courseName: 'Operating Systems',
                    time: '02:00 PM - 04:00 PM',
                    room: 'Lab 2, Computer Science Block',
                    students: 35,
                    type: 'Lab'
                }
            ]
        },
        {
            day: 'Friday', classes: [
                {
                    id: 9,
                    courseCode: 'CS-201',
                    courseName: 'Data Structures',
                    time: '11:00 AM - 12:30 PM',
                    room: 'Room 203, Block B',
                    students: 38,
                    type: 'Lecture'
                }
            ]
        }
    ];

    const getStatusColor = (type) => {
        switch (type) {
            case 'Lecture':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Lab':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const ClassCard = ({ classItem }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(classItem.type)}`}>
                        {classItem.type}
                    </span>
                </div>
                <span className="text-sm font-bold text-blue-600">{classItem.courseCode}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-3">{classItem.courseName}</h3>

            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <MdSchedule className="w-4 h-4 text-gray-400" />
                    <span>{classItem.time}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MdLocationOn className="w-4 h-4 text-gray-400" />
                    <span>{classItem.room}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MdPeople className="w-4 h-4 text-gray-400" />
                    <span>{classItem.students} Students</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Class Schedule</h1>
                    <p className="text-gray-600 text-sm">
                        Manage and view your upcoming classes
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('today')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'today'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <MdToday className="w-4 h-4 mr-2" />
                        Today
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'week'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <MdCalendarMonth className="w-4 h-4 mr-2" />
                        Weekly View
                    </button>
                </div>
            </div>

            {viewMode === 'today' ? (
                /* Today's Schedule */
                <div>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 mb-6">
                        <div className="flex items-center gap-3 text-white">
                            <MdCalendarMonth className="w-8 h-8" />
                            <div>
                                <p className="text-blue-100 text-sm">Today's Date</p>
                                <p className="text-xl font-bold">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-6 text-white">
                            <div>
                                <p className="text-2xl font-bold">{todaySchedule.length}</p>
                                <p className="text-blue-100 text-sm">Classes Today</p>
                            </div>
                            <div className="h-10 w-px bg-blue-400"></div>
                            <div>
                                <p className="text-2xl font-bold">{todaySchedule.reduce((acc, c) => acc + c.students, 0)}</p>
                                <p className="text-blue-100 text-sm">Total Students</p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-800 mb-4">Upcoming Classes</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todaySchedule.map((classItem) => (
                            <ClassCard key={classItem.id} classItem={classItem} />
                        ))}
                    </div>
                </div>
            ) : (
                /* Weekly Schedule */
                <div className="space-y-6">
                    {weekSchedule.map((daySchedule) => (
                        <div key={daySchedule.day} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800">{daySchedule.day}</h3>
                            </div>
                            <div className="p-4">
                                {daySchedule.classes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {daySchedule.classes.map((classItem) => (
                                            <div
                                                key={classItem.id}
                                                className={`p-4 rounded-lg border-l-4 ${classItem.type === 'Lab'
                                                    ? 'border-l-green-500 bg-green-50'
                                                    : 'border-l-blue-500 bg-blue-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-gray-800">{classItem.courseCode}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(classItem.type)}`}>
                                                        {classItem.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{classItem.courseName}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <MdSchedule className="w-3 h-3" />
                                                    <span>{classItem.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <MdLocationOn className="w-3 h-3" />
                                                    <span>{classItem.room}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm py-4 text-center">No classes scheduled</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Schedule;