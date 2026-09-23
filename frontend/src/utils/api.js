// src/utils/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_BASE,
});

// ✅ Initialize the token immediately on module load
const token = localStorage.getItem("access_token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

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
