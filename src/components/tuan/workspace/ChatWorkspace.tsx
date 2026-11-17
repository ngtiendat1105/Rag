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
  Copy,
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
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/ToastProvider'
import UserAvatar from '@/components/ui/UserAvatar'
import type { User } from '@/store/authStore'
import { useChatStore, type ChatAttachment } from '@/store/chatStore'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './workspace.module.css'

const suggestions = [
  { icon: Briefcase, label: 'Hợp đồng lao động', question: 'Cần lưu ý gì khi ký hợp đồng lao động?' },
  { icon: BookOpen, label: 'Nghỉ phép năm', question: 'Người lao động được nghỉ phép năm bao nhiêu ngày?' },
  { icon: FileText, label: 'Bảo hiểm xã hội', question: 'Mức đóng bảo hiểm xã hội được xác định như thế nào?' },
]

const guide = `HƯỚNG DẪN SỬ DỤNG TRỢ LÝ PHÁP LÝ NỘI BỘ

1. Đặt câu hỏi cụ thể, nêu số điều, tên văn bản hoặc phòng ban nếu bạn biết.
2. Mở nguồn tham chiếu để đối chiếu câu trả lời với văn bản gốc.
3. Lưu trữ, bỏ lưu trữ hoặc xuất hội thoại thành tệp .txt khi cần.
4. Chọn Thử lại nếu dịch vụ gặp lỗi. Tránh gửi dữ liệu cá nhân hoặc thông tin mật không cần thiết.`

function downloadText(content: string, name: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface Props {
  user: User
  onLogout: () => void
}

export default function ChatWorkspace({ user, onLogout }: Props) {
  const {
    chats, activeChatId, isTyping, processingStage, setActiveChat,
    createNewChat, sendMessage, cancelMessage, retryMessage, deleteChat, archiveChat, unarchiveChat, rateMessage,
  } = useChatStore()
  const { showToast } = useToast()
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light')
  const [draft, setDraft] = useState('')
  const [composerVersion, setComposerVersion] = useState(0)
  const [nearBottom, setNearBottom] = useState(true)
  const [popularQuestions, setPopularQuestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showGuide, setShowGuide] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  const activeChat = chats.find(chat => chat.id === activeChatId)
  const deleteTarget = chats.find(chat => chat.id === deleteTargetId)
  const messages = activeChat?.messages
  const waitingForReply = isTyping && messages?.[messages.length - 1]?.status === 'sending'
  const hasMessages = Boolean(messages?.length)
  const latestReply = messages?.slice().reverse().find(message => message.role === 'assistant' && message.status !== 'error')
  const questions = latestReply?.suggestions?.length ? latestReply.suggestions : popularQuestions

  useEffect(() => {
    if (sessionStorage.getItem('chat-suggestions-hidden') === 'true') {
      setShowSuggestions(false)
      return
    }
    const controller = new AbortController()
    fetch('/api/popular-questions?limit=5', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!controller.signal.aborted && Array.isArray(data?.questions)) {
          const values = data.questions
            .map((item: { question?: string } | null) => item?.question)
            .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0) as string[]
          setPopularQuestions(values)
        }
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

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
    setComposerVersion(version => version + 1)
    setNearBottom(true)
    closeDrawer()
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function selectChat(id: string) {
    if (id !== activeChatId) {
      setActiveChat(id)
      setDraft('')
      setComposerVersion(version => version + 1)
      setNearBottom(true)
    }
    closeDrawer()
  }

  function fillDraft(question: string) {
    setDraft(question)
    inputRef.current?.focus()
  }

  async function submitQuestion(question: string, attachments: ChatAttachment[], files: File[]) {
    setNearBottom(true)
    await sendMessage(question, attachments, files)
  }

  function exportChat(id: string) {
    const chat = chats.find(item => item.id === id)
    if (!chat) return
    const content = chat.messages.map(message => {
      const name = message.role === 'user' ? 'Bạn' : 'Legal AI'
      return `${name}: ${message.content}`
    }).join('\n\n')
    downloadText(content, `legal-ai-${chat.id}.txt`)
  }

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(guide)
      showToast('Đã sao chép hướng dẫn.')
    } catch {
      showToast('Không thể sao chép hướng dẫn.', 'info')
    }
  }

  const sidebarProps = {
    chats, activeChatId,
    onChatSelect: selectChat, onNewChat: startChat, onArchiveChat: archiveChat,
    onUnarchiveChat: unarchiveChat, onExportChat: exportChat,
    onDeleteChat: (id: string) => { closeDrawer(); setDeleteTargetId(id) },
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
            {activeChat && hasMessages && (
              <button type="button" aria-label="Xuất hội thoại" title="Xuất hội thoại" className={`${theme.actionButton} ${styles.exportButton}`} onClick={() => exportChat(activeChat.id)}>
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
                {user.avatarUrl || user.avatar
                  ? <UserAvatar src={user.avatarUrl || user.avatar} name={user.name} />
                  : <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toLocaleUpperCase('vi') || 'L'}</span>}
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
                <button type="button" className={theme.actionButton} onClick={() => setShowGuide(true)}>
                  <BookOpen size={17} aria-hidden="true" /> Hướng dẫn sử dụng
                </button>
                <button type="button" className={theme.actionButton} onClick={() => setConfirmLogout(true)}>
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
              {messages?.map((message, index) => {
                const previous = messages[index - 1]
                const failedQuestion = message.role === 'assistant' && message.status === 'error' && previous?.role === 'user' ? previous : null
                const needsFiles = Boolean(failedQuestion?.attachments?.length)
                return (
                  <ChatMessage
                    key={message.id}
                    {...message}
                    onRate={(rating, reason, detail) => rateMessage(message.id, rating, reason, message.content, detail)}
                    onRetry={failedQuestion ? () => {
                      if (needsFiles) {
                        fillDraft(failedQuestion.content)
                        showToast('Hãy chọn lại tệp đính kèm trước khi gửi.', 'info')
                        return
                      }
                      setNearBottom(true)
                      void retryMessage(message.id)
                    } : undefined}
                    retryLabel={needsFiles ? 'Soạn lại câu hỏi' : undefined}
                    retryDisabled={isTyping}
                  />
                )
              })}
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
                    <button type="button" onClick={() => fillDraft(question)} disabled={isTyping}>
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
          {showSuggestions && questions.length > 0 && (
            <div className={styles.questionSuggestions}>
              <div role="group" aria-label="Câu hỏi gợi ý">
                {Array.from(new Set(questions)).map(question => (
                  <button key={question} title={question} type="button" className={theme.actionButton} disabled={isTyping} onClick={() => fillDraft(question)}>
                    <span>{question}</span>
                  </button>
                ))}
              </div>
              <button className={theme.iconButton} aria-label="Ẩn câu hỏi gợi ý" type="button" onClick={() => {
                sessionStorage.setItem('chat-suggestions-hidden', 'true')
                setShowSuggestions(false)
              }}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          <ChatInput
            key={composerVersion}
            inputRef={inputRef}
            value={draft}
            onValueChange={setDraft}
            onSendMessage={submitQuestion}
            onCancel={cancelMessage}
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
      {deleteTarget && (
        <ConfirmDialog isOpen title="Xóa cuộc trò chuyện?" message={`“${deleteTarget.title}” sẽ bị xóa khỏi lịch sử trên thiết bị này.`} confirmLabel="Xóa cuộc trò chuyện" onClose={() => setDeleteTargetId(null)} onConfirm={() => {
          deleteChat(deleteTarget.id)
          setDeleteTargetId(null)
        }} />
      )}
      {confirmLogout && (
        <ConfirmDialog isOpen title="Đăng xuất khỏi hệ thống?" message="Phiên làm việc hiện tại sẽ kết thúc trên thiết bị này." confirmLabel="Đăng xuất" onClose={() => setConfirmLogout(false)} onConfirm={onLogout} />
      )}
      {showGuide && (
        <Modal isOpen title="Hướng dẫn sử dụng" tone="light" size="sm" onClose={() => setShowGuide(false)}>
          <p className="max-h-[50dvh] overflow-auto whitespace-pre-line text-sm leading-relaxed">{guide}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-slate-700">
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm" onClick={() => void copyGuide()}>
              <Copy size={16} aria-hidden="true" /> Sao chép
            </button>
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm" onClick={() => downloadText(guide, 'huong-dan-su-dung-chatbot.txt')}>
              <Download size={16} aria-hidden="true" /> Xuất hướng dẫn
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
