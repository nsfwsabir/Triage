import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/api'
import type { Role, UserResponse } from '../types'

interface AuthContextValue {
  user: UserResponse | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const raw = localStorage.getItem('triage_user')
    return raw ? (JSON.parse(raw) as UserResponse) : null
  })

  const persist = useCallback((token: string, next: UserResponse) => {
    localStorage.setItem('triage_token', token)
    localStorage.setItem('triage_user', JSON.stringify(next))
    setUser(next)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    persist(res.data.token, res.data.user)
  }, [persist])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await authApi.register(fullName, email, password)
    persist(res.data.token, res.data.user)
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem('triage_token')
    localStorage.removeItem('triage_user')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'ADMIN', login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { Role }
