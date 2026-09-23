import React from 'react'
import { motion } from 'framer-motion'

const sample = [
  { id: 1, name: 'Teacher A', role: 'teacher' },
  { id: 2, name: 'Student 1', role: 'student' },
  { id: 3, name: 'Student 2', role: 'student' }
]

export default function ParticipantList() {
  return (
    <div>
      <h4 className="text-gray-300 mb-2">Participants</h4>
      <div className="space-y-2">
        {sample.map(p => (
          <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-2 rounded bg-white/4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">{p.name[0]}</div>
              <div>
                <div className="text-white font-medium">{p.name}</div>
                <div className="text-xs text-gray-300">{p.role}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">● online</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
