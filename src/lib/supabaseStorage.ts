export interface StorageDocument {
  id: string
  name: string
  path: string
  size: number
  contentType: string
  createdAt: string | null
  updatedAt: string | null
}

interface StorageObject {
  id?: string
  name: string
  size?: number
  created_at?: string
  updated_at?: string
  metadata?: { mimetype?: string; size?: number }
}

const bucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'legal-documents'

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Chưa cấu hình Supabase Storage.')
  return { baseUrl: `${url.replace(/\/$/, '')}/storage/v1`, key }
}

async function storageRequest(path: string, init: RequestInit = {}) {
  const { baseUrl, key } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Supabase Storage HTTP ${response.status}`)
  }
  return response
}

export async function listStorageDocuments(): Promise<StorageDocument[]> {
  const response = await storageRequest(`/object/list/${encodeURIComponent(bucket())}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 1000, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }),
  })
  const objects = await response.json() as StorageObject[]
  return objects
    .filter(object => object.name && !object.name.endsWith('/'))
    .map(object => ({
      id: object.id || object.name,
      name: object.name,
      path: object.name,
      size: Number(object.metadata?.size || object.size || 0),
      contentType: object.metadata?.mimetype || 'application/octet-stream',
      createdAt: object.created_at || null,
      updatedAt: object.updated_at || object.created_at || null,
    }))
}

export async function uploadStorageDocument(file: File): Promise<void> {
  const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
  const baseName = file.name.slice(0, file.name.length - extension.length)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, value => value === 'Đ' ? 'D' : 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'document'
  const existing = new Set((await listStorageDocuments()).map(document => document.path))
  let safeName = `${baseName}${extension}`
  if (existing.has(safeName)) safeName = `${baseName}_${Date.now()}${extension}`
  const filePath = encodeURIComponent(safeName)
  await storageRequest(`/object/${encodeURIComponent(bucket())}/${filePath}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
    body: await file.arrayBuffer(),
  })
}

export async function deleteStorageDocument(path: string): Promise<void> {
  const objectPath = path.split('/').map(encodeURIComponent).join('/')
  await storageRequest(`/object/${encodeURIComponent(bucket())}/${objectPath}`, {
    method: 'DELETE',
  })
}
