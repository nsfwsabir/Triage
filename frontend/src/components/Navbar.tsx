import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <header className="sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-zinc-900 rotate-45 rounded-[3px]" />
          <span className="text-sm font-semibold tracking-tight text-zinc-950">Triage</span>
          <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500">
            {user.role}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden sm:inline">{user.fullName}</span>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  )
}
