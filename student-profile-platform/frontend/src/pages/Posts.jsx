import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Posts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('global') // 'global' or 'friends'
  const [friendsIds, setFriendsIds] = useState([])

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
        // friendsList items have profile_photo, username, id (which is addressee/requester id)
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
      // Include user's own posts + friends' posts
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

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() || !user) return

    try {
      const created = await api.createPost({
        user_id: user.id,
        content: newPost,
        image_url: '' // Future enhancement: add image upload
      })
      // Prepend temporary post until full refetch
      const fullPost = {
        ...created,
        users: { name: user.user_metadata?.full_name || 'You', username: user.email.split('@')[0], profile_photo: user.user_metadata?.avatar_url || '' }
      }
      setPosts([fullPost, ...posts])
      setNewPost('')
    } catch (err) {
      console.error('Error creating post:', err)
    }
  }

  // Helpers for extracting hashtags
  const renderContent = (content) => {
    const tokens = content.split(/(\s+)/)
    return tokens.map((token, i) => {
      if (token.startsWith('#')) {
        return <span key={i} className="text-primary-500 font-bold">{token}</span>
      }
      if (token.startsWith('http://') || token.startsWith('https://')) {
        return <a key={i} href={token} target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:underline">{token}</a>
      }
      return token
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-12 gradient-bg-subtle relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-60 right-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        
        {/* Search Bar - Floating at Top */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mb-8"
        >
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card mb-8 p-6 rounded-3xl shadow-xl border-t-4 border-t-primary-500 overflow-hidden relative"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary-400/30 to-accent-400/30 rounded-full blur-2xl"></div>
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
                    placeholder="Share an update, project, or thought... (use #hashtags and http:// links)"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  type="submit" 
                  disabled={!newPost.trim()}
                  className="px-6 py-2.5 rounded-full gradient-bg text-white font-bold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-4 mb-8"
        >
          <button 
            onClick={() => setFilterMode('global')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'global' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl' : 'glass-card text-gray-600 dark:text-gray-400 hover:bg-white/40'}`}
          >
            🌍 Global Feed
          </button>
          <button 
            onClick={() => {
              if(!user) {
                alert("Please login to see friends' posts")
                return
              }
              setFilterMode('friends')
            }}
            className={`px-8 py-3 rounded-full font-bold transition-all ${filterMode === 'friends' ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/40' : 'glass-card text-gray-600 dark:text-gray-400 hover:bg-white/40'}`}
          >
            🤝 Friends Only
          </button>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center rounded-3xl">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold dark:text-white">No posts found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search query.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredPosts.map((post, i) => (
                <motion.div
                  key={post.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6 rounded-3xl shadow-lg border border-white/20 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex gap-4">
                    <Link to={post.users?.username ? `/student/${post.users.username}` : '#'} className="shrink-0 group-hover:scale-105 transition-transform">
                      <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {post.users?.profile_photo ? (
                          <img src={post.users.profile_photo} className="w-full h-full rounded-full object-cover" alt={post.users.name} />
                        ) : (
                          post.users?.name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <Link to={post.users?.username ? `/student/${post.users.username}` : '#'}>
                          <h4 className="font-bold text-gray-900 dark:text-white hover:text-primary-500 transition-colors">
                            {post.users?.name || 'Unknown User'}
                          </h4>
                          <p className="text-xs text-primary-500 font-medium">@{post.users?.username || 'unknown'}</p>
                        </Link>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-surface-700 px-3 py-1 rounded-full font-medium">
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <div className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                        {renderContent(post.content)}
                      </div>
                      
                      {/* Interaction Buttons (Visual Only For Now) */}
                      <div className="mt-6 flex gap-6 text-gray-400 border-t border-gray-100 dark:border-surface-700 pt-4">
                        <button className="flex items-center gap-2 hover:text-rose-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          <span className="text-sm font-medium">{post.likes_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          <span className="text-sm font-medium">Comment</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-accent-500 transition-colors ml-auto">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
