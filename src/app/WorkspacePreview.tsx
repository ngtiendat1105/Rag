'use client'

import { useState, type PointerEvent } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import BrandMark from '@/components/tuan/ui/BrandMark'
import styles from './public-site.module.css'

const examples = [
  {
    topic: 'Hợp đồng',
    question: 'Tôi cần đối chiếu những gì trước khi ký hợp đồng lao động?',
    answer: 'Bắt đầu từ loại hợp đồng, thử việc và quyền lợi. Mở nguồn dẫn để đọc những nội dung này trong văn bản gốc.',
    source: 'Bộ luật Lao động 2019',
    note: 'Khi tra cứu, chọn một nguồn để đọc thông tin đối chiếu và mở tài liệu gốc nếu bản xem trước có sẵn.',
  },
  {
    topic: 'Nghỉ phép',
    question: 'Tôi nên xem ở đâu để hiểu quy định về nghỉ phép năm?',
    answer: 'Đối chiếu văn bản pháp luật với chính sách nghỉ phép của công ty để xác định tài liệu nào áp dụng cho tình huống của bạn.',
    source: 'Bộ luật Lao động 2019',
    note: 'Khi tra cứu, mở nguồn để đọc ngữ cảnh đầy đủ và kiểm tra tài liệu áp dụng cho trường hợp của bạn.',
  },
  {
    topic: 'Nội quy',
    question: 'Tìm quy trình xin phê duyệt làm thêm giờ ở đâu?',
    answer: 'Tìm trong nội quy hoặc quy trình nhân sự. Khi có kết quả, mở văn bản để xem các bước và người phụ trách.',
    source: 'Quy trình nhân sự mẫu',
    note: 'Tài liệu minh họa. Kết quả tra cứu nội bộ phụ thuộc vào tài liệu mà doanh nghiệp cung cấp.',
  },
]

function moveSpotlight(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse' || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
  const bounds = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
  event.currentTarget.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
}

function resetSpotlight(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty('--spot-x')
  event.currentTarget.style.removeProperty('--spot-y')
}

export function WorkspacePreview() {
  const [activeTopic, setActiveTopic] = useState(0)
  const example = examples[activeTopic]

  return (
    <div className={styles.previewStage} onPointerMove={moveSpotlight} onPointerLeave={resetSpotlight}>
      <figure className={styles.preview} aria-label="Minh họa một cuộc tra cứu trên Legal AI">
        <figcaption className={styles.previewHeader}>
          <span className={styles.previewIdentity}><BrandMark size={26} /> Legal AI Workspace</span>
          <span className={styles.previewTag}>Minh họa</span>
        </figcaption>
        <div className={styles.demoTopics} role="group" aria-label="Tình huống tra cứu mẫu">
          {examples.map(({ topic }, index) => (
            <button key={topic} type="button" aria-pressed={activeTopic === index} onClick={() => setActiveTopic(index)}>
              {topic}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          <div className={styles.previewBody} key={example.topic}>
            <p className={styles.demoQuestion}>{example.question}</p>
            <div className={styles.demoAnswer}>
              <BrandMark size={32} />
              <div>
                <p className={styles.demoName}>Legal AI</p>
                <p>{example.answer}</p>
              </div>
            </div>
            <details className={styles.demoSource}>
              <summary>
                <BookOpen size={18} aria-hidden="true" />
                <span><strong>{example.source}</strong><small>Nguồn tham chiếu · Bấm để xem</small></span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>{example.note}</p>
            </details>
          </div>
        </div>
      </figure>
    </div>
  )
}
