'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, ArrowLeft, Building2, Camera, Check, Loader2, LockKeyhole, Mail,
  Phone, Save, Scale, ShieldCheck, User as ProfileIcon,
} from 'lucide-react'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { useAuthStore, type User } from '@/store/authStore'
import BrandMark from '@/components/tuan/ui/BrandMark'
import ThemeSwitch from '@/components/tuan/ui/ThemeSwitch'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './profile.module.css'

interface ProfileFields {
  name: string
  phone: string
  avatarUrl: string
}

const emptyFields: ProfileFields = { name: '', phone: '', avatarUrl: '' }
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
const roleNames: Record<User['role'], string> = {
  user: 'Người dùng',
  moderator: 'Kiểm duyệt viên',
  admin: 'Quản trị viên',
}

function profileFields(profile: User): ProfileFields {
  return {
    name: profile.name,
    phone: profile.phone ?? '',
    avatarUrl: profile.avatarUrl || profile.avatar || '',
  }
}

async function readProfile(response: Response, fallback: string): Promise<User> {
  const data = await response.json().catch(() => null) as { user?: User; message?: string } | null
  if (!response.ok || !data?.user) throw new Error(data?.message || fallback)
  return data.user
}

export default function ProfilePage() {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light')
  const [form, setForm] = useState(emptyFields)
  const [saved, setSaved] = useState<ProfileFields | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [readingImage, setReadingImage] = useState(false)
  const [failedImage, setFailedImage] = useState('')
  const [imageError, setImageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const imageReader = useRef<FileReader | null>(null)
  const dirty = Boolean(saved && (
    form.name.trim() !== saved.name || form.phone.trim() !== saved.phone || form.avatarUrl !== saved.avatarUrl
  ))

  useEffect(() => {
    if (localStorage.getItem('legalai-theme') === 'dark') setAppearance('dark')
    return () => imageReader.current?.abort()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    const controller = new AbortController()
    fetch('/api/profile', { signal: controller.signal, cache: 'no-store' })
      .then(response => readProfile(response, 'Không thể tải hồ sơ.'))
      .then(profile => {
        if (controller.signal.aborted) return
        const fields = profileFields(profile)
        setForm(fields)
        setSaved(fields)
        setUser({ ...profile, avatar: fields.avatarUrl || undefined, avatarUrl: fields.avatarUrl || null })
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải hồ sơ.')
        }
      })
    return () => controller.abort()
  }, [hydrated, isAuthenticated, loadVersion, router, setUser])

  function toggleTheme() {
    const next = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(next)
    localStorage.setItem('legalai-theme', next)
  }

  function edit(field: keyof ProfileFields, value: string) {
    setForm(current => ({ ...current, [field]: value }))
    setSaveError('')
    setSavedNotice(false)
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setImageError('')
    if (!imageTypes.includes(file.type) || file.size > 1_000_000) {
      setImageError('Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 1 MB.')
      return
    }

    const reader = new FileReader()
    imageReader.current = reader
    setReadingImage(true)
    reader.onload = () => {
      setFailedImage('')
      edit('avatarUrl', String(reader.result))
    }
    reader.onerror = () => setImageError('Không đọc được ảnh. Hãy thử một tệp khác.')
    reader.onloadend = () => {
      imageReader.current = null
      setReadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  function undoChanges() {
    if (!saved) return
    setForm(saved)
    setImageError('')
    setSaveError('')
    setSavedNotice(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || saving || readingImage) return
    const fields = { ...form, name: form.name.trim(), phone: form.phone.trim() }
    setSaveError('')
    setSavedNotice(false)
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const profile = await readProfile(response, 'Không thể lưu hồ sơ.')
      const updated = profileFields(profile)
      setForm(updated)
      setSaved(updated)
      setUser({ ...profile, avatar: updated.avatarUrl || undefined, avatarUrl: updated.avatarUrl || null })
      setSavedNotice(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = form.name.trim() || user?.name || 'Legal AI'
  const initials = displayName.split(/\s+/).slice(-2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase('vi')

  return (
    <main className={`${theme.theme} ${styles.page}`} data-theme={appearance}>
      <header className={styles.navigation}>
        <div className={styles.navContent}>
          <div className={styles.brand}>
            <BrandMark size={38} />
            Legal AI
          </div>
          <div className={styles.navActions}>
            <Link href="/chat" className={`${theme.actionButton} ${styles.back}`} aria-label="Quay lại trò chuyện">
              <ArrowLeft size={17} aria-hidden="true" /> <span>Quay lại trò chuyện</span>
            </Link>
            <ThemeSwitch dark={appearance === 'dark'} onToggle={toggleTheme} compact />
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>Hồ sơ cá nhân</h1>

        {loadError ? (
          <section className={styles.state}>
            <p className={styles.error} role="alert"><AlertCircle size={18} aria-hidden="true" /> {loadError}</p>
            <button type="button" className={theme.actionButton} onClick={() => {
              setLoadError('')
              setLoadVersion(version => version + 1)
            }}>Thử tải lại</button>
          </section>
        ) : !hydrated || !isAuthenticated || !user || !saved ? (
          <div className={styles.state} role="status">
            <Loader2 className={styles.spinner} size={20} aria-hidden="true" /> Đang tải hồ sơ…
          </div>
        ) : (
          <div className={styles.profile}>
            <section className={styles.identity} aria-labelledby="profile-display-name">
              <div className={styles.avatar}>
                <span aria-hidden="true">{initials}</span>
                {form.avatarUrl && form.avatarUrl !== failedImage && (
                  <img src={form.avatarUrl} alt={`Ảnh đại diện của ${displayName}`} onError={() => setFailedImage(form.avatarUrl)} />
                )}
              </div>
              <div className={styles.identityBody}>
                <h2 id="profile-display-name">{displayName}</h2>
                <span className={styles.role}><ShieldCheck size={15} aria-hidden="true" /> {roleNames[user.role]}</span>
              </div>
              <Scale className={styles.identityMark} size={154} strokeWidth={1} aria-hidden="true" />
            </section>

            <div className={styles.grid}>
              <form className={styles.editor} onSubmit={submit} aria-labelledby="profile-editor-title">
                <div className={styles.panelHeading}>
                  <div className={styles.sectionIcon}><ProfileIcon size={21} aria-hidden="true" /></div>
                  <h2 id="profile-editor-title">Thông tin cá nhân</h2>
                </div>

                <div className={styles.editorBody}>
                  <div className={styles.fields}>
                    <label>
                      <span>Họ và tên</span>
                      <span className={styles.input}>
                        <ProfileIcon size={17} aria-hidden="true" />
                        <input required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={event => edit('name', event.target.value)} disabled={saving} />
                      </span>
                    </label>
                    <label>
                      <span>Số điện thoại <small>Không bắt buộc</small></span>
                      <span className={styles.input}>
                        <Phone size={17} aria-hidden="true" />
                        <input type="tel" autoComplete="tel" maxLength={20} placeholder="+84 901 234 567" value={form.phone} onChange={event => edit('phone', event.target.value)} disabled={saving} />
                      </span>
                    </label>
                  </div>
                  <section className={styles.photo} aria-labelledby="profile-photo-title">
                    <div className={styles.photoLabel}>
                      <span><Camera size={18} aria-hidden="true" /></span>
                      <div>
                        <h3 id="profile-photo-title">Ảnh đại diện</h3>
                        <p id="profile-photo-format">JPG, PNG hoặc WebP · Tối đa 1 MB</p>
                      </div>
                    </div>
                    <div className={styles.photoActions}>
                      <button type="button" className={`${theme.actionButton} ${styles.secondary}`} aria-describedby="profile-photo-format" disabled={saving || readingImage} onClick={() => fileInput.current?.click()}>
                        {readingImage ? 'Đang đọc…' : 'Đổi ảnh'}
                      </button>
                      {form.avatarUrl && (
                        <button type="button" className={theme.actionButton} disabled={saving || readingImage} onClick={() => {
                          edit('avatarUrl', '')
                          setImageError('')
                        }}>Gỡ ảnh</button>
                      )}
                      <input ref={fileInput} type="file" accept={imageTypes.join(',')} onChange={selectImage} hidden />
                    </div>
                  </section>
                  {imageError && <p className={styles.error} role="alert"><AlertCircle size={17} aria-hidden="true" /> {imageError}</p>}
                </div>

                <footer className={styles.footer}>
                  <div className={styles.status}>
                    {saveError ? <p className={styles.error} role="alert"><AlertCircle size={17} aria-hidden="true" /> {saveError}</p>
                      : savedNotice ? <p className={styles.success} role="status"><Check size={18} aria-hidden="true" /> Đã lưu thay đổi</p>
                        : dirty && <p className={styles.pending} role="status">Có thay đổi chưa lưu</p>}
                  </div>
                  <div className={styles.saveActions}>
                    <button type="button" className={theme.actionButton} disabled={!dirty || saving || readingImage} onClick={undoChanges}>Hoàn tác</button>
                    <button type="submit" className={theme.primaryButton} disabled={!dirty || saving || readingImage} aria-busy={saving}>
                      {saving ? <Loader2 className={styles.spinner} size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                      {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </footer>
              </form>
              <aside className={styles.account} aria-labelledby="profile-account-title">
                <div className={styles.panelHeading}>
                  <div className={styles.sectionIcon}><LockKeyhole size={19} aria-hidden="true" /></div>
                  <h2 id="profile-account-title">Thông tin tài khoản</h2>
                </div>
                <dl className={styles.details}>
                  <div>
                    <dt><Mail size={17} aria-hidden="true" /> Email công ty</dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div>
                    <dt><Building2 size={17} aria-hidden="true" /> Phòng ban</dt>
                    <dd>{user.department || 'Chưa cập nhật'}</dd>
                  </div>
                </dl>
                <p className={styles.accountNote}>Liên hệ quản trị viên để cập nhật email hoặc phòng ban.</p>
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
