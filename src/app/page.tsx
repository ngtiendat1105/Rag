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
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Logo */}
          <div className="flex flex-col items-center justify-center mb-16">
            <div className="mb-8">
              <RotatingLogo />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6">
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
              
              <button className="glass-effect px-8 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-all duration-300">
                <span className="text-lg font-semibold">Xem Demo</span>
              </button>
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
      </div>
    </div>
  )
}