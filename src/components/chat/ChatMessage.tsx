'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  X, 
  FileText, 
  ExternalLink,
  User,
  Bot,
  AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate } from '@/utils/formatters'
import type { ChatAttachment, ChatReference } from '@/store/chatStore'

interface ChatMessageProps {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  references?: Array<string | ChatReference>
  confidence?: number
  attachments?: ChatAttachment[]
  rating?: 'like' | 'dislike' | null
  onRate?: (rating: 'like' | 'dislike') => void
  onCopy?: () => void
}

export default function ChatMessage({
  id,
  role,
  content,
  timestamp,
  status = 'sent',
  references = [],
  confidence,
  attachments = [],
  rating = null,
  onRate,
  onCopy,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [selectedReference, setSelectedReference] = useState<ChatReference | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    onCopy?.()
    
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === 'user'
  const isAI = role === 'assistant'
  const isSystem = role === 'system'
  const isError = status === 'error'

  const getMessageBg = () => {
    if (isUser) return 'bg-gradient-to-r from-primary-600 to-primary-700'
    if (isAI) return 'bg-dark-surface'
    if (isSystem) return 'bg-accent-900/20'
    if (isError) return 'bg-red-900/20'
    return 'bg-dark-surface'
  }

  const getMessageBorder = () => {
    if (isUser) return 'border-primary-500/30'
    if (isAI) return 'border-dark-border'
    if (isSystem) return 'border-accent-500/30'
    if (isError) return 'border-red-500/30'
    return 'border-dark-border'
  }

  const getIcon = () => {
    if (isUser) return <User className="w-5 h-5" />
    if (isAI) return <Bot className="w-5 h-5" />
    if (isSystem) return <AlertCircle className="w-5 h-5" />
    return <Bot className="w-5 h-5" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
        ${isUser ? 'bg-gradient-to-r from-primary-500 to-secondary-500' : 'bg-gradient-to-r from-accent-500 to-neon-cyan'}
        ${isSystem && 'bg-gradient-to-r from-yellow-500 to-orange-500'}
        ${isError && 'bg-gradient-to-r from-red-500 to-pink-500'}`}>
        {getIcon()}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`${isUser ? 'text-right' : 'text-left'} mb-1`}>
          <span className="font-semibold text-sm">
            {isUser ? 'Bạn' : isAI ? 'Legal AI Assistant' : 'Hệ thống'}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            {formatDate(timestamp)}
            {status === 'sending' && ' • Đang gửi...'}
            {status === 'error' && ' • Lỗi'}
          </span>
        </div>

        <div className={`${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`relative rounded-2xl p-4 border ${getMessageBg()} ${getMessageBorder()}
              ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'} max-w-3xl`}
          >
            {/* Status indicators */}
            {status === 'sending' && (
              <div className="absolute -top-2 -right-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-150" />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-300" />
              </div>
            )}

            {status === 'error' && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Lỗi
              </div>
            )}

            {/* Message content */}
            {isAI ? (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-white whitespace-pre-wrap">{content}</p>
            )}

            {isUser && attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">{attachments.map(file => <span key={file.id} className="flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1.5 text-xs"><FileText className="h-3.5 w-3.5" />{file.name}</span>)}</div>
            )}

            {isAI && typeof confidence === 'number' && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${confidence >= 75 ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-200'}`}>
                <span className={`h-2 w-2 rounded-full ${confidence >= 75 ? 'bg-green-400' : 'bg-yellow-300'}`} />
                Độ tin cậy {confidence}%{confidence < 75 && ' — nên kiểm tra lại nguồn trước khi sử dụng.'}
              </div>
            )}

            {/* References section */}
            {isAI && references.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border/30">
                <button
                  onClick={() => setShowReferences(!showReferences)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {showReferences ? 'Ẩn tài liệu tham khảo' : `Hiển thị ${references.length} tài liệu tham khảo`}
                </button>

                {showReferences && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    {references.map((ref, index) => {
                      const item = typeof ref === 'string' ? { title: ref } : ref
                      return <button
                        key={index}
                        onClick={() => setSelectedReference(item)}
                        className="flex w-full items-center gap-2 rounded-lg bg-dark-bg/50 p-3 text-left text-sm text-gray-300 hover:bg-dark-bg"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="flex-1">{item.title}{item.page ? ` · Trang ${item.page}` : ''}</span>
                      </button>
                    })}
                  </motion.div>
                )}
                {selectedReference && <div className="mt-3 rounded-xl border border-accent-500/20 bg-accent-500/5 p-3 text-sm"><div className="mb-1 flex items-center justify-between"><strong>{selectedReference.title}</strong><button aria-label="Đóng nguồn" onClick={() => setSelectedReference(null)}><X className="h-4 w-4" /></button></div>{selectedReference.page && <p className="text-xs text-gray-400">Trang {selectedReference.page}</p>}<p className="mt-2 text-gray-300">{selectedReference.excerpt || 'Bản xem trước chưa có sẵn cho tài liệu này.'}</p></div>}
              </div>
            )}
          </div>

          {/* Action buttons (only for AI messages) */}
          {isAI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
                title="Sao chép tin nhắn"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <button
                onClick={() => onRate?.('like')}
                className={`p-2 rounded-lg transition-colors ${rating === 'like' ? 'bg-green-500/20 text-green-400' : 'hover:bg-dark-surface text-gray-400'}`}
                title="Thích"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => { onRate?.('dislike'); setShowFeedback(true); setFeedbackSent(false) }}
                className={`p-2 rounded-lg transition-colors ${rating === 'dislike' ? 'bg-red-500/20 text-red-400' : 'hover:bg-dark-surface text-gray-400'}`}
                title="Không thích"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {isAI && showFeedback && !feedbackSent && (
            <div className="mt-2 rounded-xl border border-white/10 bg-dark-surface/70 p-3 text-sm"><p className="mb-2 text-gray-300">Câu trả lời cần cải thiện ở điểm nào?</p><div className="flex flex-wrap gap-2">{['Sai nội dung', 'Thiếu nguồn', 'Khó hiểu', 'Không liên quan'].map(reason => <button key={reason} onClick={() => { setFeedbackSent(true); setShowFeedback(false) }} className="rounded-lg border border-white/10 px-3 py-1.5 text-gray-300 hover:bg-white/5">{reason}</button>)}</div></div>
          )}
          {isAI && feedbackSent && <p className="mt-2 text-xs text-green-400">Đã ghi nhận phản hồi. Cảm ơn bạn.</p>}
        </div>
      </div>
    </motion.div>
  )
}
