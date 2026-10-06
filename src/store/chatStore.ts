import { create } from 'zustand'
import { SAMPLE_CHATS, DEMO_MESSAGES } from '@/utils/constants'
import { generateChatId } from '@/utils/formatters'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  references?: string[]
  rating?: 'like' | 'dislike' | null
}

interface Chat {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  unread: boolean
  status: 'active' | 'archived' | 'draft'
  messages: Message[]
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  isTyping: boolean
  isLoading: boolean
  
  // Actions
  setActiveChat: (chatId: string) => void
  createNewChat: (title?: string) => Chat
  sendMessage: (content: string) => Promise<void>
  deleteChat: (chatId: string) => void
  archiveChat: (chatId: string) => void
  rateMessage: (messageId: string, rating: 'like' | 'dislike') => void
  clearChat: (chatId: string) => void
  searchChats: (query: string) => Chat[]
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: SAMPLE_CHATS.map(chat => ({
    ...chat,
    messages: chat.id === 'chat_1' ? DEMO_MESSAGES : [],
  })) as Chat[],
  
  activeChatId: 'chat_1',
  isTyping: false,
  isLoading: false,

  setActiveChat: (chatId: string) => {
    set({ activeChatId: chatId })
  },

  createNewChat: (title?: string) => {
    const newChat: Chat = {
      id: generateChatId(),
      title: title || 'Cuộc trò chuyện mới',
      lastMessage: '',
      timestamp: new Date().toISOString(),
      unread: false,
      status: 'active',
      messages: [],
    }
    
    set(state => ({
      chats: [newChat, ...state.chats],
      activeChatId: newChat.id,
    }))
    
    return newChat
  },

  sendMessage: async (content: string) => {
    const { activeChatId, chats } = get()
    if (!activeChatId || !content.trim()) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending' as const,
    }

    // Update chat with user message
    set(state => ({
      chats: state.chats.map(chat => 
        chat.id === activeChatId
          ? {
              ...chat,
              lastMessage: content,
              timestamp: userMessage.timestamp,
              messages: [...chat.messages, userMessage],
            }
          : chat
      ),
      isTyping: true,
    }))

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiResponse: Message = {
      id: `msg_${Date.now()}_ai`,
      role: 'assistant',
      content: `Đây là phản hồi từ AI về câu hỏi "${content}". Tôi đã phân tích và tìm thấy các tài liệu liên quan. 
      
**Thông tin pháp lý liên quan:**
- Điều 15 Bộ luật Lao động
- Nghị định 145/2020/NĐ-CP
- Thông tư 10/2020/TT-BLĐTBXH

**Gợi ý tiếp theo:** Bạn có muốn tôi tìm hiểu thêm về vấn đề cụ thể nào không?`,
      timestamp: new Date().toISOString(),
      references: ['Điều 15 Bộ luật Lao động', 'Nghị định 145/2020/NĐ-CP'],
    }

    // Update chat with AI response
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages.map(msg => 
                msg.id === userMessage.id 
                  ? { ...msg, status: 'sent' as const }
                  : msg
              ), aiResponse],
            }
          : chat
      ),
      isTyping: false,
    }))
  },

  deleteChat: (chatId: string) => {
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
      activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
    }))
  },

  archiveChat: (chatId: string) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? { ...chat, status: 'archived' }
          : chat
      ),
    }))
  },

  rateMessage: (messageId: string, rating: 'like' | 'dislike') => {
    const { activeChatId } = get()
    if (!activeChatId) return

    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, rating }
                  : msg
              ),
            }
          : chat
      ),
    }))
  },

  clearChat: (chatId: string) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [], lastMessage: '' }
          : chat
      ),
    }))
  },

  searchChats: (query: string) => {
    const { chats } = get()
    const lowercaseQuery = query.toLowerCase()
    
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(lowercaseQuery) ||
      chat.lastMessage.toLowerCase().includes(lowercaseQuery)
    )
  },
}))