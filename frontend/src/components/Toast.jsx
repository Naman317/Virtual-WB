import React from 'react'
import { motion } from 'framer-motion'

export default function Toast({ kind = 'info', message = '', onClose }) {
  const color = kind === 'success' ? 'bg-green-500' : kind === 'warning' ? 'bg-yellow-500' : 'bg-indigo-500'
  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
      className={`fixed right-6 bottom-6 ${color} text-white px-4 py-2 rounded shadow-lg`}>
      <div className="flex items-center gap-3">
        <div>{message}</div>
        <button onClick={onClose} className="ml-4 underline">Close</button>
      </div>
    </motion.div>
  )
}
