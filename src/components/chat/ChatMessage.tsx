'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Copy, FileText, Scale, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatAttachment, ChatReference } from '@/store/chatStore'
import { formatDate } from '@/utils/formatters'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chat.module.css'

interface Props {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  references?: Array<string | ChatReference>
  attachments?: ChatAttachment[]
  rating?: 'like' | 'dislike' | null
  onRate: (rating: 'like' | 'dislike') => void
}

export default function ChatMessage({
  role, content, timestamp, status = 'sent', references = [], attachments = [], rating, onRate,
}: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
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

  return (
    <article className={styles.message} data-role={role}>
      {!isUser && (
        <div className={styles.assistantIcon}>
          {status === 'error' ? <AlertCircle size={18} aria-hidden="true" /> : <Scale size={18} aria-hidden="true" />}
        </div>
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
              {references.map((reference, index) => {
                const item = typeof reference === 'string' ? { title: reference } : reference
                return (
                  <details className={styles.reference} key={`${item.title}-${index}`}>
                    <summary>
                      <FileText size={16} aria-hidden="true" />
                      <span>{item.title}{item.page ? ` · Trang ${item.page}` : ''}</span>
                      <ChevronDown size={15} aria-hidden="true" />
                    </summary>
                    <p>{item.excerpt || 'Chưa có thông tin chi tiết cho nguồn này.'}</p>
                  </details>
                )
              })}
            </div>
          )}
        </div>

        {showActions && (
          <div className={styles.messageActions}>
            <button type="button" className={theme.iconButton} onClick={copyMessage} title="Sao chép tin nhắn" aria-label="Sao chép tin nhắn">
              {copyStatus === 'copied' ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            </button>
            <button type="button" className={theme.iconButton} onClick={() => onRate('like')} title="Câu trả lời hữu ích" aria-label="Câu trả lời hữu ích" aria-pressed={rating === 'like'}>
              <ThumbsUp size={17} aria-hidden="true" />
            </button>
            <button type="button" className={theme.iconButton} onClick={() => onRate('dislike')} title="Câu trả lời chưa hữu ích" aria-label="Câu trả lời chưa hữu ích" aria-pressed={rating === 'dislike'}>
              <ThumbsDown size={17} aria-hidden="true" />
            </button>
            <span role="status">
              {copyStatus === 'copied' && 'Đã sao chép'}
              {copyStatus === 'error' && 'Không thể sao chép'}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
