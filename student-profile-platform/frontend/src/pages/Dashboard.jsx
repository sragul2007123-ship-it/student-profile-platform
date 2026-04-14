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

  const loadData = async () => {
    try {
      const data = await api.getProfile(user.id)
      const userData = data.user
      const profileData = data.profile

      if (userData) {
        setProfile(prev => ({
          ...prev,
          name: userData.name || user.user_metadata?.full_name || '',
          username: userData.username || '',
          profile_photo: userData.profile_photo || user.user_metadata?.avatar_url || '',
          email: userData.email || user.email || '',
        }))
      }

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          role: profileData.role || '',
          about: profileData.about || '',
          github: profileData.github || '',
          linkedin: profileData.linkedin || '',
          college: profileData.education?.college || '',
          degree: profileData.education?.degree || '',
          year: profileData.education?.year || '',
        }))
      }

      // Load skills, projects, certificates, and friends
      const [skillsData, projectsData, certsData, friendsData, pendingData, sentData] = await Promise.all([
        api.getSkills(user.id),
        api.getProjects(user.id),
        api.getCertificates(user.id),
        api.getFriends(user.id),
        api.getPendingRequests(user.id),
        api.getSentRequests(user.id)
      ])

      if (skillsData) setSkills(skillsData)
      if (projectsData) setProjects(projectsData)
      if (certsData) setCertificates(certsData)
      if (friendsData) setFriends(friendsData)
      if (pendingData) setPendingRequests(pendingData)
      if (sentData) setSentRequests(sentData)
    } catch (err) {
      console.error('Error loading data:', err)
      showMessage('error', 'Failed to load profile data.')
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'friends', label: 'Friends', icon: '🤝' },
  ]

  const [syncTimeout, setSyncTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || (!user && window.location.hash.includes('access_token='))) {
        setSyncTimeout(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [loading, user])

  if (loading || (!user && window.location.hash.includes('access_token='))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg-subtle">
        <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4"></div>
        <h2 className="text-xl font-display font-bold text-gray-700 dark:text-gray-300">
          Syncing your profile...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {window.location.hash.includes('access_token=') 
            ? 'Finishing login, please wait...' 
            : 'Loading your dashboard...'}
        </p>
        
        {syncTimeout && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
              Taking longer than usual? Try refreshing your session.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl shadow-lg hover:bg-primary-600 transition-all font-semibold"
            >
              Refresh Dashboard
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12 gradient-bg-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your digital profile</p>
          
          {/* New User Onboarding Banner */}
          {!profile.username && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">🎉 Welcome to your new profile!</h3>
                <p className="text-primary-100 mb-4 max-w-lg">You've successfully signed up. Let's start by creating your unique username and adding your basic info.</p>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="px-6 py-2 bg-white text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
                >
                  Complete My Profile
                </button>
              </div>
            </motion.div>
          )}

          {profile.username && (
            <p className="text-sm text-primary-500 mt-2">
              Your profile: <a href={`/student/${profile.username}`} className="underline hover:text-primary-700" target="_blank" rel="noopener noreferrer">/student/{profile.username}</a>
            </p>
          )}
        </div>

        {/* Message Toast */}
        {message.text && (
          <div className={`mb-6 px-6 py-3 rounded-xl text-sm font-medium animate-slide-up ${
            message.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-56 shrink-0">
            <div className="glass-card p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'gradient-bg text-white shadow-lg shadow-primary-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700'
                  }`}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-8"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Profile Information</h2>

                  {/* Avatar Section */}
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
                    <p className="text-xs text-gray-500 mt-3 font-medium">Click photo to upload from device</p>
                    
                    <div className="mt-4 w-full max-w-sm">
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Or paste Photo URL</label>
                      <input
                        type="url"
                        className="input-field text-sm py-2"
                        placeholder="https://..."
                        value={profile.profile_photo}
                        onChange={e => setProfile(prev => ({ ...prev, profile_photo: e.target.value }))}
                      />
                    </div>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="yourname (for your public URL)"
                        value={profile.username}
                        onChange={e => setProfile(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                      />
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
                        className="input-field bg-gray-50 dark:bg-surface-700 cursor-not-allowed"
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
                </div>
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
                  <div className="p-6 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 mb-8">
                    <h3 className="font-medium mb-4 dark:text-gray-200">Add New Skill</h3>
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
                              <div key={skill.id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 group shadow-sm">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium dark:text-gray-200">{skill.skill_name}</span>
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
                  <div className="p-6 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 mb-6">
                    <h3 className="font-medium mb-4 dark:text-gray-200">Add New Project</h3>
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
                      <div key={project.id} className="p-5 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 group card-hover">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold dark:text-white">{project.title}</h4>
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

                  <div className="p-6 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 mb-8">
                    <h3 className="font-medium mb-4 dark:text-gray-200">Add New Certificate</h3>
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
                      <div key={cert.id} className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 group card-hover">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg">
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
                        <div key={friend.friendship_id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 group hover:shadow-md transition-all">
                          <a href={`/student/${friend.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white text-lg font-bold shrink-0">
                              {friend.profile_photo ? <img src={friend.profile_photo} className="w-full h-full object-cover rounded-full" /> : friend.name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold dark:text-white truncate">{friend.name}</p>
                              <p className="text-xs text-primary-500">@{friend.username}</p>
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
                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                          )}
                        </h3>
                        {pendingRequests.length === 0 && (
                           <p className="text-sm text-gray-500 py-2 italic font-medium">No incoming requests.</p>
                        )}
                        <div className="space-y-3">
                          {pendingRequests.map(req => (
                            <div key={req.friendship_id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold dark:text-white truncate">{req.name}</p>
                                <p className="text-[10px] text-gray-500">wants to be friends</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => acceptFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                  title="Accept"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => rejectFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-gray-200 dark:bg-surface-700 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
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
                              <div key={req.friendship_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-surface-700/30 border border-gray-100 dark:border-surface-700/50 opacity-75">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold dark:text-white truncate">{req.name}</p>
                                  <p className="text-[10px] text-gray-500 italic">Waiting for response...</p>
                                </div>
                                <button
                                   onClick={() => unfriend(req.friendship_id)}
                                   className="p-1.5 text-gray-400 hover:text-red-500"
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
    </div>
  )
}
