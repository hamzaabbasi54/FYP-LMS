import React, { useState, useEffect } from 'react';
import { MdSchedule, MdPeople, MdCalendarMonth, MdToday, MdWbSunny, MdNightsStay } from 'react-icons/md';
import { courseApi } from '../../services/api';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const Schedule = () => {
    const [viewMode, setViewMode] = useState('today');
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const res = await courseApi.getMySchedule();
            if (res.success) {
                setScheduleData(res.data || []);
            }
        } catch (e) {
            console.error('Failed to load schedule:', e);
        } finally {
            setLoading(false);
        }
    };

    // Format time from HH:MM:SS to displayable AM/PM
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    // Get today's day name
    const getTodayKey = () => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[new Date().getDay()];
    };

    const todayKey = getTodayKey();
    const todayClasses = scheduleData.filter(s => s.day_of_week === todayKey);

    // Group by day for weekly view
    const weekSchedule = DAYS_ORDER.map(day => ({
        day: DAY_LABELS[day],
        dayKey: day,
        classes: scheduleData.filter(s => s.day_of_week === day)
    }));

    const totalStudentsToday = todayClasses.reduce((acc, c) => acc + (c.student_count || 0), 0);

    const getShiftColor = (shift) => {
        if (shift === 'morning') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    };

    const ClassCard = ({ classItem }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getShiftColor(classItem.shift)}`}>
                        <span className="flex items-center gap-1">
                            {classItem.shift === 'morning'
                                ? <MdWbSunny className="w-3 h-3" />
                                : <MdNightsStay className="w-3 h-3" />
                            }
                            {classItem.shift === 'morning' ? 'Morning' : 'Evening'}
                        </span>
                    </span>
                </div>
                <span className="text-sm font-bold text-blue-600">{classItem.course_code}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1">{classItem.course_name}</h3>
            <p className="text-xs text-gray-400 mb-3">{classItem.batch_name}</p>

            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <MdSchedule className="w-4 h-4 text-gray-400" />
                    <span>{formatTime(classItem.start_time)} — {formatTime(classItem.end_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MdPeople className="w-4 h-4 text-gray-400" />
                    <span>{classItem.student_count || 0} Students</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Class Schedule</h1>
                    <p className="text-gray-600 text-sm">
                        View your upcoming classes
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
                                <p className="text-2xl font-bold">{todayClasses.length}</p>
                                <p className="text-blue-100 text-sm">Classes Today</p>
                            </div>
                            <div className="h-10 w-px bg-blue-400"></div>
                            <div>
                                <p className="text-2xl font-bold">{totalStudentsToday}</p>
                                <p className="text-blue-100 text-sm">Total Students</p>
                            </div>
                        </div>
                    </div>

                    {todayClasses.length > 0 ? (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Classes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayClasses.map((classItem) => (
                                    <ClassCard key={classItem.id} classItem={classItem} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <MdCalendarMonth className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-1">No Classes Today</h3>
                            <p className="text-gray-400 text-sm">You don't have any classes scheduled for today.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Weekly Schedule */
                <div className="space-y-6">
                    {weekSchedule.map((daySchedule) => (
                        <div key={daySchedule.dayKey} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                            daySchedule.dayKey === todayKey ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                        }`}>
                            <div className={`px-6 py-3 border-b flex items-center justify-between ${
                                daySchedule.dayKey === todayKey ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <h3 className="font-bold text-gray-800">{daySchedule.day}</h3>
                                {daySchedule.dayKey === todayKey && (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Today</span>
                                )}
                            </div>
                            <div className="p-4">
                                {daySchedule.classes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {daySchedule.classes.map((classItem) => (
                                            <div
                                                key={classItem.id}
                                                className={`p-4 rounded-lg border-l-4 ${
                                                    classItem.shift === 'evening'
                                                        ? 'border-l-indigo-500 bg-indigo-50'
                                                        : 'border-l-amber-500 bg-amber-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-gray-800">{classItem.course_code}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getShiftColor(classItem.shift)}`}>
                                                        {classItem.shift === 'morning'
                                                            ? <MdWbSunny className="w-3 h-3" />
                                                            : <MdNightsStay className="w-3 h-3" />
                                                        }
                                                        {classItem.shift === 'morning' ? 'Morning' : 'Evening'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{classItem.course_name}</p>
                                                <p className="text-xs text-gray-400 mb-2">{classItem.batch_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <MdSchedule className="w-3 h-3" />
                                                    <span>{formatTime(classItem.start_time)} — {formatTime(classItem.end_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <MdPeople className="w-3 h-3" />
                                                    <span>{classItem.student_count || 0} Students</span>
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