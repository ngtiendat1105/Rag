import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AuthPageLayout from '@/components/auth/AuthPageLayout'
import theme from '@/components/tuan/ui/theme.module.css'
import publicStyles from '../public-site.module.css'
import styles from './register.module.css'

const steps = [
  { title: 'Liên hệ bộ phận IT', description: 'Gửi yêu cầu cấp quyền cho IT hoặc quản trị viên Legal AI của công ty.' },
  { title: 'Cung cấp thông tin', description: 'Gửi họ tên, email công ty và phòng ban để quản trị viên cấp quyền phù hợp.' },
  { title: 'Đăng nhập sau khi được cấp quyền', description: 'Dùng email công ty và xác thực bằng mã OTP gửi đến hộp thư.' },
]

export default function RegisterPage() {
  return (
    <AuthPageLayout titleId="register-title">
      <div className={styles.content}>
        <div className={styles.heading}>
          <h1 id="register-title">Đăng ký tài khoản</h1>
          <p>Tài khoản Legal AI do công ty cấp để bạn truy cập tài liệu nội bộ.</p>
        </div>
        <ol className={styles.steps} aria-label="Các bước xin cấp tài khoản" role="list">
          {steps.map(({ title, description }, index) => (
            <li key={title}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          <p>Đã được cấp tài khoản?</p>
          <Link href="/login" className={`${theme.primaryButton} ${publicStyles.press} ${styles.loginLink}`}>
            Đăng nhập <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  )
}
