'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image, 
  X,
  FileText,
  Search,
  Smile
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ChatAttachment } from '@/store/chatStore'

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  allowAttachments?: boolean
  onAttachmentClick?: () => void
}

export default function ChatInput({
  onSendMessage,
  placeholder = 'Nhập câu hỏi về pháp lý...',
  disabled = false,
  isLoading = false,
  allowAttachments = true,
  onAttachmentClick,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [moderationError, setModerationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || isLoading || isSubmitting) return

    setModerationError('')
    setIsSubmitting(true)
    try {
      await onSendMessage(trimmedMessage, attachments)
      setMessage('')
      setAttachments([])
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : 'Không thể gửi tin nhắn. Vui lòng thử lại.')
      textareaRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (moderationError) setModerationError('')
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleAttachmentClick = () => {
    if (onAttachmentClick) {
      onAttachmentClick()
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const selected = Array.from(files)
    const invalid = selected.find(file => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024)
    if (invalid) {
      setAttachmentError('Chỉ hỗ trợ PDF, Word, TXT tối đa 10 MB mỗi tệp.')
      return
    }
    setAttachmentError('')
    setAttachments(current => [...current, ...selected.map(file => ({ id: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, size: file.size, type: file.type }))].slice(0, 5))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const quickQuestions = [
    'Quy định nghỉ phép năm?',
    'Hợp đồng lao động mẫu?',
    'Cách tính bảo hiểm xã hội?',
    'Chính sách tăng lương?',
  ]

  return (
    <div className="space-y-4">
      {/* Quick questions */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((question, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMessage(question)}
            className="px-3 py-1.5 glass-effect-light rounded-full text-sm hover:bg-dark-surface transition-colors"
          >
            {question}
          </motion.button>
        ))}
      </div>

      {/* Input area */}
      <div className={`relative glass-effect rounded-2xl border transition-all duration-300
        ${isFocused ? 'border-primary-500/50 ring-2 ring-primary-500/20' : 'border-dark-border'}`}>
        
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAttachmentClick}
              disabled={disabled || !allowAttachments}
              className="p-2 rounded-lg hover:bg-dark-surface transition-colors disabled:opacity-50"
              title="Đính kèm tài liệu"
            >
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={event => handleFiles(event.target.files)} />
            
            <button
              className="p-2 rounded-lg hover:bg-dark-surface transition-colors disabled:opacity-50"
              title="Tìm kiếm trong tài liệu"
            >
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            
            <button
              className="p-2 rounded-lg hover:bg-dark-surface transition-colors disabled:opacity-50"
              title="Chèn biểu tượng cảm xúc"
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {message.length}/2000
            </span>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading || isSubmitting}
            rows={1}
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none
                     focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[120px]"
          />
        </div>

        {(attachments.length > 0 || attachmentError) && (
          <div className="border-b border-dark-border px-3 py-3">
            {attachmentError && <p role="alert" className="mb-2 text-sm text-red-300">{attachmentError}</p>}
            <div className="flex flex-wrap gap-2">{attachments.map(file => (
              <span key={file.id} className="flex max-w-full items-center gap-2 rounded-lg bg-primary-500/10 px-3 py-2 text-xs text-primary-200">
                <FileText className="h-3.5 w-3.5 shrink-0" /><span className="max-w-48 truncate">{file.name}</span><span className="text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button type="button" aria-label={`Bỏ tệp ${file.name}`} onClick={() => setAttachments(current => current.filter(item => item.id !== file.id))}><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}</div>
          </div>
        )}

        {moderationError && (
          <div role="alert" className="mx-3 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {moderationError}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between p-3 border-t border-dark-border">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <Mic className="w-4 h-4" />
              <span>Voice input</span>
            </button>
            
            <div className="w-px h-4 bg-dark-border" />
            
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <Image className="w-4 h-4" />
              <span>Hình ảnh</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {message && (
              <button
                onClick={() => setMessage('')}
                className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
            
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="sm"
              loading={isLoading || isSubmitting}
              disabled={!message.trim() || disabled || isSubmitting}
              icon={<Send className="w-4 h-4" />}
            >
              Gửi
            </Button>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FileText className="w-3 h-3" />
        <span>
          Hãy sử dụng ngôn ngữ lịch sự. Nhấn <kbd className="px-1.5 py-0.5 glass-effect rounded text-xs">Enter</kbd> để gửi
        </span>
      </div>
    </div>
  )
}
