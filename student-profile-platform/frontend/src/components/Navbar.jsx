import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'

export default function FloatingNavbar() {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Global Presence & Notification Heartbeat
  useEffect(() => {
    if (user) {
      const update = async () => {
        try {
          await api.updatePresence(user.id)
          const lastChecked = localStorage.getItem('messages_last_checked') || new Date(Date.now() - 86400000).toISOString()
          const res = await api.checkUnreadMessages(user.id, lastChecked)
          setHasUnread(res.has_new)
        } catch (err) {}
      }
      update()
      const interval = setInterval(update, 60000) // check every minute
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="backdrop-blur-[24px] bg-[var(--glass)] border border-[var(--border)] rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,198,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-shadow">
            <svg className="w-5 h-5 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-[var(--text)] tracking-tight">
            AcademicOS
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/">Home</NavLink>
          {user && (
            <>
              <NavLink to="/leaderboard">Hall of Fame</NavLink>
              <NavLink to="/posts">Stream</NavLink>
              <NavLink to="/learning">AI Hub</NavLink>
              <NavLink to="/dashboard">Mission Control</NavLink>
            </>
          )}
          {user?.email === 'admin@academicos.com' && (
            <NavLink to="/admin">Admin</NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/messages" className="relative p-2 text-[var(--muted)] hover:text-[var(--cyan)] transition-colors group">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--glass)] shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"></span>
                )}
              </Link>
              <Link to="/dashboard" className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] p-[2px]">
                <div className="w-full h-full rounded-full bg-[var(--surface)] overflow-hidden flex items-center justify-center text-[var(--text)] text-sm font-bold">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              </Link>
              <button onClick={signOut} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors">Login</Link>
              <Link to="/register" className="px-5 py-2 rounded-full text-sm font-bold bg-[var(--emerald)] text-[var(--background)] hover:bg-[var(--cyan)] shadow-[0_0_15px_rgba(0,255,198,0.2)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[var(--text)] p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[110%] left-0 right-0 backdrop-blur-2xl bg-[var(--surface-2)]/90 border border-[var(--border)] rounded-3xl p-4 flex flex-col gap-2 shadow-2xl"
          >
            <Link to="/" onClick={() => setMobileOpen(false)} className="p-3 text-[var(--text)] font-medium rounded-xl hover:bg-[var(--glass)]">Home</Link>
            {user && (
              <>
                <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className="p-3 text-[var(--text)] font-medium rounded-xl hover:bg-[var(--glass)]">Hall of Fame</Link>
                <Link to="/posts" onClick={() => setMobileOpen(false)} className="p-3 text-[var(--text)] font-medium rounded-xl hover:bg-[var(--glass)]">Stream</Link>
                <Link to="/learning" onClick={() => setMobileOpen(false)} className="p-3 text-[var(--emerald)] font-bold rounded-xl hover:bg-[var(--glass)]">AI Hub</Link>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="p-3 text-[var(--text)] font-medium rounded-xl hover:bg-[var(--glass)]">Mission Control</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="p-3 text-red-400 font-medium rounded-xl hover:bg-red-500/10 text-left">Logout</button>
              </>
            )}
            {!user && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="p-3 text-center text-[var(--cyan)] font-bold border border-[var(--cyan)] rounded-xl">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="p-3 text-center bg-[var(--emerald)] text-[var(--background)] font-bold rounded-xl">Register</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link 
      to={to} 
      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-[var(--emerald)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
    >
      {isActive && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-0 bg-[var(--emerald)]/10 rounded-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  )
}
