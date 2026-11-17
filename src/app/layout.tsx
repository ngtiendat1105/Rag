import type { Metadata, Viewport } from "next"
import "../styles/globals.css"
import { ToastProvider } from "@/components/ui/ToastProvider"
import PresenceHeartbeat from "@/components/auth/PresenceHeartbeat"


export const metadata: Metadata = {
  title: "Legal AI | Trợ lý pháp lý cho doanh nghiệp",
  description: "Tra cứu, đối chiếu và tổng hợp thông tin từ kho tài liệu pháp lý nội bộ bằng AI.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <body className="font-sans bg-dark-bg text-white">
        <div className="min-h-screen relative overflow-hidden">
          <ToastProvider>
            <PresenceHeartbeat />
            {children}
          </ToastProvider>
        </div>
      </body>
    </html>
  )
}
