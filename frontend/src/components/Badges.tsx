import type { TicketPriority, TicketStatus } from '../types'

const statusStyles: Record<TicketStatus, string> = {
  OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const statusDots: Record<TicketStatus, string> = {
  OPEN: 'bg-sky-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-zinc-400',
}

export const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusStyles[status]}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${statusDots[status]}`} />
      {statusLabels[status]}
    </span>
  )
}

const priorityStyles: Record<TicketPriority, string> = {
  LOW: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  MEDIUM: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
}

const priorityDots: Record<TicketPriority, string> = {
  LOW: 'bg-zinc-400',
  MEDIUM: 'bg-zinc-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-rose-500',
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${priorityStyles[priority]}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${priorityDots[priority]}`} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  )
}
