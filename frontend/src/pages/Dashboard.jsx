import React, { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [rooms, setRooms] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async function fetchRooms() {
      try {
        const res = await api.get("boards/rooms/");
        if (!mounted) return;
        setRooms(res.data);
      } catch (err) {
        console.warn("fetch rooms", err);
        setRooms([]);
      }
    })();
    return () => (mounted = false);
  }, []);

  function openRoom(slug) {
    nav(`/room/${slug}`);
  }

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      <div className="panel p-4 rounded-xl">
        <h3 className="text-xl mb-3">Create Room</h3>
        <CreateRoom onCreated={r => openRoom(r.slug)} />
      </div>

      <div className="panel p-4 rounded-xl">
        <h3 className="text-xl mb-3">Available Rooms</h3>
        {!rooms ? <div className="animate-pulse space-y-2"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-4 bg-white/10 rounded w-1/2"></div></div> : (
          <div className="space-y-2">
            {rooms.length === 0 && <div className="text-gray-400">No rooms yet</div>}
            {rooms.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-gray-300">{r.slug}</div>
                </div>
                <button onClick={()=>openRoom(r.slug)} className="px-3 py-1 rounded bg-indigo-500">Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateRoom({ onCreated }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function create() {
    setLoading(true);
    try {
      const res = await api.post("boards/rooms/", { name });
      onCreated && onCreated(res.data);
    } catch (err) {
      alert("Create failed");
      console.error(err);
    } finally { setLoading(false); }
  }
  return (
    <div className="space-y-3">
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Room name" className="w-full p-2 rounded bg-white/5" />
      <button disabled={!name || loading} onClick={create} className="px-4 py-2 bg-indigo-600 rounded">{loading? "Creating...":"Create Room"}</button>
    </div>
  );
}
