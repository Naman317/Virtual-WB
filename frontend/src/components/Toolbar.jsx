import React from "react";

export default function Toolbar({ color, setColor, size, setSize, onClear, onSave, onReplay }) {
  return (
    <div className="flex flex-col items-center gap-3 p-3">
      <div>
        <label className="text-xs block mb-1">Color</label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      </div>

      <div>
        <label className="text-xs block mb-1">Size</label>
        <input type="range" min="1" max="20" value={size} onChange={e => setSize(parseInt(e.target.value))} />
      </div>

      <button onClick={onClear} className="bg-red-600 text-white px-3 py-1 rounded">Clear</button>
      <button onClick={onSave} className="bg-indigo-600 text-white px-3 py-1 rounded">Save</button>
      <button onClick={onReplay} className="bg-green-600 text-white px-3 py-1 rounded">Replay</button>
    </div>
  );
}
