export type ModerationCategory = 'profanity' | 'threat'

export interface ModerationResult {
  allowed: boolean
  category?: ModerationCategory
  message?: string
}

const profanityPatterns = [
  /(^|\s)(địt|dit|đụ|du|đéo|deo|lồn|lon|cặc|cac|vcl|clm|clmm|đm|dm|d\s*m|ngu)(\s|$)/,
  /(^|\s)(địt\s*mẹ|dit\s*me|đụ\s*má|du\s*ma|con\s*đĩ|con\s*di)(\s|$)/,
]

const threatPatterns = [
  /(^|\s)(chết\s*đi|chet\s*di|biến\s*đi|bien\s*di)(\s|$)/,
  /(^|\s)(giết|giet|đánh\s*chết|danh\s*chet|xử|xu)\s+(mày|may|nó|no)(\s|$)/,
  /(^|\s)(tao|tôi|toi)\s+(sẽ\s+)?(giết|giet|đánh\s*chết|danh\s*chet)\s+(mày|may|nó|no)(\s|$)/,
]

function normalizeForModeration(value: string) {
  return value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFKC')
    .replace(/[0@]/g, match => match === '0' ? 'o' : 'a')
    .replace(/[_*~`'".,!?;:()[\]{}<>/\\|+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function moderateChatContent(content: string): ModerationResult {
  const normalized = normalizeForModeration(content)
  if (!normalized) return { allowed: false, message: 'Vui lòng nhập nội dung câu hỏi.' }

  if (threatPatterns.some(pattern => pattern.test(normalized))) {
    return { allowed: false, category: 'threat', message: 'Tin nhắn có nội dung đe dọa hoặc bạo lực. Vui lòng diễn đạt lại theo cách phù hợp.' }
  }
  if (profanityPatterns.some(pattern => pattern.test(normalized))) {
    return { allowed: false, category: 'profanity', message: 'Tin nhắn chứa ngôn từ không phù hợp. Vui lòng chỉnh sửa trước khi gửi.' }
  }

  return { allowed: true }
}

export class ContentModerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentModerationError'
  }
}
