import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'

const BADGE_OPTIONS = [
  {
    id: 'elite',
    name: 'Elite Scholar',
    emoji: '👑',
    color: '#FFD700',
    description: 'Top 10 performer'
  },
  {
    id: 'master',
    name: 'Master Scholar',
    emoji: '🏆',
    color: '#FFA500',
    description: 'Top 50 performer'
  },
  {
    id: 'diamond',
    name: 'Diamond Scholar',
    emoji: '💎',
    color: '#00CED1',
    description: 'Exceptional achiever'
  },
  {
    id: 'star',
    name: 'Star Scholar',
    emoji: '⭐',
    color: '#FFD700',
    description: 'Rising star'
  },
  {
    id: 'rocket',
    name: 'Rocket Scholar',
    emoji: '🚀',
    color: '#FF6B6B',
    description: 'Fast progress'
  }
]

export default function Recruiters() {
  const navigate = useNavigate()
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRecruiters, setFilteredRecruiters] = useState([])

  useEffect(() => {
    loadRecruiters()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = recruiters.filter(r =>
        r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRecruiters(filtered)
    } else {
      setFilteredRecruiters(recruiters)
    }
  }, [searchQuery, recruiters])

  const loadRecruiters = async () => {
    try {
      setLoading(true)
      const response = await api.get('/recruiters/')
      setRecruiters(response.data.recruiters || [])
    } catch (error) {
      console.error('Failed to load recruiters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecruiterClick = (username) => {
    navigate(`/recruiter/${username}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-900 dark:to-surface-800 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Recruiters
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Learn from industry professionals and understand what recruiters look for in candidates
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search recruiters by name, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </motion.div>

        {/* Empty State */}
        {!loading && filteredRecruiters.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">No recruiters found</p>
          </motion.div>
        )}

        {/* Recruiters Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRecruiters.map((recruiter, index) => (
            <motion.div
              key={recruiter.user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleRecruiterClick(recruiter.user.username)}
              className="group cursor-pointer"
            >
              <div className="h-full bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-1">
                {/* Header with Photo and Company */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    {recruiter.user.profile_photo ? (
                      <img
                        src={recruiter.user.profile_photo}
                        alt={recruiter.user.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-xl font-bold border-4 border-primary-100 dark:border-primary-900">
                        {recruiter.user.name?.[0]?.toUpperCase() || 'R'}
                      </div>
                    )}
                    {recruiter.profile.company_logo && (
                      <img
                        src={recruiter.profile.company_logo}
                        alt={recruiter.profile.company}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Name and Company */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {recruiter.user.name}
                </h3>
                {recruiter.profile.company && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold mb-3">
                    @ {recruiter.profile.company}
                  </p>
                )}

                {/* Role */}
                {recruiter.profile.role && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {recruiter.profile.role}
                  </p>
                )}

                {/* Bio */}
                {recruiter.profile.about && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {recruiter.profile.about}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex gap-2 mb-4">
                  {recruiter.profile.linkedin && (
                    <a
                      href={recruiter.profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.84v8.37h2.84v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.84M7 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </a>
                  )}
                  {recruiter.profile.github && (
                    <a
                      href={recruiter.profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.099 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482 3.97-1.31 6.833-5.066 6.833-9.489C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* View Profile Button */}
                <button className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
                  View Profile
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
