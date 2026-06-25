import React from 'react';
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

import { CourseProvider } from "./context/CourseContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Global Components
import UndoToast from "./components/common/UndoToast.jsx";

// Code-split route pages so production does not load the whole app at login.
const AdminMainLayout = React.lazy(() => import("./components/layout/admin/AdminMainLayout.jsx"));
const FacultyMainLayout = React.lazy(() => import("./components/layout/faculty/FacultyMainLayout.jsx"));
const Login = React.lazy(() => import("./pages/login/Login.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/login/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("./pages/login/ResetPassword.jsx"));
const SetPassword = React.lazy(() => import("./pages/login/SetPassword.jsx"));
const Dashboard = React.lazy(() => import("./pages/admin-pages/Dashboard.jsx"));
const ManageBatches = React.lazy(() => import("./pages/admin-pages/ManageBatches.jsx"));
const ManageFaculty = React.lazy(() => import("./pages/admin-pages/ManageFaculty.jsx"));
const Parents = React.lazy(() => import("./pages/admin-pages/Parents.jsx"));
const Reports = React.lazy(() => import("./pages/admin-pages/Reports.jsx"));
const ManageCourses = React.lazy(() => import("./pages/admin-pages/ManageCourses.jsx"));
const Settings = React.lazy(() => import("./pages/admin-pages/Settings.jsx"));
const AddCourses = React.lazy(() => import("./pages/admin-pages/AddCourses.jsx"));
const CourseDetails = React.lazy(() => import("./pages/admin-pages/CourseDetails.jsx"));
const ManageCLOs = React.lazy(() => import("./pages/admin-pages/ManageCLOs.jsx"));
const ManagePLOs = React.lazy(() => import("./pages/admin-pages/ManagePLOs.jsx"));
const AddFaculty = React.lazy(() => import("./pages/admin-pages/AddFaculty.jsx"));
const AddBatch = React.lazy(() => import("./pages/admin-pages/AddBatch.jsx"));
const BatchDetails = React.lazy(() => import("./pages/admin-pages/BatchDetails.jsx"));
const BatchCourseSchedule = React.lazy(() => import("./pages/admin-pages/BatchCourseSchedule.jsx"));
const StudentsList = React.lazy(() => import("./pages/admin-pages/StudentsList.jsx"));
const StudentDetails = React.lazy(() => import("./pages/admin-pages/StudentDetails.jsx"));
const SemesterCourses = React.lazy(() => import("./pages/admin-pages/SemesterCourses.jsx"));
const CreateAccount = React.lazy(() => import("./pages/admin-pages/CreateAccount.jsx"));
const ManageUsers = React.lazy(() => import("./pages/admin-pages/ManageUsers.jsx"));
const OBEReports = React.lazy(() => import("./pages/admin-pages/OBEReports.jsx"));
const ExternalLinks = React.lazy(() => import("./pages/admin-pages/ExternalLinks.jsx"));
const ManageCurricula = React.lazy(() => import("./pages/admin-pages/ManageCurricula.jsx"));
const CurriculumDetails = React.lazy(() => import("./pages/admin-pages/CurriculumDetails.jsx"));
const ManageDeptAdmins = React.lazy(() => import("./pages/admin-pages/ManageDeptAdmins.jsx"));
const SuperAdminPanel = React.lazy(() => import("./pages/admin-pages/SuperAdminPanel.jsx"));
const DocumentViewer = React.lazy(() => import("./pages/shared/DocumentViewer.jsx"));
const FacultyDashboard = React.lazy(() => import("./pages/faculty-pages/Dashboard.jsx"));
const MyCourses = React.lazy(() => import("./pages/faculty-pages/MyCourses.jsx"));
const EditSyllabus = React.lazy(() => import("./pages/faculty-pages/EditSyllabus.jsx"));
const BatchCourses = React.lazy(() => import("./pages/faculty-pages/BatchCourses.jsx"));
const Attendance = React.lazy(() => import("./pages/faculty-pages/Attendance.jsx"));
const MonthlyReport = React.lazy(() => import("./pages/faculty-pages/MonthlyReport.jsx"));
const RegisterStudent = React.lazy(() => import("./pages/faculty-pages/RegisterStudent.jsx"));
const Grading = React.lazy(() => import("./pages/faculty-pages/Grading.jsx"));
const GradeAssignment = React.lazy(() => import("./pages/faculty-pages/GradeAssignment.jsx"));
const CreateAssessment = React.lazy(() => import("./pages/faculty-pages/CreateAssessment.jsx"));
const Messages = React.lazy(() => import("./pages/faculty-pages/Messages.jsx"));
const Notifications = React.lazy(() => import("./pages/faculty-pages/Notifications.jsx"));
const Schedule = React.lazy(() => import("./pages/faculty-pages/Schedule.jsx"));
const ManageStudents = React.lazy(() => import("./pages/faculty-pages/ManageStudents.jsx"));
const AssessmentDetails = React.lazy(() => import("./pages/faculty-pages/AssessmentDetails.jsx"));

const RouteLoader = () => (
    <div className="min-h-screen bg-sky-50/50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
    </div>
);

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SocketProvider>
                    <React.Suspense fallback={<RouteLoader />}>
                        <Routes>
                        {/* Authentication Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/document-viewer" element={<DocumentViewer />} />

                {/* Super Admin — Standalone page, no sidebar */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                    <Route path="/admin-dashboard" element={<SuperAdminPanel />} />
                </Route>

                {/* Department Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['deptadmin']} />}>
                    <Route element={<AdminMainLayout />}>
                        <Route path="/deptadmin-dashboard" element={<Dashboard />} />

                        {/* User Management Routes */}
                        <Route path="/admin-createaccount" element={<CreateAccount />} />
                        <Route path="/admin-manageusers" element={<ManageUsers />} />
                        <Route path="/admin-manage-dept-admins" element={<ManageDeptAdmins />} />

                        <Route path="/admin-managebatches" element={<ManageBatches />} />
                        <Route path="/admin-managebatches/addbatch" element={<AddBatch />} />
                        <Route path="/admin-managebatches/:id" element={<BatchDetails />} />
                        <Route path="/admin-managebatches/:id/students" element={<StudentsList />} />
                        <Route path="/admin-managebatches/:id/students/:studentId" element={<StudentDetails />} />
                        <Route path="/admin-managebatches/:id/semester/:semesterId" element={<SemesterCourses />} />
                        <Route path="/admin-managebatches/:batchId/course/:courseId" element={<BatchCourseSchedule />} />

                        <Route path="/admin-managefaculty" element={<ManageFaculty />} />
                        <Route path="/admin-managefaculty/addfaculty" element={<AddFaculty />} />

                        <Route path="/admin-reports" element={<Reports />} />
                        <Route path="/admin-parents" element={<Parents />} />
                        <Route path="/admin-settings" element={<Settings />} />

                        <Route path="/admin-managecourses" element={<ManageCourses />} />
                        <Route path="/admin-managecourses/admin-addcourses" element={<AddCourses />} />
                        <Route path="/admin-managecourses/clos" element={<ManageCLOs />} />
                        <Route path="/admin-managecourses/plos" element={<ManagePLOs />} />
                        <Route path="/admin-managecourses/:id" element={<CourseDetails />} />

                        <Route path="/admin-obe" element={<OBEReports />} />
                        <Route path="/admin-external-links" element={<ExternalLinks />} />

                        <Route path="/admin-curricula" element={<ManageCurricula />} />
                        <Route path="/admin-curricula/:id" element={<CurriculumDetails />} />

                        <Route path="/admin-messages" element={<Messages />} />
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
                        <Route path="/faculty-mycourses" element={<MyCourses />} />
                        <Route path="/faculty-mycourses/:assignmentId" element={<MyCourses />} />
                        <Route path="/faculty-mycourses/:assignmentId/edit-syllabus" element={<EditSyllabus />} />
                        <Route path="/faculty-mycourses/:assignmentId/attendance" element={<Attendance />} />
                        <Route path="/faculty-mycourses/:assignmentId/attendance/monthly-report" element={<MonthlyReport />} />
                        <Route path="/faculty-attendance" element={<Attendance />} />
                        <Route path="/faculty-attendance/monthly-report" element={<MonthlyReport />} />
                        <Route path="/faculty-mycourses/:assignmentId/register-student" element={<RegisterStudent />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading" element={<Grading />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/:gradeAssignmentId" element={<GradeAssignment />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/:gradeAssignmentId/details" element={<AssessmentDetails />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/:gradeAssignmentId/edit" element={<CreateAssessment />} />
                        <Route path="/faculty-mycourses/:assignmentId/grading/new" element={<CreateAssessment />} />
                        <Route path="/faculty-mycourses/:assignmentId/students" element={<ManageStudents />} />
                        <Route path="/faculty-messages" element={<Messages />} />
                        <Route path="/faculty-notifications" element={<Notifications />} />
                        <Route path="/faculty-schedule" element={<Schedule />} />
                        <Route path="/faculty-settings" element={<Settings />} />
                    </Route>
                </Route>

                        </Routes>
                    </React.Suspense>
                    </SocketProvider>
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
                    <UndoToast />
                </AuthProvider>
                {import.meta.env.DEV && (
                    <React.Suspense fallback={null}>
                        <Devtools />
                    </React.Suspense>
                )}
            </QueryClientProvider>
    );
}

const Devtools = React.lazy(() =>
    import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
    }))
);

export default App;
