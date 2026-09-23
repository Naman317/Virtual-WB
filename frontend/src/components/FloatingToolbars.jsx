import React from 'react';
import { 
  Pointer, 
  Pencil, 
  Square, 
  Diamond, 
  Circle, 
  ArrowRight, 
  Minus, 
  Type, 
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  Download,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import useSceneStore from '../store/useSceneStore';

export function MainToolbar({ selectedTool, setSelectedTool }) {
  const { roomLocked, canDraw } = useSceneStore();
  const role = localStorage.getItem("role");

  const tools = [
    { id: 'select', icon: <Pointer size={20} />, label: 'Selection' },
    { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'sticky', icon: <div className="w-4 h-4 bg-yellow-400 rounded-sm border border-yellow-500 shadow-sm" />, label: 'Sticky Note' },
    { id: 'diamond', icon: <Diamond size={20} />, label: 'Diamond' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'laser', icon: <div className="text-red-500 font-bold text-xl drop-shadow-[0_0_8px_rgba(239,68,68,1)]">~</div>, label: 'Laser Pointer' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  if (roomLocked || (!canDraw && role === 'student')) {
      return null;
  }

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-24 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 glass rounded-2xl shadow-2xl z-40"
    >
      {tools.filter(t => t.id !== 'laser' || role === 'teacher').map((tool) => (
        <button
          key={tool.id}
          onClick={() => setSelectedTool(tool.id)}
          className={`toolbar-btn p-2.5 ${selectedTool === tool.id ? 'active' : ''}`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </motion.div>
  );
}

export function ActionToolbar({ onClear, ws }) {
  const { undo, redo, history, redoStack } = useSceneStore();
  
  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `collabcanvas-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleClear = () => {
      if (window.confirm("Are you sure you want to clear the entire board?")) {
          onClear();
      }
  };

  const handleUndo = () => {
    const { history, elements } = useSceneStore.getState();
    const username = localStorage.getItem("username");
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    const myCurrent = elements.filter(el => String(el.id).startsWith(username + "-"));
    const myPrevious = previousState.filter(el => String(el.id).startsWith(username + "-"));
    
    myCurrent.forEach(curr => {
      if (!myPrevious.find(p => p.id === curr.id) && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "element_delete", payload: { id: curr.id } }));
      }
    });
    myPrevious.forEach(prev => {
      const curr = myCurrent.find(c => c.id === prev.id);
      if ((!curr || JSON.stringify(curr) !== JSON.stringify(prev)) && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "draw_sync", payload: prev }));
      }
    });
    undo();
  };

  const handleRedo = () => {
    const { redoStack, elements } = useSceneStore.getState();
    const username = localStorage.getItem("username");
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[0];
    const myCurrent = elements.filter(el => String(el.id).startsWith(username + "-"));
    const myNext = nextState.filter(el => String(el.id).startsWith(username + "-"));
    
    myCurrent.forEach(curr => {
      if (!myNext.find(n => n.id === curr.id) && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "element_delete", payload: { id: curr.id } }));
      }
    });
    myNext.forEach(next => {
      const curr = myCurrent.find(c => c.id === next.id);
      if ((!curr || JSON.stringify(curr) !== JSON.stringify(next)) && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "draw_sync", payload: next }));
      }
    });
    redo();
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-24 top-24 flex flex-col gap-1 p-1.5 glass rounded-2xl shadow-2xl z-40"
    >
      <button className="toolbar-btn" title="Download Image" onClick={handleExport}>
        <Download size={20} />
      </button>
      <div className="h-px bg-white/5 my-1 mx-1"></div>
      <button 
        className="toolbar-btn disabled:opacity-30" 
        onClick={handleUndo} 
        disabled={history.length === 0}
        title="Undo"
      >
        <Undo2 size={20} />
      </button>
      <button 
        className="toolbar-btn disabled:opacity-30" 
        onClick={handleRedo} 
        disabled={redoStack.length === 0}
        title="Redo"
      >
        <Redo2 size={20} />
      </button>
      <div className="h-px bg-white/5 my-1 mx-1"></div>
      <button className="toolbar-btn text-red-400 hover:bg-red-400/10" onClick={handleClear} title="Clear Board">
        <Trash2 size={20} />
      </button>
    </motion.div>
  );
}

export function ZoomToolbar() {
  const { zoom, setZoom, setPan } = useSceneStore();

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-6 flex items-center gap-1 p-1.5 glass rounded-2xl shadow-2xl z-40 text-sm font-semibold"
    >
      <button className="toolbar-btn text-content-secondary hover:text-white" onClick={handleZoomOut} title="Zoom Out">
        <Minus size={16} />
      </button>
      <button className="px-2 font-mono text-xs w-14 text-center cursor-pointer hover:text-white transition" title="Reset View" onClick={handleReset}>
        {Math.round(zoom * 100)}%
      </button>
      <button className="toolbar-btn text-content-secondary hover:text-white" onClick={handleZoomIn} title="Zoom In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    </motion.div>
  );
}
