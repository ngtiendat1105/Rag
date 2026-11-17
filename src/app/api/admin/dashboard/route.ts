import { NextRequest, NextResponse } from 'next/server'
import { listUsers } from '@/lib/supabaseUsers'
import { listPopularQuestions, listRecentQuestions } from '@/lib/supabaseQuestions'
import { listStorageDocuments } from '@/lib/supabaseStorage'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

function monthKey(date: string) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  if (readSession(request.cookies.get(SESSION_COOKIE)?.value)?.role !== 'admin') {
    return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  }

  try {
    const [users, questions, popularQuestions, storageDocuments] = await Promise.all([
      listUsers(),
      listRecentQuestions(),
      listPopularQuestions(5),
      listStorageDocuments(),
    ])
    const now = new Date()
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const previousMonth = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`
    const countByMonth = (values: string[], key: string) => values.filter(value => monthKey(value) === key).length
    const userDates = users.map(user => user.createdAt).filter((value): value is string => Boolean(value))
    const questionDates = questions.map(question => question.createdAt)
    const currentUsers = countByMonth(userDates, currentMonth)
    const previousUsers = countByMonth(userDates, previousMonth)
    const currentQuestions = countByMonth(questionDates, currentMonth)
    const previousQuestions = countByMonth(questionDates, previousMonth)
    const percentChange = (current: number, previousValue: number) => previousValue === 0 ? null : Math.round(((current - previousValue) / previousValue) * 1000) / 10
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1))
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      return {
        label: date.toLocaleDateString('vi-VN', { month: 'short', timeZone: 'UTC' }),
        users: countByMonth(userDates, key),
        chats: countByMonth(questionDates, key),
      }
    })

    return NextResponse.json({
      totals: {
        users: users.length,
        documents: storageDocuments.length,
        chats: questions.length,
        activeModels: process.env.RAG_LLM_MODEL || process.env.OLLAMA_MODEL ? 1 : 0,
        responseTimeMs: null,
      },
      changes: {
        users: percentChange(currentUsers, previousUsers),
        chats: percentChange(currentQuestions, previousQuestions),
        documents: null,
        responseTime: null,
      },
      chart: months,
      popularQuestions,
      recentQuestions: questions.slice(0, 5),
    })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể tải dữ liệu dashboard.' }, { status: 503 })
  }
}
