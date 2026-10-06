// src/utils/api.js
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_BASE,
});

// ✅ Initialize the token immediately on module load
const token = localStorage.getItem("access_token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}


// Global slow-request detector (Render Cold Start UX)
const activeTimers = new Map();

api.interceptors.request.use((config) => {
  // Generate a unique ID for this request
  const reqId = Math.random().toString(36).substring(7);
  config.reqId = reqId;
  
  // Set a timer to show a toast if request takes longer than 3.5 seconds
  activeTimers.set(reqId, setTimeout(() => {
    toast.info("Waking up the server... Please wait up to 50 seconds! ?", { 
      toastId: 'server-wakeup',
      autoClose: 10000 
    });
  }, 3500));
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    const timer = activeTimers.get(response.config.reqId);
    if (timer) clearTimeout(timer);
    activeTimers.delete(response.config.reqId);
    
    // If the toast is active, we can dismiss it early
    if (toast.isActive('server-wakeup')) {
      toast.dismiss('server-wakeup');
    }
    return response;
  },
  (error) => {
    const timer = activeTimers.get(error.config?.reqId);
    if (timer) clearTimeout(timer);
    activeTimers.delete(error.config?.reqId);
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("access_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("access_token");
  }
}

export default api;
