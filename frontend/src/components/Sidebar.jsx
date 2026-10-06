import React, { useState } from "react";
import {
  LayoutGrid,
  FolderClosed,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import useSceneStore from "../store/useSceneStore";

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const { showGrid, setShowGrid } = useSceneStore();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  return (
    <>
      <aside className="w-16 flex flex-col items-center py-6 bg-bg-sidebar border-r border-black/5 dark:border-white/5 z-40">
        <div className="flex-1 flex flex-col gap-6">
          <div
            className="sidebar-icon active"
            onClick={() => navigate("/dashboard")}
            title="Dashboard"
          >
            <LayoutGrid size={22} />
          </div>
          <div
            className="sidebar-icon"
            onClick={() => {
              toast.info("Your saved boards are on the dashboard.");
              navigate("/dashboard");
            }}
            title="My Boards"
          >
            <FolderClosed size={22} />
          </div>
          <div
            className="sidebar-icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={22} />
          </div>
        </div>

        <div className="flex-col flex gap-6">
          <div
            className="sidebar-icon"
            onClick={() => {
              toast.info("Help Center loaded.");
            }}
            title="Help"
          >
            <HelpCircle size={22} />
          </div>
          <div
            className="sidebar-icon text-red-400 hover:bg-red-400/10"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-16 top-0 bottom-0 w-80 glass border-r border-black/10 dark:border-white/10 z-50 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-content-primary tracking-tight">
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-content-secondary hover:text-content-primary transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-4">
                  Account Profile
                </h3>
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                  <p className="text-sm font-medium text-content-primary mb-1">
                    {username}
                  </p>
                  <p className="text-xs text-content-secondary capitalize">
                    Role: {role}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-4">
                  Whiteboard Preferences
                </h3>
                <div className="flex flex-col gap-2">
                  <div
                    className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition"
                    onClick={() => useSceneStore.getState().toggleTheme()}
                  >
                    <div className="text-sm font-medium text-content-primary">
                      Light Mode
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full relative transition ${useSceneStore.getState().theme === "light" ? "bg-accent-primary" : "bg-black/20 dark:bg-white/20"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 mt-px w-4 h-4 rounded-full bg-white transition shadow-sm ${useSceneStore.getState().theme === "light" ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <div className="text-sm font-medium text-content-primary">
                      Show Grid Background
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full relative transition ${showGrid ? "bg-accent-primary" : "bg-black/20 dark:bg-white/20"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 mt-px w-4 h-4 rounded-full bg-white transition shadow-sm ${showGrid ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-content-secondary mt-2 px-1">
                  Toggles the dot grid rendered on the whiteboard background.
                </p>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
