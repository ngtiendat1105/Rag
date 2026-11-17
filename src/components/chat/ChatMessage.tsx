'use client'

import { useEffect, useState } from 'react'
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
  AlertCircle,
  ShieldCheck
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate } from '@/utils/formatters'
import type { ChatAttachment, ChatReference } from '@/store/chatStore'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/ToastProvider'
import DocumentViewer from '@/components/chat/DocumentViewer'
import DislikeFeedbackModal from '@/components/chat/DislikeFeedbackModal'

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
  onRate?: (rating: 'like' | 'dislike', reason: string, detail?: string) => Promise<void>
  onCopy?: () => void
  onRetry?: () => void
  animate?: boolean
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
  onRetry,
  animate = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [selectedReference, setSelectedReference] = useState<ChatReference | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [pendingRating, setPendingRating] = useState<'like' | 'dislike' | null>(null)
  const [feedbackError, setFeedbackError] = useState('')
  const [referenceCopied, setReferenceCopied] = useState<number | null>(null)
  const [viewerReference, setViewerReference] = useState<ChatReference | null>(null)
  const [dislikeModalOpen, setDislikeModalOpen] = useState(false)
  const currentUser = useAuthStore(state => state.user)
  const { showToast } = useToast()
  const [displayedContent, setDisplayedContent] = useState(animate && role === 'assistant' ? '' : content)

  useEffect(() => {
    if (!animate || role !== 'assistant') { setDisplayedContent(content); return }
    setDisplayedContent('')
    let index = 0
    const timer = window.setInterval(() => {
      index = Math.min(index + 2, content.length)
      setDisplayedContent(content.slice(0, index))
      if (index >= content.length) window.clearInterval(timer)
    }, 12)
    return () => window.clearInterval(timer)
  }, [animate, content, role])

  const handleCopy = () => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      showToast('Đã sao chép câu trả lời.')
      onCopy?.()
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const isUser = role === 'user'
  const isAI = role === 'assistant'
  const isSystem = role === 'system'
  const isError = status === 'error'
  const copyReference = async (item: ChatReference | { title: string }, index: number) => {
    const citation = [item.title, 'page' in item && item.page ? `Trang ${item.page}` : '', 'excerpt' in item && item.excerpt ? item.excerpt : ''].filter(Boolean).join(' — ')
    await navigator.clipboard.writeText(citation)
    setReferenceCopied(index)
    showToast('Đã sao chép nguồn tham khảo.')
    window.setTimeout(() => setReferenceCopied(null), 2000)
  }
  const feedbackReasons = pendingRating === 'like'
    ? ['Đúng và hữu ích', 'Nguồn rõ ràng', 'Dễ hiểu', 'Đúng nhu cầu']
    : ['Sai nội dung', 'Thiếu nguồn', 'Khó hiểu', 'Không liên quan']
  const activeRating = pendingRating || rating
  const chooseRating = (nextRating: 'like' | 'dislike') => {
    if (nextRating === 'dislike') {
      setDislikeModalOpen(true)
      return
    }
    setPendingRating(nextRating)
    setShowFeedback(true)
    setFeedbackSent(false)
    setFeedbackError('')
    showToast(nextRating === 'like' ? 'Hãy chọn lý do bạn thấy câu trả lời hữu ích.' : 'Hãy chọn lý do cần cải thiện.', 'info')
  }
  const submitFeedback = async (reason: string) => {
    if (!pendingRating || !onRate) return
    try {
      await onRate(pendingRating, reason)
      setFeedbackSent(true)
      showToast('Đã ghi nhận đánh giá của bạn.')
      setShowFeedback(false)
      setPendingRating(null)
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Không thể gửi phản hồi.')
    }
  }

  const getMessageBg = () => {
    if (isUser) return 'bg-[#173f73] text-white shadow-sm'
    if (isAI) return 'bg-white text-slate-700 shadow-sm'
    if (isSystem) return 'bg-amber-50 text-slate-700'
    if (isError) return 'bg-red-50 text-red-800'
    return 'bg-white text-slate-700'
  }

  const getMessageBorder = () => {
    if (isUser) return 'border-[#173f73]'
    if (isAI) return 'border-slate-200'
    if (isSystem) return 'border-amber-200'
    if (isError) return 'border-red-200'
    return 'border-slate-200'
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
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm
        ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-[#173f73] text-white'}
        ${isSystem && 'bg-amber-100 text-amber-700'}
        ${isError && 'bg-red-100 text-red-700'}`}>
        {isUser ? <UserAvatar src={currentUser?.avatarUrl || currentUser?.avatar} name={currentUser?.name || 'Bạn'} size="md" className="h-9 w-9 bg-slate-200 text-slate-600" /> : getIcon()}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`${isUser ? 'text-right' : 'text-left'} mb-1`}>
          <span className="font-semibold text-sm">
            {isUser ? 'Bạn' : isAI ? 'Legal AI Assistant' : 'Hệ thống'}
          </span>
          <span className="text-xs text-slate-400 ml-2">
            {formatDate(timestamp)}
            {status === 'sending' && ' • Đang gửi...'}
            {status === 'error' && ' • Lỗi'}
          </span>
        </div>

        <div className={`${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`relative inline-block w-fit max-w-[min(100%,48rem)] rounded-2xl border p-4 ${getMessageBg()} ${getMessageBorder()}
              ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          >
            {status === 'error' && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Lỗi
              </div>
            )}

            {/* Message content */}
            {isAI ? (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({ children }) => <ul>{children}</ul>,
                    ol: ({ children }) => <ol>{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-white whitespace-pre-wrap">{content}</p>
            )}

            {isUser && attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">{attachments.map(file => <span key={file.id} className="flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1.5 text-xs"><FileText className="h-3.5 w-3.5" />{file.name}</span>)}</div>
            )}

            {isAI && typeof confidence === 'number' && (
              <div
                className={`mt-4 w-full rounded-xl border px-3.5 py-3 ${
                  confidence >= 75
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
                role="status"
                aria-label={`Độ tin cậy ${confidence}%`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    confidence >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {confidence >= 75
                      ? <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold">Độ tin cậy câu trả lời</span>
                      <span className="text-sm font-bold">{confidence}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          confidence >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {confidence >= 75
                        ? 'Câu trả lời có mức đối chiếu tốt với các nguồn được cung cấp.'
                        : 'Nên kiểm tra lại nguồn pháp lý trước khi sử dụng trong thực tế.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* References section */}
            {isAI && references.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  onClick={() => setShowReferences(!showReferences)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#173f73]"
                >
                  <FileText className="w-4 h-4" />
                  {showReferences ? 'Ẩn nguồn tham khảo' : `Nguồn tham khảo (${references.length})`}
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
                        onClick={() => { setSelectedReference(item); setViewerReference(item) }}
                        className="flex w-full items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-700 transition hover:border-[#173f73]/30 hover:bg-[#f3f7fb]"
                      >
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#173f73]" />
                        <span className="min-w-0 flex-1"><span className="block font-medium">{item.title}</span>{item.page && <span className="mt-1 block text-xs text-slate-500">Trang {item.page}</span>}{item.excerpt && <span className="mt-1 block line-clamp-2 text-xs text-slate-500">{item.excerpt}</span>}</span>
                        <span onClick={(event) => { event.stopPropagation(); void copyReference(item, index) }} className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-white hover:text-[#173f73]">{referenceCopied === index ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    })}
                  </motion.div>
                )}
                {selectedReference && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700"><div className="mb-1 flex items-center justify-between"><strong>{selectedReference.title}</strong><button aria-label="Đóng nguồn" onClick={() => setSelectedReference(null)}><X className="h-4 w-4" /></button></div>{selectedReference.page && <p className="text-xs text-slate-500">Trang {selectedReference.page}</p>}<p className="mt-2 leading-6">{selectedReference.excerpt || 'Bản xem trước chưa có sẵn cho tài liệu này.'}</p></div>}
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
                onClick={() => chooseRating('like')}
                className={`p-2 rounded-lg transition-colors ${activeRating === 'like' ? 'text-green-500' : 'hover:bg-dark-surface text-gray-400'}`}
                title="Thích"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => chooseRating('dislike')}
                className={`p-2 rounded-lg transition-colors ${activeRating === 'dislike' ? 'text-green-500' : 'hover:bg-dark-surface text-gray-400'}`}
                title="Không thích"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {isAI && showFeedback && !feedbackSent && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"><p className="mb-2 font-medium text-slate-700">{pendingRating === 'like' ? 'Điều gì làm câu trả lời hữu ích?' : 'Câu trả lời cần cải thiện ở điểm nào?'}</p><div className="flex flex-wrap gap-2">{feedbackReasons.map(reason => <button key={reason} onClick={() => void submitFeedback(reason)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-[#173f73]/40 hover:bg-[#f3f7fb]">{reason}</button>)}</div>{feedbackError && <p className="mt-2 text-xs text-red-600">{feedbackError}</p>}</div>
          )}
          {isError && onRetry && <button onClick={onRetry} className="mt-2 inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Thử lại câu hỏi</button>}
          {isAI && feedbackSent && <p className="mt-2 text-sm font-medium text-green-600">Cảm ơn bạn đã đánh giá.</p>}
        </div>
      </div>
      <DislikeFeedbackModal
        open={dislikeModalOpen}
        onClose={() => setDislikeModalOpen(false)}
        onSubmit={async (reason, detail) => {
          if (!onRate) return
          await onRate('dislike', reason, detail)
          setFeedbackSent(true)
          showToast('Đã ghi nhận phản hồi cải thiện.')
        }}
      />
      <DocumentViewer reference={viewerReference} onClose={() => { setViewerReference(null); setSelectedReference(null) }} />
    </motion.div>
  )
}
