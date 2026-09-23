import React from "react";

export default function TeacherControls({ wsUrl, onSaved }) {
  function sendControl(action, payload = {}) {
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "control", payload: { action, ...payload } }));
        ws.close();
      };
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-3">
      <button className="w-full py-2 rounded bg-red-600" onClick={() => sendControl("clear")}>Clear Board</button>
      <button className="w-full py-2 rounded bg-yellow-600" onClick={() => sendControl("lock")}>Lock Board</button>
      <button className="w-full py-2 rounded bg-green-600" onClick={() => sendControl("unlock")}>Unlock Board</button>

      <div className="flex gap-2">
        <input id="kickname" placeholder="display name to kick" className="flex-1 p-2 rounded bg-white/5" />
        <button onClick={() => {
          const t = document.getElementById("kickname").value;
          if (!t) return alert("enter name");
          sendControl("kick", { target: t });
        }} className="px-3 py-2 rounded bg-gray-700">Kick</button>
      </div>

      <button onClick={() => onSaved && onSaved()} className="w-full py-2 rounded bg-indigo-600">Save Recording</button>
    </div>
  );
}
