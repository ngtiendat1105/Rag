'use client'

import { useState } from 'react'
import { Archive, MessageSquare, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import { formatChatDate, formatRelativeTime } from '@/utils/formatters'

interface Chat { id: string; title: string; lastMessage: string; timestamp: string; unread: boolean; status: 'active' | 'archived' | 'draft' }
interface Props { chats: Chat[]; activeChatId: string | null; onChatSelect: (id: string) => void; onNewChat: () => void; onDeleteChat?: (id: string) => void; onArchiveChat?: (id: string) => void; className?: string }

export default function ChatHistorySidebar({ chats, activeChatId, onChatSelect, onNewChat, onDeleteChat, onArchiveChat, className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const filtered = chats.filter(chat => `${chat.title} ${chat.lastMessage}`.toLowerCase().includes(query.toLowerCase()))
  const grouped = filtered.reduce((result, chat) => { const key = formatChatDate(chat.timestamp); (result[key] ||= []).push(chat); return result }, {} as Record<string, Chat[]>)

  return <aside className={`h-full w-[310px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 ${className}`}>
    <div className="border-b border-slate-200 px-5 pb-4 pt-5">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173f73] text-white"><MessageSquare className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold">Không gian tư vấn</h2><p className="text-xs text-slate-500">{chats.length} cuộc trò chuyện</p></div></div>
      <button onClick={onNewChat} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f73] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12345f]"><Plus className="h-4 w-4" />Cuộc trò chuyện mới</button>
      <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm trong lịch sử..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#173f73]/40 focus:bg-white focus:ring-2 focus:ring-[#173f73]/10" /></label>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-4">
      {Object.keys(grouped).length === 0 ? <div className="px-4 py-12 text-center"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">Không tìm thấy cuộc trò chuyện</p></div> : Object.entries(grouped).map(([date, items]) => <section key={date} className="mb-5"><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{date}</p><div className="space-y-1">{items.map(chat => <div key={chat.id} className="group relative"><button onClick={() => onChatSelect(chat.id)} className={`w-full rounded-xl px-3 py-3 pr-9 text-left transition ${activeChatId === chat.id ? 'bg-[#eaf1f8] text-[#173f73]' : 'text-slate-700 hover:bg-slate-50'}`}><div className="mb-1 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-semibold">{chat.title}</span>{chat.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#b28647]" />}</div><p className="truncate text-xs text-slate-500">{chat.lastMessage || 'Chưa có tin nhắn'}</p><p className="mt-1.5 text-[11px] text-slate-400">{formatRelativeTime(chat.timestamp)}</p></button><button onClick={() => setOpenMenu(openMenu === chat.id ? null : chat.id)} className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-700 group-hover:opacity-100" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button>{openMenu === chat.id && <div className="absolute right-2 top-9 z-20 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{onArchiveChat && chat.status !== 'archived' && <button onClick={() => { onArchiveChat(chat.id); setOpenMenu(null) }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50"><Archive className="h-3.5 w-3.5" />Lưu trữ</button>}{onDeleteChat && <button onClick={() => { onDeleteChat(chat.id); setOpenMenu(null) }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Xóa</button>}</div>}</div>)}</div></section>)}
    </div>
    <div className="border-t border-slate-200 px-5 py-4"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Kho tài liệu đã sẵn sàng</div></div>
  </aside>
}
