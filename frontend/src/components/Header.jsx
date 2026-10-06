import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Copy, Check, MessageSquare, Lock, Shield, Move } from 'lucide-react';
import { toast } from 'react-toastify';
import useSceneStore from '../store/useSceneStore';

export default function Header({ roomName, roomSlug, participants = [], toggleChat }) {
  const role = localStorage.getItem("role");
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { otherCursors, setPan, zoom, viewLocked, setViewLocked } = useSceneStore();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomSlug);
    setCopied(true);
    toast.success("Room code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarClick = (username) => {
    const cursor = otherCursors[username];
    if (cursor) {
      setPan({
        x: window.innerWidth / 2 - cursor.x * zoom,
        y: window.innerHeight / 2 - cursor.y * zoom
      });
    } else if (username !== localStorage.getItem("username")) {
      toast.info(`${username} is not currently moving their mouse.`);
    }
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 flex items-center justify-between px-6 bg-transparent border-b border-black/5 dark:border-white/5 z-50 backdrop-blur-md"
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white shadow-lg shadow-accent-primary/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-content-primary/90">CollabCanvas</h1>
        </div>

        <div className="h-6 w-px bg-black/10 dark:bg-white/10 hidden md:block"></div>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm font-medium text-content-primary/70">{roomName || 'Untitled Board'}</span>
          {/* Room code badge */}
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-content-secondary hover:text-content-primary text-xs font-mono transition"
            title="Click to copy room code"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {roomSlug}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {participants.slice(0, 4).map((p, i) => (
            <div 
              key={p.username || i} 
              onClick={() => handleAvatarClick(p.username)}
              className="w-8 h-8 rounded-full border-2 border-bg-main flex items-center justify-center text-[10px] font-bold text-content-primary shadow-sm ring-1 ring-black/10 dark:ring-white/10 cursor-pointer hover:z-10 hover:scale-110 transition"
              style={{ backgroundColor: p.color || `hsl(${(i * 60) % 360}, 60%, 50%)` }}
              title={`${p.username} - Click to follow`}
            >
              {(p.username || 'U')[0].toUpperCase()}
            </div>
          ))}
          {participants.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-bg-main bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-content-secondary ring-1 ring-black/10 dark:ring-white/10">
              +{participants.length - 4}
            </div>
          )}
        </div>

        {/* Invite button — opens a popover with room code */}
        {role === 'teacher' && (
          <div className="relative">
            <button 
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium transition shadow-lg shadow-accent-primary/20"
            >
              <UserPlus size={16} />
              Invite
            </button>

            <AnimatePresence>
              {showInvite && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 p-4 glass-dark rounded-2xl shadow-2xl z-50"
                >
                  <h4 className="text-sm font-bold mb-3">Share this room code</h4>
                  <p className="text-xs text-content-secondary mb-3">Students can join by entering this code in their dashboard.</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono text-content-primary">
                      {roomSlug}
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className="px-3 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/80 text-white transition"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-3">
          <button 
            onClick={() => setViewLocked(!viewLocked)}
            className={`p-2 rounded-lg transition ${viewLocked ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-black/5 dark:hover:bg-white/5 text-content-secondary'}`}
            title={viewLocked ? "Unlock Viewport" : "Lock Viewport (Prevent Panning)"}
          >
            <Lock size={20} className={viewLocked ? 'opacity-50' : ''} />
          </button>

          <button 
            onClick={toggleChat}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-content-secondary"
            title="Toggle Chat"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
