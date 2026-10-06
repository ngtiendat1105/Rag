'use client'

import { useState, useCallback } from 'react'
import { ragChatService, RAGResponse } from '@/services/ragChatService'

interface RAGQueryOptions {
  includeCitations?: boolean
  includeConfidence?: boolean
  temperature?: number
  maxTokens?: number
}

interface RAGSearchResult {
  id: string
  title: string
  content: string
  relevance: number
  documentType: string
  metadata: Record<string, any>
}

export function useRAG() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RAGResponse[]>([])
  const [searchResults, setSearchResults] = useState<RAGSearchResult[]>([])

  /**
   * Query RAG system
   */
  const queryRAG = useCallback(async (
    query: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      // Validate query
      const validation = ragChatService.validateLegalQuery(query)
      if (!validation.isValid) {
        setError(validation.issues?.join(', ') || 'Query không hợp lệ')
        return null
      }

      const response = await ragChatService.sendQueryToRAG(query, undefined, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        includeReferences: options.includeCitations,
      })

      setResults(prev => [...prev, response])
      return response
    } catch (err: any) {
      setError(err.message || 'Không thể truy vấn hệ thống RAG')
      console.error('RAG query error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Search documents
   */
  const searchDocuments = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const results = await ragChatService.searchLegalDocuments(query)
      
      const formattedResults: RAGSearchResult[] = results.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.excerpt || '',
        relevance: doc.relevance || 0,
        documentType: doc.type || 'unknown',
        metadata: {
          size: doc.size,
          uploadedAt: doc.uploadedAt,
          status: doc.status,
          tags: doc.tags || [],
        },
      }))

      setSearchResults(formattedResults)
      return formattedResults
    } catch (err: any) {
      setError(err.message || 'Không thể tìm kiếm tài liệu')
      console.error('Document search error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get document by ID
   */
  const getDocument = useCallback(async (documentId: string) => {
    setLoading(true)
    setError(null)

    try {
      // In real implementation, fetch document from API
      // const response = await api.getDocument(documentId)
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      const mockDocument: RAGSearchResult = {
        id: documentId,
        title: 'Bộ luật Lao động 2019',
        content: 'Đây là nội dung chi tiết của tài liệu pháp lý...',
        relevance: 0.95,
        documentType: 'pdf',
        metadata: {
          size: 2456789,
          uploadedAt: '2024-01-10',
          status: 'processed',
          tags: ['lao động', 'hợp đồng', 'tiền lương'],
        },
      }

      return mockDocument
    } catch (err: any) {
      setError(err.message || 'Không thể lấy thông tin tài liệu')
      console.error('Get document error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Upload document to RAG system
   */
  const uploadDocument = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('Kích thước file không được vượt quá 10MB')
      }

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Chỉ hỗ trợ file PDF, DOCX, TXT')
      }

      // In real implementation, upload to API
      // const response = await api.uploadDocument(file)
      
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate upload
      
      return {
        success: true,
        documentId: `doc_${Date.now()}`,
        message: 'Tải lên thành công. Tài liệu đang được xử lý...',
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải lên tài liệu')
      console.error('Upload document error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Analyze document relevance
   */
  const analyzeRelevance = useCallback((document: RAGSearchResult, query: string): number => {
    // Simple relevance analysis
    const queryWords = query.toLowerCase().split(' ')
    const titleWords = document.title.toLowerCase().split(' ')
    const contentWords = document.content.toLowerCase().split(' ')
    
    let score = 0
    
    queryWords.forEach(word => {
      if (titleWords.includes(word)) score += 0.5
      if (contentWords.includes(word)) score += 0.3
    })
    
    // Consider document metadata
    if (document.metadata.tags?.some((tag: string) => 
      query.toLowerCase().includes(tag.toLowerCase())
    )) {
      score += 0.2
    }
    
    return Math.min(score, 1.0)
  }, [])

  /**
   * Generate search suggestions
   */
  const getSearchSuggestions = useCallback((query: string): string[] => {
    const suggestions = [
      'hợp đồng lao động',
      'nghỉ phép năm',
      'bảo hiểm xã hội',
      'tiền lương',
      'thời gian làm việc',
      'kỷ luật lao động',
      'chấm dứt hợp đồng',
      'thử việc',
    ]
    
    return suggestions
      .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
  }, [])

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([])
    setSearchResults([])
    setError(null)
  }, [])

  /**
   * Get statistics
   */
  const getStatistics = useCallback(() => {
    const totalResults = results.length + searchResults.length
    const avgConfidence = results.length > 0 
      ? results.reduce((sum, res) => sum + res.confidence, 0) / results.length
      : 0
    
    const documentTypes = searchResults.reduce((acc, result) => {
      acc[result.documentType] = (acc[result.documentType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalResults,
      avgConfidence,
      totalQueries: results.length,
      totalDocuments: searchResults.length,
      documentTypes,
    }
  }, [results, searchResults])

  return {
    // State
    loading,
    error,
    results,
    searchResults,
    
    // Actions
    queryRAG,
    searchDocuments,
    getDocument,
    uploadDocument,
    analyzeRelevance,
    getSearchSuggestions,
    clearResults,
    getStatistics,
    
    // Utilities
    clearError: () => setError(null),
    
    // Validators
    validateFile: (file: File) => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      
      const errors: string[] = []
      
      if (file.size > maxSize) {
        errors.push('Kích thước file không được vượt quá 10MB')
      }
      
      if (!allowedTypes.includes(file.type)) {
        errors.push('Chỉ hỗ trợ file PDF, DOCX, TXT')
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      }
    },
    
    // Formatters
    formatResponse: (response: RAGResponse) => {
      let formatted = `**Phản hồi:** ${response.message}\n\n`
      
      if (response.references && response.references.length > 0) {
        formatted += '**Tài liệu tham khảo:**\n'
        response.references.forEach((ref, index) => {
          formatted += `${index + 1}. ${ref}\n`
        })
      }
      
      if (response.confidenceScores) {
        formatted += `\n**Độ tin cậy:** ${Math.round(response.confidence * 100)}%`
      }
      
      return formatted
    },
  }
}