'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, ChevronDown, Download, LogOut, Menu, Scale, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { useChatStore } from '@/store/chatStore'
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import TypingIndicator from '@/components/chat/TypingIndicator'

export default function ChatPage() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, logout, isAuthenticated } = useAuthStore()
  const { chats, activeChatId, isTyping, processingStage, setActiveChat, createNewChat, sendMessage, deleteChat, archiveChat, rateMessage } = useChatStore()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeChat = activeChatId ? chats.find(chat => chat.id === activeChatId) : null

  useEffect(() => { if (authHydrated && !isAuthenticated) router.replace('/login') }, [authHydrated, isAuthenticated, router])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeChat?.messages, isTyping])

  const handleLogout = () => { logout(); router.push('/login') }
  const handleExportChat = () => {
    if (!activeChat) return
    const content = activeChat.messages.map(message => `${message.role === 'user' ? 'Bạn' : 'Legal AI'}: ${message.content}`).join('\n\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `legal-ai-${activeChat.id}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!authHydrated || !isAuthenticated || !user) return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]"><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#173f73]" /></div>

  return (
    <main className="chat-professional flex h-[100dvh] overflow-hidden bg-[#f5f7fa] text-slate-900">
      <ChatHistorySidebar chats={chats} activeChatId={activeChatId} onChatSelect={setActiveChat} onNewChat={createNewChat} onDeleteChat={deleteChat} onArchiveChat={archiveChat} className="hidden lg:flex" />
      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setShowMobileMenu(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Mở lịch sử trò chuyện"><Menu className="h-5 w-5" /></button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173f73] text-white shadow-sm"><Scale className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">Trợ lý pháp lý nội bộ</h1><span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Đang hoạt động</span></div><p className="truncate text-xs text-slate-500">Tra cứu chính sách và văn bản doanh nghiệp</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportChat} disabled={!activeChat} className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 sm:flex"><Download className="h-4 w-4" />Xuất hội thoại</button>
            <div className="relative"><button onClick={() => setShowUserMenu(value => !value)} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#173f73]"><User className="h-4 w-4" /></div><div className="hidden text-left md:block"><p className="max-w-32 truncate text-xs font-semibold text-slate-800">{user.name}</p><p className="max-w-32 truncate text-[11px] text-slate-500">{user.department}</p></div><ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" /></button><AnimatePresence>{showUserMenu && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button onClick={() => router.push('/profile')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><User className="h-4 w-4" />Hồ sơ cá nhân</button><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Đăng xuất</button></motion.div>}</AnimatePresence></div>
          </div>
        </header>

        {!activeChat ? <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-lg text-center"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173f73] text-white shadow-lg shadow-blue-900/10"><Scale className="h-8 w-8" /></div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#a7793d]">Legal AI Workspace</p><h2 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">Xin chào, {user.name}</h2><p className="mx-auto mb-7 max-w-md text-sm leading-6 text-slate-500">Tạo cuộc trò chuyện mới để tra cứu quy định pháp luật và tài liệu nội bộ có dẫn nguồn.</p><button onClick={() => createNewChat()} className="rounded-xl bg-[#173f73] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#12345f]">Bắt đầu tra cứu</button></div></div> : <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="border-b border-slate-200/80 bg-white px-4 py-4 md:px-8"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-900">{activeChat.title}</h2><p className="mt-0.5 text-xs text-slate-500">{activeChat.messages.length} tin nhắn · Nội dung được đối chiếu với kho tài liệu</p></div><button onClick={() => archiveChat(activeChat.id)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Lưu trữ"><Archive className="h-4 w-4" /></button></div></div>
            <div className="flex-1 px-4 py-7 md:px-8"><div className="mx-auto max-w-4xl space-y-7">{activeChat.messages.map(message => <ChatMessage key={message.id} {...message} onRate={rating => rateMessage(message.id, rating)} />)}{isTyping && <TypingIndicator message={processingStage} />}<div ref={messagesEndRef} /></div></div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8"><div className="mx-auto max-w-4xl"><ChatInput onSendMessage={sendMessage} disabled={isTyping} isLoading={isTyping} placeholder="Nhập câu hỏi pháp lý hoặc quy định nội bộ..." /></div></div>
        </>}
      </section>
      <AnimatePresence>{showMobileMenu && <><motion.button aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileMenu(false)} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" /><motion.aside initial={{ x: -340 }} animate={{ x: 0 }} exit={{ x: -340 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed inset-y-0 left-0 z-50 w-[min(88vw,340px)] bg-white lg:hidden"><button onClick={() => setShowMobileMenu(false)} className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button><ChatHistorySidebar chats={chats} activeChatId={activeChatId} onChatSelect={id => { setActiveChat(id); setShowMobileMenu(false) }} onNewChat={() => { createNewChat(); setShowMobileMenu(false) }} onDeleteChat={deleteChat} onArchiveChat={archiveChat} /></motion.aside></>}</AnimatePresence>
    </main>
  )
}
