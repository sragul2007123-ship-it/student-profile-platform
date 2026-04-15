import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'

export default function Messages() {
  const { user } = useAuth()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [convSearch, setConvSearch] = useState('')
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  // Use memoized search param to avoid unnecessary triggers
  const userIdFromUrl = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get('user')
  }, [location.search])

  useEffect(() => {
    if (user) {
      loadConversations()
      
      // Update presence every 2 minutes
      const interval = setInterval(() => {
        api.updatePresence(user.id).catch(err => console.error('Heartbeat failed', err))
      }, 120000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (selectedFriend && user) {
      loadMessages()
      
      // Realtime subscription for instant messaging
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          // If the message is from our currently selected friend, add it instantly
          if (payload.new.sender_id === selectedFriend.id) {
            setMessages(prev => {
              // Avoid duplicates if optimistic update already added it
              if (prev.find(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
            setTimeout(() => scrollToBottom(), 100)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedFriend, user])

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior })
  }

  // Pre-process messages to avoid repetitive parsing in render
  const memoizedMessages = useMemo(() => messages, [messages])

  const loadConversations = async () => {
    setLoadingConv(true)
    try {
      const convs = await api.getConversations(user.id)
      setConversations(convs)
      
      if (userIdFromUrl) {
        const friend = convs.find(f => f.id === userIdFromUrl)
        if (friend) setSelectedFriend(friend)
        else if (convs.length > 0) setSelectedFriend(convs[0])
      } else if (convs.length > 0 && !selectedFriend) {
        setSelectedFriend(convs[0])
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoadingConv(false)
    }
  }

  const loadMessages = async () => {
    setLoadingMsgs(true)
    try {
      const msgs = await api.getMessages(user.id, selectedFriend.id)
      setMessages(msgs)
      // Instant scroll on first load
      setTimeout(() => scrollToBottom('auto'), 100)
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoadingMsgs(false)
    }
  }

  const uploadMedia = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `messages/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('Profiles')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('Profiles')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedFriend) return

    setUploading(true)
    try {
      const mediaUrl = await uploadMedia(file)
      let mediaType = 'file'
      if (file.type.startsWith('image/')) mediaType = 'image'
      else if (file.type.startsWith('video/')) mediaType = 'video'

      const msgData = {
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: '',
        media_url: mediaUrl,
        media_type: mediaType
      }
      const sent = await api.sendMessage(msgData)
      setMessages(prev => [...prev, sent])
    } catch (err) {
      console.error('Upload failed', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend || !user) return

    const msgData = {
      sender_id: user.id,
      receiver_id: selectedFriend.id,
      content: newMessage.trim()
    }

    // Optimistic update for "smart" performance feeling
    const tempId = Date.now()
    const tempMsg = { ...msgData, id: tempId, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setNewMessage('')
    scrollToBottom()

    try {
      const sent = await api.sendMessage(msgData)
      // Replace temp with real
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m))
    } catch (err) {
      console.error('Error sending message:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const isUserActive = (lastSeen) => {
    if (!lastSeen) return false
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    return (now - lastSeenDate) < 5 * 60 * 1000 // Active if seen in last 5 mins
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-16 pb-0 gradient-bg-subtle h-[calc(100vh-4rem)] overflow-hidden">
      <div className="max-w-7xl mx-auto h-full px-0 sm:px-4">
        <div className="glass-card sm:rounded-3xl shadow-2xl overflow-hidden flex h-[90vh] border border-white/20 dark:border-surface-700/50">
          
          {/* sidebar - Conversations */}
          <div className="w-80 border-r border-gray-100 dark:border-surface-700/50 flex flex-col bg-white/40 dark:bg-surface-800/40 backdrop-blur-xl">
            <div className="p-6 border-b border-gray-100 dark:border-surface-700/50">
              <h2 className="text-xl font-bold dark:text-white mb-4">Messages</h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search friends..." 
                  className="w-full bg-gray-50 dark:bg-surface-700/50 text-xs py-2 px-8 rounded-xl border-none focus:ring-1 focus:ring-primary-500 outline-none dark:text-white"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                />
                <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConv ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : conversations.filter(c => c.name.toLowerCase().includes(convSearch.toLowerCase())).length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-gray-500">No friends found matching "{convSearch}"</p>
                </div>
              ) : (
                conversations
                  .filter(c => c.name.toLowerCase().includes(convSearch.toLowerCase()))
                  .map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      selectedFriend?.id === friend.id 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'hover:bg-white/60 dark:hover:bg-surface-700/50 dark:text-gray-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                        {friend.profile_photo ? (
                          <img src={friend.profile_photo} className="w-full h-full object-cover" alt={friend.name} />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center font-bold text-gray-500">
                            {friend.name?.[0]}
                          </div>
                        )}
                      </div>
                      {isUserActive(friend.last_seen) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold truncate text-sm">{friend.name}</p>
                      <p className={`text-xs truncate ${selectedFriend?.id === friend.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {isUserActive(friend.last_seen) ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative bg-white/20 dark:bg-surface-900/40">
            {selectedFriend ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-surface-700/50 flex items-center gap-3 backdrop-blur-md sticky top-0 z-10">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-500/20">
                      {selectedFriend.profile_photo ? (
                        <img src={selectedFriend.profile_photo} className="w-full h-full object-cover" alt={selectedFriend.name} />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-primary-500 font-bold">
                          {selectedFriend.name?.[0]}
                        </div>
                      )}
                    </div>
                    {isUserActive(selectedFriend.last_seen) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white dark:border-surface-800 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white leading-none text-base">{selectedFriend.name}</h3>
                    <p className={`text-[10px] font-medium ${isUserActive(selectedFriend.last_seen) ? 'text-green-500' : 'text-gray-400'}`}>
                      {isUserActive(selectedFriend.last_seen) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                  ) : memoizedMessages.map((msg, i) => (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                        msg.sender_id === user.id 
                          ? 'bg-primary-500 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-surface-700 dark:text-gray-200 rounded-tl-none'
                      }`}>
                        {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        
                        {msg.media_url && (
                          <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
                            {msg.media_type === 'image' ? (
                              <img src={msg.media_url} className="w-full h-auto cursor-pointer" alt="Media" onClick={() => window.open(msg.media_url)} />
                            ) : msg.media_type === 'video' ? (
                              <video src={msg.media_url} controls className="w-full h-auto" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-black/10 rounded-lg text-xs font-medium truncate">
                                📎 {msg.media_url.split('/').pop().substring(0, 20)}...
                              </a>
                            )}
                          </div>
                        )}
                        
                        <p className={`text-[9px] mt-1.5 opacity-60 ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {uploading && (
                    <div className="flex justify-end">
                      <div className="bg-primary-500/50 p-2 rounded-xl text-white text-xs flex items-center gap-2">
                         <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                         Uploading media...
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/40 dark:bg-surface-800/40 backdrop-blur-md">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-surface-700 flex items-center justify-center transition-colors text-gray-500 dark:text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-gray-50 dark:bg-surface-800 rounded-full px-5 py-2.5 border border-gray-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm"
                      placeholder="Message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || uploading}
                      className="w-10 h-10 shrink-0 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-110 active:scale-90 transition-all outline-none disabled:opacity-50"
                    >
                      <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-white text-4xl mb-6">
                  ✉️
                </div>
                <h3 className="text-2xl font-bold dark:text-white">Your Messages</h3>
                <p className="dark:text-gray-400 mt-2">Send photos and messages to a friend.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
