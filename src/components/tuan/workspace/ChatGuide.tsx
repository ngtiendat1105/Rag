'use client'

import { useState } from 'react'
import { BookOpen, Check, Copy, Download, ShieldCheck } from 'lucide-react'
import ChatDialog from '@/components/tuan/ui/ChatDialog'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './chatGuide.module.css'

const title = 'Hướng dẫn sử dụng'
const steps = [
  {
    title: 'Đặt câu hỏi',
    description: 'Nêu tình huống cụ thể, kèm tên văn bản, số điều hoặc phòng ban nếu biết. Chọn một câu gợi ý để điền vào ô nhập, rồi bấm Gửi.',
  },
  {
    title: 'Đối chiếu nguồn',
    description: 'Chọn một nguồn bên dưới câu trả lời để xem thông tin trích dẫn. Bấm Xem tài liệu để mở bản gốc khi có sẵn.',
  },
  {
    title: 'Quản lý hội thoại',
    description: 'Mở lịch sử để tìm, lưu trữ hoặc bỏ lưu trữ hội thoại. Dùng Xuất hội thoại để tải nội dung dưới dạng tệp .txt.',
  },
]
const retryTip = 'Nếu dịch vụ gặp lỗi, chọn Thử lại câu hỏi.'
const privacyTip = 'Tránh gửi dữ liệu cá nhân hoặc thông tin mật không cần thiết.'
const guideText = [
  `${title} Legal AI`,
  ...steps.map((step, index) => `${index + 1}. ${step.title}\n${step.description}`),
  `${retryTip} ${privacyTip}`,
].join('\n\n')

interface ChatGuideProps {
  onClose: () => void
  onDownload: (text: string) => void
}

export default function ChatGuide({ onClose, onDownload }: ChatGuideProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(guideText)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <ChatDialog title={title} icon={<BookOpen size={24} />} closeLabel="Đóng hướng dẫn" onClose={onClose}>
      {() => (
        <>
          <div className={styles.body} role="region" aria-label="Các bước sử dụng Legal AI" tabIndex={0}>
            <ol className={styles.steps} role="list">
              {steps.map(({ title: stepTitle, description }, index) => (
                <li key={stepTitle}>
                  <span className={styles.number} aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3>{stepTitle}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.note}>
              <ShieldCheck size={18} aria-hidden="true" />
              <p>{retryTip} {privacyTip}</p>
            </div>
          </div>

          <footer className={styles.footer}>
            <p className={styles.feedback} role="status" data-error={copyStatus === 'error'}>
              {copyStatus === 'copied' && 'Đã sao chép hướng dẫn.'}
              {copyStatus === 'error' && 'Không thể sao chép hướng dẫn.'}
            </p>
            <div className={styles.actions}>
              <button type="button" className={`${theme.actionButton} ${styles.copy}`} onClick={() => void copyGuide()}>
                {copyStatus === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                Sao chép
              </button>
              <button type="button" className={theme.primaryButton} onClick={() => onDownload(guideText)}>
                <Download size={16} aria-hidden="true" /> Tải hướng dẫn
              </button>
            </div>
          </footer>
        </>
      )}
    </ChatDialog>
  )
}
