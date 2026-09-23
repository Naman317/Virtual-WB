import React from 'react'
import { motion } from 'framer-motion'

export default function ToolbarPro({ color, setColor, size, setSize, onUndo, onRedo, onClear, onSave }) {
  return (
    <div className="flex flex-col gap-4">
      <motion.div whileHover={{ scale: 1.02 }} className="rounded-lg p-3 bg-white/6">
        <label className="block text-sm text-gray-300 mb-2">Brush color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded" />
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} className="rounded-lg p-3 bg-white/6">
        <label className="block text-sm text-gray-300 mb-2">Size</label>
        <input type="range" min="1" max="40" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
      </motion.div>

      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onUndo} className="flex-1 py-2 rounded bg-white/8 text-white">Undo</motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onRedo} className="flex-1 py-2 rounded bg-white/8 text-white">Redo</motion.button>
      </div>

      <div className="flex flex-col gap-2">
        <motion.button whileHover={{ scale: 1.02 }} onClick={onSave} className="py-2 rounded bg-indigo-500 text-white">Save Recording</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} onClick={onClear} className="py-2 rounded bg-red-600 text-white">Clear Board</motion.button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <div className="mb-1">Shortcuts</div>
        <div className="flex gap-2"><kbd className="px-2 py-1 bg-white/6 rounded">Z</kbd><span>Undo</span></div>
      </div>
    </div>
  )
}
