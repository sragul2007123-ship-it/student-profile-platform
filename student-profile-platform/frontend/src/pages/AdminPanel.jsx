import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, activeToday: 0, totalProjects: 0, totalSkills: 0 })

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) loadStudents()
  }, [user])

  const loadStudents = async () => {
    try {
      const data = await api.getAllStudents()
      setStudents(data)
      
      // Calculate stats based on fetched data
      let projectCount = 0
      let skillCount = 0
      
      data.forEach(student => {
        // We'd ideally get these counts from the backend or another call
        // For now estimate from what we have or just mock
      })

      setStats({
        total: data.length,
        activeToday: data.filter(u => {
          const created = new Date(u.created_at)
          const today = new Date()
          return created.toDateString() === today.toDateString()
        }).length,
        totalProjects: data.reduce((acc, curr) => acc + (curr.projects?.length || 0), 0),
        totalSkills: data.reduce((acc, curr) => acc + (curr.skills?.length || 0), 0),
      })
    } catch (err) {
      console.error('Error loading students:', err)
    }
    setLoading(false)
  }

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return
    try {
      await api.deleteStudent(id)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting student:', err)
    }
  }

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statCards = [
    { label: 'Total Students', value: stats.total, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'New Today', value: stats.activeToday, icon: '🆕', color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Projects', value: stats.totalProjects, icon: '🚀', color: 'from-purple-500 to-pink-500' },
    { label: 'Total Skills', value: stats.totalSkills, icon: '⚡', color: 'from-amber-500 to-orange-500' },
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 gradient-bg-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold dark:text-white">
            🛡️ Admin Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage platform users and monitor usage</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card p-6 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`}></div>
              </div>
              <p className="text-3xl font-display font-bold dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-field pl-12"
              placeholder="Search students by name, email, or username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-surface-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-50 dark:border-surface-700/50 hover:bg-gray-50 dark:hover:bg-surface-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold shrink-0 shadow">
                          {student.profile_photo ? (
                            <img src={student.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : student.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium dark:text-white">{student.name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {student.username ? (
                        <a href={`/student/${student.username}`} className="text-primary-500 hover:underline">@{student.username}</a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {student.profiles?.role || '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                      {student.profiles?.view_count || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {searchQuery ? 'No students matching your search' : 'No students registered yet'}
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
