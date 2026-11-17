'use client'

import { useState } from 'react'
import { Archive, MessageSquare, MoreHorizontal, Plus, Scale, Search, Trash2 } from 'lucide-react'
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
}

export default function ChatHistorySidebar({ chats, activeChatId, onChatSelect, onNewChat, onDeleteChat, onArchiveChat }: Props) {
  const [query, setQuery] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const search = query.trim().toLocaleLowerCase('vi')
  const matching = chats.filter(chat => `${chat.title} ${chat.lastMessage}`.toLocaleLowerCase('vi').includes(search))
  const visible = matching
    .filter(chat => (chat.status === 'archived') === showArchive)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))

  return (
    <aside className={styles.sidebar} aria-label="Các cuộc trò chuyện">
      <div className={styles.sidebarHeader}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Scale size={21} aria-hidden="true" /></div>
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
      </div>

      <div className={styles.history}>
        <div className={styles.historyHeading}>
          <h2>{showArchive ? 'Đã lưu trữ' : 'Hội thoại'}</h2>
          <button type="button" className={theme.iconButton} title="Hội thoại đã lưu trữ" aria-label="Hội thoại đã lưu trữ" aria-pressed={showArchive} onClick={() => { setShowArchive(!showArchive); setOpenMenu(null) }}>
            <Archive size={17} aria-hidden="true" />
          </button>
        </div>
        {visible.length === 0 ? (
          <p className={styles.historyEmpty}>
            {search ? 'Không tìm thấy hội thoại.' : showArchive ? 'Chưa có hội thoại lưu trữ.' : 'Hội thoại của bạn sẽ xuất hiện ở đây.'}
          </p>
        ) : (
          <ul className={styles.historyList}>
            {visible.map(chat => (
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
                    {chat.status !== 'archived' && (
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
        )}
      </div>
    </aside>
  )
}
