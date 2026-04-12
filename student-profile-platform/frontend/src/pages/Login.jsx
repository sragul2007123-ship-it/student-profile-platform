import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) navigate('/dashboard')
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent-400/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative glass-card p-10 md:p-14 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-xl shadow-primary-500/25">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-center mb-2 dark:text-white">
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
          Sign in to manage your digital profile
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 group"
        >
          {/* Google Icon */}
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Continue with Google
          </span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            By signing in, you agree to our Terms of Service
          </p>
        </div>

        {/* Decorative Dots */}
        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full gradient-bg opacity-50"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-accent-400 opacity-40"></div>
      </div>
    </div>
  )
}
