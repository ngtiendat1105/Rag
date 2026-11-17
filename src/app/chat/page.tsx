'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, BookOpen, Bot, Check, ChevronDown, Copy, Download, LogOut, Menu, Scale, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { useChatStore } from '@/store/chatStore'
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import TypingIndicator from '@/components/chat/TypingIndicator'
import UserAvatar from '@/components/ui/UserAvatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function ChatPage() {
  const guideContent = `HƯỚNG DẪN SỬ DỤNG TRỢ LÝ PHÁP LÝ NỘI BỘ

1. Đặt câu hỏi
- Viết câu hỏi cụ thể, nêu rõ nội dung cần tra cứu.
- Có thể hỏi về quy định, quy trình, chính sách hoặc văn bản nội bộ.
- Nên ghi rõ số Điều, tên văn bản hoặc phòng ban liên quan nếu bạn biết.

2. Đọc câu trả lời
- Câu trả lời được tổng hợp từ kho tài liệu của hệ thống.
- Kiểm tra phần nguồn trích dẫn để xem văn bản và đoạn nội dung liên quan.
- Với nội dung có cảnh báo cần đối chiếu, hãy kiểm tra lại văn bản gốc trước khi áp dụng.

3. Quản lý cuộc trò chuyện
- Dùng nút Lưu trữ để giữ lại cuộc trò chuyện cần xem sau.
- Mở icon Kho lưu trữ để xem, bỏ lưu trữ hoặc xuất từng cuộc trò chuyện.
- Nút Xuất hội thoại tạo file .txt để lưu hoặc chia sẻ nội bộ.

4. Khi hệ thống gặp lỗi
- Nếu không nhận được câu trả lời, bấm Thử lại.
- Nếu không kết nối được dịch vụ RAG, kiểm tra FastAPI, Ollama và Qdrant đang hoạt động.
- Không đưa thông tin mật hoặc dữ liệu cá nhân không cần thiết vào câu hỏi.`
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, logout, isAuthenticated } = useAuthStore()
  const { chats, activeChatId, isTyping, processingStage, setActiveChat, createNewChat, sendMessage, cancelMessage, deleteChat, retryMessage, archiveChat, unarchiveChat, rateMessage } = useChatStore()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showArchivePanel, setShowArchivePanel] = useState(false)
  const [guideCopied, setGuideCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const headerActionsRef = useRef<HTMLDivElement>(null)
  const activeChat = activeChatId ? chats.find(chat => chat.id === activeChatId) : null
  const latestAssistant = activeChat?.messages.slice().reverse().find(message => message.role === 'assistant')

  useEffect(() => { if (authHydrated && !isAuthenticated) router.replace('/login') }, [authHydrated, isAuthenticated, router])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeChat?.messages, isTyping])
  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (headerActionsRef.current && !headerActionsRef.current.contains(event.target as Node)) {
        setShowArchivePanel(false)
        setShowUserMenu(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [])

  const handleLogout = () => { logout(); router.push('/login') }
  const downloadText = (content: string, fileName: string) => {
    const safeFileName = fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = safeFileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const exportChat = (chat: typeof activeChat) => {
    if (!chat) return
    const content = chat.messages.map(message => `${message.role === 'user' ? 'Bạn' : 'Legal AI'}: ${message.content}`).join('\n\n')
    downloadText(content, `legal-ai-${chat.id}.txt`)
  }
  const copyGuide = async () => {
    await navigator.clipboard.writeText(guideContent)
    setGuideCopied(true)
    window.setTimeout(() => setGuideCopied(false), 1800)
  }
  const archivedChats = chats.filter(chat => chat.status === 'archived')

  if (!authHydrated || !isAuthenticated || !user) return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]"><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#173f73]" /></div>

  return (
    <main className="chat-professional flex h-[100dvh] overflow-hidden bg-[#f5f7fa] text-slate-900">
      <ChatHistorySidebar chats={chats} activeChatId={activeChatId} onChatSelect={setActiveChat} onNewChat={() => createNewChat()} onDeleteChat={deleteChat} onArchiveChat={archiveChat} className="hidden lg:flex" />
      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setShowMobileMenu(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Mở lịch sử trò chuyện"><Menu className="h-5 w-5" /></button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173f73] text-white shadow-sm"><Scale className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">Trợ lý pháp lý nội bộ</h1><span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Đang hoạt động</span></div><p className="truncate text-xs text-slate-500">Tra cứu chính sách và văn bản doanh nghiệp</p></div>
          </div>
          <div ref={headerActionsRef} className="flex items-center gap-2">
            <button onClick={() => exportChat(activeChat)} disabled={!activeChat} className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 sm:flex"><Download className="h-4 w-4" />Xuất hội thoại</button>
            <div className="relative">
              <button onClick={() => setShowArchivePanel(value => !value)} className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#173f73]" aria-label="Mở kho lưu trữ" title="Kho lưu trữ">
                <Archive className="h-5 w-5" />
                {archivedChats.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a7793d] px-1 text-[10px] font-bold text-white">{archivedChats.length}</span>}
              </button>
              <AnimatePresence>{showArchivePanel && <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} className="absolute right-0 top-12 z-30 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-100 px-4 py-3"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Kho lưu trữ</h2><p className="mt-0.5 text-xs text-slate-500">{archivedChats.length} cuộc trò chuyện đã lưu</p></div><Archive className="h-5 w-5 text-[#a7793d]" /></div></div>
                {activeChat && activeChat.status !== 'archived' && <div className="border-b border-slate-100 p-3"><button onClick={() => archiveChat(activeChat.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f73] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#12345f]"><Archive className="h-4 w-4" />Lưu cuộc trò chuyện hiện tại</button></div>}
                <div className="max-h-80 overflow-y-auto p-2">
                  <details open className="mb-2 rounded-xl border border-blue-100 bg-blue-50/70">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#173f73] text-white"><BookOpen className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Hướng dẫn sử dụng chatbot</span><span className="block text-xs text-slate-500">Cách hỏi, đọc nguồn và quản lý hội thoại</span></span>
                      <span className="text-xs font-medium text-[#173f73]">Có sẵn</span>
                    </summary>
                    <div className="border-t border-blue-100 px-3 pb-3 pt-2 text-xs leading-5 text-slate-600">
                      <p className="whitespace-pre-line">{guideContent.replace('HƯỚNG DẪN SỬ DỤNG TRỢ LÝ PHÁP LÝ NỘI BỘ\n\n', '')}</p>
                      <div className="mt-3 flex gap-2 border-t border-blue-100 pt-3">
                        <button onClick={copyGuide} className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-medium text-[#173f73] shadow-sm transition hover:bg-blue-100">{guideCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{guideCopied ? 'Đã sao chép' : 'Sao chép'}</button>
                        <button onClick={() => downloadText(guideContent, 'huong-dan-su-dung-chatbot.txt')} className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-medium text-[#173f73] shadow-sm transition hover:bg-blue-100"><Download className="h-3.5 w-3.5" />Xuất hướng dẫn</button>
                      </div>
                    </div>
                  </details>
                  {archivedChats.length === 0 ? <div className="px-4 py-8 text-center"><Archive className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">Chưa có cuộc trò chuyện nào được lưu.</p><p className="mt-1 text-xs text-slate-400">Bạn có thể lưu cuộc trò chuyện hiện tại ở phía trên.</p></div> : archivedChats.map(chat => <div key={chat.id} className="rounded-xl p-3 transition hover:bg-slate-50"><div className="flex items-start gap-3"><button onClick={() => { setActiveChat(chat.id); setShowArchivePanel(false) }} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-slate-800">{chat.title}</p><p className="mt-1 truncate text-xs text-slate-500">{chat.lastMessage || 'Chưa có tin nhắn'}</p></button><button onClick={() => exportChat(chat)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-[#173f73]" title="Xuất cuộc trò chuyện"><Download className="h-4 w-4" /></button></div><div className="mt-2 flex items-center justify-between"><span className="text-[11px] text-slate-400">{chat.messages.length} tin nhắn</span><button onClick={() => unarchiveChat(chat.id)} className="text-[11px] font-medium text-[#173f73] hover:underline">Bỏ lưu trữ</button></div></div>)}
                </div>
              </motion.div>}</AnimatePresence>
            </div>
            <div className="relative"><button onClick={() => setShowUserMenu(value => !value)} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"><UserAvatar src={user.avatarUrl || user.avatar} name={user.name} size="sm" /><div className="hidden text-left md:block"><p className="max-w-32 truncate text-xs font-semibold text-slate-800">{user.name}</p><p className="max-w-32 truncate text-[11px] text-slate-500">{user.department}</p></div><ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" /></button><AnimatePresence>{showUserMenu && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button onClick={() => router.push('/profile')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><User className="h-4 w-4" />Hồ sơ cá nhân</button><button onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Đăng xuất</button></motion.div>}</AnimatePresence></div>
          </div>
        </header>

        {!activeChat ? <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-lg text-center"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173f73] text-white shadow-lg shadow-blue-900/10"><Scale className="h-8 w-8" /></div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#a7793d]">Legal AI Workspace</p><h2 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">Xin chào, {user.name}</h2><p className="mx-auto mb-7 max-w-md text-sm leading-6 text-slate-500">Tạo cuộc trò chuyện mới để tra cứu quy định pháp luật và tài liệu nội bộ có dẫn nguồn.</p><button onClick={() => createNewChat()} className="rounded-xl bg-[#173f73] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#12345f]">Bắt đầu tra cứu</button></div></div> : <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="border-b border-slate-200/80 bg-white px-4 py-4 md:px-8"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-900">{activeChat.title}</h2><p className="mt-0.5 text-xs text-slate-500">{activeChat.messages.length} tin nhắn · Nội dung được đối chiếu với kho tài liệu</p></div><button onClick={() => archiveChat(activeChat.id)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Lưu trữ"><Archive className="h-4 w-4" /></button></div></div>
            <div className="flex-1 px-4 py-7 md:px-8"><div className="mx-auto max-w-4xl space-y-7">
              {activeChat.messages.length === 0 && <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173f73] text-white shadow-sm"><Bot className="h-5 w-5" /></div>
                <div className="max-w-2xl rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                  Xin chào {user.name}! Tôi là Legal AI, trợ lý hỗ trợ tra cứu các vấn đề pháp lý nội bộ. Bạn muốn tra cứu nội dung nào hôm nay?
                </div>
              </div>}
              {activeChat.messages.map((message, index) => <ChatMessage key={message.id} {...message} animate={message.role === 'assistant' && index === activeChat.messages.length - 1} onRate={(rating, reason, detail) => rateMessage(message.id, rating, reason, message.content, detail)} onRetry={message.status === 'error' ? () => retryMessage(message.id) : undefined} />)}
              {isTyping && <TypingIndicator message={processingStage} />}<div ref={messagesEndRef} /></div></div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8"><div className="mx-auto max-w-4xl"><ChatInput suggestions={latestAssistant?.suggestions} onSendMessage={sendMessage} onCancel={cancelMessage} disabled={isTyping} isLoading={isTyping} placeholder="Nhập câu hỏi pháp lý hoặc quy định nội bộ..." /></div></div>
        </>}
      </section>
      <AnimatePresence>{showMobileMenu && <><motion.button aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileMenu(false)} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" /><motion.aside initial={{ x: -340 }} animate={{ x: 0 }} exit={{ x: -340 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(88vw,340px)] min-h-0 flex-col bg-white shadow-2xl lg:hidden"><button onClick={() => setShowMobileMenu(false)} className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button><ChatHistorySidebar chats={chats} activeChatId={activeChatId} onChatSelect={id => { setActiveChat(id); setShowMobileMenu(false) }} onNewChat={() => { createNewChat(); setShowMobileMenu(false) }} onDeleteChat={deleteChat} onArchiveChat={archiveChat} /></motion.aside></>}</AnimatePresence>
      <ConfirmDialog isOpen={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={handleLogout} title="Đăng xuất khỏi hệ thống?" message="Phiên làm việc hiện tại sẽ kết thúc trên thiết bị này." confirmLabel="Đăng xuất" />
    </main>
  )
}
