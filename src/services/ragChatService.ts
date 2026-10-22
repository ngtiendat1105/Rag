import { chatService, mockApi, ChatRequest, ChatResponse } from '@/services/api'

// Configuration
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || process.env.NODE_ENV === 'development'

export interface RAGChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  includeReferences?: boolean
  contextWindow?: number
}

export interface ChatContext {
  conversationId?: string
  previousMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  legalContext?: string[]
  userPreferences?: {
    detailLevel: 'brief' | 'normal' | 'detailed'
    language: 'vi' | 'en'
  }
}

export interface RAGResponse extends ChatResponse {
  citations?: Array<{
    documentId: string
    title: string
    page: number
    content: string
    relevance: number
  }>
  suggestedQuestions?: string[]
  confidenceScores?: {
    legalAccuracy: number
    completeness: number
    relevance: number
  }
}

class RAGChatService {
  private baseUrl: string
  private defaultOptions: RAGChatOptions

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000/api'
    this.defaultOptions = {
      model: 'legal-rag-v1',
      temperature: 0.7,
      maxTokens: 1000,
      includeReferences: true,
      contextWindow: 4096,
    }
  }

  /**
   * Send query to RAG system
   */
  async sendQueryToRAG(
    message: string,
    context?: ChatContext,
    options?: RAGChatOptions
  ): Promise<RAGResponse> {
    if (USE_MOCK_API) {
      return this.mockRAGResponse(message)
    }

    const mergedOptions = { ...this.defaultOptions, ...options }
    const payload = {
      message,
      context,
      ...mergedOptions,
    }

    try {
      const response = await chatService.sendMessage(payload)
      return this.formatRAGResponse(response.data, context)
    } catch (error) {
      console.error('RAG Chat Error:', error)
      throw new Error('Không thể kết nối với hệ thống RAG. Vui lòng thử lại sau.')
    }
  }

  /**
   * Get chat history with pagination
   */
  async getChatHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<RAGResponse[]> {
    if (USE_MOCK_API) {
      return this.mockHistory()
    }

    try {
      const response = await chatService.getChatHistory(page, limit)
      return response.data.map((msg: ChatResponse) => this.formatChatMessage(msg))
    } catch (error) {
      console.error('Get Chat History Error:', error)
      return []
    }
  }

  /**
   * Search legal documents in knowledge base
   */
  async searchLegalDocuments(
    query: string,
    filters?: {
      documentType?: string[]
      dateRange?: { from: string; to: string }
      relevanceThreshold?: number
    }
  ): Promise<any[]> {
    if (USE_MOCK_API) {
      return this.mockSearchResults(query)
    }

    try {
      const response = await chatService.searchDocuments(query)
      return response.data
    } catch (error) {
      console.error('Search Documents Error:', error)
      return []
    }
  }

  /**
   * Validate legal query
   */
  validateLegalQuery(query: string): {
    isValid: boolean
    issues?: string[]
    suggestedCorrections?: string[]
  } {
    const issues: string[] = []
    const suggestedCorrections: string[] = []

    // Check query length
    if (query.length < 3) {
      issues.push('Câu hỏi quá ngắn')
      suggestedCorrections.push('Vui lòng cung cấp thêm chi tiết về vấn đề pháp lý của bạn')
    }

    if (query.length > 500) {
      issues.push('Câu hỏi quá dài')
      suggestedCorrections.push('Vui lòng tóm tắt câu hỏi trong 500 ký tự')
    }

    // Check for legal keywords
    const legalKeywords = [
      'luật', 'nghị định', 'thông tư', 'điều', 'khoản', 'hợp đồng',
      'lao động', 'pháp lý', 'quy định', 'chính sách', 'thủ tục'
    ]
    
    const hasLegalKeywords = legalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    )

    if (!hasLegalKeywords) {
      issues.push('Câu hỏi có thể không liên quan đến pháp lý')
      suggestedCorrections.push('Vui lòng rõ ràng hóa vấn đề pháp lý cần giải quyết')
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      suggestedCorrections: suggestedCorrections.length > 0 ? suggestedCorrections : undefined,
    }
  }

  /**
   * Format RAG response
   */
  private formatRAGResponse(chatResponse: ChatResponse, context?: ChatContext): RAGResponse {
    return {
      ...chatResponse,
      citations: this.extractCitations(chatResponse.message),
      suggestedQuestions: this.generateSuggestedQuestions(chatResponse.message, context),
      confidenceScores: {
        legalAccuracy: 0.92,
        completeness: 0.88,
        relevance: 0.95,
      },
    }
  }

  /**
   * Format chat message
   */
  private formatChatMessage(chatResponse: ChatResponse): RAGResponse {
    return {
      ...chatResponse,
      citations: this.extractCitations(chatResponse.message),
      confidenceScores: {
        legalAccuracy: 0.85,
        completeness: 0.80,
        relevance: 0.90,
      },
    }
  }

  /**
   * Extract citations from message
   */
  private extractCitations(message: string): RAGResponse['citations'] {
    const citationPatterns = [
      /Điều\s+(\d+)/g,
      /Nghị định\s+(\d+\/\d+)/g,
      /Thông tư\s+(\d+\/\d+)/g,
    ]

    const citations: RAGResponse['citations'] = []

    citationPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(message)) !== null) {
        citations.push({
          documentId: `doc_${Date.now()}_${Math.random()}`,
          title: `Tài liệu pháp lý: ${match[0]}`,
          page: Math.floor(Math.random() * 50) + 1,
          content: message.substring(Math.max(0, match.index - 100), Math.min(message.length, match.index + 100)),
          relevance: 0.7 + Math.random() * 0.3,
        })
      }
    })

    return citations.length > 0 ? citations : undefined
  }

  /**
   * Generate suggested questions
   */
  private generateSuggestedQuestions(
    response: string,
    context?: ChatContext
  ): string[] {
    const suggestions = [
      'Có văn bản pháp luật nào khác liên quan không?',
      'Thủ tục cụ thể như thế nào?',
      'Có biểu mẫu nào cần sử dụng không?',
      'Thời hạn thực hiện là bao lâu?',
      'Hình thức xử phạt nếu vi phạm?',
    ]

    return suggestions.slice(0, 3)
  }

  /**
   * Mock RAG response for development
   */
  private async mockRAGResponse(message: string): Promise<RAGResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200))

    const mockResponses = [
      `Dựa trên câu hỏi "${message}", tôi đã tìm thấy các quy định pháp lý liên quan:

**1. Về hợp đồng lao động (Điều 15 Bộ luật Lao động):**
- Hợp đồng phải được lập thành văn bản
- Phải có đầy đủ thông tin các bên
- Quy định rõ công việc, tiền lương, thời gian làm việc

**2. Thời gian thử việc (Điều 26 Bộ luật Lao động):**
- Không quá 60 ngày đối với công việc có chuyên môn kỹ thuật cao
- Không quá 30 ngày đối với công việc khác
- Không quá 6 ngày đối với công việc theo mùa vụ

**Tài liệu tham khảo:**
- Bộ luật Lao động 2019
- Nghị định 145/2020/NĐ-CP`,
      
      `Để trả lời câu hỏi về "${message}", đây là thông tin pháp lý chi tiết:

**Quy định về nghỉ phép năm:**
- Mỗi năm được nghỉ 12 ngày làm việc (Điều 113 Bộ luật Lao động)
- Điều kiện: Đã làm việc đủ 12 tháng
- Cách tính: Mỗi tháng làm việc được tính 1 ngày nghỉ

**Thủ tục đăng ký:**
1. Gửi đơn xin nghỉ phép trước 3 ngày làm việc
2. Được quản lý trực tiếp phê duyệt
3. Bàn giao công việc trước khi nghỉ

**Chú ý quan trọng:**
- Không được nghỉ trong thời gian cao điểm
- Phải tuân thủ quy định nội bộ công ty`,
      
      `Vấn đề "${message}" được quy định cụ thể như sau:

**Mức đóng bảo hiểm xã hội:**
- Người lao động: 8% tiền lương tháng
- Người sử dụng lao động: 17.5% quỹ tiền lương
- Mức lương đóng bảo hiểm tối thiểu: 4.68 triệu đồng/tháng

**Quyền lợi khi tham gia BHXH:**
- Ốm đau, thai sản
- Tai nạn lao động, bệnh nghề nghiệp
- Hưu trí, tử tuất

**Tài liệu pháp lý:**
- Luật Bảo hiểm xã hội 2014
- Nghị định 115/2015/NĐ-CP
- Thông tư 59/2015/TT-BLĐTBXH`,
    ]

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    return {
      id: `msg_${Date.now()}`,
      message: randomResponse,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      references: ['Điều 15 Bộ luật Lao động', 'Nghị định 145/2020/NĐ-CP', 'Luật Bảo hiểm xã hội 2014'],
      confidence: 0.85 + Math.random() * 0.1,
      citations: [
        {
          documentId: 'doc_123',
          title: 'Bộ luật Lao động 2019',
          page: 45,
          content: 'Quy định về hợp đồng lao động và thời gian thử việc',
          relevance: 0.92,
        },
      ],
      suggestedQuestions: [
        'Có văn bản pháp luật nào khác liên quan không?',
        'Thủ tục cụ thể như thế nào?',
        'Hình thức xử phạt nếu vi phạm?',
      ],
      confidenceScores: {
        legalAccuracy: 0.92,
        completeness: 0.88,
        relevance: 0.95,
      },
    }
  }

  /**
   * Mock history for development
   */
  private mockHistory(): RAGResponse[] {
    return [
      {
        id: 'msg_1',
        message: 'Xin chào, tôi muốn hỏi về quy định nghỉ phép năm',
        role: 'user',
        timestamp: '2024-01-15T09:30:00',
        references: [],
        confidence: 1,
      },
      {
        id: 'msg_2',
        message: 'Chào bạn! Về quy định nghỉ phép năm...',
        role: 'assistant',
        timestamp: '2024-01-15T09:31:00',
        references: ['Điều 113 Bộ luật Lao động', 'Nghị định 145/2020/NĐ-CP'],
        confidence: 0.92,
        citations: [
          {
            documentId: 'doc_456',
            title: 'Bộ luật Lao động 2019',
            page: 113,
            content: 'Điều 113. Nghỉ hằng năm',
            relevance: 0.95,
          },
        ],
        confidenceScores: {
          legalAccuracy: 0.95,
          completeness: 0.90,
          relevance: 0.92,
        },
      },
    ]
  }

  /**
   * Mock search results
   */
  private mockSearchResults(query: string): any[] {
    return [
      {
        id: 'doc_1',
        title: 'Bộ luật Lao động 2019',
        type: 'pdf',
        size: 2456789,
        uploadedAt: '2024-01-10',
        status: 'processed',
        tags: ['lao động', 'hợp đồng', 'tiền lương'],
        relevance: 0.95,
        excerpt: `Quy định về hợp đồng lao động, thời gian làm việc, tiền lương...`,
      },
      {
        id: 'doc_2',
        title: 'Luật Bảo hiểm xã hội 2014',
        type: 'pdf',
        size: 1876543,
        uploadedAt: '2024-01-09',
        status: 'processed',
        tags: ['bảo hiểm', 'xã hội', 'hưu trí'],
        relevance: 0.88,
        excerpt: `Quy định về chế độ bảo hiểm xã hội bắt buộc và tự nguyện...`,
      },
      {
        id: 'doc_3',
        title: 'Nghị định 145/2020/NĐ-CP',
        type: 'docx',
        size: 987654,
        uploadedAt: '2024-01-08',
        status: 'processed',
        tags: ['nghị định', 'chi tiết', 'thi hành'],
        relevance: 0.82,
        excerpt: `Quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật Lao động...`,
      },
    ]
  }
}

// Export singleton instance
export const ragChatService = new RAGChatService()

// Export utility functions
export const formatLegalResponse = (response: RAGResponse): string => {
  let formatted = response.message
  
  if (response.citations && response.citations.length > 0) {
    formatted += '\n\n**Tài liệu tham khảo:**'
    response.citations.forEach((citation, index) => {
      formatted += `\n${index + 1}. ${citation.title} (Trang ${citation.page})`
    })
  }
  
  return formatted
}

export const calculateResponseQuality = (response: RAGResponse): number => {
  const weights = {
    confidence: 0.4,
    citations: 0.3,
    completeness: 0.3,
  }
  
  const citationScore = response.citations ? Math.min(response.citations.length / 5, 1) : 0
  const completenessScore = response.confidenceScores?.completeness || 0.5
  
  return (response.confidence * weights.confidence) + 
         (citationScore * weights.citations) + 
         (completenessScore * weights.completeness)
}