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

// Global response interceptor for unified error handling
api.interceptors.response.use(
    (response) => response.data, // Strip the axios wrapper
    (error) => {
        // Extract a clean message for the UI
        const message = error.response?.data?.message || 'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
    signup: (userData) => api.post('/auth/signup', userData),
    login: (email, password, role) => api.post('/auth/login', { email, password, role }),
    getProfile: () => api.get('/auth/profile'),
    getFaculties: () => api.get('/auth/faculties'),
    getDepartments: (faculty) => api.get(`/auth/departments/${encodeURIComponent(faculty)}`),
    getAllDepartments: () => api.get('/auth/departments')
};

// ==========================================
// APPROVAL API
// ==========================================
export const approvalApi = {
    getPendingUsers: () => api.get('/approvals/pending'),
    approveUser: (userId) => api.post(`/approvals/${userId}/approve`),
    rejectUser: (userId, reason) => api.post(`/approvals/${userId}/reject`, { reason }),
    getUsersByRole: (role) => api.get(`/approvals/users/${role}`),
    deleteUser: (userId) => api.delete(`/approvals/${userId}`)
};

// ==========================================
// DASHBOARD API
// ==========================================
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
    getStudentsPerDepartment: () => api.get('/dashboard/students-per-department'),
    getEnrollmentTrends: () => api.get('/dashboard/enrollment-trends'),
    getAttendanceOverview: () => api.get('/dashboard/attendance-overview'),
    getGradeDistribution: () => api.get('/dashboard/grade-distribution'),
    getFacultyWorkload: () => api.get('/dashboard/faculty-workload'),
    getBatchCgpa: () => api.get('/dashboard/batch-cgpa'),
    getCoursesPerDepartment: () => api.get('/dashboard/courses-per-department'),
    getUsersByRole: () => api.get('/dashboard/users-by-role')
};

// ==========================================
// STUDENT API
// ==========================================
export const studentApi = {
    // Get paginated students
    getStudents: (page = 1, limit = 10, search = '', batch_id = '') => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        if (batch_id) params.append('batch_id', batch_id);
        return api.get(`/students?${params.toString()}`);
    },
    
    getStudentById: (id) => api.get(`/students/${id}`),
    
    addStudent: (studentData) => api.post('/students', studentData),
    updateStudent: (id, studentData) => api.put(`/students/${id}`, studentData),
    deleteStudent: (id) => api.delete(`/students/${id}`),

    // EXCEL IMPORT
    importStudents: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/students/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // EXCEL EXPORT
    exportStudents: (batch_id = '') => {
        const params = new URLSearchParams();
        if (batch_id) params.append('batch_id', batch_id);
        
        return api.get(`/students/export/excel?${params.toString()}`, {
            responseType: 'blob' // CRITICAL for file downloads
        });
    }
};

// ==========================================
// DEPARTMENT API
// ==========================================
export const departmentApi = {
    getDepartments: (page = 1, limit = 10, search = '', faculty_id = '') => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        if (faculty_id) params.append('faculty_id', faculty_id);
        return api.get(`/departments?${params.toString()}`);
    },
    createDepartment: (data) => api.post('/departments', data),
    updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
    deleteDepartment: (id) => api.delete(`/departments/${id}`)
};

// ==========================================
// BATCH API
// ==========================================
export const batchApi = {
    getBatches: (page = 1, limit = 10, department_id = '', status = '') => {
        const params = new URLSearchParams({ page, limit });
        if (department_id) params.append('department_id', department_id);
        if (status) params.append('status', status);
        return api.get(`/batches?${params.toString()}`);
    },
    getBatchById: (id) => api.get(`/batches/${id}`),
    createBatch: (data) => api.post('/batches', data),
    updateBatch: (id, data) => api.put(`/batches/${id}`, data),
    deleteBatch: (id) => api.delete(`/batches/${id}`)
};

// ==========================================
// COURSE API
// ==========================================
export const courseApi = {
    getCourses: (page = 1, limit = 10, search = '', department_id = '') => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        if (department_id) params.append('department_id', department_id);
        return api.get(`/courses?${params.toString()}`);
    },
    getCourseById: (id) => api.get(`/courses/${id}`),
    createCourse: (data) => api.post('/courses', data),
    updateCourse: (id, data) => api.put(`/courses/${id}`, data),
    deleteCourse: (id) => api.delete(`/courses/${id}`),
    
    // Course Assignments
    assignCourse: (data) => api.post('/courses/assign', data)
};

// ==========================================
// ASSESSMENT & GRADES API
// ==========================================
export const assessmentApi = {
    getAssessments: (courseAssignmentId, page = 1, limit = 10, type = '', status = '') => {
        const params = new URLSearchParams({ page, limit });
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        return api.get(`/assessments/course/${courseAssignmentId}?${params.toString()}`);
    },
    getAssessmentById: (id) => api.get(`/assessments/${id}`),
    createAssessment: (data) => api.post('/assessments', data),
    updateAssessment: (id, data) => api.put(`/assessments/${id}`, data),
    deleteAssessment: (id) => api.delete(`/assessments/${id}`),

    // Grades
    getGrades: (assessmentId, page = 1, limit = 10) => 
        api.get(`/assessments/${assessmentId}/grades?page=${page}&limit=${limit}`),
    
    saveGrades: (assessmentId, gradesData) => 
        api.post(`/assessments/${assessmentId}/grades`, { grades: gradesData }),
        
    importGrades: (assessmentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/assessments/${assessmentId}/grades/import`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    exportGrades: (assessmentId) => 
        api.get(`/assessments/${assessmentId}/grades/export`, { responseType: 'blob' })
};

// ==========================================
// ATTENDANCE API
// ==========================================
export const attendanceApi = {
    getAttendance: (courseAssignmentId, page = 1, limit = 10, date = '') => {
        const params = new URLSearchParams({ page, limit });
        if (date) params.append('date', date);
        return api.get(`/attendance/course/${courseAssignmentId}?${params.toString()}`);
    },
    
    getAttendanceSummary: (courseAssignmentId) => 
        api.get(`/attendance/summary/${courseAssignmentId}`),
        
    saveAttendance: (courseAssignmentId, date, records) => 
        api.post(`/attendance/course/${courseAssignmentId}`, { date, records }),
        
    importAttendance: (courseAssignmentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/attendance/import/${courseAssignmentId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    exportAttendance: (courseAssignmentId, date = '') => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        return api.get(`/attendance/export/${courseAssignmentId}?${params.toString()}`, { responseType: 'blob' });
    }
};

// Legacy APIs (for backward compatibility)
export const adminAuth = {
    login: (email, password) => authApi.login(email, password, 'deptadmin'),
};

export const facultyAuth = {
    signup: (fullName, email, password) => authApi.signup({ fullName, email, password, role: 'faculty' }),
    login: (email, password) => authApi.login(email, password, 'faculty'),
};

export default api;
