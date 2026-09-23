import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Room from "./pages/Room";
import { setAuthToken } from "./utils/api";

const isLoggedIn = () => !!localStorage.getItem("access_token");
const getRole = () => localStorage.getItem("role");

export default function App() {
  const location = useLocation(); // Forces re-render on navigation
  const loggedIn = isLoggedIn();
  const role = getRole();

  // ✅ Initialize auth token on app load to prevent 401 errors on refresh
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
        setAuthToken(token);
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg-main antialiased">
      {/* We removed the basic Navbar in favor of the specialized Dashboards and Room layouts */}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            loggedIn ? (
              role === "teacher" ? (
                <Navigate to="/teacher-dashboard" />
              ) : role === "student" ? (
                <Navigate to="/student-dashboard" />
              ) : (
                <Dashboard />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/login" element={loggedIn ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={loggedIn ? <Navigate to="/dashboard" /> : <Register />} />

        <Route
          path="/teacher-dashboard"
          element={
            loggedIn && role === "teacher" ? (
              <TeacherDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/student-dashboard"
          element={
            loggedIn && role === "student" ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/room/:slug" element={<Room />} />
        <Route path="*" element={<div className="p-8 text-white">404 Not Found</div>} />
      </Routes>
    </div>
  );
}
