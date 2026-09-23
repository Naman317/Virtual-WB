import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

/**
 * Props:
 *  - wsUrl (string) websocket to connect
 *  - roomId (string)
 *  - color/size via local UI (this component keeps local brush state)
 *
 * Exposes via ref:
 *  - exportStrokes(): returns strokes array
 *  - saveSnapshot()
 *  - clear(), undo(), redo()
 */

const CanvasPro = forwardRef(({ wsUrl, roomId }, ref) => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [color, setColor] = useState("#111827");
  const [size, setSize] = useState(3);
  const strokesRef = useRef([]); // array of stroke objects {id,color,size,points:[]}
  const currentStroke = useRef(null);
  const redoStack = useRef([]);
  const [isLocked, setIsLocked] = useState(false);

  useImperativeHandle(ref, () => ({
    exportStrokes: () => strokesRef.current,
    saveSnapshot: () => saveRecording(),
    clear: () => clearCanvas(true),
    undo: () => undo(),
    redo: () => redo()
  }));

  useEffect(() => {
    if (!wsUrl) return;
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => console.log("WS connected");
    wsRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "draw") handleRemoteDraw(data.payload);
        if (data.type === "control") {
          const action = data.payload?.action;
          if (action === "clear") clearCanvas(false);
          if (action === "lock") setIsLocked(true);
          if (action === "unlock") setIsLocked(false);
          if (action === "kick") {
            if (data.payload?.target && data.payload.target === localStorage.getItem("display_name")) {
              alert("You were kicked by the teacher");
              // optionally redirect
            }
          }
        }
      } catch (err) { console.error("ws parse", err); }
    };
    wsRef.current.onclose = () => console.log("WS closed");
    return () => wsRef.current && wsRef.current.close();
    // eslint-disable-next-line
  }, [wsUrl]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    redrawAll();
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, t: Date.now() };
  }

  function beginStroke(pt) {
    const stroke = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, color, size, points: [pt], start_ts: Date.now() };
    currentStroke.current = stroke;
    strokesRef.current.push(stroke);
    emit({ action: "begin", strokeId: stroke.id, x: pt.x, y: pt.y, color: stroke.color, size: stroke.size, ts: pt.t });
  }

  function addPoint(pt) {
    if (!currentStroke.current) return;
    currentStroke.current.points.push(pt);
    drawLatestSegment(currentStroke.current);
    emit({ action: "stroke", strokeId: currentStroke.current.id, x: pt.x, y: pt.y, ts: pt.t });
  }

  function endStroke() {
    if (!currentStroke.current) return;
    emit({ action: "end", strokeId: currentStroke.current.id, ts: Date.now() });
    currentStroke.current = null;
    redoStack.current = [];
  }

  function drawLatestSegment(stroke) {
    const ctx = canvasRef.current.getContext("2d");
    const pts = stroke.points;
    if (pts.length < 2) return;
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function redrawAll() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (const s of strokesRef.current) {
      if (!s.points || s.points.length < 2) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    }
  }

  function emit(payload) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "draw", payload: { ...payload, roomId } }));
  }

  function handleRemoteDraw(payload) {
    const action = payload.action;
    if (action === "begin") {
      const s = { id: payload.strokeId, color: payload.color || "#000", size: payload.size || 2, points: [{ x: payload.x, y: payload.y, t: payload.ts }] };
      strokesRef.current.push(s);
    } else if (action === "stroke") {
      const idx = strokesRef.current.findIndex(s => s.id === payload.strokeId);
      if (idx === -1) return;
      strokesRef.current[idx].points.push({ x: payload.x, y: payload.y, t: payload.ts });
      const s = strokesRef.current[idx];
      const ctx = canvasRef.current.getContext("2d");
      const a = s.points[s.points.length - 2], b = s.points[s.points.length - 1];
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size; ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else if (action === "end") {
      // done
    }
  }

  // event handlers
  function onPointerDown(e) {
    if (isLocked) return;
    const pt = getPos(e);
    beginStroke(pt);
  }
  function onPointerMove(e) {
    if (!currentStroke.current || isLocked) return;
    const pt = getPos(e);
    addPoint(pt);
  }
  function onPointerUp() {
    if (isLocked) return;
    endStroke();
  }

  // toolbar helpers
  function clearCanvas(emitRemote = true) {
    strokesRef.current = [];
    currentStroke.current = null;
    redoStack.current = [];
    redrawAll();
    if (emitRemote) {
      // control message via ws
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "control", payload: { action: "clear" } }));
      }
    }
  }

  function undo() {
    const last = strokesRef.current.pop();
    if (last) redoStack.current.push(last);
    redrawAll();
  }

  function redo() {
    const s = redoStack.current.pop();
    if (s) strokesRef.current.push(s);
    redrawAll();
  }

  async function saveRecording(name = `rec-${Date.now()}`) {
    // try REST persist; fallback to control ws
    const events = strokesRef.current;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/boards/recordings/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ room: roomId, name, events })
      });
      if (!res.ok) throw new Error("save failed");
      return await res.json();
    } catch (err) {
      // fallback: emit control save_recording via ws
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "control", payload: { action: "save_recording", name, events } }));
      }
      return null;
    }
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute left-4 top-4 z-20 panel p-3 rounded-lg flex items-center gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 p-0" />
        <input type="range" min="1" max="40" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button onClick={() => undo()} className="px-2 py-1 rounded bg-white/8">Undo</button>
        <button onClick={() => redo()} className="px-2 py-1 rounded bg-white/8">Redo</button>
        <button onClick={() => saveRecording()} className="px-2 py-1 rounded bg-indigo-600 text-white">Save</button>
        <button onClick={() => clearCanvas(true)} className="px-2 py-1 rounded bg-red-600 text-white">Clear</button>
        <div className="text-sm text-gray-300 pl-2">{isLocked ? "Locked" : "Unlocked"}</div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-[80vh] bg-white rounded"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerUp}
      />
    </div>
  );
});

export default CanvasPro;
