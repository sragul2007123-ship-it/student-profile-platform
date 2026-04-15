import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    }).catch(err => {
      console.error("Auth session error:", err)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          console.log('🔔 Auth Event:', event)
        }
        if (session) {
          if (import.meta.env.DEV) {
            console.log('👤 User Logged In:', session.user.id)
          }
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          if (import.meta.env.DEV) {
            console.log('∅ No Session Found')
          }
          setUser(null)
          setProfile(null)
        }
        
        // Clean the URL hash after successful login to prevent stuck spinners
        if (session && window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        
        setLoading(false)
      }
    )


    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, profiles(*)')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Login error:', err.message)
      alert('Login failed: ' + err.message)
    }
  }

  const signUpWithEmail = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('Registration error:', err.message)
      throw err
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('Login error:', err.message)
      throw err
    }
  }

  const signInWithMagicLink = async (email) => {
    try {
      console.log('🔗 Requesting magic link for:', email)
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        console.error('❌ Magic link error:', error.message)
        throw error
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Magic link sent successfully')
        console.log('📧 Redirect URL:', `${window.location.origin}/dashboard`)
        console.log('⏱️  Link expires in 24 hours')
      }
      return data
    } catch (err) {
      console.error('❌ Magic link error details:', {
        message: err.message,
        status: err.status,
        error: err
      })
      
      // Provide more helpful error messages
      let userMessage = err.message
      if (err.message.includes('Email not from') || err.message.includes('email provider')) {
        userMessage = 'Magic link feature is not configured. Please contact support or use Google login.'
      } else if (err.message.includes('rate limit')) {
        userMessage = 'Too many requests. Please wait a few minutes before trying again.'
      } else if (err.message.includes('invalid email')) {
        userMessage = 'Please enter a valid email address.'
      }
      
      throw new Error(userMessage)
    }
  }

  const signOut = async () => {
    try {
      // Clear local state first for immediate UI update
      setUser(null)
      setProfile(null)
      
      // Notify Supabase in the background
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err.message)
    } finally {
      // Direct navigation to home without full page reload if possible
      // But we use window.location.href='/' to be 100% sure all memory is cleared
      // however, we ensure the Dashboard isn't showing the spinner anymore
      window.location.href = '/'
    }
  }



  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signInWithMagicLink,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
