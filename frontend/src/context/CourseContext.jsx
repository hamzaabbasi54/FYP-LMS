import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const CourseContext = createContext();

export const useCourse = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Optional: Persist to localStorage so refreshing doesn't lose context
    useEffect(() => {
        const storedCourse = localStorage.getItem('selectedFacultyCourse');
        if (storedCourse) {
            setSelectedCourse(JSON.parse(storedCourse));
        }
    }, []);

    const setCourse = useCallback((course) => {
        setSelectedCourse(course);
        if (course) {
            localStorage.setItem('selectedFacultyCourse', JSON.stringify(course));
        } else {
            localStorage.removeItem('selectedFacultyCourse');
        }
    }, []);

    const value = useMemo(() => ({ selectedCourse, setCourse }), [selectedCourse, setCourse]);

    return (
        <CourseContext.Provider value={value}>
            {children}
        </CourseContext.Provider>
    );
};