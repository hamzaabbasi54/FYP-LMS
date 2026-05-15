import React from 'react';
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AdminMainLayout from "./components/layout/admin/AdminMainLayout.jsx";
import FacultyMainLayout from "./components/layout/faculty/FacultyMainLayout.jsx";

// Auth Pages
import Login from "./pages/login/Login.jsx";
import Signup from "./pages/login/Signup.jsx";
import ForgotPassword from "./pages/login/ForgotPassword.jsx";
import ResetPassword from "./pages/login/ResetPassword.jsx";

// Admin (Department Admin) Pages
import Dashboard from "./pages/admin-pages/Dashboard.jsx";
import CourseAssignment from "./pages/admin-pages/CourseAssignment.jsx";
import ManageBatches from "./pages/admin-pages/ManageBatches.jsx";
import ManageFaculty from "./pages/admin-pages/ManageFaculty.jsx";
import Parents from "./pages/admin-pages/Parents.jsx";
import Reports from "./pages/admin-pages/Reports.jsx";
import ManageCourses from "./pages/admin-pages/ManageCourses.jsx";
import Settings from "./pages/admin-pages/Settings.jsx";
import AddCourses from "./pages/admin-pages/AddCourses.jsx";
import CourseDetails from "./pages/admin-pages/CourseDetails.jsx";
import ManageCLOs from "./pages/admin-pages/ManageCLOs.jsx";
import AddFaculty from './pages/admin-pages/AddFaculty.jsx';
import AddBatch from './pages/admin-pages/AddBatch.jsx';
import BatchDetails from "./pages/admin-pages/BatchDetails.jsx";
import StudentsList from './pages/admin-pages/StudentsList.jsx';
import SemesterCourses from "./pages/admin-pages/SemesterCourses.jsx";
import CreateAccount from './pages/admin-pages/CreateAccount.jsx';
import ManageUsers from './pages/admin-pages/ManageUsers.jsx';
import OBEReports from './pages/admin-pages/OBEReports.jsx';
import ExternalLinks from './pages/admin-pages/ExternalLinks.jsx';
import ManageCurricula from './pages/admin-pages/ManageCurricula.jsx';
import CurriculumDetails from './pages/admin-pages/CurriculumDetails.jsx';

// Faculty Pages
import FacultyDashboard from "./pages/faculty-pages/Dashboard.jsx";
import MyCourses from "./pages/faculty-pages/MyCourses.jsx";
import EditSyllabus from "./pages/faculty-pages/EditSyllabus.jsx";
import BatchCourses from "./pages/faculty-pages/BatchCourses.jsx";
import Attendance from "./pages/faculty-pages/Attendance.jsx";
import MonthlyReport from "./pages/faculty-pages/MonthlyReport.jsx";
import RegisterStudent from "./pages/faculty-pages/RegisterStudent.jsx";
import Grading from "./pages/faculty-pages/Grading.jsx";
import GradeAssignment from "./pages/faculty-pages/GradeAssignment.jsx";
import CreateAssessment from "./pages/faculty-pages/CreateAssessment.jsx";
import Messages from "./pages/faculty-pages/Messages.jsx";
import Notifications from "./pages/faculty-pages/Notifications.jsx";
import Schedule from "./pages/faculty-pages/Schedule.jsx";
import ManageStudents from "./pages/faculty-pages/ManageStudents.jsx";
import { CourseProvider } from "./context/CourseContext.jsx";


// Protected Route
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
    return (
        <>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Department Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRole="deptadmin" />}>
                    <Route element={<AdminMainLayout />}>
                        <Route path="/admin-dashboard" element={<Dashboard />} />

                        {/* User Management Routes */}
                        <Route path="/admin-createaccount" element={<CreateAccount />} />
                        <Route path="/admin-manageusers" element={<ManageUsers />} />

                        <Route path="/admin-courseassignment" element={<CourseAssignment />} />

                        <Route path="/admin-managebatches" element={<ManageBatches />} />
                        <Route path="/admin-managebatches/addbatch" element={<AddBatch />} />
                        <Route path="/admin-managebatches/:id" element={<BatchDetails />} />
                        <Route path="/admin-managebatches/:id/students" element={<StudentsList />} />
                        <Route path="/admin-managebatches/:id/semester/:semesterId" element={<SemesterCourses />} />

                        <Route path="/admin-managefaculty" element={<ManageFaculty />} />
                        <Route path="/admin-managefaculty/addfaculty" element={<AddFaculty />} />

                        <Route path="/admin-reports" element={<Reports />} />
                        <Route path="/admin-parents" element={<Parents />} />
                        <Route path="/admin-settings" element={<Settings />} />

                        <Route path="/admin-managecourses" element={<ManageCourses />} />
                        <Route path="/admin-managecourses/admin-addcourses" element={<AddCourses />} />
                        <Route path="/admin-managecourses/clos" element={<ManageCLOs />} />
                        <Route path="/admin-managecourses/:id" element={<CourseDetails />} />

                        <Route path="/admin-obe" element={<OBEReports />} />
                        <Route path="/admin-external-links" element={<ExternalLinks />} />

                        <Route path="/admin-curricula" element={<ManageCurricula />} />
                        <Route path="/admin-curricula/:id" element={<CurriculumDetails />} />
                    </Route>
                </Route>

                {/* Faculty Protected Routes */}
                <Route element={<ProtectedRoute allowedRole="faculty" />}>
                    <Route element={
                        <CourseProvider>
                            <FacultyMainLayout />
                        </CourseProvider>
                    }>
                        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                        <Route path="/faculty-batch/:batchId" element={<BatchCourses />} />
                        <Route path="/faculty-mycourses/:assignmentId" element={<MyCourses />} />
                        <Route path="/faculty-mycourses/:assignmentId/edit-syllabus" element={<EditSyllabus />} />
                        <Route path="/faculty-mycourses/:assignmentId/attendance" element={<Attendance />} />
                        <Route path="/faculty-mycourses/:assignmentId/attendance/monthly-report" element={<MonthlyReport />} />
                        <Route path="/faculty-attendance" element={<Attendance />} />
                        <Route path="/faculty-attendance/monthly-report" element={<MonthlyReport />} />
                        <Route path="/faculty-mycourses/:assignmentId/register-student" element={<RegisterStudent />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading" element={<Grading />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/:gradeAssignmentId" element={<GradeAssignment />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/new" element={<CreateAssessment />} />
                        <Route path="/faculty-mycourses/:assignmentId/students" element={<ManageStudents />} />
                        <Route path="/faculty-messages" element={<Messages />} />
                        <Route path="/faculty-notifications" element={<Notifications />} />
                        <Route path="/faculty-schedule" element={<Schedule />} />
                        <Route path="/faculty-settings" element={<Settings />} />
                    </Route>
                </Route>

            </Routes>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </>
    );
}

export default App;