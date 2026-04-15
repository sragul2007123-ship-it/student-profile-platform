import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'

export default function StudentProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [friendStatus, setFriendStatus] = useState(null) // null, 'none', 'pending', 'accepted', 'sent'
  const [friendshipId, setFriendshipId] = useState(null)
  const [friendLoading, setFriendLoading] = useState(false)
  const profileRef = useRef(null)

  // Performance optimization: Cache profile data
  const [cachedProfiles, setCachedProfiles] = useState(new Map())

  const profileUrl = `${window.location.origin}/student/${username}`

  useEffect(() => {
    if (username) loadProfile()
  }, [username])

  useEffect(() => {
    if (user && profileData?.id && user.id !== profileData.id) {
      checkFriendship()
    }
  }, [user, profileData])

  const loadProfile = async () => {
    // Check cache first for better performance
    const cacheKey = username
    if (cachedProfiles.has(cacheKey)) {
      const cached = cachedProfiles.get(cacheKey)
      // Use cached data if it's less than 5 minutes old
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setProfileData({ ...cached.user, ...cached.profile })
        setSkills(cached.skills || [])
        setProjects(cached.projects || [])
        setCertificates(cached.certificates || [])
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const data = await api.getPublicProfile(username)
      
      setProfileData({ ...data.user, ...data.profile })
      setSkills(data.skills || [])
      setProjects(data.projects || [])
      setCertificates(data.certificates || [])

      // Cache the data
      setCachedProfiles(prev => new Map(prev).set(cacheKey, {
        ...data,
        timestamp: Date.now()
      }))

      // Increment view count via backend (only for non-owners)
      if (!user || user.id !== data.user.id) {
        api.incrementViews(username).catch(err => console.error('Error incrementing views:', err))
      }
      
    } catch (err) {
      setError('Profile not found')
      console.error(err)
    }
    setLoading(false)
  }

  const checkFriendship = async () => {
    try {
      // Check if we are friends, have a pending request, or sent a request
      const friends = await api.getFriends(user.id)
      const isFriend = friends.find(f => f.id === profileData.id)
      if (isFriend) {
        setFriendStatus('accepted')
        setFriendshipId(isFriend.friendship_id)
        return
      }

      const pending = await api.getPendingRequests(user.id)
      const pendingReq = pending.find(f => f.id === profileData.id)
      if (pendingReq) {
        setFriendStatus('pending')
        setFriendshipId(pendingReq.friendship_id)
        return
      }

      const sent = await api.getSentRequests(user.id)
      const sentReq = sent.find(f => f.id === profileData.id)
      if (sentReq) {
        setFriendStatus('sent')
        setFriendshipId(sentReq.friendship_id)
        return
      }

      setFriendStatus('none')
    } catch (err) {
      console.error('Error checking friendship:', err)
      setFriendStatus('none')
    }
  }

  const handleMessageUser = () => {
    navigate(`/messages?user=${profileData.id}`)
  }

  const handleFriendAction = async () => {
    if (!user) {
      alert('Please login to add friends')
      return
    }
    setFriendLoading(true)
    try {
      if (friendStatus === 'none') {
        await api.sendFriendRequest(user.id, profileData.id)
        setFriendStatus('sent')
      } else if (friendStatus === 'pending') {
        await api.acceptFriendRequest(friendshipId)
        setFriendStatus('accepted')
      } else if (friendStatus === 'accepted') {
        await api.removeFriend(friendshipId)
        setFriendStatus('none')
        setFriendshipId(null)
      }
    } catch (err) {
      console.error('Friend action error:', err)
      alert(err.message)
    }
    setFriendLoading(false)
  }

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out my digital profile: ${profileUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(`${profileData?.name}'s Portfolio`)}&body=${encodeURIComponent(`Check out my digital profile: ${profileUrl}`)}`,
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Header Skeleton */}
          <div className="glass-card overflow-hidden mb-8 animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-surface-700"></div>
            <div className="px-8 pb-8 -mt-16">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div className="w-32 h-32 rounded-2xl bg-gray-200 dark:bg-surface-700 shrink-0"></div>
                <div className="text-center sm:text-left pb-2 flex-1 space-y-3">
                  <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-48 mx-auto sm:mx-0"></div>
                  <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded w-32 mx-auto sm:mx-0"></div>
                  <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-40 mx-auto sm:mx-0"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeletons */}
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-8 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded w-32 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-display font-bold mb-2 dark:text-white">Profile Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg-subtle">
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <AnimatePresence>
          {username && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setShowQR(true)}
              className="w-12 h-12 rounded-full gradient-bg text-white shadow-xl shadow-primary-500/30 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="QR Code"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="w-12 h-12 rounded-full bg-accent-500 text-white shadow-xl shadow-accent-500/30 flex items-center justify-center"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </motion.button>
          <AnimatePresence>
            {showShareMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-14 right-0 glass-card p-3 w-48 shadow-2xl z-50"
              >
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors text-sm">
                  <span className="text-blue-600">in</span> LinkedIn
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors text-sm">
                  <span className="text-green-500">💬</span> WhatsApp
                </a>
                <a href={shareLinks.email} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors text-sm">
                  <span>✉️</span> Email
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(profileUrl); setShowShareMenu(false) }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors text-sm w-full text-left"
                >
                  <span>📋</span> Copy Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 text-center max-w-sm" 
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Scan to View Profile</h3>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCode value={profileUrl} size={200} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 break-all">{profileUrl}</p>
              <button onClick={() => setShowQR(false)} className="btn-ghost">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Content */}
      <div ref={profileRef} className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 ${
        profileData?.layout_style === 'minimal' ? 'max-w-2xl' :
        profileData?.layout_style === 'creative' ? 'max-w-6xl' :
        profileData?.layout_style === 'professional' ? 'max-w-5xl' :
        'max-w-4xl'
      }`}>
        {/* Header / Hero Card */}
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
                <h1 className="text-3xl font-display font-bold dark:text-white">{profileData?.name}</h1>
                <p className="text-primary-500 font-semibold text-lg">{profileData?.role}</p>
                {profileData?.education && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {profileData.education.degree} • {profileData.education.college} • {profileData.education.year}
                  </p>
                )}
              </div>
              {user && profileData?.id && user.id !== profileData.id && friendStatus && (
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 pt-2 sm:pt-0">
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
                </div>
              )}
            </div>
            {/* View Count */}
            <div className="absolute top-20 right-8 hidden sm:flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {profileData?.view_count || 0} views
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
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Skills</h2>
            <div className="space-y-8">
              {Array.from(new Set(skills.map(s => s.category || 'Other'))).map(category => (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-4">{category}</h3>
                  <div className="space-y-5">
                    {skills.filter(s => (s.category || 'Other') === category).map((skill, i) => (
                      <motion.div 
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium dark:text-gray-200">{skill.skill_name}</span>
                          <span className="text-sm font-semibold text-primary-500">{skill.skill_level}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.skill_level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full gradient-bg"
                          ></motion.div>
                        </div>
                      </motion.div>
                    ))}
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
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((project, i) => (
                <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group overflow-hidden rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-600 transition-all card-hover flex flex-col"
                >
                  {project.image_url && (
                    <div className="h-40 w-full overflow-hidden">
                      <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{project.description}</p>
                    <div className="flex gap-3">
                      {project.github_link && (
                        <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </a>
                      )}
                      {project.demo_link && (
                        <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-bg text-white text-xs font-medium hover:shadow-lg transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card-animated p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Certificates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert, i) => (
                <motion.div 
                  key={cert.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-amber-300 dark:hover:border-amber-600 transition-colors shadow-sm cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold dark:text-white truncate">{cert.title}</h4>
                    {cert.certificate_url && (
                      <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:text-primary-600 hover:underline inline-flex items-center gap-1 font-medium">
                        View Certificate 
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gallery Section */}
        {profileData?.gallery_images && profileData.gallery_images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profileData.gallery_images.map((image, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-square rounded-xl overflow-hidden group cursor-pointer"
                  onClick={() => window.open(image, '_blank')}
                >
                  <img 
                    src={image} 
                    alt={`Gallery image ${i + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-display font-bold mb-6 dark:text-white">Contact</h2>
          <div className="flex flex-wrap gap-4">
            {profileData?.email && (
              <a href={`mailto:${profileData.email}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium dark:text-gray-200">{profileData.email}</span>
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
