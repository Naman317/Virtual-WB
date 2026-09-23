import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import api, { setAuthToken } from "../utils/api";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { MainToolbar, ActionToolbar, ZoomToolbar } from "../components/FloatingToolbars";
import PropertyPanel from "../components/PropertyPanel";
import RoughCanvas from "../components/RoughCanvas";
import ChatPanel from "../components/ChatPanel";
import useSceneStore from "../store/useSceneStore";

export default function Room() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // App State
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Local Drawing State (Syncing with store)
  const [selectedTool, setSelectedTool] = useState('pencil');
  const [strokeColor, setStrokeColor] = useState('#6366F1');
  const [fillColor, setFillColor] = useState(null);
  const [fillStyle, setFillStyle] = useState('hachure');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  const { clearElements, setPermissions } = useSceneStore();
  
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(1000);

  useEffect(() => {
    let mounted = true;

    const fetchRoom = async () => {
      try {
        const res = await api.get("boards/rooms/");
        const found = res.data.find(r => r.slug === slug);
        if (found) {
          if (mounted) {
            setRoom(found);
            setPermissions({ 
                canDraw: role === 'teacher',
                canChat: role === 'teacher'
            });
            connectWS(found.slug);
          }
        } else {
          toast.error("Room not found");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load room");
      }
    };

    fetchRoom();

    return () => {
        mounted = false;
        if(wsRef.current) {
            wsRef.current.onclose = null; // Prevent reconnect loop on unmount
            wsRef.current.close();
        }
        clearElements();
    }
  }, [slug]);

  const connectWS = (roomSlug) => {
    const token = localStorage.getItem("access_token");
    const wsBase = import.meta.env.VITE_WS_BASE || "ws://localhost:8000";
    const wsUrl = `${wsBase}/ws/room/${roomSlug}/?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket Connected");
      toast.info("Connected to room");
      reconnectTimeoutRef.current = 1000; // Reset
    };

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "chat") {
        setMessages(prev => [...prev, data]);
      } else if (data.type === "permission_request") {
        if (role === 'teacher') {
            // Custom toast with Accept/Deny buttons
            toast(
              ({ closeToast }) => (
                <div>
                  <p className="font-bold text-sm mb-2">{data.payload?.user || data.sender} wants {data.payload?.request} access</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { approvePermission(data.payload?.user || data.sender, data.payload?.request); closeToast(); }}
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition"
                    >
                      ✓ Grant
                    </button>
                    <button 
                      onClick={closeToast}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold transition"
                    >
                      ✕ Deny
                    </button>
                  </div>
                </div>
              ),
              { 
                autoClose: 15000, 
                closeOnClick: false,
                toastId: `perm_req_${data.sender}_${data.payload?.request}`
              }
            );
        }
      }
    };

    wsRef.current.onclose = () => {
        console.log("WebSocket Disconnected");
        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current < 30000) {
            reconnectTimeoutRef.current *= 2;
        }
        toast.error(`Connection lost. Retrying in ${reconnectTimeoutRef.current / 1000}s...`, { autoClose: 2000 });
        setTimeout(() => connectWS(roomSlug), reconnectTimeoutRef.current);
    };
  };

  const approvePermission = (target, type) => {
      wsRef.current.send(JSON.stringify({
          type: "control",
          payload: { action: "grant_permission", target, perm_type: type }
      }));
  };

  const handleClearBoard = () => {
      wsRef.current.send(JSON.stringify({
          type: "control",
          payload: { action: "clear" }
      }));
  };

  const handleLogout = () => {
      setAuthToken(null);
      localStorage.clear();
      navigate("/login");
  };

  if (!room) return <div className="h-screen flex items-center justify-center bg-bg-main">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-bg-main overflow-hidden select-none">
      <Header 
        roomName={room.name} 
        roomSlug={room.slug} 
        participants={participants} 
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onLogout={handleLogout} />
        
        <main className="flex-1 relative overflow-hidden bg-white/[0.02] rounded-tl-3xl border-l border-t border-white/5 shadow-2xl">
          <RoughCanvas 
            ws={wsRef.current}
            tool={selectedTool}
            color={strokeColor}
            fillColor={fillColor}
            fillStyle={fillStyle}
            width={strokeWidth}
          />

          <MainToolbar 
            selectedTool={selectedTool} 
            setSelectedTool={setSelectedTool} 
          />
          
          <ActionToolbar 
            ws={wsRef.current}
            onClear={handleClearBoard}
          />

          <ZoomToolbar />

          <PropertyPanel 
            strokeColor={strokeColor} 
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            fillStyle={fillStyle}
            setFillStyle={setFillStyle}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
          />
        </main>

        <aside className="w-80 border-l border-white/5 flex flex-col glass-dark">
          <ChatPanel 
            messages={messages} 
            ws={wsRef.current}
            onSendChat={(msg) => setMessages(prev => [...prev, msg])}
          />
        </aside>
      </div>
      
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
}
