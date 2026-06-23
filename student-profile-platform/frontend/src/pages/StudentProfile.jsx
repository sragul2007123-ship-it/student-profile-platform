import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../services/supabaseClient'
import LearningHub from './LearningHub'

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
  const [friendStatus, setFriendStatus] = useState(null)
  const [friendLoading, setFriendLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [showCopied, setShowCopied] = useState(false)

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
    setLoading(true)
    setError(null)
    try {
      const data = await api.getPublicProfile(username)
      setProfileData({ ...data.user, ...data.profile })
      setSkills(data.skills || [])
      setProjects(data.projects || [])
      setCertificates(data.certificates || [])
      // Increment views
      api.incrementViews(username).catch(() => {})
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
    } catch (err) {}
  }

  const handleFriendAction = async () => {
    if (!user) return navigate('/login')
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
    } finally {
      setFriendLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-black">
      <div className="w-12 h-12 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-500 mb-8">{error}</p>
      <Link to="/" className="px-6 py-2 bg-primary-600 text-white rounded-lg">Back to Home</Link>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-12 bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        
        {/* Cover Image & Profile Header */}
        <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 w-full bg-gradient-to-r from-primary-600 via-indigo-500 to-sky-400 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          <div className="px-8 pb-8 relative">
            {/* Avatar overlapping cover */}
            <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
              <div className="w-32 h-32 rounded-2xl p-1.5 bg-white dark:bg-[#111111] shadow-xl">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-4xl font-black text-slate-300">
                  {profileData?.profile_photo ? (
                    <img src={profileData.profile_photo} className="w-full h-full object-cover" alt="profile" />
                  ) : (
                    profileData?.name?.[0]
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mb-2">
                {user && user.id === profileData?.id ? (
                  <Link to="/dashboard" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleFriendAction}
                      className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors shadow-sm ${
                        friendStatus === 'accepted' 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700' 
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {friendStatus === 'accepted' ? 'Following' : friendLoading ? '...' : friendStatus === 'sent' ? 'Requested' : 'Follow'}
                    </button>
                    <button 
                      onClick={() => navigate(`/messages?user=${profileData.id}`)}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      Message
                    </button>
                  </>
                )}
                <button onClick={handleCopyLink} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative shadow-sm">
                  <AnimatePresence>
                    {showCopied && (
                      <motion.span initial={{opacity:0, y:-10}} animate={{opacity:1, y:-25}} exit={{opacity:0}} className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
                        Link Copied!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
            </div>

            {/* User Details */}
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {profileData?.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-4">
                @{profileData?.username} • <span className="text-primary-600 dark:text-primary-400">{profileData?.role}</span>
              </p>
              
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-2xl mb-6 font-medium">
                {profileData?.about}
              </p>

              {/* Social Links */}
              <div className="flex gap-3">
                {profileData?.linkedin && (
                  <a href={profileData.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors">
                    LinkedIn
                  </a>
                )}
                {profileData?.github && (
                  <a href={profileData.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Skills Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="col-span-1 flex gap-4">
            <div className="flex-1 bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-center items-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{projects.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Posts</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-center items-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{profileData?.views || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Views</span>
            </div>
          </div>

          <div className="col-span-2 bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center overflow-x-auto scrollbar-hide gap-2">
            {skills.length === 0 ? (
              <span className="text-sm text-slate-400 italic">No skills listed yet.</span>
            ) : (
              skills.map((skill, index) => (
                <div key={index} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {skill.skill_name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pill Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-[#111111] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80'}`}
          >
            Posts & Projects
          </button>
          <button 
            onClick={() => setActiveTab('reels')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'reels' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-[#111111] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80'}`}
          >
            Certificates
          </button>
          <button 
            onClick={() => setActiveTab('learning')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'learning' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-[#111111] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80'}`}
          >
            Learning Hub
          </button>
        </div>

        {/* Content Section */}
        <div>
          {activeTab === 'learning' ? (
            <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-2 sm:p-6 shadow-sm">
              <LearningHub embedded={true} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'posts' ? projects : certificates).map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: index * 0.05}}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/50 dark:border-slate-800/80 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
                >
                  {item.image_url ? (
                    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="post" />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-500 font-medium text-sm text-center italic line-clamp-3">
                        {item.content || item.title || item.certificate_name || "Text post"}
                      </p>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight line-clamp-1">
                      {item.title || item.certificate_name || (item.content ? item.content.split('\n')[0] : 'Untitled')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                      {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span className="text-xs font-bold">{item.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {activeTab !== 'learning' && (activeTab === 'posts' ? projects : certificates).length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 border-dashed mt-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nothing here yet</h3>
              <p className="text-sm text-slate-500 mt-1">This section is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

