import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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

// Admin Auth API
export const adminAuth = {
    login: async (email, password) => {
        const response = await api.post('/auth/admin/login', { email, password });
        return response.data;
    },
};

// Faculty Auth API
export const facultyAuth = {
    signup: async (fullName, email, password) => {
        const response = await api.post('/auth/faculty/signup', { fullName, email, password });
        return response.data;
    },
    login: async (email, password) => {
        const response = await api.post('/auth/faculty/login', { email, password });
        return response.data;
    },
};

export default api;
