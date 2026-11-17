import { Scale } from 'lucide-react'
import styles from './chat.module.css'

export default function TypingIndicator({ message }: { message?: string }) {
  return (
    <div className={styles.message} role="status">
      <div className={styles.assistantIcon}><Scale size={18} aria-hidden="true" /></div>
      <div className={styles.loading}>
        <span className={styles.loadingDot} aria-hidden="true" />
        {message || 'Đang tìm tài liệu liên quan…'}
      </div>
    </div>
  )
}
