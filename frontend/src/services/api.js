import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auto-handle 401 (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// Auth API
// ============================================
export const authApi = {
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    },
    login: async (email, password, role) => {
        const response = await api.post('/auth/login', { email, password, role });
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.put('/auth/change-password', data);
        return response.data;
    },
    // Invite flow
    validateInvite: async (token) => {
        const response = await api.post('/auth/validate-invite', { token });
        return response.data;
    },
    setPassword: async (token, password) => {
        const response = await api.post('/auth/set-password', { token, password });
        return response.data;
    },
    // Password reset flow
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token, password) => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    },
    getFaculties: async () => {
        const response = await api.get('/auth/faculties');
        return response.data;
    },
    getDepartments: async (faculty) => {
        const response = await api.get(`/auth/departments/${encodeURIComponent(faculty)}`);
        return response.data;
    },
    getAllDepartments: async () => {
        const response = await api.get('/auth/departments');
        return response.data;
    },
    // User Management (Admin Only)
    createAccount: async (userData) => {
        const response = await api.post('/auth/create-account', userData);
        return response.data;
    },
    getAllUsers: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.search) params.append('search', filters.search);
        const response = await api.get(`/auth/users${params.toString() ? '?' + params.toString() : ''}`);
        return response.data;
    },
    updateUser: async (userId, userData) => {
        const response = await api.put(`/auth/users/${userId}`, userData);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await api.delete(`/auth/users/${userId}`);
        return response.data;
    },
    toggleUserStatus: async (userId) => {
        const response = await api.patch(`/auth/users/${userId}/status`);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    }
};

// ============================================
// Approval API
// ============================================
export const approvalApi = {
    getPendingUsers: async () => {
        const response = await api.get('/approvals/pending');
        return response.data;
    },
    approveUser: async (userId) => {
        const response = await api.post(`/approvals/${userId}/approve`);
        return response.data;
    },
    rejectUser: async (userId, reason) => {
        const response = await api.post(`/approvals/${userId}/reject`, { reason });
        return response.data;
    },
    getUsersByRole: async (role) => {
        const response = await api.get(`/approvals/users/${role}`);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await api.delete(`/approvals/${userId}`);
        return response.data;
    }
};

// ============================================
// Batch API
// ============================================
export const batchApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/batches', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/batches/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/batches', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/batches/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/batches/${id}`);
        return response.data;
    },
    // Semesters
    getSemester: async (batchId, semId) => {
        const response = await api.get(`/batches/${batchId}/semesters/${semId}`);
        return response.data;
    },
    addSemester: async (batchId, data) => {
        const response = await api.post(`/batches/${batchId}/semesters`, data);
        return response.data;
    },
    updateSemester: async (batchId, semId, data) => {
        const response = await api.put(`/batches/${batchId}/semesters/${semId}`, data);
        return response.data;
    },
    deleteSemester: async (batchId, semId) => {
        const response = await api.delete(`/batches/${batchId}/semesters/${semId}`);
        return response.data;
    },
    // PLOs
    addPLO: async (batchId, data) => {
        const response = await api.post(`/batches/${batchId}/plos`, data);
        return response.data;
    },
    updateAllPLOs: async (batchId, plos) => {
        const response = await api.put(`/batches/${batchId}/plos`, { plos });
        return response.data;
    },
    deletePLO: async (batchId, ploId) => {
        const response = await api.delete(`/batches/${batchId}/plos/${ploId}`);
        return response.data;
    },
    // Batch Curriculum Courses (copy-on-assign pattern)
    getCurriculumCourses: async (batchId) => {
        const response = await api.get(`/batches/${batchId}/curriculum-courses`);
        return response.data;
    },
    addBatchCourse: async (batchId, semesterNumber, data) => {
        const response = await api.post(`/batches/${batchId}/semesters/${semesterNumber}/courses`, data);
        return response.data;
    },
    removeBatchCourse: async (batchId, semesterNumber, courseId) => {
        const response = await api.delete(`/batches/${batchId}/semesters/${semesterNumber}/courses/${courseId}`);
        return response.data;
    }
};

// ============================================
// Course API
// ============================================
export const courseApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/courses', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },
    import: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/courses/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    export: async () => {
        const response = await api.get('/courses/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'courses_export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    // Course Assignments
    assign: async (data) => {
        const response = await api.post('/courses/assign', data);
        return response.data;
    },
    updateAssignmentFaculty: async (assignmentId, facultyId) => {
        const response = await api.put(`/courses/assign/${assignmentId}`, { faculty_id: facultyId });
        return response.data;
    },
    getAssignments: async (params = {}) => {
        const response = await api.get('/courses/assignments', { params });
        return response.data;
    },
    getAssignmentDetails: async (assignmentId) => {
        const response = await api.get(`/courses/assignments/${assignmentId}`);
        return response.data;
    },
    getAssigned: async () => {
        const response = await api.get('/courses/assigned');
        return response.data;
    },
    removeAssignment: async (assignmentId) => {
        const response = await api.delete(`/courses/assign/${assignmentId}`);
        return response.data;
    },
    // CLOs
    addCLO: async (courseId, data) => {
        const response = await api.post(`/courses/${courseId}/clos`, data);
        return response.data;
    },
    updateCLO: async (courseId, cloId, data) => {
        const response = await api.put(`/courses/${courseId}/clos/${cloId}`, data);
        return response.data;
    },
    deleteCLO: async (courseId, cloId) => {
        const response = await api.delete(`/courses/${courseId}/clos/${cloId}`);
        return response.data;
    },
    // Syllabus
    updateSyllabus: async (courseId, data) => {
        const response = await api.put(`/courses/${courseId}/syllabus`, data);
        return response.data;
    },
    // All courses list (no pagination, for pickers)
    getAllList: async () => {
        const response = await api.get('/courses/all-list');
        return response.data;
    },
    // Global CLO management
    getAllCLOs: async () => {
        const response = await api.get('/courses/clos/all');
        return response.data;
    },
    addGlobalCLO: async (data) => {
        const response = await api.post('/courses/clos/add', data);
        return response.data;
    },
    importCLOs: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/courses/clos/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    exportCLOs: async () => {
        const response = await api.get('/courses/clos/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'clos_export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

// ============================================
// Parent API
// ============================================
export const parentApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/parents', { params });
        return response.data;
    }
};

// ============================================
// Student API
// ============================================
export const studentApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/students', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/students', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/students/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/students/${id}`);
        return response.data;
    },
    import: async (batchId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batch_id', batchId);
        const response = await api.post('/students/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    export: async (batchId) => {
        const response = await api.get(`/students/export/excel`, {
            params: { batch_id: batchId },
            responseType: 'blob'
        });
        return response.data;
    },
    // Enrollment
    enroll: async (data) => {
        const response = await api.post('/students/enroll', data);
        return response.data;
    },
    getEnrollments: async (studentId) => {
        const response = await api.get(`/students/${studentId}/enrollments`);
        return response.data;
    },
    getEnrolledStudents: async (courseAssignmentId) => {
        const response = await api.get(`/students/enrolled/${courseAssignmentId}`);
        return response.data;
    }
};

// ============================================
// Assessment API
// ============================================
export const assessmentApi = {
    getByCourse: async (courseAssignmentId, params = {}) => {
        const response = await api.get(`/assessments/course/${courseAssignmentId}`, { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/assessments/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/assessments', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/assessments/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/assessments/${id}`);
        return response.data;
    }
};

// ============================================
// Grade API
// ============================================
export const gradeApi = {
    getByAssessment: async (assessmentId, params = {}) => {
        const response = await api.get(`/assessments/${assessmentId}/grades`, { params });
        return response.data;
    },
    save: async (assessmentId, grades) => {
        const response = await api.post(`/assessments/${assessmentId}/grades`, { grades });
        return response.data;
    },
    export: async (assessmentId) => {
        const response = await api.get(`/assessments/${assessmentId}/grades/export`, {
            responseType: 'blob'
        });
        return response.data;
    },
    importGrades: async (assessmentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/assessments/${assessmentId}/grades/import`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

// ============================================
// Attendance API
// ============================================
export const attendanceApi = {
    getByCourse: async (courseAssignmentId, params = {}) => {
        const response = await api.get(`/attendance/course/${courseAssignmentId}`, { params });
        return response.data;
    },
    saveCourseAttendance: async (courseAssignmentId, data) => {
        const response = await api.post(`/attendance/course/${courseAssignmentId}`, data);
        return response.data;
    },
    mark: async (data) => {
        const response = await api.post('/attendance', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/attendance/${id}`, data);
        return response.data;
    },
    export: async (courseAssignmentId, params = {}) => {
        const response = await api.get(`/attendance/export/${courseAssignmentId}`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    import: async (courseAssignmentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/attendance/import/${courseAssignmentId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getMonthly: async (courseAssignmentId, month, year) => {
        const response = await api.get(`/attendance/monthly/${courseAssignmentId}`, {
            params: { month, year }
        });
        return response.data;
    },
    exportMonthly: async (courseAssignmentId, month, year) => {
        const response = await api.get(`/attendance/export-monthly/${courseAssignmentId}`, {
            params: { month, year },
            responseType: 'blob'
        });
        return response.data;
    }
};

// ============================================
// Department API
// ============================================
export const departmentApi = {
    getAll: async () => {
        const response = await api.get('/departments');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/departments/${id}`);
        return response.data;
    },
    getFaculty: async (departmentId) => {
        const response = await api.get(`/departments/${departmentId}/faculty`);
        return response.data;
    },
    getAllFaculty: async () => {
        const response = await api.get('/departments/faculty');
        return response.data;
    },
    getPLOs: async (departmentId) => {
        const response = await api.get(`/departments/${departmentId}/plos`);
        return response.data;
    }
};

// ============================================
// Dashboard API (Admin analytics)
// ============================================
export const dashboardApi = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getStudentsPerDept: async () => {
        const response = await api.get('/dashboard/students-per-department');
        return response.data;
    },
    getEnrollmentTrends: async () => {
        const response = await api.get('/dashboard/enrollment-trends');
        return response.data;
    },
    getAttendanceOverview: async () => {
        const response = await api.get('/dashboard/attendance-overview');
        return response.data;
    },
    getGradeDistribution: async () => {
        const response = await api.get('/dashboard/grade-distribution');
        return response.data;
    },
    getFacultyWorkload: async () => {
        const response = await api.get('/dashboard/faculty-workload');
        return response.data;
    },
    getBatchCGPA: async () => {
        const response = await api.get('/dashboard/batch-cgpa');
        return response.data;
    },
    getCoursesPerDept: async () => {
        const response = await api.get('/dashboard/courses-per-department');
        return response.data;
    },
    getUsersByRole: async () => {
        const response = await api.get('/dashboard/users-by-role');
        return response.data;
    }
};


// ============================================
// Curriculum API
// ============================================
export const curriculumApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/curricula', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/curricula/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/curricula', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/curricula/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/curricula/${id}`);
        return response.data;
    },
    addCourses: async (curriculumId, semesterNumber, data) => {
        const response = await api.post(`/curricula/${curriculumId}/semesters/${semesterNumber}/courses`, data);
        return response.data;
    },
    removeCourse: async (curriculumId, semesterNumber, courseId) => {
        const response = await api.delete(`/curricula/${curriculumId}/semesters/${semesterNumber}/courses/${courseId}`);
        return response.data;
    }
};

// ============================================
// Notification API
// ============================================
export const notificationApi = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAllRead: async () => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    }
};

export default api;
