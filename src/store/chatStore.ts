import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateChatId, truncateText } from '@/utils/formatters'
import { ContentModerationError, moderateChatContent } from '@/utils/contentModeration'
import { ragChatService } from '@/services/ragChatService'

let activeRequestController: AbortController | null = null

export interface ChatAttachment {
  id: string
  name: string
  size: number
  type: string
}

export interface ChatReference {
  title: string
  documentId?: string
  page?: number
  excerpt?: string
  previewUrl?: string
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
  feedbackReason?: string
  suggestions?: string[]
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
  sendMessage: (content: string, attachments?: ChatAttachment[], files?: File[]) => Promise<void>
  cancelMessage: () => void
  deleteChat: (chatId: string) => void
  retryMessage: (messageId: string) => Promise<void>
  archiveChat: (chatId: string) => void
  unarchiveChat: (chatId: string) => void
  rateMessage: (messageId: string, rating: 'like' | 'dislike', reason: string, content: string, detail?: string) => Promise<void>
  clearChat: (chatId: string) => void
  searchChats: (query: string) => Chat[]
}

const NEW_CHAT_TITLE = 'Cuộc trò chuyện mới'

export const useChatStore = create<ChatState>()(persist((set, get) => ({
  chats: [],
  activeChatId: null,
  isTyping: false,
  isLoading: false,
  processingStage: '',

  setActiveChat: (chatId: string) => {
    set({ activeChatId: chatId })
  },

  createNewChat: (title?: string) => {
    const safeTitle = typeof title === 'string' && title.trim()
      ? title.trim()
      : NEW_CHAT_TITLE
    const newChat: Chat = {
      id: generateChatId(),
      title: safeTitle,
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

  sendMessage: async (content: string, attachments = [], files = []) => {
    const question = content.trim()
    if (!question || get().isTyping) return

    const moderation = moderateChatContent(question)
    if (!moderation.allowed) {
      throw new ContentModerationError(moderation.message || 'Nội dung không phù hợp.')
    }

    const activeChatId = get().activeChatId ?? get().createNewChat().id
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: question,
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
              title: chat.messages.length === 0 && chat.title === NEW_CHAT_TITLE
                ? truncateText(question.replace(/\s+/g, ' '), 80)
                : chat.title,
              lastMessage: question,
              timestamp: userMessage.timestamp,
              messages: [...chat.messages, userMessage],
            }
          : chat
      ),
      isTyping: true,
      processingStage: attachments.length ? 'Đang đọc tài liệu đính kèm...' : 'Đang tìm tài liệu liên quan...',
    }))

    activeRequestController?.abort()
    const requestController = new AbortController()
    activeRequestController = requestController

    try {
      set({ processingStage: 'Đang truy xuất và tổng hợp từ kho tài liệu...' })
      const ragResponse = await ragChatService.sendQueryToRAG(question, undefined, { signal: requestController.signal, files })
      const aiResponse: Message = {
        id: ragResponse.id,
        role: 'assistant',
        content: ragResponse.hasWarning
          ? `> **Cần đối chiếu:** Một hoặc nhiều nguồn chưa được xác minh đầy đủ.\n\n${ragResponse.message}`
          : ragResponse.message,
        timestamp: ragResponse.timestamp,
        references: ragResponse.references,
        confidence: ragResponse.confidence,
        suggestions: ragResponse.suggestedQuestions,
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
      if (requestController.signal.aborted) {
        set(state => ({
          chats: state.chats.map(chat => chat.id === activeChatId ? {
            ...chat,
            messages: chat.messages.map(msg => msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg),
          } : chat),
          isTyping: false,
          processingStage: '',
        }))
        return
      }
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
    } finally {
      if (activeRequestController === requestController) activeRequestController = null
    }
  },

  cancelMessage: () => {
    activeRequestController?.abort()
  },

  deleteChat: (chatId: string) => {
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
      activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
    }))
  },

  retryMessage: async (messageId: string) => {
    const { activeChatId, chats } = get()
    const chat = chats.find(item => item.id === activeChatId)
    if (!chat || get().isTyping) return
    const failedIndex = chat.messages.findIndex(message => message.id === messageId)
    const previous = failedIndex > 0 ? chat.messages[failedIndex - 1] : undefined
    if (!previous || previous.role !== 'user' || previous.attachments?.length) return
    set(state => ({
      chats: state.chats.map(item => item.id === activeChatId ? { ...item, messages: item.messages.filter(message => message.id !== messageId) } : item),
    }))
    await get().sendMessage(previous.content)
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

  unarchiveChat: (chatId: string) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? { ...chat, status: 'active' }
          : chat
      ),
    }))
  },

  rateMessage: async (messageId: string, rating: 'like' | 'dislike', reason: string, content: string, detail = '') => {
    const { activeChatId } = get()
    if (!activeChatId) return

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating, reason, detail, messageContent: content }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { message?: string }
      throw new Error(data.message || 'Không thể gửi phản hồi.')
    }

    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, rating, feedbackReason: reason }
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
}), {
  name: 'legal-ai-chat-history',
  partialize: state => ({ chats: state.chats, activeChatId: state.activeChatId }),
}))
