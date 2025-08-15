// src/utils/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REMOTE_SERVER || "http://localhost:4000";

// Create axios instance with default configuration
const axiosWithCredentials = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // This is equivalent to credentials: 'include'
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor for debugging (optional)
axiosWithCredentials.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosWithCredentials.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('Response error:', error);

        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.warn('Unauthorized access - user may need to sign in again');

            // DO NOT automatically redirect - let each component handle it
            // Components will show their own sign-in required screens
        }

        return Promise.reject(error);
    }
);

export default axiosWithCredentials;