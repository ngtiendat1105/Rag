import Link from 'next/link'
import { ArrowLeft, Shield, ArrowRight } from 'lucide-react'
import SimpleBackground from '@/components/3d/SimpleBackground'

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-dark-bg px-4 py-12">
      <SimpleBackground />
      <section aria-labelledby="register-title" className="glass-effect relative z-10 w-full max-w-lg rounded-3xl p-6 sm:p-10">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm text-gray-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Trang chủ
        </Link>
        <Shield aria-hidden="true" className="mb-6 mt-6 h-12 w-12 text-primary-400" />
        <h1 id="register-title" className="mb-4 text-3xl font-bold">Đăng ký tài khoản</h1>
        <p className="mb-6 leading-relaxed text-gray-300">
          Legal AI dành cho nhân viên doanh nghiệp. Tài khoản được bộ phận IT cấp để bảo đảm quyền truy cập vào tài liệu nội bộ.
        </p>
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 font-semibold">Cách đăng ký</h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-300">
            <li>Liên hệ bộ phận IT hoặc quản trị viên của công ty.</li>
            <li>Cung cấp họ tên, email công ty và phòng ban để yêu cầu tài khoản.</li>
            <li>Sau khi được cấp tài khoản, đăng nhập để bắt đầu sử dụng.</li>
          </ol>
        </div>
        <Link href="/login" className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-5 py-3 font-semibold hover:from-primary-500 hover:to-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
          Đã có tài khoản? Đăng nhập <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  )
}
