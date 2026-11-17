'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  ChevronDown,
  Download,
  FileText,
  LogOut,
  Moon,
  PanelLeft,
  Scale,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react'
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import ChatInput from '@/components/chat/ChatInput'
import ChatMessage from '@/components/chat/ChatMessage'
import TypingIndicator from '@/components/chat/TypingIndicator'
import type { User } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './workspace.module.css'

const suggestions = [
  { icon: Briefcase, label: 'Hợp đồng lao động', question: 'Cần lưu ý gì khi ký hợp đồng lao động?' },
  { icon: BookOpen, label: 'Nghỉ phép năm', question: 'Người lao động được nghỉ phép năm bao nhiêu ngày?' },
  { icon: FileText, label: 'Bảo hiểm xã hội', question: 'Mức đóng bảo hiểm xã hội được xác định như thế nào?' },
]

interface Props {
  user: User
  onLogout: () => void
}

export default function ChatWorkspace({ user, onLogout }: Props) {
  const {
    chats, activeChatId, isTyping, processingStage, setActiveChat,
    createNewChat, sendMessage, deleteChat, archiveChat, rateMessage,
  } = useChatStore()
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light')
  const [draft, setDraft] = useState('')
  const [nearBottom, setNearBottom] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  const activeChat = chats.find(chat => chat.id === activeChatId)
  const messages = activeChat?.messages
  const waitingForReply = isTyping && messages?.[messages.length - 1]?.status === 'sending'
  const hasMessages = Boolean(messages?.length)

  useEffect(() => {
    if (localStorage.getItem('legalai-theme') === 'dark') setAppearance('dark')

    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeDrawerOnDesktop = () => {
      if (desktop.matches) drawerRef.current?.close()
    }
    desktop.addEventListener('change', closeDrawerOnDesktop)
    return () => desktop.removeEventListener('change', closeDrawerOnDesktop)
  }, [])

  useEffect(() => {
    const transcript = transcriptRef.current
    if (transcript && nearBottom) transcript.scrollTop = transcript.scrollHeight
  }, [messages, waitingForReply, nearBottom])

  function applyTheme() {
    const next = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(next)
    localStorage.setItem('legalai-theme', next)
  }

  function closeDrawer() {
    drawerRef.current?.close()
  }

  function startChat() {
    createNewChat()
    setDraft('')
    setNearBottom(true)
    closeDrawer()
    inputRef.current?.focus()
  }

  function selectChat(id: string) {
    if (id !== activeChatId) {
      setActiveChat(id)
      setDraft('')
      setNearBottom(true)
    }
    closeDrawer()
  }

  async function submitQuestion(question: string) {
    setNearBottom(true)
    await sendMessage(question)
  }

  function exportChat() {
    if (!activeChat) return
    const content = activeChat.messages.map(message => {
      const name = message.role === 'user' ? 'Bạn' : 'Legal AI'
      return `${name}: ${message.content}`
    }).join('\n\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `legal-ai-${activeChat.id}.txt`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const sidebarProps = {
    chats, activeChatId,
    onChatSelect: selectChat, onNewChat: startChat, onDeleteChat: deleteChat, onArchiveChat: archiveChat,
  }

  return (
    <main className={`${theme.theme} ${styles.workspace}`} data-theme={appearance}>
      <div className={styles.desktopSidebar}>
        <ChatHistorySidebar {...sidebarProps} />
      </div>

      <section className={styles.main} aria-label="Không gian tra cứu pháp lý">
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <button
              type="button"
              className={`${theme.iconButton} ${styles.drawerTrigger}`}
              aria-label="Mở lịch sử trò chuyện"
              aria-haspopup="dialog"
              onClick={() => drawerRef.current?.showModal()}
            >
              <PanelLeft size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className={styles.breadcrumb}>Không gian làm việc</p>
              <p className={styles.conversationTitle} title={activeChat?.title}>
                {activeChat?.title ?? 'Tra cứu pháp lý'}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            {activeChat && activeChat.status !== 'archived' && hasMessages && (
              <button type="button" aria-label="Lưu trữ hội thoại" title="Lưu trữ hội thoại" className={theme.iconButton} onClick={() => archiveChat(activeChat.id)}>
                <Archive size={18} aria-hidden="true" />
              </button>
            )}
            {hasMessages && (
              <button type="button" aria-label="Xuất hội thoại" title="Xuất hội thoại" className={`${theme.actionButton} ${styles.exportButton}`} onClick={exportChat}>
                <Download size={18} aria-hidden="true" />
                <span>Xuất hội thoại</span>
              </button>
            )}
            <details
              className={styles.account}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
              }}
              onKeyDown={event => {
                if (event.key === 'Escape' && event.currentTarget.open) {
                  event.currentTarget.open = false
                  event.currentTarget.querySelector('summary')?.focus()
                }
              }}
            >
              <summary className={theme.actionButton} aria-label="Tài khoản">
                <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toLocaleUpperCase('vi') || 'L'}</span>
                <span className={styles.accountName}>{user.name}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div className={styles.accountOptions}>
                <button type="button" className={theme.actionButton} onClick={applyTheme}>
                  {appearance === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
                  {appearance === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
                </button>
                <Link className={theme.actionButton} href="/profile">
                  <UserIcon size={17} aria-hidden="true" />
                  Hồ sơ cá nhân
                </Link>
                <button type="button" className={theme.actionButton} onClick={onLogout}>
                  <LogOut size={17} aria-hidden="true" />
                  Đăng xuất
                </button>
              </div>
            </details>
          </div>
        </header>

        <div
          ref={transcriptRef}
          className={styles.scrollArea}
          onScroll={event => {
            const { scrollHeight, scrollTop, clientHeight } = event.currentTarget
            setNearBottom(scrollHeight - scrollTop - clientHeight < 80)
          }}
        >
          {hasMessages ? (
            <div className={styles.transcript} role="log" aria-label="Tin nhắn hội thoại">
              <h1 className="sr-only">{activeChat?.title}</h1>
              {messages?.map(message => (
                <ChatMessage key={message.id} {...message} onRate={rating => rateMessage(message.id, rating)} />
              ))}
              {waitingForReply && <TypingIndicator message={processingStage} />}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emblem}><Scale size={29} strokeWidth={1.6} aria-hidden="true" /></div>
              <h1>Bạn muốn tra cứu gì?</h1>
              <p>Đặt câu hỏi về quy định pháp luật và tài liệu nội bộ. Bạn có thể mở nguồn tham chiếu ngay trong câu trả lời.</p>
              <ul className={styles.suggestions} aria-label="Gợi ý câu hỏi">
                {suggestions.map(({ icon: Icon, label, question }) => (
                  <li key={label}>
                    <button type="button" onClick={() => { setDraft(question); inputRef.current?.focus() }} disabled={isTyping}>
                      <Icon size={19} aria-hidden="true" />
                      <span><strong>{label}</strong><span>{question}</span></span>
                      <ArrowUpRight className={styles.suggestionArrow} size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.composerRegion}>
          {hasMessages && !nearBottom && (
            <button type="button" className={`${theme.actionButton} ${styles.scrollButton}`} onClick={() => setNearBottom(true)}>
              <ArrowDown size={16} aria-hidden="true" /> Đến tin mới nhất
            </button>
          )}
          <ChatInput
            inputRef={inputRef}
            value={draft}
            onValueChange={setDraft}
            onSendMessage={submitQuestion}
            isLoading={isTyping}
          />
        </div>
      </section>

      <dialog
        ref={drawerRef}
        className={styles.drawer}
        aria-label="Lịch sử trò chuyện"
        onClick={event => { if (event.target === event.currentTarget) closeDrawer() }}
      >
        <div className={styles.drawerBody}>
          <button type="button" className={`${theme.iconButton} ${styles.closeDrawer}`} aria-label="Đóng lịch sử trò chuyện" onClick={closeDrawer}>
            <X size={20} aria-hidden="true" />
          </button>
          <ChatHistorySidebar {...sidebarProps} />
        </div>
      </dialog>
    </main>
  )
}
