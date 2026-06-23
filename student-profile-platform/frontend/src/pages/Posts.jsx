import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import PostItem from '../components/PostItem'

export default function Posts() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const requireAuth = () => {
    if (!user) {
      alert('Please create an account or sign in to use this feature.');
      navigate('/register');
      return false;
    }
    return true;
  }

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  const [filterMode, setFilterMode] = useState('global') // global or friends
  const [friendsList, setFriendsList] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(null)

  useEffect(() => {
    loadPostsAndFriends()
  }, [user])

  const loadPostsAndFriends = async () => {
    setLoading(true)
    try {
      const allPosts = await api.getAllPosts()
      setPosts(allPosts)

      if (user) {
        const friends = await api.getFriends(user.id)
        setFriendsList(friends.map(f => f.id))
      }
    } catch (err) {
      console.error('Error loading posts:', err)
    }
    setLoading(false)
  }

  const handleFileSelect = (e) => {
    if (!requireAuth()) return
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
    if (!requireAuth()) return
    if (!newPost.trim() && !selectedFile) return

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

  const handleDeletePost = async (postId) => {
    if (!requireAuth()) return
    if (!window.confirm('Delete this post?')) return
    try {
      await api.deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filteredPosts = filterMode === 'global' ? posts : posts.filter(p => friendsList.includes(p.user_id) || p.user_id === user?.id)

  return (
    <div className="min-h-screen pt-24 pb-12 transition-colors relative overflow-hidden">
      <div className="absolute top-40 left-10 w-72 h-72 bg-[var(--emerald)]/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-60 right-10 w-80 h-80 bg-[var(--cyan)]/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        
        {/* Search Bar */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <div className="relative glass-card rounded-3xl p-2 shadow-[0_0_30px_rgba(0,255,198,0.05)] flex items-center bg-[var(--surface-2)]/60 backdrop-blur-2xl border border-white/5">
            <svg className="w-6 h-6 text-[var(--muted)] ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-[var(--text)] px-4 py-3 placeholder-[var(--muted)] font-medium outline-none"
              placeholder="Search posts, hashtags, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Create Post Section */}
        {true && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="glass-card mb-8 p-6 rounded-3xl shadow-xl border-t-4 border-t-[var(--emerald)] overflow-hidden relative"
          >
            <form onSubmit={handleCreatePost} className="relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center text-[var(--background)] text-lg font-bold shrink-0 shadow-[0_0_15px_rgba(0,255,198,0.3)]">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" alt="you" />
                  ) : (
                    user?.email?.[0].toUpperCase() || 'A'
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="w-full bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)] focus:border-[var(--emerald)] resize-none h-24 transition-all text-[var(--text)] font-medium"
                    placeholder="Tell your story... (image upload below!)"
                  ></textarea>
                  
                  {selectedFile && (
                    <div className="mt-2 relative inline-block">
                      <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 object-cover rounded-xl border-2 border-[var(--emerald)]" alt="preview" />
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                      >✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
                <button 
                  type="button"
                  onClick={(e) => { if (requireAuth(e)) fileInputRef.current?.click() }}
                  className="flex items-center gap-2 text-[var(--emerald)] font-bold hover:bg-[var(--glass)] px-4 py-2 rounded-xl transition-all"
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
                  className="px-8 py-2.5 rounded-full bg-[var(--emerald)] text-[var(--background)] font-bold shadow-[0_0_15px_rgba(0,255,198,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,198,0.5)] transition-all hover:scale-105"
                >
                  {uploading ? 'Uploading...' : 'Publish'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setFilterMode('global')} className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'global' ? 'bg-[var(--text)] text-[var(--background)] shadow-xl' : 'glass-card text-[var(--muted)] hover:bg-[var(--glass)]'}`}>🌍 Global Feed</button>
          <button onClick={() => { if(requireAuth()) setFilterMode('friends') }} className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'friends' ? 'bg-[var(--emerald)] text-[var(--background)] shadow-xl' : 'glass-card text-[var(--muted)] hover:bg-[var(--glass)]'}`}>🤝 Friends</button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-8 pb-20">
          {loading ? (
            <div className="text-center py-12"><div className="w-12 h-12 border-4 border-[var(--emerald)] border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(0,255,198,0.5)]"></div></div>
          ) : filteredPosts.map((post, i) => (
            <PostItem key={post.id || i} initialPost={post} onDelete={handleDeletePost} />
          ))}
        </div>
      </div>
    </div>
  )
}
