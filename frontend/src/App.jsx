import React from 'react';
import { Routes, Route } from "react-router-dom";

// Layouts
import AdminMainLayout from "./components/layout/admin/AdminMainLayout.jsx";
import SuperAdminMainLayout from "./components/layout/superadmin/SuperAdminMainLayout.jsx";
import DeanMainLayout from "./components/layout/dean/DeanMainLayout.jsx";
import FacultyMainLayout from "./components/layout/faculty/FacultyMainLayout.jsx";

// Auth Pages
import Login from "./pages/login/Login.jsx";
import Signup from "./pages/login/Signup.jsx";
import ForgotPassword from "./pages/login/ForgotPassword.jsx";
import ResetPassword from "./pages/login/ResetPassword.jsx";

// Super Admin Pages
import SuperAdminDashboard from "./pages/superadmin-pages/Dashboard.jsx";

// Dean Pages
import DeanDashboard from "./pages/dean-pages/Dashboard.jsx";

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
import AddFaculty from './pages/admin-pages/AddFaculty.jsx';
import AddBatch from './pages/admin-pages/AddBatch.jsx';
import BatchDetails from "./pages/admin-pages/BatchDetails.jsx";
import StudentsList from './pages/admin-pages/StudentsList.jsx';
import SemesterCourses from "./pages/admin-pages/SemesterCourses.jsx";
import CreateAccount from './pages/admin-pages/CreateAccount.jsx';
import ManageUsers from './pages/admin-pages/ManageUsers.jsx';
import OBEReports from './pages/admin-pages/OBEReports.jsx';
import ExternalLinks from './pages/admin-pages/ExternalLinks.jsx';

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

// Staff Layout and Pages (Course Coordinator)
import StaffMainLayout from "./components/layout/staff/StaffMainLayout.jsx";
import StaffDashboard from "./pages/staff-pages/Dashboard.jsx";
import { default as StaffBatches } from "./pages/staff-pages/Batches.jsx";
import { default as StaffCourses } from "./pages/staff-pages/Courses.jsx";
import { default as StaffMaterials } from "./pages/staff-pages/CourseMaterials.jsx";
import { default as StaffAssignments } from "./pages/staff-pages/Assignments.jsx";
import { default as StaffGrading } from "./pages/staff-pages/Grading.jsx";
import { default as StaffAttendance } from "./pages/staff-pages/Attendance.jsx";
import { default as StaffStudents } from "./pages/staff-pages/Students.jsx";
import { default as StaffLabs } from "./pages/staff-pages/Labs.jsx";
import { default as StaffReports } from "./pages/staff-pages/Reports.jsx";

// Teaching Assistant (TA) Layout and Pages
import TAMainLayout from "./components/layout/ta/TAMainLayout.jsx";
import TADashboard from "./pages/ta-pages/Dashboard.jsx";
import GradingSupport from "./pages/ta-pages/GradingSupport.jsx";
import LabAssistance from "./pages/ta-pages/LabAssistance.jsx";
import TAAttendance from "./pages/ta-pages/AttendanceSupport.jsx";
import TAAssignments from "./pages/ta-pages/Assignments.jsx";


// Protected Route
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
    return (
        <Routes>
            {/* Authentication Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Super Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRole="superadmin" />}>
                <Route element={<SuperAdminMainLayout />}>
                    <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/superadmin-pending-deans" element={<SuperAdminDashboard />} />
                    <Route path="/superadmin-manage-deans" element={<SuperAdminDashboard />} />
                    <Route path="/superadmin-settings" element={<Settings />} />
                </Route>
            </Route>

            {/* Dean Protected Routes */}
            <Route element={<ProtectedRoute allowedRole="dean" />}>
                <Route element={<DeanMainLayout />}>
                    <Route path="/dean-dashboard" element={<DeanDashboard />} />
                    <Route path="/dean-pending-admins" element={<DeanDashboard />} />
                    <Route path="/dean-manage-admins" element={<DeanDashboard />} />
                    <Route path="/dean-settings" element={<Settings />} />
                </Route>
            </Route>

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

                    <Route path="/admin-obe" element={<OBEReports />} />
                    <Route path="/admin-external-links" element={<ExternalLinks />} />
                </Route>
            </Route>

            {/* Faculty Protected Routes */}
            <Route element={<ProtectedRoute allowedRole="faculty" />}>
                <Route element={<FacultyMainLayout />}>
                    <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                    <Route path="/faculty-batch/:batchId" element={<BatchCourses />} />
                    <Route path="/faculty-mycourses" element={<MyCourses />} />
                    <Route path="/faculty-mycourses/edit-syllabus" element={<EditSyllabus />} />
                    <Route path="/faculty-attendance" element={<Attendance />} />
                    <Route path="/faculty-attendance/monthly-report" element={<MonthlyReport />} />
                    <Route path="/faculty-mycourses/register-student" element={<RegisterStudent />} />
                    <Route path="/faculty-mycourses/grading" element={<Grading />} />
                    <Route path="/faculty-mycourses/grading/:assignmentId" element={<GradeAssignment />} />
                    <Route path="/faculty-mycourses/grading/new" element={<CreateAssessment />} />
                    <Route path="/faculty-settings" element={<Settings />} />
                </Route>
            </Route>

            {/* Staff Protected Routes (Course Coordinator Only) */}
            <Route element={<ProtectedRoute allowedRoles={['course_coordinator']} />}>
                <Route element={<StaffMainLayout />}>
                    <Route path="/staff-dashboard" element={<StaffDashboard />} />
                    <Route path="/staff-batches" element={<StaffBatches />} />
                    <Route path="/staff-courses" element={<StaffCourses />} />
                    <Route path="/staff-materials" element={<StaffMaterials />} />
                    <Route path="/staff-assignments" element={<StaffAssignments />} />
                    <Route path="/staff-grading" element={<StaffGrading />} />
                    <Route path="/staff-attendance" element={<StaffAttendance />} />
                    <Route path="/staff-students" element={<StaffStudents />} />
                    <Route path="/staff-labs" element={<StaffLabs />} />
                    <Route path="/staff-reports" element={<StaffReports />} />
                    <Route path="/staff-settings" element={<Settings />} />
                </Route>
            </Route>

            {/* TA Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ta']} />}>
                <Route element={<TAMainLayout />}>
                    <Route path="/ta-dashboard" element={<TADashboard />} />
                    <Route path="/ta-grading" element={<GradingSupport />} />
                    <Route path="/ta-labs" element={<LabAssistance />} />
                    <Route path="/ta-attendance" element={<TAAttendance />} />
                    <Route path="/ta-assignments" element={<TAAssignments />} />
                    <Route path="/ta-settings" element={<Settings />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;