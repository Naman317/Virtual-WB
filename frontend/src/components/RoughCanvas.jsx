import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import rough from 'roughjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Hand, MousePointer2 } from 'lucide-react';
import useSceneStore from '../store/useSceneStore';
import { toast } from 'react-toastify';

const generator = rough.generator();

export default function RoughCanvas({ ws, tool, color, fillColor, fillStyle, width }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState(null); // {x, y} for text placement
  const textInputRef = useRef(null);
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const {
    elements, setElements, addElement,
    canDraw, setPermissions, roomLocked, selectedElementId, setSelectedElementId,
    pan, setPan, zoom, setZoom, bringForward, sendBackward,
    otherCursors, setOtherCursors, showGrid
  } = useSceneStore();

  const [currentElement, setCurrentElement] = useState(null);
  const currentElementRef = useRef(null);
  const [liveDraws, setLiveDraws] = useState({});

  // Dragging and Navigation States
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const lastCursorSyncRef = useRef(0);
  
  const laserTrailsRef = useRef({});
  const [laserRedraw, setLaserRedraw] = useState(0);

  useEffect(() => {
    let animationFrameId;
    
    const renderLoop = () => {
      let needsRedraw = false;
      const now = Date.now();
      Object.keys(laserTrailsRef.current).forEach(user => {
        const trail = laserTrailsRef.current[user];
        if (trail && trail.length > 0) {
          const filtered = trail.filter(p => now - p.t < 800);
          if (filtered.length !== trail.length) {
            laserTrailsRef.current[user] = filtered;
          }
          // If the trail has ANY points, we should continually redraw to ensure the stroke smoothly fades and updates
          needsRedraw = true;
        }
      });
      if (needsRedraw) setLaserRedraw(r => r + 1);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const toVirtual = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  // Generate rough.js drawable from element data
  const generateDrawable = (el) => {
    const options = {
      seed: el.seed || 1,
      stroke: el.color || color,
      strokeWidth: el.width || width,
      roughness: el.type === 'sticky' ? 0.2 : 1.2,
      fill: el.fill,
      fillStyle: el.fillStyle || 'hachure'
    };
    const { x1, y1, x2, y2, type, points } = el;

    if (type === 'pencil' && points && points.length > 1) {
      return generator.linearPath(points.map(p => [p.x, p.y]), options);
    } else if (type === 'line') {
      return generator.line(x1, y1, x2, y2, options);
    } else if (type === 'rectangle' || type === 'sticky') {
      return generator.rectangle(x1, y1, x2 - x1, y2 - y1, options);
    } else if (type === 'diamond') {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      return generator.polygon([[midX, y1], [x2, midY], [midX, y2], [x1, midY]], options);
    } else if (type === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return generator.circle(x1, y1, radius * 2, options);
    } else if (type === 'arrow') {
      return generator.line(x1, y1, x2, y2, options);
    }
    return null;
  };

  // Hit-detection: is point (px,py) near an element?
  const hitTest = (px, py, el) => {
    const margin = 8;
    if (el.type === 'pencil' && el.points) {
      return el.points.some(p => Math.abs(p.x - px) < margin && Math.abs(p.y - py) < margin);
    }
    if (el.type === 'text') {
      // With textBaseline = 'top', text draws below y1. 
      // Approximate height to 30px and width to 150px.
      return px >= el.x1 - margin && px <= el.x1 + 150 && py >= el.y1 - margin && py <= el.y1 + 30;
    }
    return px >= Math.min(el.x1, el.x2) - margin && px <= Math.max(el.x1, el.x2) + margin &&
      py >= Math.min(el.y1, el.y2) - margin && py <= Math.max(el.y1, el.y2) + margin;
  };

  // Drawing Loop
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(pan.x, pan.y);
    context.scale(zoom, zoom);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach(el => {
      if (el.type === 'text') {
        const fontSize = el.width * 8 || 16;
        context.font = `${fontSize}px 'Inter', sans-serif`;
        context.fillStyle = el.color || '#FFFFFF';
        context.textBaseline = 'top';
        const lines = (el.text || '').split('\n');
        lines.forEach((line, i) => {
          context.fillText(line, el.x1, el.y1 + i * (fontSize * 1.2));
        });
      } else {
        const drawable = generateDrawable(el);
        if (drawable) roughCanvas.draw(drawable);

        // Render sticky note text
        if (el.type === 'sticky' && el.text) {
          context.font = `14px 'Inter', sans-serif`;
          context.fillStyle = '#000000';
          // Wrap text rudimentary logic
          const words = el.text.split(' ');
          let line = '';
          let yOffset = Math.min(el.y1, el.y2) + 24;
          const maxWidth = Math.abs(el.x2 - el.x1) - 20;
          const startX = Math.min(el.x1, el.x2) + 10;

          words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
              context.fillText(line, startX, yOffset);
              line = word + ' ';
              yOffset += 20;
            } else {
              line = testLine;
            }
          });
          context.fillText(line, startX, yOffset);
        }
      }

      // Selection highlight
      if (el.id === selectedElementId) {
        context.strokeStyle = '#6366F1';
        context.lineWidth = 1 / zoom;
        context.setLineDash([5, 5]);
        const bx1 = el.type === 'pencil' && el.points ? Math.min(...el.points.map(p => p.x)) : Math.min(el.x1, el.x2);
        const by1 = el.type === 'pencil' && el.points ? Math.min(...el.points.map(p => p.y)) : Math.min(el.y1, el.y2);
        const bx2 = el.type === 'pencil' && el.points ? Math.max(...el.points.map(p => p.x)) : Math.max(el.x1, el.x2);
        const by2 = el.type === 'pencil' && el.points ? Math.max(...el.points.map(p => p.y)) : Math.max(el.y1, el.y2);
        context.strokeRect(bx1 - 5, by1 - 5, bx2 - bx1 + 10, by2 - by1 + 10);
        context.setLineDash([]);
      }
    });

    if (currentElement) {
      if (currentElement.type === 'text') {
        context.font = `${currentElement.width * 8 || 16}px 'Inter', sans-serif`;
        context.fillStyle = currentElement.color || '#FFFFFF';
        context.textBaseline = 'top';
        context.fillText(currentElement.text || '', currentElement.x1, currentElement.y1);
      } else {
        const drawable = generateDrawable(currentElement);
        if (drawable) roughCanvas.draw(drawable);
      }
    }

    Object.values(liveDraws).forEach(el => {
      if (el.type === 'text') {
        context.font = `${el.width * 8 || 16}px 'Inter', sans-serif`;
        context.fillStyle = el.color || '#FFFFFF';
        context.textBaseline = 'top';
        context.fillText(el.text || '', el.x1, el.y1);
      } else {
        const drawable = generateDrawable(el);
        if (drawable) roughCanvas.draw(drawable);
      }
    });

    // Draw arrow heads for arrow elements
    elements.filter(el => el.type === 'arrow').forEach(el => {
      const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
      const headLen = 12;
      context.beginPath();
      context.moveTo(el.x2, el.y2);
      context.lineTo(el.x2 - headLen * Math.cos(angle - Math.PI / 6), el.y2 - headLen * Math.sin(angle - Math.PI / 6));
      context.moveTo(el.x2, el.y2);
      context.lineTo(el.x2 - headLen * Math.cos(angle + Math.PI / 6), el.y2 - headLen * Math.sin(angle + Math.PI / 6));
      context.strokeStyle = el.color || color;
      context.lineWidth = el.width || width;
      context.stroke();
    });

    // Draw Laser Trails
    Object.entries(laserTrailsRef.current).forEach(([user, trail]) => {
      if (trail && trail.length > 1) {
        context.beginPath();
        context.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          context.lineTo(trail[i].x, trail[i].y);
        }
        context.strokeStyle = trail[trail.length - 1].color || '#EF4444';
        context.lineWidth = 4;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        // Add a glow effect
        context.shadowColor = context.strokeStyle;
        context.shadowBlur = 10;
        context.stroke();
        // Reset shadow
        context.shadowBlur = 0;
      }
    });

    context.restore();
  }, [elements, currentElement, liveDraws, pan, zoom, selectedElementId, laserRedraw]);

  // WebSocket Sync
  useEffect(() => {
    if (!ws) return;
    const handleMessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "init_state") {
        const syncedElements = data.payload.elements.map(e => ({ ...e.data, id: e.element_id }));
        setElements(syncedElements);
        setPermissions({ roomLocked: data.payload.room.is_locked, chatLocked: data.payload.room.is_chat_locked });
      } else if (data.type === "draw_sync") {
        if (data.sender === username) return; // Don't duplicate own drawing
        
        // Remove from live draws if they were drawing it
        setLiveDraws(prev => {
          const next = { ...prev };
          delete next[data.sender];
          return next;
        });

        const remoteEl = { ...data.payload, id: data.payload.id || data.payload.element_id };
        setElements([...useSceneStore.getState().elements.filter(el => el.id !== remoteEl.id), remoteEl]);
      } else if (data.type === "live_draw") {
        if (data.sender === username) return;
        setLiveDraws(prev => ({ ...prev, [data.sender]: data.payload }));
      } else if (data.type === "cursor_move") {
        if (data.sender !== username) {
          setOtherCursors(prev => ({ ...prev, [data.sender]: data.payload }));
          if (data.payload.laser) {
            if (!laserTrailsRef.current[data.sender]) laserTrailsRef.current[data.sender] = [];
            laserTrailsRef.current[data.sender].push({ x: data.payload.x, y: data.payload.y, t: Date.now(), color: data.payload.color });
          }
        }
      } else if (data.type === "permission_update") {
        if (data.payload.user === username) {
          const state = useSceneStore.getState();
          if (data.payload.perm_type === 'draw') setPermissions({ canDraw: data.payload.allowed });
          if (data.payload.perm_type === 'chat') setPermissions({ canChat: data.payload.allowed });
          toast.success(`Teacher granted you ${data.payload.perm_type} access!`);
        }
      } else if (data.type === "control" && data.payload?.action === "clear") {
        setElements([]);
      } else if (data.type === "chat_lock_update") {
        setPermissions({ chatLocked: data.payload.locked });
      } else if (data.type === "element_delete") {
        if (data.sender === username) return;
        setElements(useSceneStore.getState().elements.filter(el => el.id !== data.payload.id));
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, username]);

  // Keyboard shortcuts and Wheel events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') setSpacePressed(true);

      if (selectedElementId && !textInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const elToDelete = elements.find(el => el.id === selectedElementId);
          if (elToDelete) {
            if (!canModify(elToDelete)) {
              toast.error("You can only delete your own drawings.");
              return;
            }
            setElements(elements.filter(el => el.id !== selectedElementId));
            setSelectedElementId(null);
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "element_delete", payload: { id: selectedElementId } }));
            }
          }
        } else if (e.key === ']') {
          bringForward(selectedElementId);
          // Sync new state if needed
        } else if (e.key === '[') {
          sendBackward(selectedElementId);
          // Sync new state if needed
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementId, elements, textInput]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setZoom(z => Math.min(Math.max(z - e.deltaY * 0.002, 0.1), 5));
      } else {
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const canModify = (el) => {
    if (!el) return false;
    if (role === 'teacher') return true;
    return String(el.id).startsWith(username + "-");
  };

  const handlePointerDown = (e) => {
    if (e.button === 1 || spacePressed) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Text tool: place a text input
    if (tool === 'text') {
      if (role === 'student' && (roomLocked || !canDraw)) return;
      if (textInput) {
        // If there's already an active text input, trying to click elsewhere should just submit the current one.
        // The onBlur might not fire in time before this unmounts it, so we manually submit if we have a ref.
        if (textInputRef.current) {
          handleTextSubmit(textInputRef.current.value);
        }
        return; // Don't spawn a new one immediately to avoid race conditions. Require a second click.
      }
      
      const { x, y } = toVirtual(e.clientX, e.clientY);
      const rect = containerRef.current.getBoundingClientRect();
      setTextInput({ 
          x, y, 
          screenX: e.clientX - rect.left, 
          screenY: e.clientY - rect.top 
      });
      return;
    }

    // Select tool: pick element
    if (tool === 'select') {
      const { x, y } = toVirtual(e.clientX, e.clientY);
      const clicked = elements.findLast(el => hitTest(x, y, el));
      if (clicked) {
        setSelectedElementId(clicked.id);
        if ((role !== 'student' || (!roomLocked && canDraw)) && canModify(clicked)) {
          setIsDragging(true);
          setDragOffset({ x: x - clicked.x1, y: y - clicked.y1 });
        } else if (role === 'student' && !canModify(clicked)) {
          // Cannot drag another person's drawing
        }
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    // Eraser tool: remove element under cursor
    if (tool === 'eraser') {
      if (role === 'student' && (roomLocked || !canDraw)) return;
      const { x, y } = toVirtual(e.clientX, e.clientY);
      const target = elements.findLast(el => hitTest(x, y, el));
      if (target) {
        if (!canModify(target)) {
          toast.error("You can only erase your own drawings.");
          return;
        }
        setElements(elements.filter(el => el.id !== target.id));
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "element_delete", payload: { id: target.id } }));
        }
      }
      return;
    }

    if (role === 'student' && (roomLocked || !canDraw)) return;

    // Sticky tool: place a fixed size sticky and prompt for text
    if (tool === 'sticky') {
      const { x, y } = toVirtual(e.clientX, e.clientY);
      const text = window.prompt("Enter sticky note text:");
      if (text) {
        const id = `${username}-${Date.now()}`;
        const el = {
          id, type: 'sticky', x1: x, y1: y, x2: x + 150, y2: y + 150,
          color: '#D97706', width: 2, fill: '#FBBF24', fillStyle: 'solid', text
        };
        addElement(el);
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "draw_sync", payload: el }));
        }
      }
      return;
    }

    setIsDrawing(true);
    const { x, y } = toVirtual(e.clientX, e.clientY);
    const id = `${username}-${Date.now()}`;
    const seed = Math.floor(Math.random() * 2147483648);
    const newEl = { id, type: tool, x1: x, y1: y, x2: x, y2: y, color, fill: fillColor, fillStyle, width, seed, points: [{ x, y }] };
    currentElementRef.current = newEl;
    setCurrentElement(newEl);
  };

  const handlePointerMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    const { x: vX, y: vY } = toVirtual(e.clientX, e.clientY);

    if (isDragging && selectedElementId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedElementId) {
          const dx = vX - dragOffset.x - el.x1;
          const dy = vY - dragOffset.y - el.y1;
          const newEl = { ...el };
          if (el.type === 'pencil' && el.points) {
            newEl.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
          newEl.x1 += dx; newEl.y1 += dy; newEl.x2 += dx; newEl.y2 += dy;
          return newEl;
        }
        return el;
      }));
      // Throttle broadcast of movement via draw_sync? 
      return;
    }

    if (tool === 'laser' && isDrawing) {
      if (!laserTrailsRef.current[username]) laserTrailsRef.current[username] = [];
      laserTrailsRef.current[username].push({ x: vX, y: vY, t: Date.now(), color });
    }

    if (ws?.readyState === WebSocket.OPEN) {
      const now = performance.now();
      if (now - lastCursorSyncRef.current > 100) { // Limit to 10 updates a second
        ws.send(JSON.stringify({ type: "cursor_move", payload: { x: vX, y: vY, color, laser: tool === 'laser' && isDrawing } }));
        
        // Broadcast live drawing progress to others without hitting the DB
        if (isDrawing && currentElementRef.current && tool !== 'laser') {
          ws.send(JSON.stringify({ type: "live_draw", payload: currentElementRef.current }));
        }
        
        lastCursorSyncRef.current = now;
      }
    }

    if (!isDrawing || !currentElementRef.current) return;

    if (tool === 'pencil') {
      const newPoints = [...currentElementRef.current.points, { x: vX, y: vY }];
      currentElementRef.current = { ...currentElementRef.current, points: newPoints, x2: vX, y2: vY };
    } else if (tool !== 'laser') {
      currentElementRef.current = { ...currentElementRef.current, x2: vX, y2: vY };
    }
    setCurrentElement(currentElementRef.current);
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      const movedEl = elements.find(el => el.id === selectedElementId);
      if (movedEl && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "draw_sync", payload: movedEl }));
      }
      return;
    }

    if (!isDrawing || !currentElementRef.current) return;
    setIsDrawing(false);
    
    if (tool !== 'laser') {
      addElement(currentElementRef.current);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "draw_sync", payload: { ...currentElementRef.current, roughElement: null } }));
      }
    }
    
    currentElementRef.current = null;
    setCurrentElement(null);
  };

  // Text input submission
  const handleTextSubmit = (value) => {
    if (!value.trim() || !textInput) {
      setTextInput(null);
      return;
    }
    const id = `${username}-${Date.now()}`;
    const el = {
      id, type: 'text',
      x1: textInput.x, y1: textInput.y, x2: textInput.x, y2: textInput.y,
      color: color || '#FFFFFF',
      width, text: value
    };
    addElement(el);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "draw_sync", payload: el }));
    }
    setTextInput(null);
  };

  const requestPermission = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "permission_request", payload: { request: "draw" } }));
    toast.info("Drawing request sent to teacher...");
  };

  // Cursor style
  const getCursor = () => {
    if (spacePressed || isPanning) return 'cursor-grab';
    if (tool === 'select') return isDragging ? 'cursor-grabbing' : 'cursor-default';
    if (tool === 'eraser') return 'cursor-cell';
    if (tool === 'text') return 'cursor-text';
    return 'cursor-crosshair';
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-bg-main overflow-hidden ${getCursor()}`}>
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-opacity duration-300"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Floating text input */}
      {textInput && (
        <textarea
          ref={(el) => {
            textInputRef.current = el;
            if (el) setTimeout(() => el.focus(), 10);
          }}
          placeholder="Type your text here..."
          className="absolute bg-white text-black outline-none border-4 border-accent-primary font-inter min-w-[250px] min-h-[60px] p-3 rounded-lg shadow-2xl z-50 resize-both"
          style={{
            left: textInput.screenX, top: textInput.screenY,
            fontSize: `${Math.max(width * 8, 16)}px`
          }}
          onBlur={(e) => handleTextSubmit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setTextInput(null);
          }}
        />
      )}

      <AnimatePresence>
        {Object.entries(otherCursors).map(([name, pos]) => (
          <motion.div
            key={name}
            animate={{ x: pos.x * zoom + pan.x, y: pos.y * zoom + pan.y }}
            className="absolute pointer-events-none z-50 flex flex-col items-center"
            style={{ left: 0, top: 0 }}
          >
            <MousePointer2 size={18} fill={pos.color || '#6366F1'} className="text-white drop-shadow-md" />
            <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 mt-1">
              {name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {(role === 'student' && !canDraw) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-xl">
          <span className="text-sm font-semibold text-content-secondary">Read-Only Mode</span>
          <div className="w-px h-4 bg-white/20"></div>
          <button
            onClick={requestPermission}
            className="flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-white transition"
          >
            <Hand size={14} /> Request Draw Access
          </button>
        </div>
      )}
    </div>
  );
}
