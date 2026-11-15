import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ticketApi } from '../api/api'
import { extractError } from '../api/client'
import type { Ticket, TicketCategory, TicketPriority } from '../types'

const categories: TicketCategory[] = ['BUG', 'HARDWARE', 'ACCESS', 'OTHER']
const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const inputClass =
  'w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (ticket: Ticket) => void
}

export function NewTicketDrawer({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('BUG')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await ticketApi.create({ title, description, category, priority })
      setTitle('')
      setDescription('')
      setCategory('BUG')
      setPriority('MEDIUM')
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white border-l border-zinc-200 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-200 shrink-0">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-950">New ticket</h2>
              <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500">Title</label>
                <input
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of the issue"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-500">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={inputClass}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-500">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={inputClass}>
                    {priorities.map((p) => (
                      <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500">Description</label>
                <textarea
                  required
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened, what did you expect, and what did you try?"
                  className={`${inputClass} h-auto py-2 resize-none`}
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-md border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={saving}
                  className="h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? 'Creating…' : 'Create ticket'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
