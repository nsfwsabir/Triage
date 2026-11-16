import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ticketApi, userApi } from '../api/api'
import { extractError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge, statusLabels } from '../components/Badges'
import { initials, formatDateTime, relativeTime } from '../lib/format'
import type { TicketDetail, TicketPriority, TicketStatus, UserResponse } from '../types'

const statusOptions: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const priorityOptions: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const selectClass =
  'w-full h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900'
const staticClass = 'text-xs text-zinc-950'

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [admins, setAdmins] = useState<UserResponse[]>([])
  const [notFound, setNotFound] = useState(false)
  const [saved, setSaved] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await ticketApi.get(id!)
      setTicket(res.data)
    } catch {
      setNotFound(true)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (isAdmin) {
      userApi.admins().then((res) => setAdmins(res.data)).catch(() => undefined)
    }
  }, [isAdmin])

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const patch = async (body: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number }) => {
    const res = await ticketApi.patch(Number(id), body)
    setTicket((prev) => (prev ? { ...prev, ...res.data, comments: prev.comments } : prev))
    flashSaved()
  }

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setPosting(true)
    try {
      const res = await ticketApi.comment(Number(id), comment.trim())
      setTicket((prev) => (prev ? { ...prev, comments: [...prev.comments, res.data] } : prev))
      setComment('')
    } catch (err) {
      alert(extractError(err))
    } finally {
      setPosting(false)
    }
  }

  const remove = async () => {
    try {
      await ticketApi.remove(Number(id))
      navigate('/dashboard')
    } catch (err) {
      alert(extractError(err))
    }
  }

  if (notFound) {
    return (
      <div className="px-6 py-16 max-w-2xl mx-auto text-center">
        <p className="text-sm text-zinc-500">Ticket not found or not accessible.</p>
        <Link to="/dashboard" className="text-sm font-medium text-zinc-950 underline underline-offset-2">
          Back to tickets
        </Link>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-4">
        <div className="h-4 w-40 rounded bg-zinc-100 animate-pulse" />
        <div className="h-6 w-96 rounded bg-zinc-100 animate-pulse" />
        <div className="h-32 rounded bg-zinc-100 animate-pulse" />
      </div>
    )
  }

  const canCloseOwn = !isAdmin && user?.id === ticket.createdBy.id && ticket.status === 'RESOLVED'
  const canDelete = isAdmin || (user?.id === ticket.createdBy.id && ticket.status === 'OPEN')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="px-4 sm:px-6 py-8 max-w-6xl mx-auto"
    >
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 transition-colors mb-6">
        <ArrowLeft size={12} />
        Back to tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 min-w-0">
          <div className="flex items-start gap-3 mb-1">
            <span className="font-mono text-xs text-zinc-500 tabular-nums mt-1.5">#{ticket.id}</span>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-950">{ticket.title}</h1>
          </div>
          <p className="text-xs text-zinc-500 mb-6">
            {ticket.createdBy.fullName} opened this ticket · {relativeTime(ticket.createdAt)}
          </p>

          <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-4">Discussion</h2>
          {ticket.comments.length === 0 ? (
            <p className="text-sm text-zinc-400 mb-4">No comments yet.</p>
          ) : (
            <div className="space-y-0 mb-6">
              {ticket.comments.map((c, i) => (
                <div key={c.id} className="relative flex gap-3 pb-6">
                  {i < ticket.comments.length - 1 && (
                    <span className="absolute left-[13px] top-7 bottom-0 w-px bg-zinc-200" />
                  )}
                  <span className="w-7 h-7 shrink-0 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-600 flex items-center justify-center">
                    {initials(c.author.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-zinc-950">{c.author.fullName}</span>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-400">{c.author.role}</span>
                      <span className="text-[11px] text-zinc-400 tabular-nums" title={formatDateTime(c.createdAt)}>
                        {relativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={postComment} className="flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center">
              {initials(user?.fullName ?? '')}
            </span>
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={posting || !comment.trim()}
                className="h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium transition-colors shrink-0"
              >
                {posting ? '…' : 'Comment'}
              </motion.button>
            </div>
          </form>
        </div>

        <aside className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100 self-start">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Properties</span>
            {saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-medium text-emerald-600">Saved</motion.span>}
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Status</p>
            {isAdmin ? (
              <select value={ticket.status} onChange={(e) => patch({ status: e.target.value as TicketStatus })} className={selectClass}>
                {statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                {canCloseOwn && (
                  <button onClick={() => patch({ status: 'CLOSED' })} className="text-xs font-medium text-zinc-950 underline underline-offset-2">
                    Close
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Priority</p>
            {isAdmin ? (
              <select value={ticket.priority} onChange={(e) => patch({ priority: e.target.value as TicketPriority })} className={selectClass}>
                {priorityOptions.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            ) : (
              <PriorityBadge priority={ticket.priority} />
            )}
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Category</p>
            <p className={staticClass}>{ticket.category.charAt(0) + ticket.category.slice(1).toLowerCase()}</p>
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Assignee</p>
            {isAdmin ? (
              <select
                value={ticket.assignedTo?.id ?? ''}
                onChange={(e) => patch({ assignedToId: Number(e.target.value) })}
                className={selectClass}
              >
                <option value="">Unassigned</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
              </select>
            ) : (
              <p className={staticClass}>{ticket.assignedTo?.fullName ?? 'Unassigned'}</p>
            )}
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Created</p>
            <p className={staticClass}>{formatDateTime(ticket.createdAt)}</p>
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Resolved</p>
            <p className={staticClass}>{formatDateTime(ticket.resolvedAt)}</p>
          </div>

          {canDelete && (
            <div className="px-4 py-3">
              <button
                onClick={remove}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 transition-colors"
              >
                <Trash2 size={12} />
                Delete ticket
              </button>
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  )
}
