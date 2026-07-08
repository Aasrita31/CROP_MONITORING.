import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://127.0.0.1:8000/api";
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("agritwin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on an auth page
      const path = window.location.pathname;
      if (!["/login", "/register", "/forgot-password", "/"].includes(path)) {
        localStorage.removeItem("agritwin_token");
        localStorage.removeItem("agritwin_refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
