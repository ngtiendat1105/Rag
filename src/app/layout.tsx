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
  title: "Legal AI Chatbot | Enterprise",
  description: "Web Chatbot Phap Ly Noi Bo Doanh Nghiep voi AI va RAG integration",
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
