# Legal AI Chatbot Enterprise - Hệ thống Trợ lý Pháp lý Nội bộ

## Giới thiệu
Ứng dụng Web Chatbot Pháp lý Nội bộ Doanh nghiệp với UI/UX hiện đại, tích hợp RAG (Retrieval-Augmented Generation) và thiết kế futuristic.

## Tính năng chính

### 🎨 **UI/UX Hiện đại**
- Dark Mode với theme Futuristic/Cyberpunk
- Glassmorphism và hiệu ứng chuyển động mượt mà
- Animation 3D sử dụng Three.js
- Gradient colors: Dark Blue, Neon Cyan, Purple

### 🔐 **Authentication & Security**
- Đăng nhập với xác thực 2 lớp (2FA/OTP)
- Phân quyền RBAC: User và Admin
- JWT token và secure logout

### 💬 **Chatbot Interface**
- Giao diện chat hiện đại với sidebar lịch sử
- Tin nhắn AI hỗ trợ Markdown
- Hiệu ứng typing indicator
- Copy, rate (like/dislike), export chat

### 👑 **Admin Dashboard**
- Thống kê tổng quan hệ thống
- Quản lý người dùng (thêm/sửa/xóa)
- Quản lý Knowledge Base
- Analytics và reports

### 🔗 **RAG Integration**
- API service sẵn sàng kết nối RAG
- Mock data cho development
- Tìm kiếm tài liệu pháp lý
- Xử lý context và references

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** với TypeScript
- **Tailwind CSS** + Custom animations
- **Framer Motion** cho UI animations
- **Three.js** + React Three Fiber cho 3D

### State Management
- **Zustand** cho global state
- **Custom hooks** cho business logic

### UI Components
- **Lucide React** icons
- **React Markdown** cho nội dung AI
- **Recharts** cho data visualization

### Development
- **TypeScript** cho type safety
- **ESLint** + **Prettier** cho code quality

## Cấu trúc thư mục

```
/src
 ├── /app              # Next.js App Router pages
 ├── /components       # React components
 │    ├── /3d          # 3D Background components
 │    ├── /auth        # Authentication components
 │    ├── /chat        # Chat interface components
 │    ├── /admin       # Admin panel components
 │    └── /ui          # Reusable UI components
 ├── /hooks            # Custom React hooks
 ├── /services         # API services (RAG integration)
 ├── /store            # Zustand stores
 ├── /styles           # Global CSS & Tailwind
 └── /utils            # Utility functions
```

## Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd legal-chatbot-enterprise
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy development server
```bash
npm run dev
```

### 4. Build production
```bash
npm run build
npm start
```

## Demo Credentials

### User Login
- **Email:** user@company.com
- **Password:** password123
- **Role:** User

### Admin Login  
- **Email:** admin@company.com
- **Password:** admin123
- **Role:** Admin

## Tính năng demo

### Trang chủ
- Background 3D với animation
- Giới thiệu sản phẩm
- Features showcase

### Login
- Form đăng nhập glassmorphism
- Xác thực OTP 6 số
- Phân quyền tự động

### Chat Interface
- Mock AI responses
- Markdown formatting
- Typing indicators
- Export chat

### Admin Panel
- Dashboard statistics
- User management
- Mock analytics

## API Services

### RAG Integration Ready
```typescript
// Example API call
const response = await ragChatService.sendQueryToRAG(
  "Câu hỏi pháp lý",
  context,
  options
)
```

### Mock APIs cho Development
- Chat responses simulation
- Document search mock
- User authentication mock

## Environment Variables

Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_RAG_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_API=true
```

## Development

### Custom Hooks
- `useAuth()`: Authentication management
- `useChat()`: Chat state and logic
- `useRAG()`: RAG integration

### State Management
- `authStore.ts`: User authentication
- `chatStore.ts`: Chat state and messages

### Styling
- Tailwind configuration trong `tailwind.config.js`
- Custom animations và keyframes
- Global styles trong `globals.css`

## Tính năng tương lai

1. **Real RAG Integration** - Kết nối với hệ thống RAG thực
2. **Document Upload** - Upload và process tài liệu
3. **Advanced Analytics** - Chi tiết sử dụng
4. **Mobile App** - Ứng dụng di động
5. **Voice Input** - Chat bằng giọng nói
6. **Multi-language** - Hỗ trợ đa ngôn ngữ

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## License

MIT License - Xem file [LICENSE](LICENSE) để biết chi tiết

## Contact

Dự án được phát triển bởi Senior Full-Stack Developer/UI-UX Designer.

---

**Legal AI Chatbot Enterprise** - Hệ thống trợ lý pháp lý thông minh cho doanh nghiệp