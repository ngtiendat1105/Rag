'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle, RotateCcw, Save, Settings } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const STORAGE_KEY = 'rag-settings'

interface RagConfig {
  model: string
  embeddingModel: string
  topK: number
  temperature: number
  similarityThreshold: number
  chunkSize: number
  citations: boolean
}

const DEFAULT_CONFIG: RagConfig = {
  model: 'gpt-3.5-turbo',
  embeddingModel: 'paraphrase-multilingual-mpnet-base-v2',
  topK: 5,
  temperature: 0.2,
  similarityThreshold: 0.5,
  chunkSize: 512,
  citations: true,
}

const MODEL_OPTIONS = [
  { value: 'gpt-3.5-turbo', label: 'OpenAI · GPT-3.5 Turbo' },
  { value: 'gemini-1.5-pro', label: 'Google · Gemini 1.5 Pro' },
  { value: 'llama3.2:latest', label: 'Ollama · Llama 3.2' },
]

const EMBEDDING_OPTIONS = [
  {
    value: 'paraphrase-multilingual-mpnet-base-v2',
    label: 'Multilingual MPNet (768d)',
  },
  {
    value: 'paraphrase-multilingual-MiniLM-L12-v2',
    label: 'Multilingual MiniLM (384d) · cần re-index',
  },
  { value: 'bge-m3', label: 'BGE-M3 (1024d) · cần re-index' },
]

const CONFIG_LIMITS = {
  topK: { min: 1, max: 10, step: 1 },
  temperature: { min: 0, max: 2, step: 0.1 },
  similarityThreshold: { min: 0, max: 1, step: 0.05 },
  chunkSize: { min: 512, max: 10000, step: 128 },
} as const

function getEmbeddingOption(value: string) {
  return EMBEDDING_OPTIONS.find(option => option.value === value) || EMBEDDING_OPTIONS[0]
}

function isAllowedValue(value: string, options: Array<{ value: string }>) {
  return options.some(option => option.value === value)
}

function isValidStep(value: number, min: number, step: number) {
  const steps = (value - min) / step
  return Math.abs(steps - Math.round(steps)) < 0.000001
}

function validateConfig(config: RagConfig): string[] {
  const errors: string[] = []
  const addRangeError = (label: string, value: number, min: number, max: number, step: number) => {
    if (!Number.isFinite(value) || value < min || value > max || !isValidStep(value, min, step)) {
      errors.push(`${label} phải nằm trong khoảng ${min}–${max} và theo bước ${step}.`)
    }
  }

  if (!isAllowedValue(config.model, MODEL_OPTIONS)) {
    errors.push('Mô hình AI không hợp lệ.')
  }
  if (!isAllowedValue(config.embeddingModel, EMBEDDING_OPTIONS)) {
    errors.push('Mô hình Embedding không hợp lệ.')
  }
  addRangeError('Top K', config.topK, CONFIG_LIMITS.topK.min, CONFIG_LIMITS.topK.max, CONFIG_LIMITS.topK.step)
  addRangeError('Temperature', config.temperature, CONFIG_LIMITS.temperature.min, CONFIG_LIMITS.temperature.max, CONFIG_LIMITS.temperature.step)
  addRangeError(
    'Ngưỡng độ tương đồng',
    config.similarityThreshold,
    CONFIG_LIMITS.similarityThreshold.min,
    CONFIG_LIMITS.similarityThreshold.max,
    CONFIG_LIMITS.similarityThreshold.step,
  )
  addRangeError('Kích thước phân đoạn', config.chunkSize, CONFIG_LIMITS.chunkSize.min, CONFIG_LIMITS.chunkSize.max, CONFIG_LIMITS.chunkSize.step)
  if (typeof config.citations !== 'boolean') {
    errors.push('Trạng thái bắt buộc trích dẫn không hợp lệ.')
  }
  return errors
}

function configsEqual(left: RagConfig, right: RagConfig) {
  return (
    left.model === right.model &&
    left.embeddingModel === right.embeddingModel &&
    left.topK === right.topK &&
    left.temperature === right.temperature &&
    left.similarityThreshold === right.similarityThreshold &&
    left.chunkSize === right.chunkSize &&
    left.citations === right.citations
  )
}

function isRagConfig(value: unknown): value is Partial<RagConfig> {
  return typeof value === 'object' && value !== null
}

function normalizeConfig(value: unknown): RagConfig {
  if (!isRagConfig(value)) return DEFAULT_CONFIG

  const model = typeof value.model === 'string' && MODEL_OPTIONS.some(option => option.value === value.model)
    ? value.model
    : DEFAULT_CONFIG.model
  const embeddingModel = typeof value.embeddingModel === 'string' && EMBEDDING_OPTIONS.some(option => option.value === value.embeddingModel)
    ? value.embeddingModel
    : DEFAULT_CONFIG.embeddingModel
  const numberInRange = (candidate: unknown, fallback: number, min: number, max: number) => (
    typeof candidate === 'number' && Number.isFinite(candidate)
      ? Math.min(max, Math.max(min, candidate))
      : fallback
  )

  return {
    model,
    embeddingModel,
    topK: numberInRange(value.topK, DEFAULT_CONFIG.topK, 1, 10),
    temperature: numberInRange(value.temperature, DEFAULT_CONFIG.temperature, 0, 2),
    similarityThreshold: numberInRange(value.similarityThreshold, DEFAULT_CONFIG.similarityThreshold, 0, 1),
    chunkSize: numberInRange(value.chunkSize, DEFAULT_CONFIG.chunkSize, 512, 10000),
    citations: typeof value.citations === 'boolean' ? value.citations : DEFAULT_CONFIG.citations,
  }
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  description,
  onChange,
  id,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  formatValue?: (value: number) => string
  description: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-4 font-medium">
        <span>{label}</span>
        <strong className="text-primary-300">{formatValue ? formatValue(value) : value}</strong>
      </span>
      <input
        id={id}
        aria-describedby={`${id}-description`}
        className="rag-range h-2 w-full cursor-pointer"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, #0084e6 ${((value - min) / (max - min)) * 100}%, rgba(42, 42, 74, 0.9) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <span className="mt-1 flex justify-between text-xs font-medium text-gray-400">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </span>
      <span id={`${id}-description`} className="mt-2 block text-sm leading-6 text-gray-300">{description}</span>
    </label>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Bật hoặc tắt bắt buộc trích dẫn nguồn"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400/70 focus:ring-offset-2 focus:ring-offset-dark-bg ${
        checked ? 'bg-primary-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [config, setConfig] = useState<RagConfig>(DEFAULT_CONFIG)
  const [savedConfig, setSavedConfig] = useState<RagConfig>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [pendingEmbeddingModel, setPendingEmbeddingModel] = useState<string | null>(null)
  const [isChunkSizeDialogOpen, setIsChunkSizeDialogOpen] = useState(false)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const savedNoticeTimer = useRef<number | null>(null)

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY)
    if (!storedValue) {
      setIsLoading(false)
      return
    }

    try {
      const parsedValue = JSON.parse(storedValue)
      const loadedConfig = normalizeConfig(parsedValue)
      const validationErrors = isRagConfig(parsedValue)
        ? validateConfig(loadedConfig)
        : ['Dữ liệu cấu hình đã lưu không đúng định dạng.']
      setConfig(loadedConfig)
      setSavedConfig(loadedConfig)
      if (validationErrors.length > 0) {
        setStorageWarning('Một số giá trị cấu hình đã lưu không hợp lệ và đã được đưa về giới hạn an toàn.')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig))
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setStorageWarning('Không thể đọc cấu hình đã lưu. Hệ thống đã dùng cấu hình mặc định.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const isDirty = useMemo(
    () => !configsEqual(config, savedConfig),
    [config, savedConfig],
  )

  const updateConfig = <K extends keyof RagConfig>(key: K, value: RagConfig[K]) => {
    setConfig(current => ({ ...current, [key]: value }))
    setSaved(false)
    setSaveError(null)
  }

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    return () => {
      if (savedNoticeTimer.current !== null) {
        window.clearTimeout(savedNoticeTimer.current)
      }
    }
  }, [])

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG)
    setSaved(false)
    setSaveError(null)
    setPendingEmbeddingModel(null)
    setIsChunkSizeDialogOpen(false)
    setIsResetDialogOpen(false)
  }

  const requestEmbeddingModelChange = (embeddingModel: string) => {
    if (embeddingModel === config.embeddingModel) return
    setPendingEmbeddingModel(embeddingModel)
  }

  const confirmEmbeddingModelChange = () => {
    if (!pendingEmbeddingModel) return
    updateConfig('embeddingModel', pendingEmbeddingModel)
    setPendingEmbeddingModel(null)
  }

  const persistConfig = () => {
    const validationErrors = validateConfig(config)
    if (validationErrors.length > 0) {
      setSaveError(validationErrors.join(' '))
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setStorageWarning(null)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      setSavedConfig(config)
      setSaved(true)
      if (savedNoticeTimer.current !== null) {
        window.clearTimeout(savedNoticeTimer.current)
      }
      savedNoticeTimer.current = window.setTimeout(() => {
        setSaved(false)
        savedNoticeTimer.current = null
      }, 2000)
    } catch {
      setSaveError('Không thể lưu cấu hình trên trình duyệt này. Vui lòng kiểm tra quyền lưu trữ và thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const save = () => {
    if (config.chunkSize !== savedConfig.chunkSize) {
      setIsChunkSizeDialogOpen(true)
      return
    }
    persistConfig()
  }

  return (
    <AdminPageShell>
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary-400" />
          <h1 className="text-3xl font-bold">Cấu hình RAG</h1>
        </div>
        <p className="text-gray-400">
          Điều chỉnh cách hệ thống tìm tài liệu và tạo câu trả lời.
        </p>
      </header>

      <section className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8">
        {isLoading && (
          <div className="mb-6 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm text-primary-200">
            Đang tải cấu hình đã lưu...
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Cấu hình cơ bản</h2>
              <p className="mt-1 text-sm text-gray-400">Chọn mô hình và cách hiển thị nguồn tham khảo.</p>
            </div>

            <label className="block">
              <span className="mb-2 block font-medium">Mô hình AI</span>
              <select
                id="rag-model"
                value={config.model}
                onChange={event => updateConfig('model', event.target.value)}
                className="glass-effect-light w-full rounded-xl border border-dark-border px-4 py-3 text-white outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              >
                {MODEL_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-dark-surface">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-medium">Mô hình Embedding</span>
              <select
                id="embedding-model"
                value={config.embeddingModel}
                onChange={event => requestEmbeddingModelChange(event.target.value)}
                className="glass-effect-light w-full rounded-xl border border-dark-border px-4 py-3 text-white outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              >
                {EMBEDDING_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-dark-surface">
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-sm leading-6 text-gray-400">
                Model đang dùng: {getEmbeddingOption(config.embeddingModel).label}. Đổi model yêu cầu lập chỉ mục lại toàn bộ tài liệu.
              </span>
            </label>

            {config.embeddingModel !== DEFAULT_CONFIG.embeddingModel && (
              <div className="flex gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span>
                  Đã chọn {getEmbeddingOption(config.embeddingModel).label}. Collection Qdrant hiện tại vẫn dùng
                  {` ${getEmbeddingOption(DEFAULT_CONFIG.embeddingModel).label}`} và cần re-index trước khi model mới có thể truy xuất dữ liệu.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-xl border border-dark-border bg-dark-surface/60 p-4">
              <div>
                <strong className="block font-medium">Bắt buộc trích dẫn nguồn</strong>
                <span className="mt-1 block text-sm leading-6 text-gray-400">
                  Hiển thị tài liệu tham chiếu trong mỗi câu trả lời.
                </span>
              </div>
              <ToggleSwitch
                checked={config.citations}
                onChange={value => updateConfig('citations', value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Thông số kỹ thuật</h2>
              <p className="mt-1 text-sm text-gray-400">Tinh chỉnh phạm vi truy xuất và độ sáng tạo của mô hình.</p>
            </div>

            <SliderField
              id="rag-top-k"
              label="Số đoạn tài liệu truy xuất (Top K)"
              value={config.topK}
              min={CONFIG_LIMITS.topK.min}
              max={CONFIG_LIMITS.topK.max}
              step={CONFIG_LIMITS.topK.step}
              description="Số lớn hơn cung cấp nhiều ngữ cảnh nhưng có thể làm câu trả lời dài hơn."
              onChange={value => updateConfig('topK', value)}
            />

            <SliderField
              id="rag-temperature"
              label="Temperature"
              value={config.temperature}
              min={CONFIG_LIMITS.temperature.min}
              max={CONFIG_LIMITS.temperature.max}
              step={CONFIG_LIMITS.temperature.step}
              formatValue={value => value.toFixed(1)}
              description="Giá trị thấp phù hợp với câu trả lời pháp lý cần tính nhất quán."
              onChange={value => updateConfig('temperature', value)}
            />

            <SliderField
              id="rag-similarity-threshold"
              label="Ngưỡng độ tương đồng"
              value={config.similarityThreshold}
              min={CONFIG_LIMITS.similarityThreshold.min}
              max={CONFIG_LIMITS.similarityThreshold.max}
              step={CONFIG_LIMITS.similarityThreshold.step}
              formatValue={value => value.toFixed(2)}
              description="Chỉ sử dụng các đoạn tài liệu có điểm tương đồng từ ngưỡng này trở lên."
              onChange={value => updateConfig('similarityThreshold', value)}
            />

            <SliderField
              id="rag-chunk-size"
              label="Kích thước phân đoạn"
              value={config.chunkSize}
              min={CONFIG_LIMITS.chunkSize.min}
              max={CONFIG_LIMITS.chunkSize.max}
              step={CONFIG_LIMITS.chunkSize.step}
              formatValue={value => `${value.toLocaleString('vi-VN')} ký tự`}
              description="Backend hiện xử lý theo số ký tự, không phải token. Thay đổi giá trị cần re-index lại tài liệu."
              onChange={value => updateConfig('chunkSize', value)}
            />
            {config.chunkSize !== savedConfig.chunkSize && (
              <div className="flex gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span>
                  Kích thước hiện tại là {config.chunkSize.toLocaleString('vi-VN')} ký tự, khác cấu hình đã lưu
                  ({savedConfig.chunkSize.toLocaleString('vi-VN')} ký tự). Cần re-index để áp dụng cho tài liệu.
                </span>
              </div>
            )}
          </div>
        </div>

        {storageWarning && (
          <div role="status" className="mt-6 flex gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <span>{storageWarning}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dark-border bg-dark-surface/40 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isDirty ? 'bg-amber-400' : 'bg-green-400'}`} />
            <span className={isDirty ? 'text-amber-100' : 'text-green-100'}>
              {isDirty ? 'Có thay đổi chưa lưu' : 'Cấu hình đã được lưu'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {isDirty ? 'Hãy lưu để giữ lại thay đổi' : 'Không có thay đổi mới'}
          </span>
        </div>

        {saveError && (
          <div role="alert" className="mt-3 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100">
            {saveError}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-dark-border pt-6 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isSaving || !isDirty}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-dark-border px-5 font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-dark-surface/70"
          >
            <RotateCcw className="h-4 w-4" />
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || isSaving || isLoading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Đang lưu...' : saved ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}
          </button>
        </div>
      </section>
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Khôi phục cấu hình mặc định?"
        message="Các thay đổi hiện tại sẽ bị thay thế bằng cấu hình mặc định. Bạn vẫn cần bấm “Lưu cấu hình” để ghi nhận thay đổi."
        confirmLabel="Khôi phục"
        tone="neutral"
        onConfirm={resetToDefault}
        onClose={() => setIsResetDialogOpen(false)}
      />
      <ConfirmDialog
        isOpen={pendingEmbeddingModel !== null}
        title="Xác nhận đổi Embedding Model?"
        message={`Đổi sang ${pendingEmbeddingModel ? getEmbeddingOption(pendingEmbeddingModel).label : 'model mới'} có thể làm sai dimension vector với collection Qdrant hiện tại. Bạn sẽ cần re-index toàn bộ tài liệu trước khi model mới hoạt động đúng.`}
        confirmLabel="Xác nhận đổi model"
        tone="neutral"
        onConfirm={confirmEmbeddingModelChange}
        onClose={() => setPendingEmbeddingModel(null)}
      />
      <ConfirmDialog
        isOpen={isChunkSizeDialogOpen}
        title="Xác nhận thay đổi kích thước phân đoạn?"
        message={`Lưu kích thước ${config.chunkSize.toLocaleString('vi-VN')} ký tự sẽ làm thay đổi cách chia tài liệu. Cần re-index toàn bộ tài liệu để cấu hình này có hiệu lực; nếu chưa re-index, index Qdrant hiện tại vẫn dùng kích thước cũ.`}
        confirmLabel="Lưu thay đổi"
        tone="neutral"
        onConfirm={() => {
          setIsChunkSizeDialogOpen(false)
          persistConfig()
        }}
        onClose={() => setIsChunkSizeDialogOpen(false)}
      />
    </AdminPageShell>
  )
}
