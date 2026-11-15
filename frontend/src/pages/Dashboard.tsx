import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { ticketApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { NewTicketDrawer } from '../components/NewTicketDrawer'
import { initials, relativeTime } from '../lib/format'
import type { Ticket, TicketPriority, TicketStatus, TicketStats } from '../types'

const filterTabs: { key: TicketStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
]

const priorityOptions: { key: TicketPriority | ''; label: string }[] = [
  { key: '', label: 'All priorities' },
  { key: 'LOW', label: 'Low' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'HIGH', label: 'High' },
  { key: 'CRITICAL', label: 'Critical' },
]

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const load = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([
        ticketApi.list({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter || undefined,
          search: search || undefined,
        }),
        ticketApi.stats(),
      ])
      setTickets(list.data)
      setStats(summary.data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, search])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(load, search ? 250 : 0)
    return () => clearTimeout(debounce.current)
  }, [load])

  const metrics = useMemo(
    () =>
      stats
        ? [
            { label: 'Total', value: stats.total },
            { label: 'Open', value: stats.open },
            { label: 'In Progress', value: stats.inProgress },
            { label: 'Resolved', value: stats.resolved },
          ]
        : null,
    [stats],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="px-6 py-8 max-w-6xl mx-auto"
    >
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Tickets</h1>
        {!isAdmin && <p className="text-xs text-zinc-500">Showing tickets you created</p>}
      </div>

      {metrics ? (
        <div className="grid grid-cols-4 divide-x divide-zinc-200 bg-white border border-zinc-200 rounded-lg mb-6">
          {metrics.map((m) => (
            <div key={m.label} className="px-5 py-4">
              <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[86px] rounded-lg bg-zinc-100 animate-pulse mb-6" />
      )}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md p-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`relative px-3 h-7 text-xs font-medium rounded-[5px] transition-colors ${
                statusFilter === tab.key ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              {statusFilter === tab.key && (
                <motion.span
                  layoutId="activeFilterPill"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-zinc-100 rounded-[5px]"
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets"
              className="h-9 w-56 pl-8 pr-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
            className="h-9 px-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            {priorityOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setDrawerOpen(true)}
            className="h-9 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Ticket
          </motion.button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100 overflow-hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-4 w-14 rounded bg-zinc-100 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-zinc-100 animate-pulse" />
              <div className="h-4 w-24 rounded bg-zinc-100 animate-pulse" />
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">No tickets match the current filters.</div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
          >
            {tickets.map((t) => (
              <motion.button
                key={t.id}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
                }}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-50/80 transition-colors"
              >
                <span className="font-mono text-xs text-zinc-500 tabular-nums w-12 shrink-0">#{t.id}</span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-zinc-950 truncate">{t.title}</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 shrink-0">
                  {t.category}
                </span>
                <div className="w-28 shrink-0">
                  <StatusBadge status={t.status} />
                </div>
                <div className="w-24 shrink-0">
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="w-28 shrink-0 flex items-center justify-end gap-2">
                  {t.assignedTo ? (
                    <span
                      title={t.assignedTo.fullName}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center"
                    >
                      {initials(t.assignedTo.fullName)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Unassigned</span>
                  )}
                </div>
                <span className="text-xs text-zinc-500 tabular-nums w-16 text-right shrink-0">
                  {relativeTime(t.createdAt)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      <NewTicketDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(t) => {
          setTickets((prev) => [t, ...prev])
          ticketApi.stats().then((res) => setStats(res.data))
        }}
      />
    </motion.div>
  )
}
