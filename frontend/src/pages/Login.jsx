import React, { useState } from "react";
import api, { setAuthToken } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the api utility instead of raw axios
      const response = await api.post("token/", formData);
      console.log("Login response:", response.data);

      const { refresh, access, username, role } = response.data;

      if (access && refresh) {
        setAuthToken(access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("username", username);
        localStorage.setItem("role", role);

        // ✅ Navigate based on role
        if (role === "teacher") navigate("/teacher-dashboard");
        else if (role === "student") navigate("/student-dashboard");
      } else {
        setError("Invalid login response from server.");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-secondary/10 blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 rounded-2xl bg-accent-primary flex items-center justify-center text-white mb-4 shadow-lg shadow-accent-primary/20">
              <LogIn size={24} />
           </div>
           <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
           <p className="text-text-secondary text-sm mt-2">Sign in to your collaborative workspace</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-400/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-accent-primary/20 mt-4 h-12 flex items-center justify-center overflow-hidden"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-secondary">Don't have an account? </span>
          <button 
            onClick={() => navigate('/register')}
            className="text-accent-primary font-bold hover:underline"
          >
            Create one
          </button>
        </div>
      </motion.div>
    </div>
  );
}
