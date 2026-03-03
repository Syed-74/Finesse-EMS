import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:5000/api', // Reverting to include /api as per backend mounting
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor: Attach Token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (like 401)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized! Redirecting to login...");
            // Optional: window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default instance;

