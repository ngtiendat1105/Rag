import BrandMark from '@/components/tuan/ui/BrandMark'
import styles from './chat.module.css'

export default function TypingIndicator({ message }: { message?: string }) {
  return (
    <div className={styles.message} role="status">
      <BrandMark className={styles.assistantMark} size={34} />
      <div className={styles.loading}>
        <span className={styles.loadingDots} aria-hidden="true"><span /><span /><span /></span>
        {message || 'Đang tìm tài liệu liên quan…'}
      </div>
    </div>
  )
}
