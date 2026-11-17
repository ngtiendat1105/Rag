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
  PanelLeft,
  User as UserIcon,
  X,
} from 'lucide-react'
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import ChatInput from '@/components/chat/ChatInput'
import ChatMessage from '@/components/chat/ChatMessage'
import DocumentViewer from '@/components/chat/DocumentViewer'
import TypingIndicator from '@/components/chat/TypingIndicator'
import SourceInspector from '@/components/tuan/sources/SourceInspector'
import BrandMark from '@/components/tuan/ui/BrandMark'
import ThemeSwitch from '@/components/tuan/ui/ThemeSwitch'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import UserAvatar from '@/components/ui/UserAvatar'
import type { User } from '@/store/authStore'
import { useChatStore, type ChatAttachment, type ChatReference } from '@/store/chatStore'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './workspace.module.css'
import ChatGuide from './ChatGuide'

const suggestions = [
  { icon: Briefcase, label: 'Hợp đồng lao động', question: 'Cần lưu ý gì khi ký hợp đồng lao động?' },
  { icon: BookOpen, label: 'Nghỉ phép năm', question: 'Người lao động được nghỉ phép năm bao nhiêu ngày?' },
  { icon: FileText, label: 'Bảo hiểm xã hội', question: 'Mức đóng bảo hiểm xã hội được xác định như thế nào?' },
]

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

interface SourceSelection {
  chatId: string | null
  messageId: string
  index: number
  reference: ChatReference
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
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const visibleMessages = useRef<{ chatId: string | null; ids: Set<string> } | null>(null)
  const accountRef = useRef<HTMLDetailsElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  const sourceTriggerRef = useRef<HTMLButtonElement | null>(null)
  const activeChat = chats.find(chat => chat.id === activeChatId)
  const deleteTarget = chats.find(chat => chat.id === deleteTargetId)
  const messages = activeChat?.messages
  const selectedSource = sourceSelection?.chatId === activeChatId ? sourceSelection : null
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

  useEffect(() => {
    const previous = visibleMessages.current
    visibleMessages.current = { chatId: activeChatId, ids: new Set(messages?.map(message => message.id)) }
    const firstSend = previous?.chatId === null && messages?.length === 1 && waitingForReply
    if (!previous || (previous.chatId !== activeChatId && !firstSend)) return
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return

    transcriptRef.current?.querySelectorAll<HTMLElement>('[data-message-id]').forEach(entry => {
      const id = entry.dataset.messageId
      if (!id || previous.ids.has(id)) return
      const offset = entry.dataset.role === 'user' ? 8 : -8
      entry.animate(
        [{ opacity: 0.45, transform: `translate(${offset}px, 6px)` }, { opacity: 1, transform: 'translate(0, 0)' }],
        { duration: 290, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
    })
  }, [activeChatId, messages, waitingForReply])

  function applyTheme() {
    const next = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(next)
    localStorage.setItem('legalai-theme', next)
  }

  function closeDrawer() {
    drawerRef.current?.close()
  }

  function startChat() {
    setSourceSelection(null)
    setPreviewing(false)
    createNewChat()
    setDraft('')
    setComposerVersion(version => version + 1)
    setNearBottom(true)
    closeDrawer()
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function selectChat(id: string) {
    if (id !== activeChatId) {
      setSourceSelection(null)
      setPreviewing(false)
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

  function closeSource() {
    setSourceSelection(null)
    setPreviewing(false)
    if (sourceTriggerRef.current?.isConnected) sourceTriggerRef.current.focus()
    sourceTriggerRef.current = null
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

  const sidebarProps = {
    chats, activeChatId,
    onChatSelect: selectChat, onNewChat: startChat, onArchiveChat: archiveChat,
    onUnarchiveChat: unarchiveChat, onExportChat: exportChat,
    onDeleteChat: (id: string) => { closeDrawer(); setDeleteTargetId(id) },
  }

  const questionSuggestions = showSuggestions && questions.length > 0 && (
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
  )

  return (
    <main className={`${theme.theme} ${styles.workspace}`} data-theme={appearance} data-source-open={Boolean(selectedSource)}>
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
              <p className={styles.conversationTitle} title={activeChat?.title}>
                {activeChat?.title ?? 'Tra cứu pháp lý'}
              </p>
              {activeChat?.status === 'archived' && <p className={styles.conversationStatus}>Đã lưu trữ</p>}
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
              ref={accountRef}
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
                <ThemeSwitch dark={appearance === 'dark'} onToggle={applyTheme} />
                <Link className={theme.actionButton} href="/profile">
                  <UserIcon size={17} aria-hidden="true" />
                  Hồ sơ cá nhân
                </Link>
                <button type="button" className={theme.actionButton} aria-haspopup="dialog" onClick={() => {
                  if (accountRef.current) accountRef.current.open = false
                  setShowGuide(true)
                }}>
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

        <div className={styles.stage} data-empty={!hasMessages}>
          {hasMessages && (
            <div
              ref={transcriptRef}
              className={styles.scrollArea}
              onScroll={event => {
                const { scrollHeight, scrollTop, clientHeight } = event.currentTarget
                setNearBottom(scrollHeight - scrollTop - clientHeight < 80)
              }}
            >
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
                      selectedReferenceIndex={selectedSource?.messageId === message.id ? selectedSource.index : undefined}
                      onSelectReference={(reference, sourceIndex, trigger) => {
                        sourceTriggerRef.current = trigger
                        setSourceSelection({ chatId: activeChatId, messageId: message.id, index: sourceIndex, reference })
                      }}
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
            </div>
          )}

          <div className={styles.composerRegion}>
            {!hasMessages && (
              <div className={styles.emptyIntro}>
                <div className={styles.emblem}><BrandMark size={66} /></div>
                <h1>Bạn muốn tra cứu gì?</h1>
                <p>Hỏi về pháp luật và quy định nội bộ. Mở nguồn tham chiếu để đối chiếu câu trả lời.</p>
              </div>
            )}
            {hasMessages && !nearBottom && (
              <button type="button" className={`${theme.actionButton} ${styles.scrollButton}`} onClick={() => setNearBottom(true)}>
                <ArrowDown size={16} aria-hidden="true" /> Đến tin mới nhất
              </button>
            )}
            {hasMessages && questionSuggestions}
            <ChatInput
              key={composerVersion}
              inputRef={inputRef}
              value={draft}
              onValueChange={setDraft}
              onSendMessage={submitQuestion}
              onCancel={cancelMessage}
              isLoading={isTyping}
            />
            {!hasMessages && (
              <>
                <ul className={styles.suggestions} aria-label="Chủ đề gợi ý" role="list">
                  {suggestions.map(({ icon: Icon, label, question }) => (
                    <li key={label}>
                      <button type="button" title={question} onClick={() => fillDraft(question)} disabled={isTyping}>
                        <span className={styles.suggestionIcon}><Icon size={18} aria-hidden="true" /></span>
                        <ArrowUpRight className={styles.suggestionArrow} size={16} aria-hidden="true" />
                        <span className={styles.suggestionCopy}><strong>{label}</strong><span>{question}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
                {questionSuggestions}
              </>
            )}
          </div>
        </div>
      </section>

      {selectedSource && (
        <SourceInspector
          key={`${selectedSource.messageId}-${selectedSource.index}`}
          reference={selectedSource.reference}
          previewing={previewing}
          onPreview={() => setPreviewing(true)}
          onClose={closeSource}
        />
      )}
      {previewing && selectedSource && (
        <DocumentViewer reference={selectedSource.reference} onClose={() => setPreviewing(false)} />
      )}

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
        <ChatGuide
          onClose={() => {
            setShowGuide(false)
            accountRef.current?.querySelector('summary')?.focus()
          }}
          onDownload={text => downloadText(text, 'huong-dan-su-dung-chatbot.txt')}
        />
      )}
    </main>
  )
}
