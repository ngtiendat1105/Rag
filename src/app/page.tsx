import Link from 'next/link'
import {
  ArrowRight, BadgeCheck, BookOpenCheck, Bot, Check, ChevronRight,
  FileCheck2, FileSearch, Fingerprint, LockKeyhole, MessageSquare,
  Scale, ShieldCheck, Sparkles, Users,
} from 'lucide-react'

const features = [
  { icon: FileSearch, title: 'Tra cứu theo ngữ cảnh', description: 'Tìm đúng điều khoản và nội dung liên quan trong kho tài liệu nội bộ, thay vì chỉ khớp từ khóa.' },
  { icon: BookOpenCheck, title: 'Câu trả lời có căn cứ', description: 'Mỗi nội dung phản hồi đi kèm nguồn tham chiếu để đội ngũ pháp chế kiểm tra nhanh chóng.' },
  { icon: Users, title: 'Quản trị tập trung', description: 'Quản lý người dùng, vai trò, tài liệu và hoạt động hỏi đáp trong một bảng điều khiển.' },
  { icon: ShieldCheck, title: 'Kiểm duyệt nội dung', description: 'Phát hiện yêu cầu không phù hợp và giữ trải nghiệm trao đổi đúng chuẩn mực doanh nghiệp.' },
]

const steps = [
  ['01', 'Đặt câu hỏi', 'Nhập tình huống pháp lý bằng ngôn ngữ tự nhiên.'],
  ['02', 'Đối chiếu tài liệu', 'AI tìm kiếm trong nguồn dữ liệu đã được doanh nghiệp phê duyệt.'],
  ['03', 'Nhận câu trả lời', 'Xem nội dung tổng hợp kèm căn cứ để tiếp tục kiểm tra và xử lý.'],
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 selection:bg-cyan-400/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-28rem] h-[50rem] w-[70rem] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute right-[-15rem] top-[32rem] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#07111f]/80 backdrop-blur-xl">
        <nav aria-label="Điều hướng chính" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" aria-label="Legal AI — Trang chủ" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-cyan-950/40"><Scale className="h-5 w-5 text-white" aria-hidden="true" /></span>
            <span><span className="block text-base font-bold tracking-tight text-white">Legal AI</span><span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Enterprise</span></span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">Tính năng</a>
            <a href="#workflow" className="transition hover:text-white">Cách hoạt động</a>
            <a href="#security" className="transition hover:text-white">Bảo mật</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4">Đăng nhập</Link>
            <Link href="/register" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50 sm:px-5">Đăng ký</Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Trợ lý pháp lý dành cho doanh nghiệp</div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4rem]">
              Tra cứu pháp lý nội bộ <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">nhanh và có căn cứ.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">Legal AI giúp đội ngũ tìm kiếm, đối chiếu và tổng hợp thông tin từ kho tài liệu đã được phê duyệt — trong một trải nghiệm hội thoại đơn giản.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:shadow-cyan-950/50">Bắt đầu sử dụng<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              <a href="#workflow" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]">Xem cách hoạt động<ChevronRight className="h-4 w-4" /></a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              {['Xác thực OTP', 'Phân quyền người dùng', 'Kiểm duyệt hội thoại'].map((item) => <span key={item} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="h-3 w-3" /></span>{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-r from-blue-500/15 to-cyan-400/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1728]/95 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-3"><span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-cyan-300"><Bot className="h-5 w-5" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1728] bg-emerald-400" /></span><div><p className="text-sm font-semibold text-white">Trợ lý Legal AI</p><p className="text-xs text-slate-500">Sẵn sàng hỗ trợ</p></div></div>
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Bảo mật</span>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-md bg-blue-500 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-blue-950/30">Hợp đồng lao động có thời hạn được ký tối đa bao nhiêu lần?</div>
                <div className="max-w-[94%] rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200"><Sparkles className="h-4 w-4" />Nội dung tham khảo</div>
                  <p className="text-sm leading-6 text-slate-300">Người sử dụng lao động và người lao động chỉ được ký thêm <strong className="font-semibold text-white">01 lần</strong> hợp đồng lao động xác định thời hạn. Sau đó, nếu tiếp tục làm việc thì phải ký hợp đồng không xác định thời hạn.</p>
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] p-3"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><div><p className="text-xs font-semibold text-slate-200">Nguồn tham chiếu</p><p className="mt-1 text-xs leading-5 text-slate-500">Bộ luật Lao động 2019 · Điều 20, Khoản 2</p></div></div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#07111f]/70 px-4 py-3.5 text-sm text-slate-500"><MessageSquare className="h-4 w-4" />Đặt câu hỏi tiếp theo...<span className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white"><ArrowRight className="h-3.5 w-3.5" /></span></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1b2d]/95 p-3.5 shadow-xl backdrop-blur sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><BadgeCheck className="h-5 w-5" /></span><div><p className="text-xs font-semibold text-white">Nguồn đã xác minh</p><p className="mt-0.5 text-[11px] text-slate-500">Kho tài liệu nội bộ</p></div></div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.02]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-7 text-center sm:flex-row sm:text-left lg:px-8"><p className="text-sm font-medium text-slate-500">Một không gian làm việc thống nhất cho</p><div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-300 sm:justify-end"><span>Phòng Pháp chế</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>Nhân sự</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>Ban điều hành</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>Kiểm soát nội bộ</span></div></div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Năng lực cốt lõi</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Từ tài liệu đến câu trả lời hữu ích</h2><p className="mt-5 text-base leading-7 text-slate-400">Được thiết kế để giảm thời gian tìm kiếm thủ công và giúp người dùng tiếp cận thông tin pháp lý nhất quán hơn.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.045] sm:p-7"><div className="flex items-start gap-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.07] text-cyan-300 transition group-hover:bg-cyan-300/[0.12]"><Icon className="h-5 w-5" /></span><div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div></div></article>)}
          </div>
        </section>

        <section id="workflow" className="border-y border-white/[0.07] bg-[#091525]">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Quy trình đơn giản</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Tìm câu trả lời trong ba bước</h2></div><div className="relative mt-14 grid gap-5 md:grid-cols-3"><div className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent md:block" aria-hidden="true" />{steps.map(([number, title, description]) => <div key={number} className="relative rounded-2xl border border-white/[0.07] bg-[#07111f] p-6 text-center"><span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[#0c1b2d] font-mono text-sm font-bold text-cyan-300">{number}</span><h3 className="mt-6 text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>)}</div></div>
        </section>

        <section id="security" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">An toàn theo thiết kế</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Quyền truy cập nằm trong tầm kiểm soát</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Legal AI kết hợp xác thực nhiều bước, phân quyền và quản trị tập trung để bảo vệ không gian làm việc của doanh nghiệp.</p><div className="mt-8 space-y-4">{[
            ['Xác thực qua email OTP', 'Mỗi phiên đăng nhập được xác minh bằng mã dùng một lần.'],
            ['Phân quyền theo vai trò', 'Quản trị viên kiểm soát quyền của từng nhóm người dùng.'],
            ['Quản lý dữ liệu tập trung', 'Tài khoản và trạng thái truy cập được theo dõi tại một nơi.'],
          ].map(([title, text]) => <div key={title} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><div><p className="text-sm font-semibold text-slate-200">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}</div></div>
          <div className="grid grid-cols-2 gap-4">{[
            { icon: Fingerprint, label: 'OTP', text: 'Xác thực hai bước' },
            { icon: LockKeyhole, label: 'RLS', text: 'Kiểm soát dữ liệu' },
            { icon: ShieldCheck, label: 'RBAC', text: 'Phân quyền vai trò' },
            { icon: FileCheck2, label: 'Logs', text: 'Quản lý hoạt động' },
          ].map(({ icon: Icon, label, text }) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6"><Icon className="h-6 w-6 text-cyan-300" /><p className="mt-8 font-mono text-2xl font-bold text-white">{label}</p><p className="mt-1 text-xs text-slate-500 sm:text-sm">{text}</p></div>)}</div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-blue-600/25 via-[#0c1c30] to-cyan-500/10 px-6 py-12 text-center sm:px-12 sm:py-16"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%)]" aria-hidden="true" /><div className="relative mx-auto max-w-2xl"><h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Bắt đầu tra cứu thông minh hơn</h2><p className="mt-4 text-base leading-7 text-slate-300">Đăng nhập vào Legal AI để truy cập trợ lý pháp lý và kho tri thức nội bộ của doanh nghiệp.</p><Link href="/login" className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50">Truy cập hệ thống<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></div></section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.07]"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:text-left lg:px-8"><div className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Scale className="h-4 w-4 text-cyan-300" />Legal AI Enterprise</div><p className="text-xs text-slate-600">© {new Date().getFullYear()} Legal AI. Nền tảng hỗ trợ tra cứu thông tin pháp lý.</p></div></footer>
    </div>
  )
}
