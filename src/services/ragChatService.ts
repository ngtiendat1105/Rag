import type { ChatResponse } from '@/services/api'
import type { ChatReference } from '@/store/chatStore'

export interface RAGChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  includeReferences?: boolean
  contextWindow?: number
}

export interface ChatContext {
  conversationId?: string
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  legalContext?: string[]
  userPreferences?: { detailLevel: 'brief' | 'normal' | 'detailed'; language: 'vi' | 'en' }
}

interface RagSource {
  document?: string
  article?: string
  clause?: string
  chunk_id?: string
  doc_id?: string
  effective_date?: string
  is_verified?: boolean
}

interface BackendRagResponse {
  answer: string
  sources: RagSource[]
  has_warning: boolean
  message?: string
}

export interface RAGResponse extends Omit<ChatResponse, 'references'> {
  references: ChatReference[]
  hasWarning: boolean
  citations: Array<{ documentId: string; title: string; content: string; relevance: number }>
  suggestedQuestions?: string[]
  confidenceScores?: { legalAccuracy: number; completeness: number; relevance: number }
}

class RAGChatService {
  async sendQueryToRAG(message: string, _context?: ChatContext, _options?: RAGChatOptions): Promise<RAGResponse> {
    const response = await fetch('/api/rag/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: message.trim() }),
    })
    const data = await response.json().catch(() => ({})) as BackendRagResponse
    if (!response.ok) throw new Error(data.message || 'Không thể truy vấn kho tài liệu.')

    const sources = Array.isArray(data.sources) ? data.sources : []
    const references: ChatReference[] = sources.map((source) => {
      const location = [
        source.article && source.article !== 'N/A' ? `Điều ${source.article}` : '',
        source.clause && source.clause !== 'N/A' ? `Khoản ${source.clause}` : '',
      ].filter(Boolean).join(', ')
      return {
        title: source.document || source.doc_id || 'Tài liệu trong kho dữ liệu',
        excerpt: [location, source.effective_date && source.effective_date !== 'N/A' ? `Hiệu lực: ${source.effective_date}` : '', source.is_verified === false ? 'Nguồn cần đối chiếu.' : ''].filter(Boolean).join(' · '),
      }
    })
    const confidence = sources.length === 0 ? 40 : data.has_warning ? 65 : 90

    return {
      id: `msg_${Date.now()}_ai`,
      message: data.answer,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      references,
      confidence,
      hasWarning: Boolean(data.has_warning),
      citations: sources.map((source, index) => ({
        documentId: source.doc_id || source.chunk_id || `source_${index}`,
        title: source.document || 'Tài liệu trong kho dữ liệu',
        content: references[index]?.excerpt || '',
        relevance: 1,
      })),
    }
  }

  async getChatHistory(_userId?: string, _page?: number, _limit?: number): Promise<RAGResponse[]> { return [] }
  async searchLegalDocuments(_query?: string, _filters?: Record<string, unknown>): Promise<any[]> { return [] }

  validateLegalQuery(query: string) {
    const value = query.trim()
    const issues: string[] = []
    if (value.length < 2) issues.push('Câu hỏi quá ngắn')
    if (value.length > 2000) issues.push('Câu hỏi vượt quá 2.000 ký tự')
    return { isValid: issues.length === 0, issues: issues.length ? issues : undefined }
  }
}

export const ragChatService = new RAGChatService()
export const formatLegalResponse = (response: RAGResponse) => response.message
export const calculateResponseQuality = (response: RAGResponse) => response.confidence / 100
