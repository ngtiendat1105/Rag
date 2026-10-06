# Quick Start Guide - Legal AI Chatbot Enterprise

## 🚀 Start Development Server

```bash
npm run dev
```

Sau đó truy cập: http://localhost:3000

## 📋 Test Credentials

### User Account (for Chat Interface)
- **Email:** user@company.com
- **Password:** password123
- **Role:** User
- **Department:** Phòng Pháp chế

### Admin Account (for Admin Dashboard)
- **Email:** admin@company.com  
- **Password:** admin123
- **Role:** Admin
- **Department:** IT Department

## 🔧 Available Routes

### 1. Homepage (`/`)
- Background 3D với animation
- Features showcase
- Call-to-action buttons

### 2. Login (`/login`)
- Glassmorphism form với 3D background
- Form validation
- 2FA OTP verification

### 3. Chat Interface (`/chat`)
- Main chatbot interface
- Chat history sidebar
- Mock AI responses
- Message rating & export

### 4. Admin Dashboard (`/admin`)
- Statistics dashboard
- User management
- Analytics charts

### 5. Admin Users (`/admin/users`)
- User table với CRUD operations
- Filter & search users
- Role management

## 🎨 UI Features

### Glassmorphism Effects
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Color Theme
- **Dark Background:** `#0a0a1a`
- **Primary Blue:** `#0084e6`
- **Neon Cyan:** `#00ffff`
- **Neon Purple:** `#9d00ff`

### Animations
- Framer Motion transitions
- Typing indicators
- Message fade-in effects
- Hover scale effects

## 🔌 API Integration Ready

### RAG Service
```typescript
import { ragChatService } from '@/services/ragChatService'

// Send query to RAG
const response = await ragChatService.sendQueryToRAG(
  "Câu hỏi về hợp đồng lao động",
  context,
  { temperature: 0.7 }
)
```

### Mock Data
- Chat responses với legal references
- User authentication simulation
- Document search results

## 📁 Project Structure

```
legal-chatbot-enterprise/
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── store/              # Zustand stores
│   └── styles/             # Global CSS
├── public/                 # Static assets
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind config
└── README.md              # Documentation
```

## 🛠 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🎯 Key Components

### 1. `Background3D.tsx`
- Three.js background scene
- Floating geometric shapes
- Light effects và gradient overlay

### 2. `ChatMessage.tsx`
- Message display với Markdown
- User/AI message styling
- Action buttons (copy, rate)

### 3. `ChatInput.tsx`
- Message composition
- Quick questions suggestions
- Attachment options

### 4. `DashboardStats.tsx`
- Statistics cards
- Chart visualizations
- Recent activity feed

### 5. `UserTable.tsx`
- User management table
- Filter và search functionality
- CRUD operations modal

## 🔒 Authentication Flow

1. **Login Form** → Email, Password, Department
2. **OTP Verification** → 6-digit code
3. **Role-based Routing** → User to `/chat`, Admin to `/admin`
4. **JWT Storage** → Local storage management
5. **Auto-logout** → Token expiration handling

## 🎪 Mock Data Features

### Chat Responses
- Legal document references
- Confidence scores
- Suggested follow-up questions

### User Data
- Demo user profiles
- Department information
- Role-based permissions

### Statistics
- Usage metrics
- Growth charts
- System status indicators

## 🚨 Troubleshooting

### Build Errors
```bash
# Clear node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check type definitions
npx tsc --noEmit
```

### Development Issues
- Đảm bảo Node.js version 18+
- Check port 3000 availability
- Verify all dependencies installed

## 📈 Next Steps

1. **Connect Real RAG API** → Update `ragChatService.ts`
2. **Add Real Database** → MongoDB/PostgreSQL integration
3. **Implement File Upload** → Document processing
4. **Add Real-time Features** → WebSocket integration
5. **Deploy to Production** → Vercel/AWS deployment

## 📞 Support

Dự án được thiết kế để dễ dàng mở rộng và tích hợp với hệ thống RAG thực tế. Các components và services đã được modularized để dễ bảo trì và nâng cấp.

---

✨ **Legal AI Chatbot Enterprise is ready to use!** ✨

Start với `npm run dev` và truy cập http://localhost:3000 để trải nghiệm ứng dụng.