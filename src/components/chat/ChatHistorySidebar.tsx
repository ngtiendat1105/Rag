'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Archive, 
  Trash2, 
  Filter,
  MoreVertical,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  FolderArchive
} from 'lucide-react'
import { formatChatDate, formatRelativeTime } from '@/utils/formatters'

interface Chat {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  unread: boolean
  status: 'active' | 'archived' | 'draft'
}

interface ChatHistorySidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat?: (chatId: string) => void
  onArchiveChat?: (chatId: string) => void
  className?: string
}

export default function ChatHistorySidebar({
  chats,
  activeChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onArchiveChat,
  className = '',
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all')
  const [showMobile, setShowMobile] = useState(false)

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || chat.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: Chat['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'archived': return <FolderArchive className="w-3 h-3 text-gray-400" />
      case 'draft': return <Clock className="w-3 h-3 text-yellow-400" />
      default: return null
    }
  }

  const getStatusColor = (status: Chat['status']) => {
    switch (status) {
      case 'active': return 'border-l-green-500'
      case 'archived': return 'border-l-gray-500'
      case 'draft': return 'border-l-yellow-500'
      default: return 'border-l-primary-500'
    }
  }

  const groupedChats = filteredChats.reduce((groups, chat) => {
    const dateGroup = formatChatDate(chat.timestamp)
    if (!groups[dateGroup]) {
      groups[dateGroup] = []
    }
    groups[dateGroup].push(chat)
    return groups
  }, {} as Record<string, Chat[]>)

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setShowMobile(!showMobile)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 glass-effect rounded-xl"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: showMobile ? 0 : -320,
          opacity: showMobile ? 1 : 0
        }}
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-80 glass-effect border-r border-dark-border
          flex flex-col ${className} lg:translate-x-0 transition-transform`}
      >
        {/* Header */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Lịch sử chat</h2>
                <p className="text-sm text-gray-400">{chats.length} cuộc trò chuyện</p>
              </div>
            </div>
            
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
              title="Tạo chat mới"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-effect-light rounded-xl text-white
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Bộ lọc</span>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'active', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${filterStatus === status 
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                    : 'glass-effect-light text-gray-400 hover:text-white'
                  }`}
              >
                {status === 'all' && 'Tất cả'}
                {status === 'active' && 'Đang hoạt động'}
                {status === 'archived' && 'Đã lưu trữ'}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedChats).length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">Không tìm thấy cuộc trò chuyện</p>
              <button
                onClick={onNewChat}
                className="mt-4 px-4 py-2 glass-effect rounded-lg hover:scale-105 transition-all"
              >
                Tạo chat mới
              </button>
            </div>
          ) : (
            Object.entries(groupedChats).map(([dateGroup, groupChats]) => (
              <div key={dateGroup} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-1 h-4 bg-primary-500 rounded-full" />
                  <span className="text-sm font-medium text-gray-300">{dateGroup}</span>
                  <span className="text-xs text-gray-500 ml-auto">{groupChats.length}</span>
                </div>
                
                <div className="space-y-2">
                  {groupChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        onChatSelect(chat.id)
                        setShowMobile(false)
                      }}
                      className={`relative p-3 rounded-xl cursor-pointer transition-all
                        ${activeChatId === chat.id 
                          ? 'bg-primary-500/10 border border-primary-500/30' 
                          : 'glass-effect-light hover:bg-dark-surface/50'
                        } ${getStatusColor(chat.status)} border-l-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-accent-500/20 to-neon-cyan/20 
                          flex items-center justify-center">
                          {getStatusIcon(chat.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium truncate">{chat.title}</h3>
                            {chat.unread && (
                              <div className="w-2 h-2 bg-accent-400 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400 truncate mb-2">
                            {chat.lastMessage || 'Chưa có tin nhắn'}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatRelativeTime(chat.timestamp)}</span>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {onArchiveChat && chat.status !== 'archived' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onArchiveChat(chat.id)
                              }}
                              className="p-1.5 rounded hover:bg-dark-surface"
                              title="Lưu trữ"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          )}
                          
                          {onDeleteChat && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chat.id)
                              }}
                              className="p-1.5 rounded hover:bg-dark-surface"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Đang hoạt động: {chats.filter(c => c.status === 'active').length}</span>
            <button
              onClick={() => console.log('Clear all')}
              className="hover:text-white transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile overlay */}
      {showMobile && (
        <div 
          className="lg:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setShowMobile(false)}
        />
      )}
    </>
  )
}