import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, User, Lock, BookOpen } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("core/register/", {
        username,
        password,
        display_name: displayName,
        role,
      });
      nav("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed. Try a different username.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-secondary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-primary/10 blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 rounded-2xl bg-accent-secondary flex items-center justify-center text-white mb-4 shadow-lg shadow-accent-secondary/20">
              <UserPlus size={24} />
           </div>
           <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
           <p className="text-content-secondary text-sm mt-2">Join the collaborative workspace</p>
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
            <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Role</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-primary/50 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="student" className="bg-bg-main">Student</option>
                <option value="teacher" className="bg-bg-main">Teacher</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-accent-primary/20 mt-4 h-12 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-content-secondary">Already have an account? </span>
          <button
            className="text-accent-primary font-bold hover:underline"
            onClick={() => nav("/login")}
          >
            Sign in
          </button>
        </div>
      </motion.div>
    </div>
  );
}
