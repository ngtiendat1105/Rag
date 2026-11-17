export type FeedbackRating = 'like' | 'dislike'

export interface ChatFeedback {
  id: string
  userId: string
  userName: string
  messageId: string
  rating: FeedbackRating
  reason: string
  detail: string
  messageContent: string
  createdAt: string
}

interface FeedbackRow {
  id: string
  user_id: string
  message_id: string
  rating: FeedbackRating
  reason: string
  detail: string
  message_content: string
  created_at: string
  app_users?: { name: string } | null
}

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Chưa cấu hình SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.')
  return { baseUrl: `${url.replace(/\/$/, '')}/rest/v1`, key }
}

async function request(path: string, init: RequestInit = {}) {
  const { baseUrl, key } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (error.code === 'PGRST205' && error.message?.includes('chat_feedback')) {
      throw new Error('Supabase chưa có bảng chat_feedback. Hãy chạy supabase/migrations/20261103_create_chat_feedback.sql và 20261103_add_feedback_detail.sql trong SQL Editor, sau đó tải lại schema.')
    }
    throw new Error(typeof error.message === 'string' ? error.message : `Supabase HTTP ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

const mapFeedback = (row: FeedbackRow): ChatFeedback => ({
  id: row.id,
  userId: row.user_id,
  userName: row.app_users?.name || 'Người dùng',
  messageId: row.message_id,
  rating: row.rating,
  reason: row.reason,
  detail: row.detail || '',
  messageContent: row.message_content,
  createdAt: row.created_at,
})

export async function createChatFeedback(input: {
  userId: string
  messageId: string
  rating: FeedbackRating
  reason: string
  detail: string
  messageContent: string
}) {
  const rows = await request('/chat_feedback?select=id,user_id,message_id,rating,reason,detail,message_content,created_at', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: input.userId,
      message_id: input.messageId,
      rating: input.rating,
      reason: input.reason,
      detail: input.detail,
      message_content: input.messageContent,
    }),
  }) as FeedbackRow[]
  return rows[0] ? mapFeedback(rows[0]) : null
}

export async function listChatFeedback() {
  const rows = await request('/chat_feedback?select=id,user_id,message_id,rating,reason,detail,message_content,created_at,app_users(name)&order=created_at.desc') as FeedbackRow[]
  return rows.map(mapFeedback)
}
