import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../services/supabaseClient'

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
    <div className="min-h-screen pt-20 pb-12 bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-[935px] mx-auto px-4 sm:px-6">
        
        {/* Profile Header section (Instagram-styled) */}
        <header className="flex flex-col md:flex-row gap-4 md:gap-20 mb-11">
          {/* Profile Picture */}
          <div className="flex justify-center md:block">
            <div className="w-[150px] h-[150px] rounded-full p-1 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
              <div className="w-full h-full rounded-full border-4 border-white dark:border-black overflow-hidden bg-gray-100">
                {profileData?.profile_photo ? (
                  <img src={profileData.profile_photo} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {profileData?.name?.[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
              <h2 className="text-xl font-light dark:text-gray-100">{profileData?.username}</h2>
              <div className="flex gap-2">
                {user && user.id === profileData?.id ? (
                  <Link to="/dashboard" className="px-4 py-1.5 bg-gray-100 dark:bg-surface-800 text-sm font-bold border rounded-lg hover:bg-gray-200">
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleFriendAction}
                      className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                        friendStatus === 'accepted' 
                        ? 'bg-gray-100 dark:bg-surface-800 text-black dark:text-white' 
                        : 'bg-primary-600 text-white'
                      }`}
                    >
                      {friendStatus === 'accepted' ? 'Following' : friendLoading ? '...' : friendStatus === 'sent' ? 'Requested' : 'Follow'}
                    </button>
                    <button 
                      onClick={() => navigate(`/messages?user=${profileData.id}`)}
                      className="px-4 py-1.5 bg-gray-100 dark:bg-surface-800 text-sm font-bold border rounded-lg hover:bg-gray-200 dark:text-white"
                    >
                      Message
                    </button>
                  </>
                )}
                <button 
                  onClick={handleCopyLink}
                  className="p-2 bg-gray-100 dark:bg-surface-800 rounded-lg relative"
                >
                  <AnimatePresence>
                    {showCopied && (
                      <motion.span initial={{opacity:0, y:-10}} animate={{opacity:1, y:-25}} exit={{opacity:0}} className="absolute bg-gray-900 text-white text-[10px] px-2 py-1 rounded">
                        Link Copied!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <svg className="w-4 h-4 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-10 mb-5">
              <div className="flex items-center gap-1 text-[16px]"><span className="font-bold dark:text-white">{projects.length}</span> <span className="dark:text-gray-400">posts</span></div>
              <div className="flex items-center gap-1 text-[16px]"><span className="font-bold dark:text-white">{profileData?.views || 0}</span> <span className="dark:text-gray-400">views</span></div>
              <div className="flex items-center gap-1 text-[16px]"><span className="font-bold dark:text-white">{skills.length}</span> <span className="dark:text-gray-400">skills</span></div>
            </div>

            {/* Bio */}
            <div className="text-sm">
              <h1 className="font-bold dark:text-white mb-0.5">{profileData?.name}</h1>
              <p className="text-gray-500 font-medium mb-1">{profileData?.role}</p>
              <p className="dark:text-gray-300 leading-tight whitespace-pre-wrap">{profileData?.about}</p>
              {profileData?.linkedin && (
                <a href={profileData.linkedin} target="_blank" rel="noreferrer" className="text-blue-900 dark:text-blue-400 font-bold hover:underline block mt-1">
                  linkedin.com/{profileData.username}
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Highlights Section */}
        <section className="flex gap-4 sm:gap-10 mb-11 overflow-x-auto pb-4 scrollbar-hide">
          {skills.slice(0, 6).map((skill, index) => (
            <div key={index} className="flex flex-col items-center gap-2 min-w-[77px]">
              <div className="w-[77px] h-[77px] rounded-full p-0.5 border border-gray-200 dark:border-surface-800">
                <div className="w-full h-full rounded-full bg-gray-50 dark:bg-surface-900 border-4 border-white dark:border-black flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden text-center p-1">
                  {skill.skill_name.slice(0, 8)}
                </div>
              </div>
              <span className="text-[12px] font-medium dark:text-gray-300">{skill.skill_name.split(' ')[0]}</span>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-surface-800 flex justify-center gap-14 -mt-px">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 h-[52px] text-[12px] font-bold tracking-widest uppercase border-t transition-all ${activeTab === 'posts' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            POSTS
          </button>
          <button 
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-1.5 h-[52px] text-[12px] font-bold tracking-widest uppercase border-t transition-all ${activeTab === 'reels' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            CERTIFICATES
          </button>
          <button 
            className="flex items-center gap-1.5 h-[52px] text-[12px] font-bold tracking-widest uppercase border-t border-transparent text-gray-400 opacity-50"
          >
             <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             TAGGED
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-7 mt-px">
          {(activeTab === 'posts' ? projects : certificates).map((item, index) => (
            <motion.div 
              key={index} 
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
              transition={{delay: index * 0.05}}
              className="relative aspect-square bg-gray-200 dark:bg-surface-800 overflow-hidden group cursor-pointer"
            >
              {item.image_url ? (
                <img src={item.image_url} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" alt="post" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold p-4 text-center text-xs">
                  {item.title || item.certificate_name}
                </div>
              )}
              {/* Hover effect */}
              <div className="absolute inset-0 bg-black/30 items-center justify-center gap-6 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                  <span>{Math.floor(Math.random() * 50) + 10}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" /></svg>
                  <span>{Math.floor(Math.random() * 10) + 2}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {(activeTab === 'posts' ? projects : certificates).length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-black dark:border-white mb-6 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="text-3xl font-light mb-2 dark:text-white">No Posts Yet</h3>
          </div>
        )}
      </div>
    </div>
  )
}
