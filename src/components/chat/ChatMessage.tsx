'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, ChevronRight, Copy, FileText, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DislikeFeedbackModal from '@/components/chat/DislikeFeedbackModal'
import BrandMark from '@/components/tuan/ui/BrandMark'
import { useToast } from '@/components/ui/ToastProvider'
import type { ChatAttachment, ChatReference } from '@/store/chatStore'
import { formatDate } from '@/utils/formatters'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chat.module.css'

interface Props {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  references?: Array<string | ChatReference>
  attachments?: ChatAttachment[]
  rating?: 'like' | 'dislike' | null
  selectedReferenceIndex?: number
  onSelectReference: (reference: ChatReference, index: number, trigger: HTMLButtonElement) => void
  onRate: (rating: 'like' | 'dislike', reason: string, detail?: string) => Promise<void>
  onRetry?: () => void
  retryLabel?: string
  retryDisabled?: boolean
}

const likeReasons = ['Đúng và hữu ích', 'Nguồn rõ ràng', 'Dễ hiểu', 'Đúng nhu cầu']

export default function ChatMessage({
  id, role, content, timestamp, status = 'sent', references = [], attachments = [], rating,
  selectedReferenceIndex, onSelectReference, onRate,
  onRetry, retryLabel = 'Thử lại câu hỏi', retryDisabled,
}: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showLikeReasons, setShowLikeReasons] = useState(false)
  const [showDislikeForm, setShowDislikeForm] = useState(false)
  const [submittingLike, setSubmittingLike] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const dislikeTrigger = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()
  const isUser = role === 'user'
  const isAssistant = role === 'assistant'
  const showActions = isAssistant && status !== 'error'

  useEffect(() => {
    if (copyStatus === 'idle') return
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2000)
    return () => window.clearTimeout(timer)
  }, [copyStatus])

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(content)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  async function submitLike(reason: string) {
    setSubmittingLike(true)
    setFeedbackError('')
    try {
      await onRate('like', reason)
      setShowLikeReasons(false)
      showToast('Đã ghi nhận đánh giá của bạn.')
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Không thể gửi phản hồi.')
    } finally {
      setSubmittingLike(false)
    }
  }

  return (
    <article className={styles.message} data-role={role} data-message-id={id}>
      {!isUser && (
        status === 'error'
          ? <div className={styles.assistantIcon}><AlertCircle size={18} aria-hidden="true" /></div>
          : <BrandMark className={styles.assistantMark} size={34} />
      )}
      <div className={styles.messageBody}>
        <div className={styles.messageMeta}>
          <strong>{isUser ? 'Bạn' : isAssistant ? 'Legal AI' : 'Hệ thống'}</strong>
          <time dateTime={timestamp}>{formatDate(timestamp)}</time>
          {isUser && status === 'sending' && <span>Đang gửi…</span>}
          {isUser && status === 'error' && <span>Gửi thất bại</span>}
        </div>

        <div className={styles.messageContent} data-status={status}>
          {isAssistant && status !== 'error' ? (
            <div className={styles.markdown}><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
          {isUser && attachments.length > 0 && (
            <ul className={styles.attachmentList}>
              {attachments.map(file => <li key={file.id}><FileText size={15} aria-hidden="true" />{file.name}</li>)}
            </ul>
          )}
          {showActions && references.length > 0 && (
            <div className={styles.references}>
              <p>Nguồn tham chiếu ({references.length})</p>
              <ul aria-label="Tài liệu trích dẫn">
                {references.map((reference, index) => {
                  const item = typeof reference === 'string' ? { title: reference } : reference
                  return (
                    <li key={`${item.title}-${index}`}>
                      <button type="button" className={styles.reference} aria-pressed={selectedReferenceIndex === index}
                        aria-label={item.page ? `${item.title} · Trang ${item.page}` : item.title}
                        onClick={event => onSelectReference(item, index, event.currentTarget)}>
                        <span className={styles.referenceIcon}><FileText size={17} aria-hidden="true" /></span>
                        <span className={styles.referenceCopy}>
                          <strong>{item.title}</strong>
                          {item.page && <small>Trang {item.page}</small>}
                        </span>
                        <ChevronRight className={styles.referenceArrow} size={16} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {showActions && (
          <div className={styles.messageActions}>
            <div className={styles.messageTools} role="group" aria-label="Thao tác với câu trả lời">
              <button type="button" className={theme.iconButton} onClick={copyMessage} title="Sao chép tin nhắn" aria-label="Sao chép tin nhắn">
                {copyStatus === 'copied' ? <Check className={styles.copiedIcon} size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
              </button>
              <button type="button" className={theme.iconButton} onClick={() => {
                setShowLikeReasons(!showLikeReasons)
                setFeedbackError('')
              }} title="Câu trả lời hữu ích" aria-label="Câu trả lời hữu ích" aria-pressed={rating === 'like'} aria-expanded={showLikeReasons} disabled={submittingLike}>
                <ThumbsUp size={17} aria-hidden="true" />
              </button>
              <button ref={dislikeTrigger} type="button" className={`${theme.iconButton} ${styles.negativeAction}`} onClick={() => {
                setShowLikeReasons(false)
                setShowDislikeForm(true)
              }} title="Câu trả lời chưa hữu ích" aria-label="Câu trả lời chưa hữu ích" aria-pressed={rating === 'dislike'} aria-haspopup="dialog" disabled={submittingLike}>
                <ThumbsDown size={17} aria-hidden="true" />
              </button>
            </div>
            <span role="status">
              {copyStatus === 'copied' && 'Đã sao chép'}
              {copyStatus === 'error' && 'Không thể sao chép'}
            </span>
          </div>
        )}
        {showLikeReasons && (
          <div className={styles.feedback}>
            <p>Điều gì làm câu trả lời hữu ích?</p>
            <div className={styles.feedbackReasons}>
              {likeReasons.map(reason => (
                <button key={reason} type="button" className={theme.actionButton} disabled={submittingLike} onClick={() => void submitLike(reason)}>
                  {reason}
                </button>
              ))}
            </div>
            {feedbackError && <p role="alert">{feedbackError}</p>}
          </div>
        )}
        {onRetry && (
          <button type="button" className={theme.actionButton} disabled={retryDisabled} onClick={onRetry}>
            <RotateCcw size={16} aria-hidden="true" /> {retryLabel}
          </button>
        )}
      </div>
      {showDislikeForm && (
        <DislikeFeedbackModal onClose={() => {
          setShowDislikeForm(false)
          dislikeTrigger.current?.focus()
        }} onSubmit={async (reason, detail) => {
          await onRate('dislike', reason, detail)
          showToast('Đã ghi nhận phản hồi cải thiện.')
        }} />
      )}
    </article>
  )
}
