import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedFriend && user) {
      loadMessages()
    }
  }, [selectedFriend])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    setLoadingConv(true)
    try {
      const convs = await api.getConversations(user.id)
      setConversations(convs)
      if (convs.length > 0) {
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
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoadingMsgs(false)
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

    try {
      const sent = await api.sendMessage(msgData)
      setMessages([...messages, sent])
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  return (
    <div className="min-h-[calc(100-4rem)] pt-20 pb-8 gradient-bg-subtle h-screen overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 h-full">
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden flex h-[85vh] border border-white/20 dark:border-surface-700/50">
          
          {/* sidebar - Conversations */}
          <div className="w-1/3 border-r border-gray-100 dark:border-surface-700/50 flex flex-col bg-white/40 dark:bg-surface-800/40 backdrop-blur-xl">
            <div className="p-6 border-b border-gray-100 dark:border-surface-700/50 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Messages</h2>
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs">
                {conversations.length}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingConv ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No friends found to chat with.</p>
                </div>
              ) : (
                conversations.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                      selectedFriend?.id === friend.id 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'hover:bg-white/60 dark:hover:bg-surface-700/50 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/20">
                      {friend.profile_photo ? (
                        <img src={friend.profile_photo} className="w-full h-full object-cover" alt={friend.name} />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-surface-600 flex items-center justify-center font-bold text-gray-500">
                          {friend.name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold truncate">{friend.name}</p>
                      <p className={`text-xs truncate ${selectedFriend?.id === friend.id ? 'text-white/80' : 'text-gray-500'}`}>
                        @{friend.username}
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
                <div className="p-4 border-b border-gray-100 dark:border-surface-700/50 flex items-center gap-4 backdrop-blur-md sticky top-0 z-10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-500/20">
                    {selectedFriend.profile_photo ? (
                      <img src={selectedFriend.profile_photo} className="w-full h-full object-cover" alt={selectedFriend.name} />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-primary-500 font-bold">
                        {selectedFriend.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white leading-none">{selectedFriend.name}</h3>
                    <p className="text-xs text-primary-500 font-medium">Active Now</p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="dark:text-white font-medium">Start a new conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, scale: 0.9, x: msg.sender_id === user.id ? 20 : -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                          msg.sender_id === user.id 
                            ? 'bg-primary-500 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-surface-700 dark:text-gray-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                          <p className={`text-[10px] mt-1 opacity-60 ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-gray-100 dark:border-surface-700/50 backdrop-blur-md">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-gray-50 dark:bg-surface-800 rounded-2xl px-6 py-3 border border-gray-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="w-12 h-12 rounded-2xl gradient-bg text-white flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all outline-none disabled:opacity-50"
                    >
                      <svg className="w-6 h-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-white text-4xl mb-6 shadow-2xl">
                  ✉️
                </div>
                <h3 className="text-2xl font-bold dark:text-white">Your Messages</h3>
                <p className="dark:text-gray-400 mt-2">Connect with your friends instantly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
