import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { supabase } from '../services/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

const defaultProfile = {
  name: '',
  username: '',
  role: '',
  about: '',
  profile_photo: '',
  github: '',
  linkedin: '',
  college: '',
  degree: '',
  year: '',
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(defaultProfile)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [certificates, setCertificates] = useState([])
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [badgeVisibility, setBadgeVisibility] = useState(true)
  // Profile customization state
  const [bannerImage, setBannerImage] = useState('')
  const [themeColor, setThemeColor] = useState('primary')
  const [layoutStyle, setLayoutStyle] = useState('default')
  const [galleryImages, setGalleryImages] = useState([])
  const [profileLayout, setProfileLayout] = useState({ sections: ['about', 'skills', 'projects', 'certificates'] })

  // New item forms
  const [newSkill, setNewSkill] = useState({ skill_name: '', category: 'Technical', skill_level: 50 })
  const [newProject, setNewProject] = useState({ title: '', description: '', github_link: '', demo_link: '', image_url: '' })
  const [newCert, setNewCert] = useState({ title: '', certificate_url: '' })

  const skillCategories = ['Technical', 'Soft Skills', 'Tools', 'Languages', 'Other']

  useEffect(() => {
    // If not loading and no user, but the URL has an access token (from OAuth)
    // don't redirect yet as Supabase might still be processing it
    const hasHashSession = window.location.hash && (
      window.location.hash.includes('access_token=') || 
      window.location.hash.includes('error=')
    )
    
    if (!loading && !user && !hasHashSession) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const loadData = async (retryCount = 0) => {
    try {
      // Parallelize ALL data fetching for maximum speed
      // We wrap getProfile in its own try/catch to handle the "New User" race condition specifically
      let profileResponse, skillsData, projectsData, certsData, friendsData, pendingData, sentData;
      
      try {
        [
          profileResponse,
          skillsData, 
          projectsData, 
          certsData, 
          friendsData, 
          pendingData, 
          sentData
        ] = await Promise.all([
          api.getProfile(user.id),
          api.getSkills(user.id),
          api.getProjects(user.id),
          api.getCertificates(user.id),
          api.getFriends(user.id),
          api.getPendingRequests(user.id),
          api.getSentRequests(user.id)
        ]);
      } catch (err) {
        // Handle race condition where user record isn't ready in DB yet
        if (retryCount < 5) {
          return setTimeout(() => loadData(retryCount + 1), 2000);
        }
        throw err;
      }

      const userData = profileResponse.user
      const profileData = profileResponse.profile

      if (userData) {
        setProfile(prev => ({
          ...prev,
          name: userData.name || prev.name || user.user_metadata?.full_name || '',
          username: userData.username || prev.username || '',
          profile_photo: userData.profile_photo || prev.profile_photo || user.user_metadata?.avatar_url || '',
          email: userData.email || prev.email || user.email || '',
        }))
      }

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          role: profileData.role || prev.role || '',
          about: profileData.about || prev.about || '',
          college: profileData.education?.college || prev.college || '',
          degree: profileData.education?.degree || prev.degree || '',
          year: profileData.education?.year || prev.year || '',
          github: profileData.github || prev.github || '',
          linkedin: profileData.linkedin || prev.linkedin || '',
        }))
        
        // Load customization settings
        setSelectedBadge(profileData.selected_badge || null)
        setBadgeVisibility(profileData.badge_visibility !== false)
        setBannerImage(profileData.banner_image || '')
        setThemeColor(profileData.theme_color || 'primary')
        setLayoutStyle(profileData.layout_style || 'default')
        setGalleryImages(profileData.gallery_images || [])
        setProfileLayout(profileData.profile_layout || { sections: ['about', 'skills', 'projects', 'certificates'] })
      }

      if (skillsData) setSkills(skillsData)
      if (projectsData) setProjects(projectsData)
      if (certsData) setCertificates(certsData)
      if (friendsData) setFriends(friendsData)
      if (pendingData) setPendingRequests(pendingData)
      if (sentData) setSentRequests(sentData)
    } catch (err) {
      console.error('Error loading data:', err)
      if (retryCount < 3) {
        setTimeout(() => loadData(retryCount + 1), 2000)
      }
    }
  }


  const uploadFile = async (file, bucket, folder = '') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file.')
      return
    }

    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'avatars')
      setProfile(prev => ({ ...prev, profile_photo: publicUrl }))
      showMessage('success', 'Photo uploaded! Don\'t forget to save your profile.')
    } catch (err) {
      console.error('Upload error:', err)
      showMessage('error', 'Error uploading photo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleProjectImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'projects')
      setNewProject(prev => ({ ...prev, image_url: publicUrl }))
      showMessage('success', 'Project image uploaded!')
    } catch (err) {
       showMessage('error', 'Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCertUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'certificates')
      setNewCert(prev => ({ ...prev, certificate_url: publicUrl }))
      showMessage('success', 'Certificate file uploaded!')
    } catch (err) {
       showMessage('error', 'Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    // Basic validation
    if (!profile.username || profile.username.trim() === '') {
      showMessage('error', 'Username is required for your public profile link.')
      return
    }
    
    // Remove spaces from username and ensure it's lowercase
    const cleanUsername = profile.username.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    
    setSaving(true)
    try {
      await api.updateProfile(user.id, {
        name: profile.name,
        username: cleanUsername,
        role: profile.role,
        about: profile.about,
        profile_photo: profile.profile_photo,
        github: profile.github,
        linkedin: profile.linkedin,
        education: {
          college: profile.college,
          degree: profile.degree,
          year: profile.year,
        },
        // Include customization fields
        selected_badge: selectedBadge,
        badge_visibility: badgeVisibility,
        banner_image: bannerImage,
        theme_color: themeColor,
        layout_style: layoutStyle,
        gallery_images: galleryImages,
        profile_layout: profileLayout,
      })
      
      setProfile(prev => ({ ...prev, username: cleanUsername }))
      showMessage('success', 'Profile saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      showMessage('error', 'Error saving profile: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async () => {
    if (!newSkill.skill_name) return
    try {
      const data = await api.addSkill(user.id, newSkill)
      setSkills(prev => [data, ...prev])
      setNewSkill({ skill_name: '', category: 'Technical', skill_level: 50 })
      showMessage('success', 'Skill added!')
    } catch (err) {
      showMessage('error', 'Error adding skill')
    }
  }

  const deleteSkill = async (id) => {
    await api.deleteSkill(id)
    setSkills(prev => prev.filter(s => s.id !== id))
    showMessage('success', 'Skill deleted')
  }

  const addProject = async () => {
    if (!newProject.title) return
    try {
      const data = await api.addProject(user.id, newProject)
      setProjects(prev => [data, ...prev])
      setNewProject({ title: '', description: '', github_link: '', demo_link: '', image_url: '' })
      showMessage('success', 'Project added!')
    } catch (err) {
      showMessage('error', 'Error adding project')
    }
  }

  const deleteProject = async (id) => {
    await api.deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    showMessage('success', 'Project deleted')
  }

  const addCertificate = async () => {
    if (!newCert.title) return
    try {
      const data = await api.addCertificate(user.id, newCert)
      setCertificates(prev => [data, ...prev])
      setNewCert({ title: '', certificate_url: '' })
      showMessage('success', 'Certificate added!')
    } catch (err) {
      showMessage('error', 'Error adding certificate')
    }
  }

  const deleteCertificate = async (id) => {
    await api.deleteCertificate(id)
    setCertificates(prev => prev.filter(c => c.id !== id))
    showMessage('success', 'Certificate deleted')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async (q) => {
    try {
      const results = await api.searchUsers(user.id, q)
      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const sendFriendRequest = async (addresseeId) => {
    try {
      await api.sendFriendRequest(user.id, addresseeId)
      const sent = await api.getSentRequests(user.id)
      setSentRequests(sent)
      setSearchResults(prev => prev.filter(u => u.id !== addresseeId))
      showMessage('success', 'Friend request sent!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const acceptFriendRequest = async (friendshipId) => {
    try {
      await api.acceptFriendRequest(friendshipId)
      // Refresh friends and pending
      const [f, p] = await Promise.all([
        api.getFriends(user.id),
        api.getPendingRequests(user.id)
      ])
      setFriends(f)
      setPendingRequests(p)
      showMessage('success', 'Friend request accepted!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const rejectFriendRequest = async (friendshipId) => {
    try {
      await api.rejectFriendRequest(friendshipId)
      setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId))
      showMessage('success', 'Request rejected')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const unfriend = async (friendshipId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return
    try {
      await api.removeFriend(friendshipId)
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      showMessage('success', 'Friend removed')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const calculateCompletion = () => {
    let score = 0;
    let total = 7;
    if (profile.name) score++;
    if (profile.username) score++;
    if (profile.about) score++;
    if (profile.profile_photo) score++;
    if (skills.length > 0) score++;
    if (projects.length > 0) score++;
    if (certificates.length > 0) score++;
    return Math.round((score / total) * 100);
  };

  const completionPercent = calculateCompletion();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'badges', label: 'Badges', icon: '⭐' },
    { id: 'friends', label: 'Friends', icon: '🤝' },
  ]

  const [isEditing, setIsEditing] = useState(false)
  const isAuthFlow = window.location.hash.includes('access_token=') || window.location.hash.includes('error=');

  if (loading && (isAuthFlow || !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-black">
        <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4"></div>
        <h2 className="text-xl font-bold dark:text-white">Syncing your profile...</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Message Toast */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-lg text-sm font-bold shadow-2xl ${
                message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {!isEditing ? (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">Academic Command Center</h1>
                <p className="text-gray-400 font-medium mt-1">Welcome back, {profile.name?.split(' ')[0] || 'Student'}. Your identity score is looking strong.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-xl font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--emerald)] transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </button>
                <a href={`/student/${profile.username}`} target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-xl font-bold bg-[var(--text)] text-[var(--background)] hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  View Public Profile
                </a>
              </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[160px]">
              
              {/* Identity Score Card (Spans 2x2) */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="col-span-1 md:col-span-2 row-span-2 glass-card p-6 md:p-8 relative overflow-hidden group cursor-pointer border-primary-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)] hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--cyan)]/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--cyan)]/30 transition-colors"></div>
                
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Academic Identity Score</h3>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative w-40 h-40 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-[var(--surface-2)]" strokeWidth="12" fill="none" />
                      <circle cx="80" cy="80" r="70" className="stroke-primary-500 transition-all duration-1500" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="439.8" strokeDashoffset={439.8 - (439.8 * completionPercent) / 100} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-display font-black text-white">{completionPercent}</span>
                      <span className="text-xs font-bold text-primary-400">/ 100</span>
                    </div>
                  </div>
                  
                  <div className="w-full flex-1 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                        <span>Profile Completion</span>
                        <span className="text-white">{completionPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-600 to-accent-500 rounded-full" style={{width: `${completionPercent}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Placement Readiness</p>
                        <p className="text-lg font-bold text-[var(--emerald)]">High</p>
                      </div>
                      <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Profile Views</p>
                        <p className="text-lg font-bold text-white">24</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Grid */}
              <div className="col-span-1 row-span-1 glass-card p-6 flex flex-col justify-between hover:border-accent-500/30 transition-colors group cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('projects'); }}>
                <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black text-white">{projects.length}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Posts</p>
                </div>
              </div>

              <div className="col-span-1 row-span-1 glass-card p-6 flex flex-col justify-between hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('skills'); }}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black text-white">{skills.length}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Skills Verified</p>
                </div>
              </div>

              {/* Achievements/Certificates */}
              <div className="col-span-1 md:col-span-2 row-span-1 glass-card p-6 flex items-center gap-6 overflow-hidden relative group border-white/5 hover:border-emerald-500/20 transition-colors cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('certificates'); }}>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0f111a] to-transparent z-10 pointer-events-none"></div>
                
                <div className="shrink-0 z-20 bg-[var(--surface-2)] pr-6">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1">Certifications</h3>
                  <p className="text-2xl font-black text-white">{certificates.length} Earned</p>
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide flex-1">
                  {certificates.length === 0 ? (
                    <div className="px-4 py-3 bg-[#111111] border border-white/5 rounded-xl text-sm text-gray-500 font-medium whitespace-nowrap">
                      No certifications yet
                    </div>
                  ) : (
                    certificates.map((cert, i) => (
                      <div key={i} className="px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl flex items-center gap-3 shrink-0 hover:bg-[var(--glass)] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">📜</div>
                        <div>
                          <p className="text-sm font-bold text-white max-w-[150px] truncate">{cert.title}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Verified</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Career Insights Widget */}
              <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 glass-card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Career Insights</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-wider">Beta</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--emerald)]"></div>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      "Adding <strong className="text-white">2 React projects</strong> to your portfolio could increase your recruiter visibility score by 12%."
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--gold)]"></div>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      "Your Machine Learning skill level is high, consider adding a <strong className="text-white">certification</strong> to validate it."
                    </p>
                  </div>
                </div>
                
                <button className="w-full mt-6 py-3 rounded-xl font-bold text-sm text-white bg-white/5 hover:bg-white/10 transition-colors">
                  View Full Analysis
                </button>
              </div>

              {/* Mini Feed / Recent Activity */}
              <div className="col-span-1 md:col-span-2 row-span-1 glass-card p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Post</h3>
                  <button onClick={() => navigate('/posts')} className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">View Feed →</button>
                </div>
                
                {projects.length > 0 ? (
                  <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-xl border border-white/5">
                    {projects[0].image_url ? (
                      <img src={projects[0].image_url} alt="post" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface-800 flex items-center justify-center text-xs font-bold text-gray-500">Text</div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white max-w-full truncate">{projects[0].title || projects[0].content}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase">Posted recently</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 border border-dashed border-white/10 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* Profile Editing View (Current Dashboard Content) */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-primary-600 font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Profile
              </button>
              <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Tabs */}
              <div className="lg:w-48 shrink-0">
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible items-center lg:items-start border-b lg:border-none mb-4 lg:mb-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-bold w-full text-left transition-all ${activeTab === tab.id ? 'border-l-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Forms Container */}
              <div className="flex-1 min-h-[500px] glass-card p-8 border border-[var(--border)]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    {activeTab === 'profile' && (
                      <>
                        <div className="flex flex-col items-center mb-10">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-32 h-32 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white text-5xl font-bold shadow-2xl cursor-pointer hover:scale-105 transition-all"
                    >
                      {profile.profile_photo ? (
                        <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      ) : (
                        profile.name?.[0]?.toUpperCase() || 'U'
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-white border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    <p className="text-xs text-gray-500 mt-3 font-medium">Click photo to upload a new one</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Your full name"
                        value={profile.name}
                        onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold ml-1 uppercase">(Required)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                        <input
                          type="text"
                          className={`input-field pl-8 ${!profile.username ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30' : ''}`}
                          placeholder="yourname"
                          value={profile.username}
                          required
                          onChange={e => setProfile(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">This will be your unique profile link.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role / Title</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., AIML Student"
                        value={profile.role}
                        onChange={e => setProfile(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        className="input-field cursor-not-allowed text-[var(--muted)] bg-[var(--surface-2)]"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://github.com/..."
                        value={profile.github}
                        onChange={e => setProfile(prev => ({ ...prev, github: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://linkedin.com/in/..."
                        value={profile.linkedin}
                        onChange={e => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About</label>
                    <textarea
                      className="input-field h-32 resize-none"
                      placeholder="Tell us about yourself..."
                      value={profile.about}
                      onChange={e => setProfile(prev => ({ ...prev, about: e.target.value }))}
                    />
                  </div>

                  <button onClick={saveProfile} disabled={saving} className="btn-primary mt-8 w-full md:w-auto">
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </>
              )}

              {/* Education Tab */}
              {activeTab === 'education' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Education</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">College / University</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Your college name"
                        value={profile.college}
                        onChange={e => setProfile(prev => ({ ...prev, college: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., B.Tech in Computer Science"
                        value={profile.degree}
                        onChange={e => setProfile(prev => ({ ...prev, degree: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., 2023 - 2027"
                        value={profile.year}
                        onChange={e => setProfile(prev => ({ ...prev, year: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6">
                    {saving ? 'Saving...' : 'Save Education'}
                  </button>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Skills</h2>

                  {/* Add Skill Form */}
                  <div className="glass-card p-6 mb-8">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Skill</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div className="lg:col-span-1">
                        <label className="block text-sm text-gray-500 mb-1">Skill Name</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g., React.js"
                          value={newSkill.skill_name}
                          onChange={e => setNewSkill(prev => ({ ...prev, skill_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Category</label>
                        <select 
                          className="input-field"
                          value={newSkill.category}
                          onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {skillCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Level: {newSkill.skill_level}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-primary-500 mt-2"
                          value={newSkill.skill_level}
                          onChange={e => setNewSkill(prev => ({ ...prev, skill_level: parseInt(e.target.value) }))}
                        />
                      </div>
                      <button onClick={addSkill} className="btn-primary w-full">Add Skill</button>
                    </div>
                  </div>

                  {/* Skills List by Category */}
                  <div className="space-y-8">
                    {skillCategories.map(category => {
                      const catSkills = skills.filter(s => s.category === category)
                      if (catSkills.length === 0) return null
                      
                      return (
                        <div key={category}>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-4">{category}</h3>
                          <div className="space-y-4">
                            {catSkills.map(skill => (
                              <div key={skill.id} className="flex items-center gap-4 glass-card p-4 group card-hover">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-[var(--text)]">{skill.skill_name}</span>
                                    <span className="text-sm text-primary-500 font-semibold">{skill.skill_level}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full gradient-bg" style={{ width: `${skill.skill_level}%` }}></div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteSkill(skill.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {skills.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-12">No skills added yet. Define your sections above!</p>
                    )}
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Projects</h2>

                  {/* Add Project Form */}
                  <div className="glass-card p-6 mb-6">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Project</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Title</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Project title"
                          value={newProject.title}
                          onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">GitHub Link</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://github.com/..."
                          value={newProject.github_link}
                          onChange={e => setNewProject(prev => ({ ...prev, github_link: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">Description</label>
                        <textarea
                          className="input-field h-20 resize-none"
                          placeholder="Brief project description"
                          value={newProject.description}
                          onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Demo Link (optional)</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://..."
                          value={newProject.demo_link}
                          onChange={e => setNewProject(prev => ({ ...prev, demo_link: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-2">Project Preview Image</label>
                        <div className="flex gap-4 items-center">
                          <button 
                            type="button"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = handleProjectImageUpload;
                                input.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all text-sm font-medium text-gray-500"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button onClick={addProject} className="btn-primary w-full sm:w-auto">Add Project</button>
                      </div>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-8 md:col-span-2">No projects added yet.</p>
                    )}
                    {projects.map(project => (
                      <div key={project.id} className="glass-card p-5 group card-hover">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-[var(--text)]">{project.title}</h4>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 rounded transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.description}</p>
                        <div className="flex gap-3">
                          {project.github_link && (
                            <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline">GitHub</a>
                          )}
                          {project.demo_link && (
                            <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-500 hover:underline">Demo</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates Tab */}
              {activeTab === 'certificates' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Certificates</h2>

                  <div className="glass-card p-6 mb-8">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Certificate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">Certificate Title</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g., AWS Cloud Practitioner"
                          value={newCert.title}
                          onChange={e => setNewCert(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-2">Upload Certificate File (Image/PDF)</label>
                        <button 
                             type="button"
                             onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,application/pdf';
                                input.onchange = handleCertUpload;
                                input.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl hover:border-primary-500 transition-all text-sm font-medium w-full text-gray-500 bg-white dark:bg-surface-800"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-sm text-gray-500 mb-1">Or Certificate Link</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://..."
                          value={newCert.certificate_url}
                          onChange={e => setNewCert(prev => ({ ...prev, certificate_url: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                         <button onClick={addCertificate} className="btn-primary w-full shadow-lg shadow-primary-500/20">Add Certificate</button>
                      </div>
                    </div>
                  </div>

                  {/* Certificates List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-8 md:col-span-2">No certificates added yet.</p>
                    )}
                    {certificates.map(cert => (
                      <div key={cert.id} className="flex items-center gap-4 glass-card p-5 group card-hover">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold dark:text-white truncate">{cert.title}</h4>
                          {cert.certificate_url && (
                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline">View Certificate →</a>
                          )}
                        </div>
                        <button
                          onClick={() => deleteCertificate(cert.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">Customize Your Badge</h2>
                  
                  <div className="glass-card p-6 mb-8 border-[var(--cyan)]">
                    <h3 className="font-semibold text-[var(--text)] mb-2">🎖️ How to Get Badges</h3>
                    <ul className="text-sm text-[var(--muted)] space-y-1">
                      <li>✅ <strong>Elite Scholar 👑</strong> - Reach Top 10 in the Leaderboard</li>
                      <li>✅ <strong>Master Scholar 🏆</strong> - Reach Top 50 in the Leaderboard</li>
                      <li>💡 Keep adding skills, projects, and certificates to improve your ranking!</li>
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Your Available Badges</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Elite Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('elite')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'elite'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">👑</div>
                        <h4 className="font-bold text-[var(--text)]">Elite Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Top 10 Student</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">Locked</span>
                        </div>
                      </div>

                      {/* Master Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('master')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'master'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">🏆</div>
                        <h4 className="font-bold text-[var(--text)]">Master Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Top 50 Student</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">Locked</span>
                        </div>
                      </div>

                      {/* Diamond Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('diamond')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'diamond'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">💎</div>
                        <h4 className="font-bold text-[var(--text)]">Diamond Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Exceptional Achiever</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>

                      {/* Star Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('star')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'star'
                            ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">⭐</div>
                        <h4 className="font-bold text-[var(--text)]">Star Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Rising Star</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>

                      {/* Rocket Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('rocket')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'rocket'
                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">🚀</div>
                        <h4 className="font-bold text-[var(--text)]">Rocket Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Fast Progress</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge Visibility Settings */}
                  <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--text)]">Badge Visibility</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={badgeVisibility} 
                        onChange={(e) => setBadgeVisibility(e.target.checked)}
                        className="w-5 h-5 rounded accent-[var(--cyan)]"
                      />
                      <span className="text-[var(--text)]">
                        Show my badge on my profile and in the leaderboard
                      </span>
                    </label>
                    <p className="text-sm text-[var(--muted)] mt-2">
                      {badgeVisibility 
                        ? '✅ Your badge will be visible to others' 
                        : '🔒 Your badge will be hidden from public view'}
                    </p>
                  </div>

                  {/* Selected Badge Preview */}
                  {selectedBadge && (
                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-200 dark:border-primary-800">
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">Badge Preview</h3>
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4 inline-block">
                          {selectedBadge === 'elite' && '👑'}
                          {selectedBadge === 'master' && '🏆'}
                          {selectedBadge === 'diamond' && '💎'}
                          {selectedBadge === 'star' && '⭐'}
                          {selectedBadge === 'rocket' && '🚀'}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          This badge will appear on your profile and leaderboard ranking
                        </p>
                      </div>
                    </div>
                  )}

                  <button onClick={saveProfile} disabled={saving} className="btn-primary w-full shadow-lg shadow-primary-500/20">
                    {saving ? 'Saving...' : 'Save Badge Settings'}
                  </button>
                </div>
              )}



              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-xl font-semibold dark:text-white">Friends & Networking</h2>
                    <div className="relative w-full md:w-64">
                      <input
                        type="text"
                        className="input-field pl-10 text-sm"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>

                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 glass-card shadow-2xl z-50 overflow-hidden animate-scale-in">
                          {searchResults.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-surface-700 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {u.profile_photo ? <img src={u.profile_photo} className="w-full h-full object-cover rounded-full" /> : u.name?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold dark:text-white truncate">{u.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">@{u.username}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => sendFriendRequest(u.id)}
                                className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Friends List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">My Friends ({friends.length})</h3>
                      {friends.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 italic">You haven't added any friends yet.</p>
                      )}
                      {friends.map(friend => (
                        <div key={friend.friendship_id} className="flex items-center justify-between p-4 rounded-xl glass-card group hover:shadow-[0_0_15px_rgba(0,255,198,0.2)] transition-all">
                          <a href={`/student/${friend.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-lg font-bold shrink-0">
                              {friend.profile_photo ? <img src={friend.profile_photo} className="w-full h-full object-cover rounded-full" /> : friend.name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">{friend.name}</p>
                              <p className="text-xs text-[var(--cyan)]">@{friend.username}</p>
                            </div>
                          </a>
                          <button
                            onClick={() => unfriend(friend.friendship_id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pending Requests */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
                          Pending Requests
                          {pendingRequests.length > 0 && (
                            <span className="bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                          )}
                        </h3>
                        {pendingRequests.length === 0 && (
                           <p className="text-sm text-[var(--muted)] py-2 italic font-medium">No incoming requests.</p>
                        )}
                        <div className="space-y-3">
                          {pendingRequests.map(req => (
                            <div key={req.friendship_id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] group">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-xs font-bold shrink-0">
                                  {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">{req.name}</p>
                                  <p className="text-[10px] text-[var(--muted)]">wants to be friends</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => acceptFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-[var(--emerald)]/20 text-[var(--emerald)] hover:bg-[var(--emerald)] hover:text-[var(--background)] transition-colors"
                                  title="Accept"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => rejectFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-[var(--background)] transition-colors"
                                  title="Reject"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sent Requests */}
                      {sentRequests.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Sent Requests</h3>
                          <div className="space-y-3">
                            {sentRequests.map(req => (
                              <div key={req.friendship_id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border-[var(--border)]/50 border opacity-75">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-xs font-bold shrink-0">
                                  {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">{req.name}</p>
                                  <p className="text-[10px] text-[var(--muted)] italic">Waiting for response...</p>
                                </div>
                                <button
                                   onClick={() => unfriend(req.friendship_id)}
                                   className="p-1.5 text-[var(--muted)] hover:text-red-500"
                                   title="Cancel Request"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
