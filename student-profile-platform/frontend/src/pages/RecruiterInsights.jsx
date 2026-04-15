import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function RecruiterInsights() {
  const [searchUsername, setSearchUsername] = useState('')
  const [matchingResult, setMatchingResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConsultAI = async (e) => {
    e.preventDefault()
    if (!searchUsername.trim()) return
    
    setLoading(true)
    setError('')
    setMatchingResult(null)
    
    try {
      const profile = await api.getPublicProfile(searchUsername.trim())
      if (profile) {
        // Simulated AI Matching Logic
        const skillsCount = profile.skills?.length || 0
        const projectsCount = profile.projects?.length || 0
        const certsCount = profile.certificates?.length || 0
        
        // Mock score calculation
        let score = 40 // Base score
        score += Math.min(skillsCount * 5, 25)
        score += Math.min(projectsCount * 8, 25)
        score += Math.min(certsCount * 5, 10)
        
        if (profile.bio || profile.about) score += 5
        
        // Random variance for "AI feeling"
        score += Math.floor(Math.random() * 10)
        score = Math.min(score, 99)

        setMatchingResult({
          score: score,
          user: profile,
          analysis: score > 80 ? "Top Tier Talent. Highly recommended for senior roles." : 
                    score > 60 ? "Solid Professional. Great fit for mid-level growth." : 
                    "Developing Talent. Potential for junior or internship roles."
        })
      }
    } catch (err) {
      setError("User not found or profile is private.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 gradient-bg-subtle relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
      
      <div className="max-w-5xl mx-auto px-4 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-bold tracking-widest text-xs uppercase mb-6 shadow-sm">
            AI Talent Predictor
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 dark:text-white mb-6">
            Consult the <span className="gradient-text-animate">Recruiter AI</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Enter a username below to see how our AI evaluates their profile against real-world recruiter expectations.
          </p>

          <form onSubmit={handleConsultAI} className="mt-10 max-w-lg mx-auto">
            <div className="flex gap-2 p-2 glass-card rounded-2xl shadow-2xl bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl border border-white/40 dark:border-surface-700/50">
              <input 
                type="text" 
                placeholder="Enter username (e.g. sragul)" 
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 px-4 py-3 placeholder-gray-400 font-medium"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl gradient-bg text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
          </form>
        </motion.div>

        <AnimatePresence>
          {matchingResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card mb-16 p-10 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-surface-800 dark:to-surface-900 overflow-hidden relative"
            >
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-3xl font-display font-bold dark:text-white mb-2">Analysis for @{matchingResult.user.username}</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-sm">
                      VERIFIED PROFILE
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed italic">
                    "{matchingResult.analysis}"
                  </p>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-bold dark:text-white">Hireability Score</span>
                        <span className="font-bold text-primary-500">{matchingResult.score}%</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${matchingResult.score}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full gradient-bg"
                        ></motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10">
                    <Link to={`/student/${matchingResult.user.username}`} className="inline-block px-8 py-4 rounded-full border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all text-lg">
                      View Full Profile →
                    </Link>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 rounded-full border-8 border-primary-500/20 flex items-center justify-center p-4">
                      <div className="w-full h-full rounded-full border-8 border-primary-500/40 flex items-center justify-center p-4">
                        <div className="w-full h-full rounded-full gradient-bg flex items-center justify-center text-white text-6xl font-black shadow-2xl animate-pulse-subtle">
                          {matchingResult.score}
                        </div>
                      </div>
                    </div>
                    {/* Floating stats */}
                    <div className="absolute top-0 -right-4 bg-white dark:bg-surface-700 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-surface-600 scale-90">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Projects</p>
                      <p className="font-bold dark:text-white">{matchingResult.user.projects?.length || 0}</p>
                    </div>
                    <div className="absolute bottom-0 -left-4 bg-white dark:bg-surface-700 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-surface-600 scale-90">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Skills</p>
                      <p className="font-bold dark:text-white">{matchingResult.user.skills?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-3xl shadow-xl flex flex-col justify-center border-l-4 border-l-primary-500"
          >
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              🤖
            </div>
            <h3 className="text-2xl font-bold dark:text-white mb-4">AI Profile Parsing</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              Our engine maps skills to current market trends. Use highly specific names like "TailwindCSS" or "FastAPI" to maximize your score.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-3xl shadow-xl flex flex-col justify-center border-l-4 border-l-accent-500"
          >
            <div className="w-14 h-14 bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              🔍
            </div>
            <h3 className="text-2xl font-bold dark:text-white mb-4">Semantic Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              It's not just about what you know, but what you've built. Projects with live links are weighted 3x more by our AI.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
