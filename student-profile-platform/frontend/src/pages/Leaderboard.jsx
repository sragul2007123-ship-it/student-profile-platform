import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function Leaderboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard()
      setStudents(data)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 gradient-bg-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-3 dark:text-white">
            🏆 <span className="gradient-text">Student Leaderboard</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Rankings based on skills, projects, and certificates
          </p>
          <div className="mt-4 inline-flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>Skills: 2pts</span>
            <span>•</span>
            <span>Projects: 5pts</span>
            <span>•</span>
            <span>Certificates: 3pts</span>
          </div>
        </div>

        {/* Top 3 Podium */}
        {students.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-12">
            {/* 2nd Place */}
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card p-4 w-32">
                <div className="w-16 h-16 rounded-full gradient-bg mx-auto flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg">
                  {students[1].profile_photo ? (
                    <img src={students[1].profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : students[1].name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-2xl mb-1">🥈</div>
                <Link to={`/student/${students[1].username}`} className="text-sm font-semibold dark:text-white hover:text-primary-500 truncate block">{students[1].name}</Link>
                <p className="text-xs text-gray-400 mt-1">{students[1].score} pts</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="glass-card p-6 w-40 ring-2 ring-yellow-400/30 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold shadow-lg">
                  CHAMPION
                </div>
                <div className="w-20 h-20 rounded-full gradient-bg mx-auto flex items-center justify-center text-white text-3xl font-bold mb-2 shadow-xl mt-2">
                  {students[0].profile_photo ? (
                    <img src={students[0].profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : students[0].name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-3xl mb-1">🥇</div>
                <Link to={`/student/${students[0].username}`} className="font-semibold dark:text-white hover:text-primary-500 truncate block">{students[0].name}</Link>
                <p className="text-sm text-primary-500 font-bold mt-1">{students[0].score} pts</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="glass-card p-4 w-32">
                <div className="w-16 h-16 rounded-full gradient-bg mx-auto flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg">
                  {students[2].profile_photo ? (
                    <img src={students[2].profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : students[2].name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-2xl mb-1">🥉</div>
                <Link to={`/student/${students[2].username}`} className="text-sm font-semibold dark:text-white hover:text-primary-500 truncate block">{students[2].name}</Link>
                <p className="text-xs text-gray-400 mt-1">{students[2].score} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-surface-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projects</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Certs</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => {
                  const badge = getRankBadge(i)
                  return (
                    <tr key={student.id} className="border-b border-gray-50 dark:border-surface-700/50 hover:bg-gray-50 dark:hover:bg-surface-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-lg">{badge.emoji}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/student/${student.username}`} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold shrink-0 shadow">
                            {student.profile_photo ? (
                              <img src={student.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : student.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white group-hover:text-primary-500 transition-colors">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.role}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium">{student.skillCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium">{student.projectCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium">{student.certCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-primary-500">{student.score}</span>
                      </td>
                    </tr>
                  )
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No students yet. Be the first to create your profile!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
