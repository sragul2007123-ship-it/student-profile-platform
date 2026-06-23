import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function PostItem({ initialPost, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [post, setPost] = useState(initialPost)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(initialPost.content)
  
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  const requireAuth = (e) => {
    if (!user) {
      if (e && e.preventDefault) e.preventDefault();
      alert('Please create an account or sign in to use this feature.');
      navigate('/register');
      return false;
    }
    return true;
  }

  const handleLike = async () => {
    if (!requireAuth()) return;
    try {
      const result = await api.likePost(post.id, user.id)
      setPost(prev => ({ ...prev, likes_count: result.count }))
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const toggleComments = async () => {
    if (!showComments) {
      try {
        const fetchedComments = await api.getComments(post.id)
        setComments(fetchedComments)
      } catch (err) {
        console.error('Failed to load comments:', err)
      }
    }
    setShowComments(!showComments)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return;
    if (!newComment.trim()) return

    try {
      const created = await api.addComment(post.id, {
        user_id: user.id,
        content: newComment.trim()
      })
      
      const fullComment = {
        ...created,
        users: { 
          name: user.user_metadata?.full_name || 'You', 
          username: user.email.split('@')[0], 
          profile_photo: user.user_metadata?.avatar_url || '' 
        }
      }
      setComments(prev => [...prev, fullComment])
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return
    try {
      await api.updatePost(post.id, { user_id: user.id, content: editContent })
      setPost(prev => ({ ...prev, content: editContent }))
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating post:', err)
      alert('Failed to update post')
    }
  }

  const renderContent = (content) => {
    if (!content) return null
    const tokens = content.split(/(\s+)/)
    return tokens.map((token, i) => {
      if (token.startsWith('#')) return <span key={i} className="text-primary-500 font-bold">{token}</span>
      if (token.startsWith('http://') || token.startsWith('https://')) {
        return <a key={i} href={token} target="_blank" rel="noopener noreferrer" className="text-[var(--cyan)] hover:underline">{token}</a>
      }
      return token
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl shadow-xl border border-white/20 overflow-hidden w-full text-left relative z-10">
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <Link to={`/student/${post.users?.username}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] overflow-hidden border-2 border-[var(--border)]">
            {post.users?.profile_photo ? <img src={post.users.profile_photo} className="w-full h-full object-cover" /> : post.users?.name?.[0]}
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--text)] leading-none">{post.users?.name}</h4>
            <span className="text-[10px] text-[var(--emerald)] font-bold">@{post.users?.username}</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--muted)] font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
          {user && user.id === post.user_id && (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-[var(--surface-2)] rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[var(--border)] z-50 overflow-hidden">
                  <button onClick={() => { setIsEditing(true); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--glass)] transition-colors">Edit</button>
                  <button onClick={() => { setDropdownOpen(false); if (onDelete) onDelete(post.id); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {post.image_url && (
        <div className="w-full bg-black/20">
          <img src={post.image_url} className="w-full h-auto max-h-[500px] object-contain" alt="post" />
        </div>
      )}

      <div className="p-6">
        {isEditing ? (
          <div className="mb-4">
            <textarea 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)} 
              className="w-full bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--emerald)] focus:outline-none resize-none h-24 text-sm text-[var(--text)]"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleUpdatePost} className="px-3 py-1 text-xs font-bold bg-[var(--emerald)] text-[var(--background)] rounded-lg">Save</button>
            </div>
          </div>
        ) : (
          <div className="text-[var(--text)] whitespace-pre-wrap leading-relaxed">
            {renderContent(post.content)}
          </div>
        )}

        <div className="mt-6 flex items-center gap-6 pt-4 border-t border-white/10">
          <button onClick={handleLike} className="flex items-center gap-2 group transition-all">
            <svg className="w-6 h-6 text-gray-400 group-hover:text-rose-500 fill-current group-hover:scale-125 transition-all" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span className="text-sm font-bold text-gray-400">{post.likes_count || 0}</span>
          </button>
          <button onClick={toggleComments} className="flex items-center gap-2 group">
            <svg className="w-6 h-6 text-gray-400 group-hover:text-[var(--cyan)] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-sm font-bold text-gray-400">Comments</span>
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 py-2">
                {comments.map((comment, ci) => (
                  <div key={ci} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] shrink-0 overflow-hidden font-bold text-[10px] flex items-center justify-center text-[var(--background)]">
                      {comment.users?.profile_photo ? <img src={comment.users.profile_photo} className="w-full h-full object-cover" /> : comment.users?.name?.[0]}
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none backdrop-blur-sm">
                      <p className="font-bold text-xs text-white mb-1">{comment.users?.name}</p>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {true && (
                <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--emerald)] text-white"
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="text-[var(--emerald)] font-bold text-sm px-4 rounded-full hover:bg-[var(--glass)] transition-all">Post</button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
