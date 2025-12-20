import React from 'react';
import { Routes, Route } from "react-router-dom";
import AdminMainLayout from "./components/layout/admin/AdminMainLayout.jsx";
import Dashboard from "./pages/admin-pages/Dashboard.jsx";
import CourseAssignment from "./pages/admin-pages/CourseAssignment.jsx";
import ManageBatches from "./pages/admin-pages/ManageBatches.jsx";
import ManageFaculty from "./pages/admin-pages/ManageFaculty.jsx";
import Reports from "./pages/admin-pages/Reports.jsx";
import ManageCourses from "./pages/admin-pages/ManageCourses.jsx";
import Settings from "./pages/admin-pages/Settings.jsx";
function App() {
    return (
        <Routes>
            <Route element={<AdminMainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin-courseassignment" element={<CourseAssignment />} />
                <Route path="/admin-managebatches" element={<ManageBatches />} />
                <Route path="/admin-managefaculty" element={<ManageFaculty />} />
                <Route path="/admin-reports" element={<Reports/>} />
                <Route path="/admin-settings" element={<Settings />} />
                <Route path="/admin-managecourses" element={<ManageCourses />} />

            </Route>
        </Routes>
    );
}

export default App;