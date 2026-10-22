'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface StatCard {
  id: string
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
  trend: 'up' | 'down'
}

export default function DashboardStats() {
  const stats: StatCard[] = [
    {
      id: 'total_users',
      title: 'Tổng User',
      value: '1,248',
      change: 12.5,
      icon: <Users className="w-6 h-6" />,
      color: 'from-primary-500 to-secondary-500',
      trend: 'up'
    },
    {
      id: 'total_chats',
      title: 'Cuộc trò chuyện',
      value: '8,742',
      change: 8.2,
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'from-accent-500 to-neon-cyan',
      trend: 'up'
    },
    {
      id: 'total_docs',
      title: 'Tài liệu',
      value: '156',
      change: -3.2,
      icon: <FileText className="w-6 h-6" />,
      color: 'from-neon-purple to-neon-pink',
      trend: 'down'
    },
    {
      id: 'avg_response',
      title: 'Thời gian phản hồi',
      value: '1.2s',
      change: 15.8,
      icon: <Clock className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      trend: 'up'
    },
  ]

  const barChartData = [
    { label: 'Jan', users: 450, chats: 1200 },
    { label: 'Feb', users: 520, chats: 1500 },
    { label: 'Mar', users: 610, chats: 1800 },
    { label: 'Apr', users: 730, chats: 2100 },
    { label: 'May', users: 850, chats: 2400 },
    { label: 'Jun', users: 920, chats: 2800 },
    { label: 'Jul', users: 1020, chats: 3200 },
    { label: 'Aug', users: 1150, chats: 3800 },
    { label: 'Sep', users: 1248, chats: 4200 },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
                <span className="text-sm text-gray-400">so với tháng trước</span>
              </div>
              
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold mb-1">Tăng trưởng sử dụng</h3>
            <p className="text-sm text-gray-400">Theo dõi số lượng user và chat qua các tháng</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <span className="text-sm text-gray-300">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-500" />
              <span className="text-sm text-gray-300">Chats</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-2">
          {barChartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center gap-1 mb-2">
                {/* Users bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.users / 1500) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.8 }}
                  className="w-3 bg-gradient-to-t from-primary-500 to-primary-600 rounded-t-lg"
                />
                
                {/* Chats bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.chats / 5000) * 100}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.8 }}
                  className="w-3 bg-gradient-to-t from-accent-500 to-neon-cyan rounded-t-lg"
                />
              </div>
              
              <span className="text-xs text-gray-400">{data.label}</span>
            </div>
          ))}
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-dark-border">
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">89%</div>
            <div className="text-sm text-gray-400">User hài lòng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">24/7</div>
            <div className="text-sm text-gray-400">Thời gian hoạt động</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">99.5%</div>
            <div className="text-sm text-gray-400">Độ chính xác</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">3.8s</div>
            <div className="text-sm text-gray-400">Phản hồi trung bình</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Hoạt động gần đây</h3>
              <p className="text-sm text-gray-400">Cập nhật mới nhất từ hệ thống</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { user: 'Nguyễn Văn A', action: 'tải lên tài liệu mới', time: '5 phút trước', type: 'upload' },
              { user: 'Trần Thị B', action: 'hỏi về hợp đồng lao động', time: '15 phút trước', type: 'chat' },
              { user: 'Lê Văn C', action: 'đăng ký tài khoản mới', time: '1 giờ trước', type: 'register' },
              { user: 'AI System', action: 'cập nhật model RAG', time: '2 giờ trước', type: 'system' },
              { user: 'Phạm Thị D', action: 'xuất báo cáo chat', time: '3 giờ trước', type: 'export' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-surface/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${activity.type === 'upload' ? 'bg-green-500/20 text-green-400' : 
                    activity.type === 'chat' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'register' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-yellow-500/20 text-yellow-400'}`}>
                  {activity.type === 'upload' ? <FileText className="w-5 h-5" /> :
                   activity.type === 'chat' ? <MessageSquare className="w-5 h-5" /> :
                   activity.type === 'register' ? <Users className="w-5 h-5" /> :
                   <TrendingUp className="w-5 h-5" />}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Top câu hỏi</h3>
              <p className="text-sm text-gray-400">Các chủ đề được hỏi nhiều nhất</p>
            </div>
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { topic: 'Nghỉ phép năm', count: 324, trend: 'up' },
              { topic: 'Hợp đồng lao động', count: 287, trend: 'up' },
              { topic: 'Bảo hiểm xã hội', count: 245, trend: 'stable' },
              { topic: 'Chính sách lương', count: 198, trend: 'down' },
              { topic: 'Quy định nội bộ', count: 176, trend: 'up' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-surface/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 
                    flex items-center justify-center">
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  
                  <div>
                    <p className="font-medium">{item.topic}</p>
                    <p className="text-sm text-gray-400">{item.count} lượt hỏi</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 ${item.trend === 'up' ? 'text-green-400' : 
                  item.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {item.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                   item.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
                   <span className="w-4 h-4 flex items-center justify-center">●</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}