import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ roomSlug, wsUrl, color, size }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [events, setEvents] = useState([]);
  const undoStack = useRef([]);
  const lastSentRef = useRef(0);

  useEffect(() => {
    // connect websocket
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => console.log("WS connected");
    wsRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "draw") drawFromEvent(data.payload, false);
        if (data.type === "control" && data.payload && data.payload.action === "clear") clearCanvas(false);
        if (data.type === "system") console.log(data.payload);
      } catch (err) {
        console.error(err);
      }
    };
    wsRef.current.onclose = () => console.log("WS closed");
    return () => wsRef.current && wsRef.current.close();
  }, [wsUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    // set pixel ratio for crisp lines
    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      redrawFromStack();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
  }, [size, color]);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  }

  function handlePointerDown(e) {
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    const ev = { action: "begin", x: pos.x, y: pos.y, color, size, ts: Date.now() };
    pushEvent(ev);
    sendWS("draw", ev);
  }

  function handlePointerMove(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    const now = Date.now();
    if (now - lastSentRef.current > 25) {
      const ev = { action: "stroke", x: pos.x, y: pos.y, ts: now };
      pushEvent(ev);
      sendWS("draw", ev);
      lastSentRef.current = now;
    } else {
      // still draw locally & push minimal event to local stack for undo
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      undoStack.current.push({ type: "stroke", x: pos.x, y: pos.y });
    }
  }

  function handlePointerUp() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ev = { action: "end", ts: Date.now() };
    pushEvent(ev);
    sendWS("draw", ev);
  }

  function pushEvent(ev) {
    setEvents(prev => [...prev, ev]);
    undoStack.current.push(ev);
  }

  function sendWS(type, payload) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type, payload }));
  }

  function drawFromEvent(payload, pushIntoStack = true) {
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    if (payload.color) ctx.strokeStyle = payload.color;
    if (payload.size) ctx.lineWidth = payload.size;
    if (payload.action === "begin") {
      ctx.beginPath();
      ctx.moveTo(payload.x, payload.y);
    } else if (payload.action === "stroke") {
      ctx.lineTo(payload.x, payload.y);
      ctx.stroke();
    } else if (payload.action === "end") {
      ctx.closePath();
    }
    // restore current color/size
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    if (pushIntoStack) {
      undoStack.current.push(payload);
    }
  }

  function clearCanvas(emit = true) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    undoStack.current = [];
    setEvents([]);
    if (emit) sendWS("control", { action: "clear" });
  }

  function undo() {
    // naive full redraw: pop last stroke sequence and replay everything
    // For robust undo you need stroke grouping — this is a simple approach
    undoStack.current.pop();
    redrawFromStack();
  }

  function redrawFromStack() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    // Replay events in undoStack
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    for (const ev of undoStack.current) {
      if (ev.action === "begin") {
        ctx.beginPath();
        ctx.moveTo(ev.x, ev.y);
        if (ev.color) ctx.strokeStyle = ev.color;
        if (ev.size) ctx.lineWidth = ev.size;
      } else if (ev.action === "stroke") {
        ctx.lineTo(ev.x, ev.y);
        ctx.stroke();
      } else if (ev.action === "end") {
        ctx.closePath();
      }
    }
    // restore selected style
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
  }

  // Save recording: send control save_recording with events
  function saveRecording(name = "recording") {
    sendWS("control", { action: "save_recording", name, events });
  }

  // Replay: locally replay events (useful to show saved recording fetch)
  function replayEvents(evts) {
    if (!Array.isArray(evts) || evts.length === 0) return;
    // clear then replay with timing
    clearCanvas(false);
    let i = 0;
    function step() {
      if (i >= evts.length) return;
      const e = evts[i++];
      drawFromEvent(e, false);
      setTimeout(step, 10);
    }
    step();
  }

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[80vh] bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      />
      <div className="absolute top-3 right-3 flex gap-2">
        <button onClick={() => undo()} className="bg-gray-200 px-2 rounded">Undo</button>
        <button onClick={() => saveRecording("manual-save")} className="bg-indigo-600 text-white px-2 rounded">Save</button>
        <button onClick={() => sendWS("control", { action: "clear" })} className="bg-red-500 text-white px-2 rounded">Clear (emit)</button>
      </div>
    </div>
  );
}
