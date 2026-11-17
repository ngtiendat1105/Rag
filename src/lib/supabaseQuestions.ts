export interface PopularQuestion {
  question: string
  count: number
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
    throw new Error(typeof error.message === 'string' ? error.message : `Supabase HTTP ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function recordQuestion(input: { userId: string; question: string }) {
  await request('/chat_questions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: input.userId,
      question: input.question,
      normalized_question: input.question.trim().toLocaleLowerCase('vi-VN').replace(/\s+/g, ' '),
    }),
  })
}

export async function listPopularQuestions(limit = 5) {
  const rows = await request(`/rpc/get_popular_questions?limit_count=${Math.min(Math.max(limit, 1), 10)}`) as PopularQuestion[]
  return rows.map(row => ({ question: row.question, count: Number(row.count) }))
}
