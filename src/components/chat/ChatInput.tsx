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

interface ChatInputProps {
  onSendMessage: (message: string) => void
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || isLoading) return

    onSendMessage(trimmedMessage)
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
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
      // Default attachment handling
      console.log('Attachment clicked')
    }
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
            disabled={disabled || isLoading}
            rows={1}
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none
                     focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[120px]"
          />
        </div>

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
              loading={isLoading}
              disabled={!message.trim() || disabled}
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
          Nhập câu hỏi pháp lý hoặc sử dụng phím <kbd className="px-1.5 py-0.5 glass-effect rounded text-xs">Enter</kbd> để gửi
        </span>
      </div>
    </div>
  )
}