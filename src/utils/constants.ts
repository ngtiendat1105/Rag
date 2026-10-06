export const APP_NAME = 'Legal AI Chatbot Enterprise'
export const APP_DESCRIPTION = 'Web Chatbot Pháp Lý Nội Bộ Doanh Nghiệp với AI và RAG integration'

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const CHAT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
} as const

export type ChatStatus = typeof CHAT_STATUS[keyof typeof CHAT_STATUS]

export const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
  SYSTEM: 'system',
  LEGAL_REFERENCE: 'legal_reference',
} as const

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]

export const AI_MODELS = {
  GPT_4: 'gpt-4',
  GPT_3_5: 'gpt-3.5-turbo',
  CLAUDE_3: 'claude-3',
  CUSTOM_RAG: 'custom-rag',
} as const

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS]

export const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
} as const

export type Theme = typeof THEME[keyof typeof THEME]

export const LEGAL_DOCUMENT_TYPES = [
  'PDF',
  'DOCX',
  'XLSX',
  'PPTX',
  'TXT',
  'IMAGE',
] as const

export type LegalDocumentType = typeof LEGAL_DOCUMENT_TYPES[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
]

export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CHAT_HISTORY: '/api/chat/history',
  UPLOAD_DOCUMENT: '/api/documents/upload',
  RAG_SEARCH: '/api/rag/search',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_VERIFY: '/api/auth/verify',
  USERS: '/api/users',
  STATISTICS: '/api/statistics',
} as const

export const DEMO_MESSAGES = [
  {
    id: 'msg_1',
    role: 'user',
    content: 'Xin chào, tôi muốn hỏi về quy định nghỉ phép năm của công ty.',
    timestamp: '2024-01-15T09:30:00',
  },
  {
    id: 'msg_2',
    role: 'assistant',
    content: `Chào bạn! Về quy định nghỉ phép năm, theo **Điều 113 Bộ luật Lao động** và quy định nội bộ công ty:

**1. Điều kiện hưởng:**
- Đã làm việc đủ 12 tháng cho người sử dụng lao động
- Thời gian làm việc được tính từ ngày bắt đầu làm việc

**2. Số ngày nghỉ:**
- 12 ngày làm việc cho người làm công việc bình thường
- 14 ngày cho người làm công việc nặng nhọc, độc hại
- 16 ngày cho người khuyết tật làm việc

**3. Cách tính:**
- Mỗi tháng làm việc được tính 1 ngày nghỉ
- Có thể nghỉ nhiều lần trong năm
- Phải báo trước ít nhất 3 ngày làm việc

Bạn có thể tham khảo thêm tại **Nghị định 145/2020/NĐ-CP** về chi tiết thi hành Bộ luật Lao động.`,
    timestamp: '2024-01-15T09:31:00',
  },
  {
    id: 'msg_3',
    role: 'user',
    content: 'Cảm ơn! Vậy thủ tục đăng ký nghỉ phép như thế nào?',
    timestamp: '2024-01-15T09:32:00',
  },
  {
    id: 'msg_4',
    role: 'assistant',
    content: `**Thủ tục đăng ký nghỉ phép năm:**

1. **Đơn xin nghỉ phép:**
   - Điền đầy đủ thông tin trên form đơn nghỉ phép
   - Ghi rõ thời gian bắt đầu và kết thúc
   - Ký và ghi rõ họ tên

2. **Trình tự xét duyệt:**
   - Nộp đơn cho quản lý trực tiếp
   - Quản lý phê duyệt trong vòng 2 ngày làm việc
   - Chuyển đơn đã duyệt cho phòng Nhân sự

3. **Lưu ý quan trọng:**
   - Nghỉ liên tục từ 5 ngày trở lên cần đăng ký trước 1 tuần
   - Không được nghỉ trong thời gian cao điểm công việc
   - Phải bàn giao công việc trước khi nghỉ

**Tài liệu tham khảo:**
- Quy định số 15/QĐ-HĐQT về chế độ nghỉ phép
- Biểu mẫu 03/BM-NP (Đơn xin nghỉ phép)`,
    timestamp: '2024-01-15T09:33:00',
  },
] as const

export const SAMPLE_CHATS = [
  {
    id: 'chat_1',
    title: 'Hỏi về nghỉ phép năm',
    lastMessage: 'Cảm ơn! Vậy thủ tục đăng ký nghỉ phép như thế nào?',
    timestamp: '2024-01-15T09:32:00',
    unread: false,
    status: 'active' as ChatStatus,
  },
  {
    id: 'chat_2',
    title: 'Thắc mắc về hợp đồng lao động',
    lastMessage: 'Điều khoản về thử việc có thể thay đổi không?',
    timestamp: '2024-01-14T14:20:00',
    unread: true,
    status: 'active' as ChatStatus,
  },
  {
    id: 'chat_3',
    title: 'Tư vấn về bảo hiểm xã hội',
    lastMessage: 'Mức đóng BHXH tối thiểu là bao nhiêu?',
    timestamp: '2024-01-13T11:15:00',
    unread: false,
    status: 'archived' as ChatStatus,
  },
  {
    id: 'chat_4',
    title: 'Hướng dẫn sử dụng hệ thống',
    lastMessage: 'Làm thế nào để upload tài liệu?',
    timestamp: '2024-01-12T16:45:00',
    unread: false,
    status: 'active' as ChatStatus,
  },
  {
    id: 'chat_5',
    title: 'Về chính sách tăng lương',
    lastMessage: 'Tiêu chí đánh giá để tăng lương là gì?',
    timestamp: '2024-01-11T10:30:00',
    unread: false,
    status: 'draft' as ChatStatus,
  },
] as const