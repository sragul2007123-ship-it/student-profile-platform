import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function Posts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('global')
  const [friendsIds, setFriendsIds] = useState([])
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Comments State
  const [activeComments, setActiveComments] = useState({}) // postId -> comments array
  const [showComments, setShowComments] = useState({}) // postId -> boolean
  const [newComment, setNewComment] = useState({}) // postId -> string

  useEffect(() => {
    loadPostsAndFriends()
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [posts, searchQuery, filterMode, friendsIds])

  const loadPostsAndFriends = async () => {
    setLoading(true)
    try {
      const allPosts = await api.getAllPosts()
      setPosts(allPosts)

      if (user) {
        const friendsList = await api.getFriends(user.id)
        setFriendsIds(friendsList.map(f => f.id))
      }
    } catch (err) {
      console.error('Error loading posts:', err)
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let result = posts
    if (filterMode === 'friends' && user) {
      result = result.filter(p => p.user_id === user.id || friendsIds.includes(p.user_id))
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.content.toLowerCase().includes(q) || 
        (p.users?.name && p.users.name.toLowerCase().includes(q)) ||
        (p.users?.username && p.users.username.toLowerCase().includes(q))
      )
    }
    setFilteredPosts(result)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file)
  }

  const uploadPostImage = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `posts/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('Profiles')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('Profiles')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() && !selectedFile) return
    if (!user) return

    setUploading(true)
    try {
      let image_url = ''
      if (selectedFile) {
        image_url = await uploadPostImage(selectedFile)
      }

      const created = await api.createPost({
        user_id: user.id,
        content: newPost,
        image_url
      })
      
      const fullPost = {
        ...created,
        users: { 
          name: user.user_metadata?.full_name || 'You', 
          username: user.email.split('@')[0], 
          profile_photo: user.user_metadata?.avatar_url || '' 
        },
        likes_count: 0
      }
      setPosts([fullPost, ...posts])
      setNewPost('')
      setSelectedFile(null)
    } catch (err) {
      console.error('Error creating post:', err)
      alert('Failed to publish post')
    } finally {
      setUploading(false)
    }
  }

  const handleLike = async (postId) => {
    if (!user) return
    try {
      const result = await api.likePost(postId, user.id)
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes_count: result.count } : p
      ))
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const toggleComments = async (postId) => {
    if (!showComments[postId]) {
      try {
        const comments = await api.getComments(postId)
        setActiveComments(prev => ({ ...prev, [postId]: comments }))
      } catch (err) {
        console.error('Failed to load comments:', err)
      }
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  const handleAddComment = async (e, postId) => {
    e.preventDefault()
    const content = newComment[postId]
    if (!content?.trim() || !user) return

    try {
      const created = await api.addComment(postId, {
        user_id: user.id,
        content: content.trim()
      })
      
      const fullComment = {
        ...created,
        users: { 
          name: user.user_metadata?.full_name || 'You', 
          username: user.email.split('@')[0], 
          profile_photo: user.user_metadata?.avatar_url || '' 
        }
      }
      setActiveComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), fullComment]
      }))
      setNewComment(prev => ({ ...prev, [postId]: '' }))
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const renderContent = (content) => {
    if (!content) return null
    const tokens = content.split(/(\s+)/)
    return tokens.map((token, i) => {
      if (token.startsWith('#')) return <span key={i} className="text-primary-500 font-bold">{token}</span>
      if (token.startsWith('http://') || token.startsWith('https://')) {
        return <a key={i} href={token} target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:underline">{token}</a>
      }
      return token
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-12 gradient-bg-subtle relative overflow-hidden">
      <div className="absolute top-40 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-60 right-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        
        {/* Search Bar */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <div className="relative glass-card rounded-3xl p-2 shadow-2xl flex items-center bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl border border-white/40 dark:border-surface-700/50">
            <svg className="w-6 h-6 text-gray-400 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 px-4 py-3 placeholder-gray-400 font-medium"
              placeholder="Search posts, hashtags, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Create Post Section */}
        {user && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="glass-card mb-8 p-6 rounded-3xl shadow-xl border-t-4 border-t-primary-500 overflow-hidden relative"
          >
            <form onSubmit={handleCreatePost} className="relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg shadow-primary-500/30">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" alt="you" />
                  ) : (
                    user.email?.[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-surface-700/50 rounded-2xl p-4 border border-gray-200 dark:border-surface-600 focus:border-primary-500 resize-none h-24 transition-all text-gray-800 dark:text-gray-200 font-medium"
                    placeholder="Tell your story... (image upload below!)"
                  ></textarea>
                  
                  {selectedFile && (
                    <div className="mt-2 relative inline-block">
                      <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 object-cover rounded-xl border-2 border-primary-500" alt="preview" />
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                      >✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-surface-700">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-primary-500 font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 px-4 py-2 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add Image
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                <button 
                  type="submit" 
                  disabled={(!newPost.trim() && !selectedFile) || uploading}
                  className="px-8 py-2.5 rounded-full gradient-bg text-white font-bold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all hover:scale-105"
                >
                  {uploading ? 'Uploading...' : 'Publish'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setFilterMode('global')} className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'global' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl' : 'glass-card text-gray-600 hover:bg-white/40'}`}>🌍 Global Feed</button>
          <button onClick={() => { if(!user) return alert("Please login"); setFilterMode('friends') }} className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'friends' ? 'bg-primary-600 text-white shadow-xl' : 'glass-card text-gray-600 hover:bg-white/40'}`}>🤝 Friends</button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-8 pb-20">
          {loading ? (
            <div className="text-center py-12"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto"></div></div>
          ) : filteredPosts.map((post, i) => (
            <motion.div key={post.id || i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-surface-700/50">
                <Link to={`/student/${post.users?.username}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-bg overflow-hidden border-2 border-white/50">
                    {post.users?.profile_photo ? <img src={post.users.profile_photo} className="w-full h-full object-cover" /> : post.users?.name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm dark:text-white leading-none">{post.users?.name}</h4>
                    <span className="text-[10px] text-primary-500 font-bold">@{post.users?.username}</span>
                  </div>
                </Link>
                <span className="text-[10px] text-gray-400 font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              {post.image_url && (
                <div className="w-full bg-black/5 dark:bg-surface-800">
                  <img src={post.image_url} className="w-full h-auto max-h-[500px] object-contain" alt="post" />
                </div>
              )}

              <div className="p-6">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {renderContent(post.content)}
                </div>

                <div className="mt-6 flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-surface-700">
                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 group transition-all">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-rose-500 fill-current group-hover:scale-125 transition-all" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <span className="text-sm font-bold dark:text-gray-400">{post.likes_count || 0}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 group">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="text-sm font-bold dark:text-gray-400">Comments</span>
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {showComments[post.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide py-2">
                        {activeComments[post.id]?.map((comment, ci) => (
                          <div key={ci} className="flex gap-3 text-sm">
                            <div className="w-7 h-7 rounded-full gradient-bg shrink-0 overflow-hidden font-bold text-[10px] flex items-center justify-center text-white">
                              {comment.users?.profile_photo ? <img src={comment.users.profile_photo} className="w-full h-full object-cover" /> : comment.users?.name?.[0]}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-surface-700/50 p-3 rounded-2xl rounded-tl-none">
                              <p className="font-bold text-xs dark:text-white mb-1">{comment.users?.name}</p>
                              <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {user && (
                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="mt-4 flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 bg-gray-50 dark:bg-surface-700/50 border-none rounded-full px-4 text-sm focus:ring-1 focus:ring-primary-500 dark:text-white"
                            placeholder="Add a comment..." 
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          />
                          <button type="submit" className="text-primary-500 font-bold text-sm px-2">Post</button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
