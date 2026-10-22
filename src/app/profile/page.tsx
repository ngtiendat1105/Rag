'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Camera, Mail, Phone, Save, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { User as AuthUser, useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [form, setForm] = useState({ name: '', phone: '', avatarUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    fetch('/api/profile')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Không thể tải hồ sơ.')
        const profile = data.user as AuthUser & { avatarUrl?: string | null }
        setForm({ name: profile.name, phone: profile.phone || '', avatarUrl: profile.avatarUrl || profile.avatar || '' })
        setUser({ ...profile, avatar: profile.avatarUrl || profile.avatar })
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ.'))
      .finally(() => setLoading(false))
  }, [hydrated, isAuthenticated, router, setUser])

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 1_000_000) {
      setError('Vui lòng chọn ảnh hợp lệ, dung lượng tối đa 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm(current => ({ ...current, avatarUrl: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Không thể lưu hồ sơ.')
      const profile = data.user as AuthUser & { avatarUrl?: string | null }
      setUser({ ...profile, avatar: profile.avatarUrl || undefined })
      setForm({ name: profile.name, phone: profile.phone || '', avatarUrl: profile.avatarUrl || '' })
      setMessage('Hồ sơ đã được cập nhật.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || !isAuthenticated || !user || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner w-12 h-12" /></div>
  }

  return (
    <main className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/chat')} className="flex items-center gap-2 text-gray-300 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại trò chuyện
        </button>
        <section className="glass-effect rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-400 mb-8">Xem và cập nhật thông tin tài khoản của bạn.</p>
          <form onSubmit={submit} className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-dark-surface flex items-center justify-center">
                {form.avatarUrl ? <img src={form.avatarUrl} alt="Ảnh đại diện" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-gray-500" />}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dark-border px-4 py-2 hover:bg-dark-surface">
                <Camera className="w-4 h-4" /> Đổi ảnh đại diện
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} className="hidden" />
              </label>
            </div>
            <Input label="Họ và tên" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} icon={<User className="w-4 h-4" />} required />
            <Input label="Email" value={user.email} icon={<Mail className="w-4 h-4" />} disabled />
            <Input label="Số điện thoại cá nhân" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} icon={<Phone className="w-4 h-4" />} placeholder="+84 901 234 567" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-green-400">{message}</p>}
            <Button type="submit" disabled={saving} icon={<Save className="w-4 h-4" />}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
