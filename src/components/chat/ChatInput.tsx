'use client'

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import { ArrowUp, Info } from 'lucide-react'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chat.module.css'

interface Props {
  inputRef: RefObject<HTMLTextAreaElement>
  value: string
  onValueChange: (value: string) => void
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
}

const MAX_QUESTION_LENGTH = 2000

export default function ChatInput({ inputRef, value, onValueChange, onSendMessage, isLoading }: Props) {
  const inputId = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<{ draft: string; message: string } | null>(null)
  const isBusy = isLoading || isSubmitting
  const canSend = value.trim().length >= 2 && !isBusy
  const errorMessage = error?.draft === value ? error.message : ''

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${input.scrollHeight}px`
  }, [inputRef, value])

  async function submit() {
    if (!canSend) return
    const question = value.trim()
    setError(null)
    setIsSubmitting(true)
    onValueChange('')
    try {
      await onSendMessage(question)
    } catch (cause) {
      onValueChange(value)
      setError({
        draft: value,
        message: cause instanceof Error ? cause.message : 'Không thể gửi câu hỏi. Vui lòng thử lại.',
      })
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.composer}>
        <label className="sr-only" htmlFor={inputId}>Câu hỏi pháp lý</label>
        <textarea
          ref={inputRef}
          id={inputId}
          value={value}
          rows={1}
          maxLength={MAX_QUESTION_LENGTH}
          readOnly={isBusy}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `${inputId}-error` : undefined}
          placeholder="Nhập câu hỏi pháp lý hoặc quy định nội bộ…"
          onKeyDown={handleKeyDown}
          onChange={event => { onValueChange(event.target.value); setError(null) }}
        />
        {errorMessage && <p id={`${inputId}-error`} role="alert" className={styles.composerError}>{errorMessage}</p>}
        <div className={styles.composerControls}>
          <span className={styles.keyboardHint}>Shift + Enter để xuống dòng</span>
          <span className={styles.characterCount}>{value.length.toLocaleString('vi')}/{MAX_QUESTION_LENGTH.toLocaleString('vi')}</span>
          <button type="submit" className={theme.primaryButton} disabled={!canSend} aria-label="Gửi câu hỏi">
            <span>Gửi</span>
            <ArrowUp size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className={styles.composerNotice}>
        <Info size={14} aria-hidden="true" />
        Kiểm tra nguồn trước khi sử dụng câu trả lời.
      </p>
    </form>
  )
}
