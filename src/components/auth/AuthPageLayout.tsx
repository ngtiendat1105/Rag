import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BrandMark from '@/components/tuan/ui/BrandMark'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from '@/app/public-site.module.css'

export default function AuthPageLayout({ titleId, children }: { titleId: string; children: ReactNode }) {
  return (
    <main className={`${theme.theme} ${styles.site} ${styles.loginPage}`}>
      <div className={styles.loginFrame}>
        <section className={styles.loginPanel} aria-labelledby={titleId}>
          <header className={styles.loginHeader}>
            <Link href="/" className={styles.brand} aria-label="Legal AI, trang chủ">
              <BrandMark size={36} /> Legal AI
            </Link>
            <Link href="/" className={`${theme.actionButton} ${styles.backHome}`}>
              <ArrowLeft size={15} aria-hidden="true" /> Trang chủ
            </Link>
          </header>
          <div className={styles.loginContent}>{children}</div>
        </section>
        <div className={styles.loginAside} aria-hidden="true">
          <div className={styles.loginArtwork} />
          <div className={styles.loginArtCaption}>
            <span />
            <p>Tra cứu có<br />nguồn đối chiếu.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
