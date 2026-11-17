'use client'

import { useState } from 'react'
import { differenceInCalendarDays, isSameMonth, isValid, parseISO, subMonths } from 'date-fns'
import { Archive, ArchiveRestore, Download, MessageSquare, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import BrandMark from '@/components/tuan/ui/BrandMark'
import { formatRelativeTime } from '@/utils/formatters'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chat.module.css'

interface Chat {
  id: string
  title: string
  timestamp: string
  lastMessage: string
  status: 'active' | 'archived' | 'draft'
}

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onChatSelect: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  onArchiveChat: (id: string) => void
  onUnarchiveChat: (id: string) => void
  onExportChat: (id: string) => void
}

function historyGroup(timestamp: string, today: Date) {
  const date = parseISO(timestamp)
  if (!isValid(date)) return 'Cũ hơn'
  const days = differenceInCalendarDays(today, date)
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Hôm qua'
  if (days >= 2 && days <= 7) return '7 ngày trước'
  if (isSameMonth(date, subMonths(today, 1))) return 'Tháng trước'
  return 'Cũ hơn'
}

export default function ChatHistorySidebar({
  chats, activeChatId, onChatSelect, onNewChat, onDeleteChat, onArchiveChat, onUnarchiveChat, onExportChat,
}: Props) {
  const [query, setQuery] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const search = query.trim().toLocaleLowerCase('vi')
  const matching = chats.filter(chat => `${chat.title} ${chat.lastMessage}`.toLocaleLowerCase('vi').includes(search))
  const visible = matching
    .filter(chat => (chat.status === 'archived') === showArchive)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
  const today = new Date()
  const groups = visible.reduce<Record<string, Chat[]>>((items, chat) => {
    const label = historyGroup(chat.timestamp, today)
    items[label] ??= []
    items[label].push(chat)
    return items
  }, {})

  return (
    <aside className={styles.sidebar} aria-label="Các cuộc trò chuyện">
      <div className={styles.sidebarHeader}>
        <div className={styles.brand}>
          <BrandMark className={styles.brandIcon} size={39} />
          <div><strong>Legal AI</strong><p>Trợ lý pháp lý nội bộ</p></div>
        </div>
        <button type="button" className={`${theme.primaryButton} ${styles.newChat}`} onClick={onNewChat}>
          <Plus size={19} aria-hidden="true" />
          Cuộc trò chuyện mới
        </button>
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Tìm hội thoại</span>
          <input value={query} onChange={event => { setQuery(event.target.value); setOpenMenu(null) }} placeholder="Tìm hội thoại…" type="search" />
        </label>
        <div className={styles.historyFilters} role="group" aria-label="Lọc lịch sử">
          <button type="button" className={theme.actionButton} aria-pressed={!showArchive} onClick={() => { setShowArchive(false); setOpenMenu(null) }}>
            <MessageSquare size={15} aria-hidden="true" /> Hội thoại
          </button>
          <button type="button" className={theme.actionButton} aria-label="Hội thoại đã lưu trữ" aria-pressed={showArchive} onClick={() => { setShowArchive(true); setOpenMenu(null) }}>
            <Archive size={15} aria-hidden="true" /> Lưu trữ
          </button>
        </div>
      </div>

      <div className={styles.history}>
        {visible.length === 0 ? (
          <p className={styles.historyEmpty}>
            {search ? 'Không tìm thấy hội thoại.' : showArchive ? 'Chưa có hội thoại lưu trữ.' : 'Hội thoại của bạn sẽ xuất hiện ở đây.'}
          </p>
        ) : (
          Object.entries(groups).map(([label, items]) => (
          <section className={styles.historyGroup} key={label}>
            <h3>{label}</h3>
            <ul className={styles.historyList}>
            {items.map(chat => (
              <li key={chat.id}>
                <div className={styles.historyRow} data-active={activeChatId === chat.id}>
                  <button type="button" className={styles.historySelect} aria-current={activeChatId === chat.id ? 'true' : undefined} onClick={() => { setOpenMenu(null); onChatSelect(chat.id) }}>
                    <MessageSquare size={17} aria-hidden="true" />
                    <span>
                      <strong title={chat.title}>{chat.title}</strong>
                      <small>{formatRelativeTime(chat.timestamp)}</small>
                    </span>
                  </button>
                  <button type="button" className={theme.iconButton} aria-label={`Tùy chọn cho ${chat.title}`} aria-expanded={openMenu === chat.id} onClick={() => setOpenMenu(openMenu === chat.id ? null : chat.id)}>
                    <MoreHorizontal size={19} aria-hidden="true" />
                  </button>
                </div>
                {openMenu === chat.id && (
                  <div className={styles.historyActions}>
                    {chat.status === 'archived' ? (
                      <>
                        <button type="button" className={theme.actionButton} onClick={() => { onUnarchiveChat(chat.id); setOpenMenu(null) }}>
                          <ArchiveRestore size={15} aria-hidden="true" /> Bỏ lưu trữ
                        </button>
                        <button type="button" className={theme.actionButton} onClick={() => { onExportChat(chat.id); setOpenMenu(null) }}>
                          <Download size={15} aria-hidden="true" /> Xuất
                        </button>
                      </>
                    ) : (
                      <button type="button" className={theme.actionButton} onClick={() => { onArchiveChat(chat.id); setOpenMenu(null) }}>
                        <Archive size={15} aria-hidden="true" /> Lưu trữ
                      </button>
                    )}
                    <button type="button" className={`${theme.actionButton} ${styles.deleteAction}`} onClick={() => { onDeleteChat(chat.id); setOpenMenu(null) }}>
                      <Trash2 size={15} aria-hidden="true" /> Xóa
                    </button>
                  </div>
                )}
              </li>
            ))}
            </ul>
          </section>
          ))
        )}
      </div>
    </aside>
  )
}
