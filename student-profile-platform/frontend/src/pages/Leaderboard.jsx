import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Leaderboard() {
  const { user } = useAuth()
  const [globalStudents, setGlobalStudents] = useState([])
  const [friendStudents, setFriendStudents] = useState([])
  const [friendsActivity, setFriendsActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends') // 'friends' or 'global'
  const [myStats, setMyStats] = useState({ globalRank: 0, friendsRank: 0 })

  useEffect(() => {
    loadAllData()
  }, [user])

  // Set default tab based on login status and friend availability
  useEffect(() => {
    if (!loading) {
      if (!user) {
        setActiveTab('global')
      } else if (friendStudents.length > 0) {
        setActiveTab('friends')
      } else {
        setActiveTab('global')
      }
    }
  }, [user, friendStudents.length, loading])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const globalData = await api.getLeaderboard()
      setGlobalStudents(globalData)

      if (user) {
        const [friendsData, activityData] = await Promise.all([
          api.getFriendsLeaderboard(user.id),
          api.getFriendsActivity(user.id)
        ])
        setFriendStudents(friendsData)
        setFriendsActivity(activityData)

        // Calculate my stats
        const gRank = globalData.findIndex(s => s.id === user.id) + 1
        const fRank = friendsData.findIndex(s => s.id === user.id) + 1
        setMyStats({ globalRank: gRank, friendsRank: fRank })
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err)
    }
    setLoading(false)
  }

  const getRankBadge = (index) => {
    if (index === 0) return { emoji: '🥇', bg: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/30' }
    if (index === 1) return { emoji: '🥈', bg: 'from-gray-300 to-gray-400', ring: 'ring-gray-300/30' }
    if (index === 2) return { emoji: '🥉', bg: 'from-amber-600 to-orange-700', ring: 'ring-amber-600/30' }
    return { emoji: `#${index + 1}`, bg: 'from-primary-500 to-primary-600', ring: 'ring-primary-400/20' }
  }

  const currentStudents = activeTab === 'friends' ? friendStudents : globalStudents

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 gradient-bg-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block mb-3"
          >
            <span className="px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold tracking-wider uppercase">
              Hall of Fame
            </span>
          </motion.div>
          <h1 className="text-5xl font-display font-extrabold mb-4 dark:text-white">
            🏆 <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            See how you stack up against your friends and the entire student community. 
            Earn points by showcasing your skills, projects, and certificates.
          </p>
        </div>

        {/* My Standing Cards (Always visible if logged in) */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 flex items-center justify-between border-l-4 border-primary-500"
            >
              <div>
                <p className="text-sm text-gray-400 font-medium">Global Ranking</p>
                <h3 className="text-3xl font-bold dark:text-white">#{myStats.globalRank || 'N/A'}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xl">
                🌍
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 flex items-center justify-between border-l-4 border-accent-500"
            >
              <div>
                <p className="text-sm text-gray-400 font-medium">Friends Ranking</p>
                <h3 className="text-3xl font-bold dark:text-white">#{myStats.friendsRank || 'N/A'}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 text-xl">
                👥
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs Control */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/20 dark:border-surface-700 shadow-xl">
            {user && (
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'friends'
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-surface-700'
                }`}
              >
                👥 <span className="hidden sm:inline">Friends Only</span> <span className="sm:hidden">Friends</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'global'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-surface-700'
              }`}
            >
              🌍 <span className="hidden sm:inline">Global Rankings</span> <span className="sm:hidden">Global</span>
            </button>
          </div>
        </div>

        {/* Podium for Top 3 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            {currentStudents.length >= 3 && (
              <div className="flex items-end justify-center gap-4 py-8">
                {/* 2nd Place */}
                <div className="text-center order-1">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: 'auto' }}
                    className="glass-card p-4 w-32 md:w-40 bg-gradient-to-t from-gray-50/50 to-white/50 dark:from-surface-700/50 dark:to-surface-800/50"
                  >
                    <div className="relative inline-block mb-3">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 p-1 flex items-center justify-center shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-surface-600 flex items-center justify-center font-bold text-2xl">
                          {currentStudents[1].profile_photo ? (
                            <img src={currentStudents[1].profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : currentStudents[1].name?.[0]}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white dark:border-surface-800">🥈</div>
                    </div>
                    <Link to={`/student/${currentStudents[1].username}`} className="text-sm font-bold dark:text-white hover:text-primary-500 truncate block">{currentStudents[1].name}</Link>
                    <p className="text-xs text-gray-400 mt-1">{currentStudents[1].score} pts</p>
                  </motion.div>
                </div>

                {/* 1st Place */}
                <div className="text-center order-2 -mt-4">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: 'auto' }}
                    className="glass-card p-6 w-36 md:w-48 ring-4 ring-yellow-400/20 bg-gradient-to-t from-yellow-50/50 to-white/50 dark:from-yellow-900/10 dark:to-surface-800/50 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">👑</div>
                    <div className="relative inline-block mb-3 scale-110">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 p-1 flex items-center justify-center shadow-xl ring-4 ring-yellow-400/30">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-surface-600 flex items-center justify-center font-bold text-3xl">
                          {currentStudents[0].profile_photo ? (
                            <img src={currentStudents[0].profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : currentStudents[0].name?.[0]}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-md border-2 border-white dark:border-surface-800">🥇</div>
                    </div>
                    <Link to={`/student/${currentStudents[0].username}`} className="text-base font-extrabold dark:text-white hover:text-primary-500 truncate block">{currentStudents[0].name}</Link>
                    <p className="text-sm font-bold text-primary-500 mt-1">{currentStudents[0].score} pts</p>
                  </motion.div>
                </div>

                {/* 3rd Place */}
                <div className="text-center order-3">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: 'auto' }}
                    className="glass-card p-4 w-32 md:w-40 bg-gradient-to-t from-orange-50/50 to-white/50 dark:from-orange-900/10 dark:to-surface-800/50"
                  >
                    <div className="relative inline-block mb-3">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 p-1 flex items-center justify-center shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-surface-600 flex items-center justify-center font-bold text-2xl">
                          {currentStudents[2].profile_photo ? (
                            <img src={currentStudents[2].profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : currentStudents[2].name?.[0]}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-700 text-white rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white dark:border-surface-800">🥉</div>
                    </div>
                    <Link to={`/student/${currentStudents[2].username}`} className="text-sm font-bold dark:text-white hover:text-primary-500 truncate block">{currentStudents[2].name}</Link>
                    <p className="text-xs text-gray-400 mt-1">{currentStudents[2].score} pts</p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* List Table */}
            <div className="glass-card overflow-hidden shadow-2xl border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-surface-800/50 border-b border-gray-100 dark:border-surface-700">
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Rank</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Student</th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden md:table-cell">Portfolio</th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((student, i) => {
                      const badge = getRankBadge(i)
                      const isMe = user && student.id === user.id
                      return (
                        <motion.tr 
                          key={student.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`border-b border-gray-50 dark:border-surface-700/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all ${
                            isMe ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {i < 3 ? (
                                <span className="text-2xl">{badge.emoji}</span>
                              ) : (
                                <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-xs font-bold dark:text-white">
                                  {i + 1}
                                </span>
                              )}
                              {isMe && (
                                <span className="text-[10px] font-black bg-primary-500 text-white px-1.5 py-0.5 rounded uppercase">YOU</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/student/${student.username}`} className="flex items-center gap-4 group">
                              <div className="relative shadow-md rounded-full">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-surface-700">
                                  {student.profile_photo ? (
                                    <img src={student.profile_photo} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold">
                                      {student.name?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-base font-bold dark:text-white group-hover:text-primary-500 transition-colors">{student.name}</p>
                                <p className="text-xs text-gray-400 font-medium">{student.role || 'Student'}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex justify-center gap-4">
                              <div className="text-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-[10px] text-blue-400 font-bold uppercase">Skills</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{student.skillCount}</p>
                              </div>
                              <div className="text-center px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-[10px] text-purple-400 font-bold uppercase">Projects</p>
                                <p className="text-sm font-bold text-purple-600 dark:text-purple-300">{student.projectCount}</p>
                              </div>
                              <div className="text-center px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <p className="text-[10px] text-amber-400 font-bold uppercase">Certs</p>
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-300">{student.certCount}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xl font-black text-primary-500 tracking-tight">{student.score}</span>
                          </td>
                        </motion.tr>
                      )
                    })}
                    {currentStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="max-w-xs mx-auto">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-lg font-bold dark:text-white mb-1">No students found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activeTab === 'friends' 
                                ? "You haven't added any friends yet. Connect with other students to see them here!" 
                                : "The leaderboard is currently empty."}
                            </p>
                            {activeTab === 'friends' && (
                              <Link to="/dashboard" className="mt-4 inline-block px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary-500/30">
                                Find Friends
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Recent Friend Activity Section (Integrated for 'friends' tab) */}
        {activeTab === 'friends' && friendsActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500 text-xl shadow-inner">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold dark:text-white">Friends activity</h2>
                <p className="text-sm text-gray-500">See what your friends have been building</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {friendsActivity.map((activity, idx) => (
                <motion.div
                  key={`${activity.type}-${activity.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-4 border-b-4 border-accent-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={activity.user?.profile_photo || `https://ui-avatars.com/api/?name=${activity.user?.name}`} 
                      className="w-8 h-8 rounded-full border border-white dark:border-surface-700" 
                      alt="" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{activity.user?.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">
                      {activity.type === 'project' ? '🚀' : '📜'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black tracking-tighter text-accent-500 mb-0.5">
                        New {activity.type}
                      </p>
                      <p className="text-sm font-semibold dark:text-gray-200 line-clamp-2 leading-snug">
                        {activity.title}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/student/${activity.user?.username}`}
                    className="mt-3 block text-center text-[10px] font-bold py-1.5 rounded-lg bg-gray-50 dark:bg-surface-700 hover:bg-primary-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    View profile
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Scoring Rules Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <div className="inline-flex flex-wrap justify-center gap-x-8 gap-y-2 border border-white/20 dark:border-surface-700 px-6 py-3 rounded-2xl bg-white/30 dark:bg-surface-800/30 backdrop-blur-sm">
            <span className="flex items-center gap-2">🔹 Skills: <strong className="text-gray-600 dark:text-gray-300">2 pts</strong></span>
            <span className="flex items-center gap-2">🔹 Projects: <strong className="text-gray-600 dark:text-gray-300">5 pts</strong></span>
            <span className="flex items-center gap-2">🔹 Certificates: <strong className="text-gray-600 dark:text-gray-300">3 pts</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
