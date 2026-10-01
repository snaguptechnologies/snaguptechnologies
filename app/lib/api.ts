import axios from 'axios';

// Centralized API Configuration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
        console.warn("⚠️ [SECURITY WARNING] NEXT_PUBLIC_API_URL environment variable is missing in production build.");
    }
}

// Enable cross-origin credentials (cookies) for all client-side API requests
axios.defaults.withCredentials = true;

export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

export const API_ENDPOINTS = {
    AUTH: `${BASE_URL}/auth`,
    DASHBOARD: `${BASE_URL}/dashboard`,
    COURSES: `${BASE_URL}/courses`,
    INSTRUCTORS: `${BASE_URL}/instructors`,
    BATCHS: `${BASE_URL}/batches`,
    ENROLLMENTS: `${BASE_URL}/enrollments`,
    STUDENTS: `${BASE_URL}/users/students`,
    CERTIFICATES: `${BASE_URL}/certificates`,
    INQUIRIES: `${BASE_URL}/inquiries`,
    SETTINGS: `${BASE_URL}/settings`,
    ATTENDANCE: `${BASE_URL}/attendance`,
    PAYMENTS: `${BASE_URL}/payments`,
    USERS: `${BASE_URL}/users`,
    APPLICATIONS: `${BASE_URL}/applications`,
    ACTIVITIES: `${BASE_URL}/applications/activities`,
    SYLLABUS: `${BASE_URL}/syllabus`,
    ASSESSMENTS: `${BASE_URL}/assessments`,
    SECURITY: `${BASE_URL}/security`,
};

