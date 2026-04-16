import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profileData, setProfileData] = useState(null)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [friendStatus, setFriendStatus] = useState(null) // null, 'pending', 'accepted', 'sent'
  const [friendLoading, setFriendLoading] = useState(false)
  const [cachedProfiles, setCachedProfiles] = useState(new Map())
  
  useEffect(() => {
    loadProfile()
    window.scrollTo(0, 0)
  }, [username])

  useEffect(() => {
    if (user && profileData) {
      checkFriendship()
    }
  }, [user, profileData])

  const loadProfile = async () => {
    const cacheKey = username.toLowerCase()
    
    if (cachedProfiles.has(cacheKey)) {
      const cached = cachedProfiles.get(cacheKey)
      if (Date.now() - cached.timestamp < 300000) {
        setProfileData({ ...cached.user, ...cached.profile })
        setSkills(cached.skills || [])
        setProjects(cached.projects || [])
        setCertificates(cached.certificates || [])
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const data = await api.getPublicProfile(username)
      setProfileData({ ...data.user, ...data.profile })
      setSkills(data.skills || [])
      setProjects(data.projects || [])
      setCertificates(data.certificates || [])
      
      setCachedProfiles(prev => new Map(prev).set(cacheKey, {
        ...data,
        timestamp: Date.now()
      }))
      
    } catch (err) {
      setError('Profile not found')
    } finally {
      setLoading(false)
    }
  }

  const checkFriendship = async () => {
    try {
      const friends = await api.getFriends(user.id)
      const isFriend = friends.find(f => f.id === profileData.id)
      if (isFriend) {
        setFriendStatus('accepted')
      } else {
        const pending = await api.getPendingRequests(user.id)
        if (pending.find(r => r.id === profileData.id)) {
          setFriendStatus('pending')
        } else {
          const sent = await api.getSentRequests(user.id)
          if (sent.find(r => r.id === profileData.id)) {
            setFriendStatus('sent')
          } else {
            setFriendStatus(null)
          }
        }
      }
    } catch (err) {
      console.error('Error checking friendship:', err)
    }
  }

  const handleFriendAction = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setFriendLoading(true)
    try {
      if (friendStatus === 'pending') {
        const requests = await api.getPendingRequests(user.id)
        const req = requests.find(r => r.id === profileData.id)
        if (req) {
          await api.acceptFriendRequest(req.friendship_id)
          setFriendStatus('accepted')
        }
      } else if (!friendStatus) {
        await api.sendFriendRequest(user.id, profileData.id)
        setFriendStatus('sent')
      }
    } catch (err) {
      console.error('Friend action failed:', err)
    } finally {
      setFriendLoading(false)
    }
  }

  const handleMessageUser = () => {
    navigate(`/messages?user=${profileData.id}`)
  }

  const [showCopied, setShowCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  // ... (rest of the checks)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-display font-bold text-gray-200 mb-4">404</h1>
        <p className="text-xl text-gray-500 mb-8">{error}</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16 gradient-bg-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-8"
        >
          {/* Custom Banner */}
          <div className={`h-32 relative ${profileData?.banner_image ? '' : 'gradient-bg'}`}>
            {profileData?.banner_image ? (
              <img src={profileData.banner_image} alt="Profile banner" className="w-full h-full object-cover" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-r ${
                profileData?.theme_color === 'emerald' ? 'from-emerald-500/50 to-teal-600/50' :
                profileData?.theme_color === 'rose' ? 'from-rose-500/50 to-pink-600/50' :
                profileData?.theme_color === 'amber' ? 'from-amber-500/50 to-orange-600/50' :
                profileData?.theme_color === 'violet' ? 'from-violet-500/50 to-purple-600/50' :
                profileData?.theme_color === 'cyan' ? 'from-cyan-500/50 to-blue-600/50' :
                profileData?.theme_color === 'lime' ? 'from-lime-500/50 to-green-600/50' :
                profileData?.theme_color === 'indigo' ? 'from-indigo-500/50 to-blue-600/50' :
                'from-primary-600/50 to-accent-600/50'
              }`}></div>
            )}
          </div>
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden gradient-bg flex items-center justify-center text-white text-5xl font-display font-bold shadow-2xl shadow-primary-500/30 border-4 border-white dark:border-surface-800 shrink-0">
                {profileData?.profile_photo ? (
                  <img src={profileData.profile_photo} alt={profileData.name} className="w-full h-full object-cover" />
                ) : (
                  profileData?.name?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div className="text-center sm:text-left pb-2 flex-1">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h1 className="text-3xl font-display font-bold dark:text-white">{profileData?.name}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold">
                    @{profileData?.username}
                  </span>
                </div>
                <p className="text-primary-500 font-semibold text-lg">{profileData?.role}</p>
                {profileData?.education && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {profileData.education.degree} • {profileData.education.college} • {profileData.education.year}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 pt-2 sm:pt-0">
                {user && profileData?.id && user.id !== profileData.id && (
                  <>
                    <button
                      onClick={handleFriendAction}
                      disabled={friendLoading || friendStatus === 'sent'}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        friendStatus === 'accepted'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                          : friendStatus === 'pending'
                          ? 'gradient-bg text-white shadow-lg shadow-primary-500/25'
                          : friendStatus === 'sent'
                          ? 'bg-gray-100 dark:bg-surface-700 text-gray-500 cursor-not-allowed'
                          : 'gradient-bg text-white shadow-lg shadow-primary-500/25 hover:shadow-xl'
                      }`}
                    >
                      {friendLoading ? '...' :
                        friendStatus === 'accepted' ? '✓ Friends' :
                        friendStatus === 'pending' ? 'Accept Request' :
                        friendStatus === 'sent' ? 'Request Sent' :
                        '+ Add Friend'}
                    </button>
                    
                    {friendStatus === 'accepted' && (
                      <button
                        onClick={handleMessageUser}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Message
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={handleCopyLink}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600 transition-all flex items-center justify-center gap-2 relative"
                >
                  <AnimatePresence>
                    {showCopied && (
                      <motion.span 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: -35 }}
                        exit={{ opacity: 0 }}
                        className="absolute bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md"
                      >
                        Link Copied!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>


        {/* About Section */}
        {profileData?.about && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-4 dark:text-white">About</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profileData.about}</p>
          </motion.div>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Top Skills</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
              {skills.map((skill, index) => (
                <div key={index} className="glass-card p-4 hover:shadow-primary-500/10 transition-all border border-gray-100 dark:border-surface-700">
                  <p className="font-bold text-gray-800 dark:text-white mb-1">{skill.skill_name}</p>
                  <div className="h-1 w-full bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full gradient-bg" style={{ width: `${skill.skill_level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Selected Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <div key={index} className="glass-card overflow-hidden card-hover">
                  {project.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex gap-4">
                      {project.github_link && (
                        <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="text-primary-500 text-sm font-semibold hover:underline">View Code</a>
                      )}
                      {project.demo_link && (
                        <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="text-accent-500 text-sm font-semibold hover:underline">Live Demo</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Contact</h2>
          <div className="flex flex-wrap gap-4">
            {profileData?.email && (
              <a href={`mailto:${profileData.email}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:-translate-y-1 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold">Email Me</span>
              </a>
            )}
            {profileData?.github && (
              <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <span className="text-sm font-medium dark:text-gray-200">GitHub</span>
              </a>
            )}
            {profileData?.linkedin && (
              <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span className="text-sm font-medium dark:text-gray-200">LinkedIn</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

