'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { AlertCircle, FileSearch, Loader2, MessageSquare, Scale, Send, ThumbsDown } from 'lucide-react'
import ChatDialog from '@/components/tuan/ui/ChatDialog'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './dislikeFeedback.module.css'

interface Props {
  onClose: () => void
  onSubmit: (reason: string, detail: string) => Promise<void>
}

const reasons = [
  { label: 'Sai luật', description: 'Diễn giải hoặc áp dụng quy định chưa đúng.', icon: Scale },
  { label: 'Trích dẫn sai', description: 'Dẫn nhầm nguồn hoặc trích sai nội dung.', icon: FileSearch },
  { label: 'Tối nghĩa', description: 'Câu trả lời khó hiểu hoặc thiếu rõ ràng.', icon: MessageSquare },
]
const maxDetail = 2000

export default function DislikeFeedbackModal({ onClose, onSubmit }: Props) {
  const id = useId()
  const firstReason = useRef<HTMLInputElement>(null)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>, dismiss: () => void) {
    event.preventDefault()
    if (submitting) return
    if (!reason) {
      setError('Vui lòng chọn một lý do.')
      firstReason.current?.focus()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(reason, detail.trim())
      dismiss()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi phản hồi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ChatDialog
      title="Cải thiện câu trả lời"
      description="Phản hồi của bạn giúp cải thiện chất lượng tra cứu."
      icon={<ThumbsDown size={22} />}
      closeLabel="Đóng biểu mẫu"
      onClose={onClose}
      className={styles.dialog}
    >
      {dismiss => (
        <form className={styles.form} onSubmit={event => void submit(event, dismiss)}>
          <div className={styles.body}>
            <fieldset className={styles.reasons} disabled={submitting} aria-describedby={!reason && error ? `${id}-error` : undefined}>
              <legend>Lý do phản hồi</legend>
              {reasons.map(({ label, description, icon: Icon }, index) => {
                const reasonId = `${id}-reason-${index}`
                return (
                  <label className={styles.reason} key={label}>
                    <input
                      ref={index === 0 ? firstReason : undefined}
                      type="radio"
                      name={`${id}-reason`}
                      value={label}
                      checked={reason === label}
                      onChange={() => { setReason(label); setError('') }}
                      aria-labelledby={reasonId}
                      aria-describedby={`${reasonId}-description`}
                    />
                    <span className={styles.reasonIcon}><Icon size={18} aria-hidden="true" /></span>
                    <span>
                      <strong id={reasonId}>{label}</strong>
                      <small id={`${reasonId}-description`}>{description}</small>
                    </span>
                  </label>
                )
              })}
            </fieldset>

            <div className={styles.detail}>
              <label htmlFor={`${id}-detail`}>Chi tiết phản hồi <span>(không bắt buộc)</span></label>
              <textarea
                id={`${id}-detail`}
                value={detail}
                maxLength={maxDetail}
                rows={3}
                placeholder="Mô tả điểm cần sửa…"
                disabled={submitting}
                onChange={event => {
                  setDetail(event.target.value)
                  if (reason) setError('')
                }}
              />
              <span className={styles.count} aria-hidden="true">{detail.length.toLocaleString('vi')}/{maxDetail.toLocaleString('vi')}</span>
            </div>
          </div>

          <footer className={styles.footer}>
            {error && <p id={`${id}-error`} className={styles.error} role="alert"><AlertCircle size={16} aria-hidden="true" /> {error}</p>}
            <div className={styles.actions}>
              <button type="button" className={theme.actionButton} onClick={dismiss}>Hủy</button>
              <button type="submit" className={theme.primaryButton} disabled={submitting} aria-busy={submitting}>
                {submitting
                  ? <><Loader2 className={styles.spinner} size={16} aria-hidden="true" /> Đang gửi…</>
                  : <><Send size={16} aria-hidden="true" /> Gửi phản hồi</>}
              </button>
            </div>
          </footer>
        </form>
      )}
    </ChatDialog>
  )
}
