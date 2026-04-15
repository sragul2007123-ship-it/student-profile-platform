import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || mobileOpen
        ? 'bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl shadow-lg shadow-black/5' 
        : 'bg-transparent'
    }`}>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
              StudentProfile
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className="btn-ghost">Home</Link>
            {user && (
              <>
                <Link to="/leaderboard" className="btn-ghost">Leaderboard</Link>
                <Link to="/posts" className="btn-ghost">Feed</Link>
                <Link to="/messages" className="btn-ghost">Messages</Link>
                <Link to="/insights" className="btn-ghost text-accent-500 hover:text-accent-600 font-bold">AI Insights</Link>
                <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
              </>
            )}
            {user?.email === 'admin@studentprofile.com' && (
              <Link to="/admin" className="btn-ghost">Admin</Link>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <Link to="/dashboard" className="w-8 h-8 rounded-full gradient-bg overflow-hidden flex items-center justify-center text-white text-sm font-semibold border-2 border-white dark:border-surface-800 shadow-md">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.email?.[0]?.toUpperCase() || 'U'
                  )}
                </Link>
                <button onClick={signOut} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1.5 text-sm">
                  Logout
                </button>
              </div>
            ) : (
              // Hide Login/Register on Home Page's top section to keep center buttons as primary
              (!isHomePage || scrolled) && (
                <div className="flex items-center gap-2 ml-2 animate-fade-in">
                  <Link to="/login" className="btn-ghost px-4 py-2">Login</Link>
                  <Link to="/register" className="btn-primary px-4 py-2 text-sm shadow-xl shadow-primary-500/20">Register</Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-700">
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden py-4 border-t border-gray-100 dark:border-surface-700 overflow-hidden bg-white dark:bg-surface-900 shadow-2xl relative z-10"
            >
              <div className="flex flex-col gap-1 px-2">
                <Link to="/" className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-xl" onClick={() => setMobileOpen(false)}>Home</Link>
                {user && (
                  <>
                    <Link to="/leaderboard" className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-xl" onClick={() => setMobileOpen(false)}>Leaderboard</Link>
                    <Link to="/posts" className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-xl" onClick={() => setMobileOpen(false)}>Feed</Link>
                    <Link to="/messages" className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-xl" onClick={() => setMobileOpen(false)}>Messages</Link>
                    <Link to="/insights" className="px-4 py-3 text-sm font-bold text-accent-500 hover:bg-accent-50/50 dark:hover:bg-accent-900/10 rounded-xl" onClick={() => setMobileOpen(false)}>AI Insights</Link>
                    <Link to="/dashboard" className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-xl" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  </>
                )}
                {user ? (
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-left">Logout</button>
                ) : (
                  <div className="flex flex-col gap-2 p-2">
                    <Link to="/login" className="px-4 py-3 text-sm font-bold text-center text-primary-500 border border-primary-500 rounded-xl" onClick={() => setMobileOpen(false)}>Login</Link>
                    <Link to="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>Register</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
