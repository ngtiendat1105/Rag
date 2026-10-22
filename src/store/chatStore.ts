import { create } from 'zustand'
import { SAMPLE_CHATS, DEMO_MESSAGES } from '@/utils/constants'
import { generateChatId } from '@/utils/formatters'
import { ContentModerationError, moderateChatContent } from '@/utils/contentModeration'
import { ragChatService } from '@/services/ragChatService'

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

    try {
      set({ processingStage: 'Đang truy xuất và tổng hợp từ kho tài liệu...' })
      const ragResponse = await ragChatService.sendQueryToRAG(content)
      const aiResponse: Message = {
        id: ragResponse.id,
        role: 'assistant',
        content: ragResponse.hasWarning
          ? `> **Cần đối chiếu:** Một hoặc nhiều nguồn chưa được xác minh đầy đủ.\n\n${ragResponse.message}`
          : ragResponse.message,
        timestamp: ragResponse.timestamp,
        references: ragResponse.references,
        confidence: ragResponse.confidence,
      }
      set(state => ({
        chats: state.chats.map(chat => chat.id === activeChatId ? {
          ...chat,
          messages: [...chat.messages.map(msg => msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg), aiResponse],
        } : chat),
        isTyping: false,
        processingStage: '',
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xử lý câu hỏi.'
      const errorResponse: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'error',
      }
      set(state => ({
        chats: state.chats.map(chat => chat.id === activeChatId ? {
          ...chat,
          messages: [...chat.messages.map(msg => msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg), errorResponse],
        } : chat),
        isTyping: false,
        processingStage: '',
      }))
    }
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
