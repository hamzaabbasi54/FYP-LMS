import React, { useState } from 'react';
import {
    PiCalendarBlank,
    PiCalendarCheck,
    PiMoon,
    PiSun,
    PiUsersThree,
    PiClock
} from 'react-icons/pi';
import { courseApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const Schedule = () => {
    const [viewMode, setViewMode] = useState('today');

    const { data: scheduleData = [], isLoading: loading } = useQuery({
        queryKey: ['facultySchedule'],
        queryFn: async () => {
            const res = await courseApi.getMySchedule();
            if (res.success) return res.data || [];
            throw new Error('Failed to load schedule');
        }
    });

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
        if (shift === 'morning') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    };

    const ClassCard = ({ classItem }) => (
        <div className="bg-white/92 rounded-2xl shadow-sm border border-sky-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold border ${getShiftColor(classItem.shift)}`}>
                        <span className="flex items-center gap-1">
                            {classItem.shift === 'morning'
                                ? <PiSun className="w-3 h-3" />
                                : <PiMoon className="w-3 h-3" />
                            }
                            {classItem.shift === 'morning' ? 'Morning' : 'Evening'}
                        </span>
                    </span>
                </div>
                <span className="text-sm font-bold text-sky-700">{classItem.course_code}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{classItem.course_name}</h3>
            <p className="text-xs text-slate-400 mb-3">{classItem.batch_name}</p>

            <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <PiClock className="w-4 h-4 text-slate-400" />
                    <span>{formatTime(classItem.start_time)} — {formatTime(classItem.end_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <PiUsersThree className="w-4 h-4 text-slate-400" />
                    <span>{classItem.student_count || 0} Students</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-140px)] space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
                    <div className="h-32 bg-slate-200 rounded-xl mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            {/* Page Header */}
            <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 rounded-3xl border border-white/70 bg-gradient-to-br from-white via-sky-50/70 to-blue-50 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.10)] backdrop-blur-2xl">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 mb-2">Campus Flow</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-2">Class Schedule</h1>
                    <p className="text-slate-600 text-sm">
                        View your upcoming classes
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white/75 border border-sky-100 p-1 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setViewMode('today')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'today'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                            }`}
                    >
                        <PiCalendarCheck className="w-4 h-4 mr-2" />
                        Today
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'week'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                            }`}
                    >
                        <PiCalendarBlank className="w-4 h-4 mr-2" />
                        Weekly View
                    </button>
                </div>
            </section>

            {viewMode === 'today' ? (
                /* Today's Schedule */
                <div>
                    <div className="bg-white/92 rounded-3xl border border-sky-100 shadow-sm p-6 mb-6">
                        <div className="flex items-center gap-3 text-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiCalendarBlank className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sky-700 text-xs font-bold uppercase tracking-[0.14em]">Today's Date</p>
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
                        <div className="mt-4 flex items-center gap-6 text-slate-900">
                            <div>
                                <p className="text-2xl font-bold">{todayClasses.length}</p>
                                <p className="text-slate-500 text-sm">Classes Today</p>
                            </div>
                            <div className="h-10 w-px bg-sky-100"></div>
                            <div>
                                <p className="text-2xl font-bold">{totalStudentsToday}</p>
                                <p className="text-slate-500 text-sm">Total Students</p>
                            </div>
                        </div>
                    </div>

                    {todayClasses.length > 0 ? (
                        <>
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Today's Classes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayClasses.map((classItem) => (
                                    <ClassCard key={classItem.id} classItem={classItem} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white/92 rounded-3xl border border-sky-100 shadow-sm">
                            <PiCalendarBlank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-1">No Classes Today</h3>
                            <p className="text-slate-500 text-sm">You don't have any classes scheduled for today.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Weekly Schedule */
                <div className="space-y-6">
                    {weekSchedule.map((daySchedule) => (
                        <div key={daySchedule.dayKey} className={`bg-white/92 rounded-3xl shadow-sm border overflow-hidden ${
                            daySchedule.dayKey === todayKey ? 'border-sky-200 ring-2 ring-sky-100' : 'border-sky-100'
                        }`}>
                            <div className={`px-6 py-3 border-b flex items-center justify-between ${
                                daySchedule.dayKey === todayKey ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-sky-100'
                            }`}>
                                <h3 className="font-bold text-slate-800">{daySchedule.day}</h3>
                                {daySchedule.dayKey === todayKey && (
                                    <span className="text-xs font-bold tracking-wider uppercase text-sky-700 bg-white border border-sky-100 px-2 py-0.5 rounded-md">Today</span>
                                )}
                            </div>
                            <div className="p-4">
                                {daySchedule.classes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {daySchedule.classes.map((classItem) => (
                                            <div
                                                key={classItem.id}
                                                className={`p-4 rounded-2xl border ${
                                                    classItem.shift === 'evening'
                                                        ? 'border-indigo-100 bg-indigo-50/60'
                                                        : 'border-amber-100 bg-amber-50/60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-slate-800">{classItem.course_code}</span>
                                                    <span className={`text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 ${getShiftColor(classItem.shift)}`}>
                                                        {classItem.shift === 'morning'
                                                            ? <PiSun className="w-3 h-3" />
                                                            : <PiMoon className="w-3 h-3" />
                                                        }
                                                        {classItem.shift === 'morning' ? 'Morning' : 'Evening'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-1">{classItem.course_name}</p>
                                                <p className="text-xs text-slate-500 mb-2">{classItem.batch_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <PiClock className="w-3 h-3" />
                                                    <span>{formatTime(classItem.start_time)} — {formatTime(classItem.end_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <PiUsersThree className="w-3 h-3" />
                                                    <span>{classItem.student_count || 0} Students</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm py-4 text-center">No classes scheduled</p>
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
