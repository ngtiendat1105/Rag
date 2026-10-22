import { create } from 'zustand'
import { SAMPLE_CHATS, DEMO_MESSAGES } from '@/utils/constants'
import { generateChatId } from '@/utils/formatters'
import { ContentModerationError, moderateChatContent } from '@/utils/contentModeration'

export interface ChatAttachment {
  id: string
  name: string
  size: number
  type: string
}

export interface ChatReference {
  title: string
  page?: number
  excerpt?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  references?: Array<string | ChatReference>
  confidence?: number
  attachments?: ChatAttachment[]
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
  processingStage: string
  
  // Actions
  setActiveChat: (chatId: string) => void
  createNewChat: (title?: string) => Chat
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>
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
  processingStage: '',

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

  sendMessage: async (content: string, attachments = []) => {
    const { activeChatId, chats } = get()
    if (!activeChatId || !content.trim()) return

    const moderation = moderateChatContent(content)
    if (!moderation.allowed) {
      throw new ContentModerationError(moderation.message || 'Nội dung không phù hợp.')
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending' as const,
      attachments,
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
      processingStage: attachments.length ? 'Đang đọc tài liệu đính kèm...' : 'Đang tìm tài liệu liên quan...',
    }))

    await new Promise(resolve => setTimeout(resolve, 500))
    set({ processingStage: 'Đang đánh giá độ phù hợp của nguồn...' })
    await new Promise(resolve => setTimeout(resolve, 500))
    set({ processingStage: 'Đang tổng hợp câu trả lời...' })
    await new Promise(resolve => setTimeout(resolve, 500))

    const aiResponse: Message = {
      id: `msg_${Date.now()}_ai`,
      role: 'assistant',
      content: attachments.length > 0
        ? `Tôi đã nhận ${attachments.length} tệp đính kèm (${attachments.map(file => file.name).join(', ')}).

**Lưu ý:** Bản demo hiện lưu thông tin tệp trong cuộc trò chuyện nhưng chưa trích xuất nội dung tệp. Cần kết nối dịch vụ upload và xử lý tài liệu để tôi có thể tóm tắt hoặc kiểm tra điều khoản bên trong.`
        : `Đây là phản hồi từ AI về câu hỏi "${content}". Tôi đã phân tích và tìm thấy các tài liệu liên quan.
      
**Thông tin pháp lý liên quan:**
- Điều 15 Bộ luật Lao động
- Nghị định 145/2020/NĐ-CP
- Thông tư 10/2020/TT-BLĐTBXH

**Gợi ý tiếp theo:** Bạn có muốn tôi tìm hiểu thêm về vấn đề cụ thể nào không?`,
      timestamp: new Date().toISOString(),
      references: attachments.length ? [] : [
        { title: 'Bộ luật Lao động 2019', page: 12, excerpt: 'Điều 15 quy định về hợp đồng lao động và hình thức giao kết.' },
        { title: 'Nghị định 145/2020/NĐ-CP', page: 8, excerpt: 'Quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật Lao động.' },
      ],
      confidence: attachments.length ? 35 : 88,
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
      processingStage: '',
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
