import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi })
}

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { locale: vi, addSuffix: true })
}

export const formatChatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return 'Hôm nay'
  } else if (diffInHours < 48) {
    return 'Hôm qua'
  } else if (diffInHours < 168) { // 7 days
    return format(dateObj, 'EEEE', { locale: vi })
  } else {
    return format(dateObj, 'dd/MM/yyyy', { locale: vi })
  }
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export const generateChatId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const extractLegalReferences = (text: string): string[] => {
  const legalPatterns = [
    /Điều\s+\d+[a-zA-Z]?/g,
    /Khoản\s+\d+/g,
    /Luật\s+[A-Z][A-Za-z\s]+/g,
    /Nghị\s+định\s+\d+\/\d+/g,
    /Thông\s+tư\s+\d+\/\d+/g,
  ]
  
  const references: string[] = []
  legalPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      references.push(...matches)
    }
  })
  
  // Remove duplicates
  const uniqueReferences = Array.from(new Set(references))
  return uniqueReferences
}