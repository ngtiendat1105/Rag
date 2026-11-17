'use client'

import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import { ArrowUp, FileText, Info, Paperclip, Square, X } from 'lucide-react'
import type { ChatAttachment } from '@/store/chatStore'
import { MAX_FILE_SIZE } from '@/utils/constants'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chat.module.css'

interface Props {
  inputRef: RefObject<HTMLTextAreaElement>
  value: string
  onValueChange: (value: string) => void
  onSendMessage: (message: string, attachments: ChatAttachment[], files: File[]) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

const MAX_QUESTION_LENGTH = 2000
const MAX_ATTACHMENTS = 5
const attachmentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

function attachmentId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`
}

export default function ChatInput({ inputRef, value, onValueChange, onSendMessage, onCancel, isLoading }: Props) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
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
    const attachments = files.map(file => ({
      id: attachmentId(file), name: file.name, size: file.size, type: file.type,
    }))
    setError(null)
    setIsSubmitting(true)
    onValueChange('')
    try {
      await onSendMessage(question, attachments, files)
      setFiles([])
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

  function addFiles(incoming: FileList | null) {
    if (isBusy || !incoming?.length) return
    const selected = Array.from(incoming)
    if (selected.some(file => !attachmentTypes.includes(file.type) || file.size > MAX_FILE_SIZE)) {
      setError({ draft: value, message: 'Chỉ hỗ trợ PDF, Word hoặc TXT tối đa 10 MB mỗi tệp.' })
      return
    }

    const byId = new Map(files.map(file => [attachmentId(file), file]))
    selected.forEach(file => byId.set(attachmentId(file), file))
    const uniqueFiles = Array.from(byId.values())
    setFiles(uniqueFiles.slice(0, MAX_ATTACHMENTS))
    setError(uniqueFiles.length > MAX_ATTACHMENTS ? { draft: value, message: 'Mỗi câu hỏi hỗ trợ tối đa 5 tệp.' } : null)
  }

  function startDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(!isBusy)
  }

  function endDrag() {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.composer} data-busy={isLoading} onDragEnter={startDrag} onDragOver={event => event.preventDefault()} onDragLeave={endDrag} onDrop={dropFiles}>
        {isDragging && <div className={styles.dragOverlay}>Thả tài liệu PDF, Word hoặc TXT vào đây</div>}
        {files.length > 0 && (
          <ul className={styles.selectedFiles} aria-label="Tệp đính kèm">
            {files.map(file => (
              <li key={attachmentId(file)}>
                <FileText size={15} aria-hidden="true" />
                <span title={file.name}>{file.name}</span>
                <button type="button" className={theme.iconButton} aria-label={`Bỏ tệp ${file.name}`} disabled={isBusy} onClick={() => {
                  setFiles(files.filter(item => attachmentId(item) !== attachmentId(file)))
                  setError(null)
                }}>
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
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
          placeholder="Nhập câu hỏi pháp lý…"
          onKeyDown={handleKeyDown}
          onChange={event => { onValueChange(event.target.value); setError(null) }}
        />
        {errorMessage && <p id={`${inputId}-error`} role="alert" className={styles.composerError}>{errorMessage}</p>}
        <div className={styles.composerControls}>
          <button type="button" className={`${theme.actionButton} ${styles.attachButton}`} aria-label="Đính kèm tài liệu" title="Đính kèm tài liệu" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
            <Paperclip size={17} aria-hidden="true" /> <span>Đính kèm</span>
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" hidden onChange={event => {
            addFiles(event.target.files)
            event.target.value = ''
          }} />
          <span className={styles.keyboardHint}><kbd>Shift</kbd> + <kbd>Enter</kbd> để xuống dòng</span>
          <span className={styles.characterCount}>{value.length.toLocaleString('vi')}/{MAX_QUESTION_LENGTH.toLocaleString('vi')}</span>
          {isLoading ? (
            <button type="button" className={`${theme.actionButton} ${styles.stopButton}`} aria-label="Dừng xử lý câu hỏi" onClick={onCancel}>
              <span>Dừng</span><span className={styles.composerGlyph}><Square size={12} fill="currentColor" aria-hidden="true" /></span>
            </button>
          ) : (
            <button type="submit" className={`${theme.primaryButton} ${styles.sendButton}`} disabled={!canSend} aria-label="Gửi câu hỏi">
              <span>Gửi</span><span className={styles.composerGlyph}><ArrowUp size={17} aria-hidden="true" /></span>
            </button>
          )}
        </div>
      </div>
      <p className={styles.composerNotice}>
        <Info size={14} aria-hidden="true" />
        Kiểm tra nguồn trước khi sử dụng câu trả lời.
      </p>
    </form>
  )
}
