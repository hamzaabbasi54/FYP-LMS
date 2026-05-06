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

// Auth API
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
    // User Management (Director Only)
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
    }
};

// Approval API
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

// Legacy APIs (for backward compatibility)
export const adminAuth = {
    login: async (email, password) => {
        return authApi.login(email, password, 'deptadmin');
    },
};

export const facultyAuth = {
    signup: async (fullName, email, password) => {
        return authApi.signup({ fullName, email, password, role: 'faculty' });
    },
    login: async (email, password) => {
        return authApi.login(email, password, 'faculty');
    },
};

export default api;
