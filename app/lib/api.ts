// Centralized API Configuration
// Set NEXT_PUBLIC_API_URL in your hosting platform to your backend's production URL
// e.g., https://api.snagup.com/api or https://yourapp.com/api
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Backend base (without /api) — used for static file URLs like certificates
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
};
