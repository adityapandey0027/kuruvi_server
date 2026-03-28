import axios from 'axios';

// 1. Base URL ko env file se uthana best practice hai
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Har request ke saath token bhejne ke liye
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agar hum images bhej rahe hain (FormData), 
    // toh axios automatically Content-Type set kar deta hai, isliye manually karne ki zarurat nahi
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Error handling aur session management ke liye
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Agar token expire ho jaye ya user unauthorized ho (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Page refresh karke login par bhej dega varna window.location.href = '/admin/login' use karein
      window.location.reload(); 
    }
    
    // Global error message console mein dikhane ke liye
    console.error("API Error:", error.response?.data?.message || "Something went wrong");
    
    return Promise.reject(error);
  }
);

export default API;