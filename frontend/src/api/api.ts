import type { TicketCategory, TicketPriority, Ticket, TicketDetail, TicketStats, TicketStatus, UserResponse, Comment } from '../types'
import { client } from './client'

export interface TicketFilters {
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  search?: string
}

export const ticketApi = {
  list(filters: TicketFilters) {
    return client.get<Ticket[]>('/tickets', { params: filters })
  },
  stats() {
    return client.get<TicketStats>('/tickets/stats')
  },
  create(body: { title: string; description: string; category: TicketCategory; priority: TicketPriority }) {
    return client.post<Ticket>('/tickets', body)
  },
  get(id: number | string) {
    return client.get<TicketDetail>(`/tickets/${id}`)
  },
  patch(id: number, body: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number }) {
    return client.patch<Ticket>(`/tickets/${id}`, body)
  },
  remove(id: number) {
    return client.delete(`/tickets/${id}`)
  },
  comment(ticketId: number, content: string) {
    return client.post<Comment>(`/tickets/${ticketId}/comments`, { content })
  },
}

export const authApi = {
  login(email: string, password: string) {
    return client.post<{ token: string; user: UserResponse }>('/auth/login', { email, password })
  },
  register(fullName: string, email: string, password: string) {
    return client.post<{ token: string; user: UserResponse }>('/auth/register', { fullName, email, password })
  },
}

export const userApi = {
  admins() {
    return client.get<UserResponse[]>('/users/admins')
  },
}
