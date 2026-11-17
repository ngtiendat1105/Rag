import Link from 'next/link'
import { ArrowDown, ArrowRight, BookOpen, Download, FileSearch, LockKeyhole, MailCheck, MessageSquare, ShieldCheck } from 'lucide-react'
import BrandMark from '@/components/tuan/ui/BrandMark'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './public-site.module.css'
import { WorkspacePreview } from './WorkspacePreview'

const capabilities = [
  { icon: MessageSquare, title: 'Hỏi bằng tiếng Việt', description: 'Mô tả tình huống bằng lời của bạn. Thêm tên văn bản hoặc phòng ban để truy vấn cụ thể hơn.' },
  { icon: Download, title: 'Lưu lại cuộc tra cứu', description: 'Tìm trong lịch sử, lưu trữ hoặc xuất hội thoại khi cần trao đổi với đồng nghiệp.' },
]

const steps = [
  { title: 'Đặt câu hỏi', description: 'Nêu tình huống, tên văn bản hoặc phòng ban liên quan.' },
  { title: 'Đọc phần tổng hợp', description: 'Xem nội dung Legal AI tìm được cùng các tài liệu được dẫn.' },
  { title: 'Đối chiếu văn bản', description: 'Mở nguồn gốc và kiểm tra ngữ cảnh trước khi sử dụng.' },
]

export default function HomePage() {
  return (
    <div className={`${theme.theme} ${styles.site}`}>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.navigation}`}>
          <Link href="/" className={styles.brand} aria-label="Legal AI, trang chủ">
            <BrandMark size={36} /> Legal AI
          </Link>
          <nav className={styles.navLinks} aria-label="Trang chủ">
            <a href="#features">Tính năng</a>
            <a href="#workflow">Cách sử dụng</a>
            <a href="#security">Quyền truy cập</a>
          </nav>
          <Link href="/login" className={`${theme.primaryButton} ${styles.press}`}>
            Đăng nhập <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroLabel}><span aria-hidden="true" /> Trợ lý pháp lý cho doanh nghiệp</p>
              <h1 id="home-title">Hỏi về pháp luật.<br /><span>Tìm đến căn cứ.</span></h1>
              <p className={styles.heroDescription}>Tra cứu văn bản pháp luật và quy định nội bộ. Đọc phần tổng hợp và mở nguồn để tự đối chiếu.</p>
              <div className={styles.heroActions}>
                <Link href="/login" className={`${styles.lightButton} ${styles.press}`}>
                  Bắt đầu tra cứu <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a href="#workflow" className={`${styles.heroLink} ${styles.press}`}>Xem cách sử dụng <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
            </div>

            <WorkspacePreview />
          </div>
        </section>

        <section id="features" className={`${styles.container} ${styles.features}`} aria-labelledby="features-title">
          <h2 id="features-title">Từ câu hỏi đến văn bản gốc</h2>
          <div className={styles.featureGrid}>
            <article className={styles.featureLead}>
              <span><FileSearch size={23} aria-hidden="true" /></span>
              <h3>Đọc nguồn ngay cạnh câu trả lời</h3>
              <p>Xem điều, khoản và trang được dẫn. Mở văn bản khi có bản xem trước để đối chiếu trước khi áp dụng.</p>
              <div className={styles.sourceIllustration} aria-hidden="true">
                <div><BookOpen size={21} /><span>Nguồn tham chiếu</span></div>
                <span /><span /><span />
              </div>
            </article>
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span><Icon size={23} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className={styles.workflow} aria-labelledby="workflow-title">
          <div className={`${styles.container} ${styles.workflowGrid}`}>
            <div>
              <h2 id="workflow-title">Tra cứu trong ba bước</h2>
              <Link href="/login" className={`${theme.actionButton} ${styles.inlineLink} ${styles.press}`}>Vào Legal AI <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <ol role="list">
              {steps.map(({ title, description }) => (
                <li key={title}><h3>{title}</h3><p>{description}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="security" className={`${styles.container} ${styles.access}`} aria-labelledby="access-title">
          <div className={styles.accessContent}>
            <span><ShieldCheck size={24} aria-hidden="true" /></span>
            <div>
              <h2 id="access-title">Quyền truy cập nội bộ</h2>
              <p>Tài khoản do doanh nghiệp cấp để truy cập Legal AI.</p>
            </div>
          </div>
          <div className={styles.accessDetails}>
            <ul>
              <li><MailCheck size={19} aria-hidden="true" /> Xác thực bằng mã OTP qua email</li>
              <li><LockKeyhole size={19} aria-hidden="true" /> Quyền truy cập theo vai trò được cấp</li>
            </ul>
            <Link href="/register" className={`${styles.lightButton} ${styles.accessLink} ${styles.press}`}>Cách đăng ký tài khoản <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <span><BrandMark size={21} /> Legal AI</span>
          <p>© {new Date().getFullYear()} Legal AI</p>
        </div>
      </footer>
    </div>
  )
}
