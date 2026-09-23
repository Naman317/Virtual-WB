import React from 'react';
import { motion } from 'framer-motion';

export default function PropertyPanel({ strokeColor, setStrokeColor, strokeWidth, setStrokeWidth, fillColor, setFillColor, fillStyle, setFillStyle }) {
  const colors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Dark Gray', value: '#1F2937' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Yellow', value: '#FACC15' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Pink', value: '#EC4899' },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-24 bottom-10 p-4 glass rounded-2xl shadow-2xl z-40 w-56"
    >
      <div className="mb-4">
        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-bold mb-2 block">Stroke</label>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setStrokeColor(c.value)}
              className={`w-6 h-6 rounded-md border-2 ${strokeColor === c.value ? 'border-white ring-1 ring-accent-primary' : 'border-white/10'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {setFillColor && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Fill</label>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setFillStyle('hachure'); if (!fillColor) setFillColor(strokeColor); }} 
                className={`text-[9px] px-1.5 py-0.5 rounded ${fillStyle === 'hachure' && fillColor ? 'bg-accent-primary text-white' : 'bg-white/10 text-white/50 hover:text-white'}`}
              >Sketch</button>
              <button 
                onClick={() => { setFillStyle('solid'); if (!fillColor) setFillColor(strokeColor); }} 
                className={`text-[9px] px-1.5 py-0.5 rounded ${fillStyle === 'solid' && fillColor ? 'bg-accent-primary text-white' : 'bg-white/10 text-white/50 hover:text-white'}`}
              >Solid</button>
              <button onClick={() => setFillColor(null)} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 hover:text-white ml-1">None</button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setFillColor(c.value)}
                className={`w-6 h-6 rounded-md border-2 ${fillColor === c.value ? 'border-white ring-1 ring-accent-primary' : 'border-white/10'}`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Width</label>
          <span className="text-[10px] text-text-primary px-1.5 py-0.5 bg-white/10 rounded">{strokeWidth}px</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-full accent-accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </motion.div>
  );
}
