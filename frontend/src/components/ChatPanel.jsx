import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, Hash, Hand, ChevronDown, Shield, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import useSceneStore from '../store/useSceneStore';

export default function ChatPanel({ messages, ws, onSendChat }) {
  const [text, setText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollRef = useRef(null);
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  
  const { canChat, chatLocked } = useSceneStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !canSendMessage() || !ws) return;

    const msgPayload = { message: text, target: 'all', role };
    ws.send(JSON.stringify({
      type: "chat",
      payload: msgPayload
    }));
    setText('');
  };

  const requestPermission = () => {
      if (!ws) return;
      ws.send(JSON.stringify({
          type: "permission_request",
          payload: { request: "chat" }
      }));
      toast.info("Chat access request sent to teacher...");
  };

  const toggleChatLock = (lock) => {
      if (!ws || role !== 'teacher') return;
      ws.send(JSON.stringify({
          type: "control",
          payload: { action: lock ? "lock_chat" : "unlock_chat" }
      }));
      setShowDropdown(false);
  };

  const canSendMessage = () => {
      if (role === 'teacher') return true;
      if (canChat) return true;
      return !chatLocked;
  };

  // Filter visible messages based on chatTarget selection
  const filteredMessages = messages.filter(m => {
    // Show all messages to teacher always
    if (role === 'teacher') return true;
    // If message has a target of 'teacher' and user is student, only show if they sent it
    if (m.payload?.target === 'teacher' && m.sender !== username) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-transparent text-white/90">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Hash size={18} className="text-accent-primary" />
            <h3 className="font-bold tracking-wide uppercase text-xs">Chat</h3>
        </div>
        {(!canSendMessage()) && <Lock size={14} className="text-red-400/60" />}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="text-[10px] text-center text-content-secondary uppercase tracking-[0.2em] py-4 opacity-50">
            Start of Session
        </div>
        <AnimatePresence>
          {filteredMessages.map((m, i) => (
            <motion.div
              key={`msg-${i}-${m.ts}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${m.sender === username ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider">{m.sender}</span>
                {m.payload?.role && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${m.payload.role === 'teacher' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/10 text-white/40'}`}>
                    {m.payload.role}
                  </span>
                )}
                {m.payload?.target === 'teacher' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary font-bold">DM</span>
                )}
                <span className="text-[9px] text-white/20">{m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.sender === username 
                  ? 'bg-accent-primary text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/5 rounded-tl-none'
              }`}>
                {m.payload?.message || m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-white/[0.02] border-t border-white/5">
        {/* Target selector dropdown (Teacher only) */}
        {role === 'teacher' && (
        <div className="relative mb-2">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-content-secondary hover:text-white transition w-full"
          >
            {!chatLocked ? (
              <><Users size={12} /> Everyone</>
            ) : (
              <><Shield size={12} /> Teacher Only</>
            )}
            <ChevronDown size={12} className="ml-auto" />
          </button>
          
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute bottom-full left-0 right-0 mb-1 glass-dark rounded-xl overflow-hidden z-50 shadow-xl"
              >
                <button 
                  onClick={() => toggleChatLock(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium w-full hover:bg-white/5 transition ${!chatLocked ? 'text-accent-primary' : 'text-content-secondary'}`}
                >
                  <Users size={12} /> Everyone
                </button>
                <button 
                  onClick={() => toggleChatLock(true)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium w-full hover:bg-white/5 transition ${chatLocked ? 'text-accent-primary' : 'text-content-secondary'}`}
                >
                  <Shield size={12} /> Teacher Only
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {canSendMessage() ? (
            <form onSubmit={handleSend} className="relative">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-white/5 border border-white/5 focus:border-accent-primary/50 focus:bg-white/10 rounded-xl py-3 pl-4 pr-12 text-sm transition-all outline-none"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-all disabled:opacity-30"
                >
                    <Send size={18} />
                </button>
            </form>
        ) : (
            <button 
                onClick={requestPermission}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-primary/30 text-content-secondary hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
                <Hand size={14} />
                Request Chat Access
            </button>
        )}
        <p className="text-[9px] text-content-secondary mt-3 text-center opacity-40 uppercase tracking-widest">
            {!canSendMessage() ? 'Observe only' : 'Messages are synchronized'}
        </p>
      </div>
    </div>
  );
}
