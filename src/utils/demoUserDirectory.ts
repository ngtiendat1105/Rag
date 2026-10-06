export interface DirectoryUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  department: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
}

export const DIRECTORY_STORAGE_KEY = 'legal-ai-user-directory'

export const DEFAULT_DIRECTORY_USERS: DirectoryUser[] = [
  { id: '1', name: 'Nguyễn Tiến Đạt', email: 'ngtiendatt1105@gmail.com', role: 'user', department: 'Phòng Pháp chế', status: 'active', lastActive: '2026-10-06T09:30:00' },
  { id: '2', name: 'Trần Thị B', email: 'b.tran@company.com', role: 'user', department: 'Phòng Pháp chế', status: 'active', lastActive: '2026-10-06T08:45:00' },
  { id: '3', name: 'Lê Văn C', email: 'c.le@company.com', role: 'user', department: 'Phòng Nhân sự', status: 'inactive', lastActive: '2026-10-05T15:20:00' },
  { id: '4', name: 'Phạm Thị D', email: 'd.pham@company.com', role: 'moderator', department: 'Ban Giám đốc', status: 'active', lastActive: '2026-10-06T10:15:00' },
]

export function readDirectoryUsers(): DirectoryUser[] {
  if (typeof window === 'undefined') return DEFAULT_DIRECTORY_USERS
  try {
    const saved = localStorage.getItem(DIRECTORY_STORAGE_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_DIRECTORY_USERS
  } catch {
    return DEFAULT_DIRECTORY_USERS
  }
}
