export type Role = 'USER' | 'ADMIN'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TicketCategory = 'BUG' | 'HARDWARE' | 'ACCESS' | 'OTHER'

export interface UserResponse {
  id: number
  fullName: string
  email: string
  role: Role
}

export interface Ticket {
  id: number
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  createdBy: UserResponse
  assignedTo: UserResponse | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface Comment {
  id: number
  content: string
  author: UserResponse
  createdAt: string
}

export interface TicketDetail extends Ticket {
  comments: Comment[]
}

export interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  highPriority: number
}
