import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? `${import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000"}/api` : "/api",
    withCredentials: true,
});