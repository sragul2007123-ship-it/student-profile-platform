import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function RecruiterInsights() {
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
            AI Platform Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 dark:text-white mb-6">
            How Recruiters Spot <span className="gradient-text-animate">Top Talent</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Understand the AI-driven selection process that recruiters use on our platform to find the perfect candidates for their next big roles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 rounded-3xl shadow-xl flex flex-col justify-center border-l-4 border-l-primary-500"
          >
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              🤖
            </div>
            <h3 className="text-2xl font-bold dark:text-white mb-4">1. AI Profile Parsing</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              When you upload your skills, projects, and certificates, our internal AI engine semantically analyzes your tech stack. <strong className="text-gray-900 dark:text-white">Tip:</strong> Use highly specific skill names (e.g., "React.js" instead of just "Frontend") because the AI maps these to recruiter queries.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-3xl shadow-xl flex flex-col justify-center border-l-4 border-l-accent-500"
          >
            <div className="w-14 h-14 bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              🔍
            </div>
            <h3 className="text-2xl font-bold dark:text-white mb-4">2. Semantic Search Filtering</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              Recruiters don't just search keywords; they search intent. If a recruiter searches for <em>"developer who builds modern user interfaces in 2026"</em>, the AI matches them with your highlighted <strong>Projects and Github Activity</strong>.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-10 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-surface-800 dark:to-surface-900 overflow-hidden relative"
        >
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl font-display font-bold dark:text-white mb-6">The "Score" Matrix</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                Recruiters see an aggregated <strong>"Hireability Score"</strong> based on three major factors:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">✓</div>
                  <span className="text-gray-700 dark:text-gray-300 text-lg"><strong>Project Complexity:</strong> Live demo links weigh more than just descriptions.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">✓</div>
                  <span className="text-gray-700 dark:text-gray-300 text-lg"><strong>Profile Consistency:</strong> Frequently posting updates/projects on the feed signals active learning.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">✓</div>
                  <span className="text-gray-700 dark:text-gray-300 text-lg"><strong>Leaderboard Ranking:</strong> Reaching Top 10 guarantees your profile is placed in the "Featured Talent" daily email.</span>
                </li>
              </ul>
              
              <div className="mt-10">
                <Link to="/dashboard" className="inline-block px-8 py-4 rounded-full gradient-bg text-white font-bold shadow-lg shadow-primary-500/40 hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 text-lg">
                  Boost My Profile Now →
                </Link>
              </div>
            </div>
            
            {/* Visual Dashboard Representation */}
            <div className="glass-card rounded-2xl bg-gray-900 p-6 shadow-2xl relative border border-gray-700 transform rotate-1 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
               </div>
               
               <div className="space-y-4">
                 {/* Fake recruiter dashboard UI */}
                 <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
                 <div className="flex gap-4 items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700 border-l-4 border-l-emerald-500">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                    </div>
                    <div className="text-emerald-400 font-bold">98% Match</div>
                 </div>
                 <div className="flex gap-4 items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                    </div>
                    <div className="text-amber-400 font-bold">74% Match</div>
                 </div>
               </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  )
}
