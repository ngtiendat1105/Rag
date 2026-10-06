'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  department: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  avatar?: string
}

export default function UserTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Nguyễn Văn A', email: 'a.nguyen@company.com', role: 'admin', department: 'IT Department', status: 'active', lastActive: '2024-01-15T09:30:00' },
    { id: '2', name: 'Trần Thị B', email: 'b.tran@company.com', role: 'user', department: 'Phòng Pháp chế', status: 'active', lastActive: '2024-01-15T08:45:00' },
    { id: '3', name: 'Lê Văn C', email: 'c.le@company.com', role: 'user', department: 'Phòng Nhân sự', status: 'inactive', lastActive: '2024-01-14T15:20:00' },
    { id: '4', name: 'Phạm Thị D', email: 'd.pham@company.com', role: 'moderator', department: 'Ban Giám đốc', status: 'active', lastActive: '2024-01-15T10:15:00' },
    { id: '5', name: 'Hoàng Văn E', email: 'e.hoang@company.com', role: 'user', department: 'Phòng Kế toán', status: 'pending', lastActive: '2024-01-13T14:30:00' },
    { id: '6', name: 'Vũ Thị F', email: 'f.vu@company.com', role: 'user', department: 'Phòng Kinh doanh', status: 'active', lastActive: '2024-01-15T11:45:00' },
    { id: '7', name: 'Đặng Văn G', email: 'g.dang@company.com', role: 'user', department: 'IT Department', status: 'active', lastActive: '2024-01-15T13:20:00' },
    { id: '8', name: 'Bùi Thị H', email: 'h.bui@company.com', role: 'moderator', department: 'Phòng Pháp chế', status: 'inactive', lastActive: '2024-01-12T16:55:00' },
  ])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: User['role']) => {
    const config = {
      admin: { color: 'bg-red-500/20 text-red-400', icon: <Shield className="w-3 h-3" /> },
      moderator: { color: 'bg-purple-500/20 text-purple-400', icon: <UserIcon className="w-3 h-3" /> },
      user: { color: 'bg-blue-500/20 text-blue-400', icon: <UserIcon className="w-3 h-3" /> },
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config[role].color}`}>
        {config[role].icon}
        {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'User'}
      </span>
    )
  }

  const getStatusBadge = (status: User['status']) => {
    const config = {
      active: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      inactive: { color: 'bg-gray-500/20 text-gray-400', icon: <XCircle className="w-3 h-3" /> },
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: <Calendar className="w-3 h-3" /> },
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config[status].color}`}>
        {config[status].icon}
        {status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Pending'}
      </span>
    )
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
    }
  }

  const handleAddUser = () => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: 'New User',
      email: `user${users.length + 1}@company.com`,
      role: 'user',
      department: 'New Department',
      status: 'pending',
      lastActive: new Date().toISOString()
    }
    setUsers([newUser, ...users])
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Quản lý người dùng</h2>
          <p className="text-gray-400">Tổng cộng {users.length} người dùng, {filteredUsers.length} kết quả tìm thấy</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddUser}
          >
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-effect-light rounded-xl text-white
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Role filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full glass-effect-light rounded-xl px-4 py-3 text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full glass-effect-light rounded-xl px-4 py-3 text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-surface">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-300">Người dùng</th>
                <th className="text-left p-4 font-semibold text-gray-300">Vai trò</th>
                <th className="text-left p-4 font-semibold text-gray-300">Phòng ban</th>
                <th className="text-left p-4 font-semibold text-gray-300">Trạng thái</th>
                <th className="text-left p-4 font-semibold text-gray-300">Hoạt động cuối</th>
                <th className="text-left p-4 font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-dark-border hover:bg-dark-surface/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-500/20 to-neon-cyan/20 
                        flex items-center justify-center">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  
                  <td className="p-4">
                    <div className="font-medium">{user.department}</div>
                  </td>
                  
                  <td className="p-4">
                    {getStatusBadge(user.status)}
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-gray-300">
                      {new Date(user.lastActive).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(user.lastActive).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button className="p-2 rounded-lg hover:bg-dark-surface transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Chỉnh sửa người dùng"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tên</label>
                <input
                  type="text"
                  defaultValue={selectedUser.name}
                  className="w-full glass-effect-light rounded-xl px-4 py-3 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="w-full glass-effect-light rounded-xl px-4 py-3 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vai trò</label>
                <select className="w-full glass-effect-light rounded-xl px-4 py-3 text-white">
                  <option value="user" selected={selectedUser.role === 'user'}>User</option>
                  <option value="moderator" selected={selectedUser.role === 'moderator'}>Moderator</option>
                  <option value="admin" selected={selectedUser.role === 'admin'}>Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phòng ban</label>
                <input
                  type="text"
                  defaultValue={selectedUser.department}
                  className="w-full glass-effect-light rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Hủy
              </Button>
              <Button variant="primary">
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              
              <p className="text-gray-300">
                Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.name}</strong>?
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Thao tác này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Xóa người dùng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}