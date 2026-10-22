'use client'

import { useState, useCallback, useEffect } from 'react'
import { ragChatService, RAGResponse, ChatContext } from '@/services/ragChatService'
import { useChatStore } from '@/store/chatStore'

interface UseChatOptions {
  autoScroll?: boolean
  persistHistory?: boolean
  maxHistoryLength?: number
}

export function useChat(options: UseChatOptions = {}) {
  const {
    autoScroll = true,
    persistHistory = true,
    maxHistoryLength = 50,
  } = options

  const chatStore = useChatStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ChatContext>({})

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return

    setIsProcessing(true)
    setError(null)

    try {
      // Validate query
      const validation = ragChatService.validateLegalQuery(content)
      if (!validation.isValid) {
        setError(validation.issues?.join(', ') || 'Câu hỏi không hợp lệ')
        return
      }

      // Get RAG response
      const response = await ragChatService.sendQueryToRAG(content, context)
      
      // Store in chat store
      await chatStore.sendMessage(content)
      
      // Update context with new message
      setContext(prev => ({
        ...prev,
        previousMessages: [
          ...(prev.previousMessages || []).slice(-maxHistoryLength),
          { role: 'user', content },
          { role: 'assistant', content: response.message },
        ],
      }))

      return response
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xử lý tin nhắn')
      console.error('Chat error:', err)
      
      // Fallback: use store's send message
      await chatStore.sendMessage(content)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, context, maxHistoryLength, chatStore])

  /**
   * Load chat history
   */
  const loadHistory = useCallback(async (chatId?: string) => {
    if (!chatId) return []

    try {
      // In real implementation, fetch from API
      // const history = await ragChatService.getChatHistory(chatId)
      // return history
      
      return []
    } catch (err) {
      console.error('Load history error:', err)
      return []
    }
  }, [])

  /**
   * Search legal documents
   */
  const searchDocuments = useCallback(async (query: string) => {
    try {
      return await ragChatService.searchLegalDocuments(query)
    } catch (err) {
      console.error('Search documents error:', err)
      return []
    }
  }, [])

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    if (chatStore.activeChatId) {
      chatStore.clearChat(chatStore.activeChatId)
    }
    setContext({})
    setError(null)
  }, [chatStore])

  /**
   * Export chat as text
   */
  const exportChat = useCallback(() => {
    if (!chatStore.activeChatId) return ''

    const activeChat = chatStore.chats.find(chat => chat.id === chatStore.activeChatId)
    if (!activeChat) return ''

    const content = activeChat.messages
      .map(msg => `${msg.role === 'user' ? 'Bạn' : 'AI'}: ${msg.content}`)
      .join('\n\n')

    return content
  }, [chatStore.activeChatId, chatStore.chats])

  /**
   * Rate a message
   */
  const rateMessage = useCallback((messageId: string, rating: 'like' | 'dislike') => {
    chatStore.rateMessage(messageId, rating)
    
    // In real implementation, send rating to API
    // apiService.rateMessage(messageId, rating)
  }, [chatStore])

  /**
   * Get suggested questions
   */
  const getSuggestedQuestions = useCallback((response: RAGResponse): string[] => {
    return response.suggestedQuestions || [
      'Có thể giải thích rõ hơn về điểm này không?',
      'Có văn bản pháp luật nào khác liên quan?',
      'Thủ tục thực hiện như thế nào?',
    ]
  }, [])

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback((preferences: ChatContext['userPreferences']) => {
    setContext(prev => ({
      ...prev,
      userPreferences: preferences ? {
        ...(prev.userPreferences || {}),
        ...preferences,
      } : prev.userPreferences,
    }))
  }, [])

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    if (autoScroll && chatStore.activeChatId) {
      const chatContainer = document.querySelector('.chat-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [chatStore.activeChatId, chatStore.chats, autoScroll])

  /**
   * Persist chat history
   */
  useEffect(() => {
    if (persistHistory && chatStore.activeChatId) {
      const activeChat = chatStore.chats.find(chat => chat.id === chatStore.activeChatId)
      if (activeChat && activeChat.messages.length > 0) {
        localStorage.setItem(`chat_${activeChat.id}`, JSON.stringify(activeChat.messages))
      }
    }
  }, [chatStore.activeChatId, chatStore.chats, persistHistory])

  /**
   * Load persisted chat
   */
  useEffect(() => {
    if (persistHistory && chatStore.activeChatId) {
      const saved = localStorage.getItem(`chat_${chatStore.activeChatId}`)
      if (saved) {
        try {
          const messages = JSON.parse(saved)
          // Could load messages into store if needed
        } catch (err) {
          console.error('Load persisted chat error:', err)
        }
      }
    }
  }, [chatStore.activeChatId, persistHistory])

  return {
    // State from store
    chats: chatStore.chats,
    activeChatId: chatStore.activeChatId,
    activeChat: chatStore.chats.find(chat => chat.id === chatStore.activeChatId),
    isTyping: chatStore.isTyping,
    
    // Local state
    isProcessing,
    error,
    context,
    
    // Actions from store
    setActiveChat: chatStore.setActiveChat,
    createNewChat: chatStore.createNewChat,
    deleteChat: chatStore.deleteChat,
    archiveChat: chatStore.archiveChat,
    
    // Custom actions
    sendMessage,
    loadHistory,
    searchDocuments,
    clearHistory,
    exportChat,
    rateMessage,
    getSuggestedQuestions,
    updatePreferences,
    
    // Utilities
    clearError: () => setError(null),
    updateContext: setContext,
    
    // Validation
    validateQuery: ragChatService.validateLegalQuery,
    
    // Stats
    getStats: () => ({
      totalMessages: chatStore.chats.reduce((sum, chat) => sum + chat.messages.length, 0),
      totalChats: chatStore.chats.length,
      activeChats: chatStore.chats.filter(chat => chat.status === 'active').length,
    }),
  }
}