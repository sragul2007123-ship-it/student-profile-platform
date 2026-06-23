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
      
      // Realtime subscription for instant messaging, deletions, and reactions
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.sender_id === selectedFriend.id || payload.new.sender_id === user.id) {
              setMessages(prev => {
                if (prev.find(m => m.id === payload.new.id)) return prev
                return [...prev, payload.new]
              })
              setTimeout(() => scrollToBottom(), 100)
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedFriend, user])

  const [activeMenu, setActiveMenu] = useState(null) // ID of message with open menu

  const handleReact = async (messageId, emoji) => {
    try {
      const res = await api.reactToMessage(messageId, emoji, user.id)
      if (res.status === 'success') {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: res.reactions } : m))
      }
    } catch (err) {
      console.error('Reaction failed:', err)
    } finally {
      setActiveMenu(null)
    }
  }

  const handleUnsend = async (messageId) => {
    if (!window.confirm('Unsend this message?')) return
    try {
      await api.deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (err) {
      console.error('Unsend failed:', err)
    } finally {
      setActiveMenu(null)
    }
  }

  const quickEmojis = ['❤️', '😂', '👍', '🔥', '😢', '🙌']

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior })
  }

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

    const tempId = Date.now()
    const tempMsg = { ...msgData, id: tempId, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setNewMessage('')
    scrollToBottom()

    try {
      const sent = await api.sendMessage(msgData)
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
    return (now - lastSeenDate) < 5 * 60 * 1000 
  }


  return (
    <div className="min-h-[calc(100vh-4rem)] pt-24 pb-0 relative overflow-hidden h-[calc(100vh-4rem)]">
      <div className="absolute top-40 left-10 w-72 h-72 bg-[var(--emerald)]/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--cyan)]/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>
      
      <div className="max-w-7xl mx-auto h-full px-0 sm:px-4 relative z-10">
        <div className="glass-card sm:rounded-3xl shadow-[0_0_50px_rgba(0,255,198,0.1)] overflow-hidden flex h-[85vh] border border-white/10 dark:border-[var(--border)] bg-[var(--surface-2)]/60 backdrop-blur-2xl">
          
          {/* sidebar - Conversations */}
          <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--surface)]/40 backdrop-blur-xl">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">Messages</h2>
              <div className="relative glass-card rounded-2xl p-1 bg-white/5 border border-white/10">
                  <input 
                    type="text" 
                    placeholder="Search friends..." 
                    className="w-full bg-transparent text-sm py-2 px-10 border-none focus:ring-0 outline-none text-[var(--text)] placeholder-[var(--muted)]"
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                  />
                  <svg className="w-4 h-4 absolute left-4 top-3 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <p className="text-sm text-[var(--muted)]">No friends found matching "{convSearch}"</p>
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
                        ? 'bg-[var(--emerald)]/20 border border-[var(--emerald)]/50 shadow-[0_0_15px_rgba(0,255,198,0.2)]' 
                        : 'hover:bg-white/5 border border-transparent text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface-2)]">
                        {friend.profile_photo ? (
                          <img src={friend.profile_photo} className="w-full h-full object-cover" alt={friend.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[var(--emerald)]">
                            {friend.name?.[0]}
                          </div>
                        )}
                      </div>
                      {isUserActive(friend.last_seen) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--surface-2)] rounded-full"></div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className={`font-bold truncate text-sm ${selectedFriend?.id === friend.id ? 'text-[var(--emerald)]' : 'text-[var(--text)]'}`}>{friend.name}</p>
                      <p className={`text-xs truncate ${selectedFriend?.id === friend.id ? 'text-[var(--cyan)]' : 'text-[var(--muted)]'}`}>
                        {isUserActive(friend.last_seen) ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative bg-[var(--surface-2)]/30 backdrop-blur-md">
            {selectedFriend ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 backdrop-blur-md sticky top-0 z-10 bg-[var(--surface)]/50">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--emerald)]">
                      {selectedFriend.profile_photo ? (
                        <img src={selectedFriend.profile_photo} className="w-full h-full object-cover" alt={selectedFriend.name} />
                      ) : (
                        <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--emerald)] font-bold">
                          {selectedFriend.name?.[0]}
                        </div>
                      )}
                    </div>
                    {isUserActive(selectedFriend.last_seen) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[var(--surface)] rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text)] leading-none text-base">{selectedFriend.name}</h3>
                    <p className={`text-[10px] font-medium ${isUserActive(selectedFriend.last_seen) ? 'text-[var(--emerald)]' : 'text-[var(--muted)]'}`}>
                      {isUserActive(selectedFriend.last_seen) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6" onClick={() => setActiveMenu(null)}>
                  {loadingMsgs ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                  ) : memoizedMessages.map((msg, i) => (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`group relative max-w-[75%] ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                        {/* Reaction/Menu Trigger */}
                        <div 
                          className={`absolute ${msg.sender_id === user.id ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded-full hover:bg-[var(--glass)]`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenu(activeMenu === msg.id ? null : msg.id)
                          }}
                        >
                          <svg className="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </div>

                        {/* Reaction Menu */}
                        <AnimatePresence>
                          {activeMenu === msg.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className={`absolute z-30 bottom-full mb-2 ${msg.sender_id === user.id ? 'right-0' : 'left-0'} bg-[var(--surface-2)] shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-2xl p-2 border border-[var(--border)] flex gap-1`}
                            >
                              {quickEmojis.map(emoji => (
                                <button 
                                  key={emoji} 
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform p-1 text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                              {msg.sender_id === user.id && (
                                <button 
                                  onClick={() => handleUnsend(msg.id)}
                                  className="ml-2 pl-2 border-l border-[var(--border)] text-xs font-bold text-red-400 hover:text-red-500 px-2"
                                >
                                  Unsend
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className={`p-4 rounded-3xl shadow-sm border border-white/5 backdrop-blur-sm ${
                          msg.sender_id === user.id 
                            ? 'bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] text-[#030303] rounded-tr-none' 
                            : 'bg-[var(--surface-2)] text-[var(--text)] rounded-tl-none border-[var(--border)]'
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
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <div 
                                  key={emoji} 
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] cursor-pointer transition-all ${
                                    users.includes(user.id) 
                                      ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)]' 
                                      : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="font-bold opacity-60 text-[8px]">{users.length}</span>
                                </div>
                            ))}
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
                <div className="p-4 bg-[var(--surface)]/50 backdrop-blur-xl border-t border-[var(--border)]">
                  <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 shrink-0 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-[var(--muted)] hover:text-[var(--cyan)]"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="flex-1 relative glass-card rounded-full bg-white/5 border border-white/10 p-1 flex items-center">
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none px-6 py-3 focus:ring-0 outline-none text-[var(--text)] text-sm placeholder-[var(--muted)]"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || uploading}
                        className="w-10 h-10 mr-1 shrink-0 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] text-[#030303] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,198,0.3)] hover:scale-110 active:scale-90 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 transform rotate-90 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--cyan)]/20 blur-3xl rounded-full"></div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center text-white text-5xl mb-6 shadow-[0_0_30px_rgba(0,255,198,0.3)] relative z-10">
                  <svg className="w-12 h-12 text-[#030303]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-[var(--text)] font-display relative z-10">Communicate</h3>
                <p className="text-[var(--muted)] mt-2 relative z-10">Select a friend to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

