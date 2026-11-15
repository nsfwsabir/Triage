import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { extractError } from '../api/client'

const inputClass =
  'w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-8 h-8 bg-zinc-900 rotate-45 rounded-md mb-4" />
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Sign in to Triage</h1>
        </div>
        <form onSubmit={submit} className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-500">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            className="w-full h-9 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </motion.button>
          <p className="text-xs text-zinc-500 text-center">
            No account?{' '}
            <Link to="/register" className="text-zinc-950 font-medium underline underline-offset-2">
              Register
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
