'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  LogOut, 
  User,
  Settings,
  HelpCircle,
  FileText,
  Download,
  Menu,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { useChatStore } from '@/store/chatStore'
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import TypingIndicator from '@/components/chat/TypingIndicator'
import Button from '@/components/ui/Button'

export default function ChatPage() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, logout, isAuthenticated } = useAuthStore()
  const { 
    chats, 
    activeChatId, 
    isTyping, 
    setActiveChat, 
    createNewChat, 
    sendMessage, 
    deleteChat,
    archiveChat,
    rateMessage 
  } = useChatStore()
  
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = activeChatId ? chats.find(chat => chat.id === activeChatId) : null

  useEffect(() => {
    if (!authHydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [authHydrated, isAuthenticated, router])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, isTyping])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  const handleNewChat = () => {
    createNewChat()
  }

  const handleExportChat = () => {
    if (!activeChat) return
    
    const chatContent = activeChat.messages
      .map(msg => `${msg.role === 'user' ? 'Bạn' : 'AI'}: ${msg.content}`)
      .join('\n\n')
    
    const blob = new Blob([chatContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${activeChat.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!authHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4" />
          <p>Đang xác thực...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <ChatHistorySidebar
        chats={chats}
        activeChatId={activeChatId}
        onChatSelect={setActiveChat}
        onNewChat={handleNewChat}
        onDeleteChat={deleteChat}
        onArchiveChat={archiveChat}
        className="hidden lg:flex"
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-effect border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-dark-surface"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 
                  flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                
                <div>
                  <h1 className="font-bold text-lg">Legal AI Chatbot</h1>
                  <p className="text-sm text-gray-400">
                    {activeChat?.title || 'Chọn một cuộc trò chuyện'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.department}</p>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-accent-500 to-neon-cyan">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportChat}
                  disabled={!activeChat}
                  className="p-2 rounded-lg hover:bg-dark-surface disabled:opacity-50"
                  title="Xuất chat"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                <button
                  className="p-2 rounded-lg hover:bg-dark-surface"
                  title="Cài đặt"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  className="p-2 rounded-lg hover:bg-dark-surface"
                  title="Trợ giúp"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  icon={<LogOut className="w-4 h-4" />}
                >
                  <span className="hidden md:inline">Đăng xuất</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!activeChat ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-32 h-32 mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl" />
                <div className="relative w-full h-full rounded-full glass-effect flex items-center justify-center">
                  <FileText className="w-16 h-16 text-primary-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-3">Chào mừng trở lại, {user.name}!</h2>
              <p className="text-gray-300 text-center max-w-md mb-8">
                Hãy chọn một cuộc trò chuyện từ thanh bên hoặc tạo mới để bắt đầu 
                tra cứu thông tin pháp lý với AI.
              </p>
              
              <Button
                onClick={handleNewChat}
                variant="primary"
                size="lg"
                icon={<FileText className="w-5 h-5" />}
              >
                Bắt đầu cuộc trò chuyện mới
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Chat header */}
              <div className="glass-effect p-4 rounded-2xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl mb-1">{activeChat.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{activeChat.messages.length} tin nhắn</span>
                      <span>•</span>
                      <span>Cuộc trò chuyện {activeChat.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleExportChat}
                      variant="secondary"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                    >
                      Xuất PDF
                    </Button>
                    
                    <button
                      onClick={() => archiveChat(activeChat.id)}
                      className="p-2 rounded-lg glass-effect-light hover:bg-dark-surface"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-8 pb-20">
                {activeChat.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    {...message}
                    onRate={(rating) => rateMessage(message.id, rating)}
                    onCopy={() => console.log('Copied:', message.id)}
                  />
                ))}
                
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        {activeChat && (
          <div className="border-t border-dark-border p-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
                isLoading={isTyping}
                placeholder="Nhập câu hỏi về pháp lý, hợp đồng, quy định nội bộ..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 glass-effect border-r border-dark-border"
          >
            <div className="p-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="ml-auto block p-2 rounded-lg hover:bg-dark-surface"
              >
                <X className="w-5 h-5" />
              </button>
              
              <ChatHistorySidebar
                chats={chats}
                activeChatId={activeChatId}
                onChatSelect={(id) => {
                  setActiveChat(id)
                  setShowMobileMenu(false)
                }}
                onNewChat={() => {
                  handleNewChat()
                  setShowMobileMenu(false)
                }}
                onDeleteChat={deleteChat}
                onArchiveChat={archiveChat}
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
