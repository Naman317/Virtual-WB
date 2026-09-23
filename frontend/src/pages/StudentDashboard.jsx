import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ExternalLink, Calendar, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import { setAuthToken } from "../utils/api";

export default function StudentDashboard() {
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const fetchRooms = async () => {
    try {
      const res = await api.get("boards/rooms/");
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await api.post("boards/rooms/join-by-code/", { code: joinCode });
      toast.success("Joined successfully!");
      setJoinCode("");
      fetchRooms();
    } catch (err) {
      console.error(err.response?.data);
      toast.error(err.response?.data?.error || "Failed to join room");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="flex h-screen bg-bg-main text-white overflow-hidden">
      <Sidebar onLogout={() => { setAuthToken(null); localStorage.clear(); navigate('/login'); }} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-transparent border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight outfit">Learning Space</h2>
            <p className="text-xs text-content-secondary">Welcome back, <span className="text-accent-secondary">{username}</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-accent-primary/20">
              {username ? username[0].toUpperCase() : 'S'}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {/* Join Room Section */}
            <div className="mb-12">
               <h3 className="text-lg font-semibold mb-4 text-white">Enter a Classroom</h3>
               <form onSubmit={joinRoom} className="flex gap-3">
                  <div className="relative flex-1 max-w-md">
                     <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" size={18} />
                     <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Ex: kk-9d90b3"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white focus:bg-white/10 focus:border-accent-secondary/50 transition-all outline-none"
                        required
                     />
                  </div>
                  <button type="submit" className="px-8 py-3.5 rounded-xl bg-accent-secondary hover:bg-accent-secondary/90 text-white font-bold transition shadow-lg shadow-accent-secondary/20 flex items-center gap-2">
                    <LogIn size={20} />
                    Join Now
                  </button>
               </form>
            </div>

            {/* List Section */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Classrooms</h3>
                <span className="text-xs text-content-secondary">{rooms.length} Active Sessions</span>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2].map(i => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {rooms.map((r, i) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group glass p-6 rounded-3xl hover:border-accent-secondary/30 transition-all relative"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
                                        <ExternalLink size={24} />
                                    </div>
                                    {r.is_locked && (
                                        <div className="px-2 py-1 rounded-md bg-red-400/10 text-red-400 text-[10px] font-bold uppercase tracking-widest">Locked</div>
                                    )}
                                </div>
                                
                                <h4 className="text-lg font-bold mb-1 group-hover:text-accent-secondary transition truncate">{r.name}</h4>
                                <div className="text-xs text-content-secondary mb-6">Created by {r.created_by_username}</div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] text-content-secondary uppercase tracking-widest font-bold">
                                        <Calendar size={12} />
                                        {(new Date(r.created_at)).toLocaleDateString()}
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/room/${r.slug}`)}
                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-secondary text-white text-xs font-bold transition shadow-sm"
                                    >
                                        Open
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {rooms.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-text-secondary">You haven't joined any classrooms yet. Enter a code above!</p>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </main>
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
}

