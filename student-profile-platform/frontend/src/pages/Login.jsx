import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Login() {
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail, signInWithMagicLink, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const isRegister = location.pathname === '/register'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user && !loading) navigate('/dashboard')
  }, [user, loading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setAuthLoading(true)

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }
        await signUpWithEmail(email, password, name)
        setSuccess('Registration successful! Please check your email for a confirmation link.')
      } else {
        if (isMagicLink) {
          await signInWithMagicLink(email)
          setSuccess('Magic Link sent! Check your email to log in.')
        } else {
          await signInWithEmail(email, password)
          navigate('/dashboard')
        }
      }
    } catch (err) {
      let msg = err.message
      if (msg.includes('already registered') || msg.includes('User already exists')) {
        msg = "This email is already registered. Please login instead."
      }
      setError(msg)
    } finally {
      setAuthLoading(false)
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4 relative pt-20">
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 group text-gray-500 hover:text-primary-600 transition-all font-medium z-10"
      >
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 shadow-sm flex items-center justify-center group-hover:bg-primary-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        Back to Home
      </Link>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent-400/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass-card p-8 md:p-12 w-full max-w-md shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg rotate-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-center mb-1 dark:text-white">
          {isRegister ? 'Join the Community' : (isMagicLink ? 'Passwordless Sign In' : 'Welcome Back')}
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          {isRegister 
            ? 'Create your professional student profile today' 
            : (isMagicLink ? "We'll send a login link to your inbox" : 'Sign in to manage your digital profile')}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100/50 border border-red-200 text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-100/50 border border-emerald-200 text-emerald-600 text-sm animate-fade-in font-medium">
            {success}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {isRegister && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                required
                className="input-field py-3"
                placeholder="Alex Johnson"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              className="input-field py-3"
              placeholder="name@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {!isMagicLink && (
              <motion.div 
                key="password-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    required={!isMagicLink}
                    className="input-field py-3"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                {isRegister && (
                  <div className="pt-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                    <input
                      type="password"
                      required
                      className="input-field py-3"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!isRegister && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setIsMagicLink(!isMagicLink)}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
              >
                {isMagicLink ? 'Use Password instead' : 'Sign in with Magic Link'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full btn-primary py-4 shadow-xl shadow-primary-500/20"
          >
            {authLoading ? 'Please wait...' : (
              isRegister ? 'Create Account' : (isMagicLink ? 'Send Magic Link' : 'Sign In')
            )}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-surface-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400">
            <span className="bg-white dark:bg-surface-800 px-3">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border-2 border-gray-100 dark:border-surface-600 bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-700 hover:border-primary-300 transition-all duration-300 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Google Account
          </span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-50 dark:border-surface-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
            <Link 
              to={isRegister ? '/login' : '/register'} 
              className="ml-2 font-bold text-primary-500 hover:text-primary-600 underline decoration-2 underline-offset-4"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
