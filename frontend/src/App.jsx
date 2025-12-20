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
import AddCourses from "./pages/admin-pages/AddCourses.jsx";
import AddFaculty from './pages/admin-pages/AddFaculty.jsx';
import AddBatch from './pages/admin-pages/AddBatch.jsx';
import BatchDetails from "./pages/admin-pages/BatchDetails.jsx";
import StudentsList from './pages/admin-pages/StudentsList.jsx';
import SemesterCourses from "./pages/admin-pages/SemesterCourses.jsx";
function App() {
    return (
        <Routes>
            <Route element={<AdminMainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin-courseassignment" element={<CourseAssignment />} />

                <Route path="/admin-managebatches" element={<ManageBatches />} />
                <Route path="/admin-managebatches/addbatch" element={<AddBatch />} />
                <Route path="/admin-managebatches/:id" element={<BatchDetails />} />
                <Route path="/admin-managebatches/:id/students" element={<StudentsList />} />
                <Route path="/admin-managebatches/:id/semester/:semesterId" element={<SemesterCourses />} />

                <Route path="/admin-managefaculty" element={<ManageFaculty />} />
                <Route path="/admin-managefaculty/addfaculty" element={<AddFaculty />} />

                <Route path="/admin-reports" element={<Reports/>} />
                <Route path="/admin-settings" element={<Settings />} />

                <Route path="/admin-managecourses" element={<ManageCourses />} />
                <Route path="/admin-managecourses/admin-addcourses" element={<AddCourses />} />

            </Route>
        </Routes>
    );
}

export default App;