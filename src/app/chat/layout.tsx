import type { Viewport } from 'next'
import type { ReactNode } from 'react'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  interactiveWidget: 'resizes-content',
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  return children
}
