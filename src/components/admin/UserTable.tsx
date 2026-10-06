'use client'

import { useEffect, useState } from 'react'
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
import { DEFAULT_DIRECTORY_USERS, DIRECTORY_STORAGE_KEY, DirectoryUser as User } from '@/utils/demoUserDirectory'

export default function UserTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(DEFAULT_DIRECTORY_USERS)
  const [directoryLoaded, setDirectoryLoaded] = useState(false)
  const [addError, setAddError] = useState('')
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' as User['role'], department: 'Phòng Pháp chế' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DIRECTORY_STORAGE_KEY)
      if (saved) setUsers(JSON.parse(saved))
    } catch {}
    setDirectoryLoaded(true)
  }, [])

  useEffect(() => {
    if (directoryLoaded) localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(users))
  }, [users, directoryLoaded])

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
    setAddError('')
    setShowAddModal(true)
  }

  const confirmAddUser = (event: React.FormEvent) => {
    event.preventDefault()
    const email = newUser.email.trim().toLowerCase()
    if (!newUser.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError('Vui lòng nhập đầy đủ họ tên và email hợp lệ.')
      return
    }
    if (users.some(user => user.email.toLowerCase() === email)) {
      setAddError('Email này đã tồn tại trong hệ thống.')
      return
    }
    const createdUser: User = {
      id: `user_${Date.now()}`,
      name: newUser.name.trim(),
      email,
      role: newUser.role,
      department: newUser.department,
      status: 'active',
      lastActive: new Date().toISOString()
    }
    setUsers(current => [createdUser, ...current])
    setNewUser({ name: '', email: '', role: 'user', department: 'Phòng Pháp chế' })
    setShowAddModal(false)
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm người dùng" size="lg">
        <form onSubmit={confirmAddUser} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-medium text-gray-300">Họ và tên</span><input autoFocus required value={newUser.name} onChange={e => setNewUser(current => ({ ...current, name: e.target.value }))} className="glass-effect-light w-full rounded-xl px-4 py-3" placeholder="Nguyễn Văn A" /></label>
            <label className="space-y-2"><span className="text-sm font-medium text-gray-300">Email</span><input required type="email" value={newUser.email} onChange={e => setNewUser(current => ({ ...current, email: e.target.value }))} className="glass-effect-light w-full rounded-xl px-4 py-3" placeholder="user@company.com" /></label>
            <label className="space-y-2"><span className="text-sm font-medium text-gray-300">Vai trò</span><select value={newUser.role} onChange={e => setNewUser(current => ({ ...current, role: e.target.value as User['role'] }))} className="glass-effect-light w-full rounded-xl px-4 py-3"><option className="bg-dark-surface" value="user">User</option><option className="bg-dark-surface" value="moderator">Moderator</option><option className="bg-dark-surface" value="admin">Admin</option></select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-gray-300">Phòng ban</span><select value={newUser.department} onChange={e => setNewUser(current => ({ ...current, department: e.target.value }))} className="glass-effect-light w-full rounded-xl px-4 py-3"><option className="bg-dark-surface">Phòng Pháp chế</option><option className="bg-dark-surface">Phòng Nhân sự</option><option className="bg-dark-surface">Phòng Kế toán</option><option className="bg-dark-surface">Phòng Kinh doanh</option><option className="bg-dark-surface">IT Department</option><option className="bg-dark-surface">Ban Giám đốc</option></select></label>
          </div>
          <div className="rounded-xl bg-primary-500/10 p-4 text-sm text-primary-200">Tài khoản được kích hoạt ngay với mật khẩu tạm <strong>password123</strong>. Người dùng xác minh OTP bằng email khi đăng nhập.</div>
          {addError && <p role="alert" className="text-sm text-red-400">{addError}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Hủy</Button><Button type="submit" variant="primary">Tạo tài khoản</Button></div>
        </form>
      </Modal>

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
