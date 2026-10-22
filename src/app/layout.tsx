import type { Metadata, Viewport } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "../styles/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
})

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
      <body className={`${inter.variable} ${robotoMono.variable} font-sans bg-dark-bg text-white`}>
        <div className="min-h-screen relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
