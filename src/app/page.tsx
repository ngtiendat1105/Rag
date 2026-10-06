import Link from 'next/link'
import { ArrowRight, Shield, Bot, FileText } from 'lucide-react'
// import Background3D from '@/components/3d/Background3D'
import RotatingLogo from '@/components/3d/RotatingLogo'
import SimpleBackground from '@/components/3d/SimpleBackground'

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-dark-bg via-dark-bg/90 to-dark-bg">
      {/* Animated Canvas Background */}
      <SimpleBackground />

      <header className="relative z-20 border-b border-white/10 bg-dark-bg/70 backdrop-blur-xl">
        <nav aria-label="Điều hướng chính" className="container mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Legal AI — Trang chủ" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
            <Shield aria-hidden="true" className="h-7 w-7 text-primary-400" />
            <span className="text-base font-bold sm:text-xl">Legal AI</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sm:px-5">
              Đăng nhập
            </Link>
            <Link href="/register" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-colors hover:from-primary-500 hover:to-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg sm:px-5">
              Đăng ký
            </Link>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-10 sm:px-6 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Logo */}
          <div className="flex flex-col items-center justify-center mb-16">
            <div className="mb-8">
              <RotatingLogo />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-center mb-6">
              <span className="gradient-text">Legal AI</span> 
              <span className="block mt-2">Enterprise Chatbot</span>
            </h1>
            
            <p className="text-xl text-gray-300 text-center max-w-3xl mb-10">
              Hệ thống trợ lý pháp lý thông minh sử dụng AI và RAG để hỗ trợ nhân viên 
              tra cứu thông tin pháp lý nội bộ một cách nhanh chóng và chính xác
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="/login"
                className="glass-effect px-8 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-all duration-300 group"
              >
                <span className="text-lg font-semibold">Bắt đầu ngay</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              
              <Link href="/login" className="glass-effect px-8 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
                <span className="text-lg font-semibold">Dùng thử demo</span>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Bảo mật tuyệt đối</h3>
              <p className="text-gray-300">
                Xác thực 2 lớp, mã hóa end-to-end, và tuân thủ nghiêm ngặt các quy định 
                bảo mật dữ liệu doanh nghiệp
              </p>
            </div>
            
            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-neon-cyan flex items-center justify-center mb-6">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI thông minh</h3>
              <p className="text-gray-300">
                Sử dụng mô hình RAG để tìm kiếm và tổng hợp thông tin từ 
                kho tài liệu pháp lý nội bộ chính xác và đầy đủ
              </p>
            </div>
            
            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Tài liệu đa dạng</h3>
              <p className="text-gray-300">
                Hỗ trợ đa định dạng: PDF, Word, Excel, và tích hợp với 
                các hệ thống quản lý tài liệu hiện có
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-effect p-8 rounded-2xl mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
                <div className="text-gray-300">Độ chính xác</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
                <div className="text-gray-300">Hỗ trợ liên tục</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">50ms</div>
                <div className="text-gray-300">Phản hồi trung bình</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">100+</div>
                <div className="text-gray-300">Tài liệu tích hợp</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-400">
            <p className="mb-2">© 2024 Legal AI Enterprise Chatbot. All rights reserved.</p>
            <p className="text-sm">Được phát triển bởi đội ngũ chuyên gia Full-Stack & AI</p>
          </div>
        </div>
      </main>
    </div>
  )
}
