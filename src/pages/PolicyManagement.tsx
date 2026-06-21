import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Policy } from '@/types'
import { POLICY_CATEGORIES } from '@/types'
import { supabase } from '@/lib/supabase'

let toastIdCounter = 0
import DataTable from '@/components/DataTable'
import {
  Search,
  UploadCloud,
  FileText,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronLeft,
  Pencil,
  Eye,
  Archive,
  Check,
  FolderOpen,
  Loader2,
  } from 'lucide-react'
import { format } from 'date-fns'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PolicyWithCounts extends Policy {
  signed_count: number
  total_staff: number
  status: 'active' | 'inactive'
}

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info'
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  'COVID-19': 'bg-rose-50 text-rose-600 border-rose-200',
  'Care Planning': 'bg-sky-50 text-sky-600 border-sky-200',
  'Views, Wishes and Feelings': 'bg-violet-50 text-violet-600 border-violet-200',
  'Child Protection': 'bg-amber-50 text-amber-600 border-amber-200',
  'Health and Well-being': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Quality of Care': 'bg-teal-50 text-teal-600 border-teal-200',
  'Enjoyment and Achievement': 'bg-orange-50 text-orange-600 border-orange-200',
  'Positive Relationships': 'bg-pink-50 text-pink-600 border-pink-200',
  'Leadership and Management': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'GDPR': 'bg-cyan-50 text-cyan-600 border-cyan-200',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => onDismiss(t.id), 5000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => {
        const borderColor =
          toast.variant === 'success'
            ? 'border-l-primary-500'
            : toast.variant === 'error'
            ? 'border-l-error-500'
            : 'border-l-info-500'
        return (
          <div
            key={toast.id}
            className={`bg-white rounded-xl shadow-lg px-4 py-3 min-w-[280px] max-w-[400px] border-l-4 ${borderColor} animate-in slide-in-from-right duration-300`}
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-body text-neutral-700">{toast.message}</p>
              <button onClick={() => onDismiss(toast.id)} className="text-neutral-400 hover:text-neutral-600 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  value,
  label,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  value: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-neutral-800">{value}</div>
          <div className="text-xs font-body text-neutral-400 mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'lg' ? 'max-w-[720px]' : 'max-w-[560px]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${maxW} max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <h2 className="font-display text-[22px] font-semibold text-neutral-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Confirm Dialog                                                     */
/* ------------------------------------------------------------------ */

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'destructive'
}) {
  if (!open) return null
  const confirmClass = confirmVariant === 'destructive' ? 'bg-error-600 hover:bg-error-700' : 'bg-primary-600 hover:bg-primary-700'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-6 animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <h3 className="font-display text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
        <p className="text-sm font-body text-neutral-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-5 h-11 rounded-lg text-white text-sm font-body font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-body transition-colors ${
                i < current
                  ? 'bg-primary-500 text-white'
                  : i === current
                  ? 'bg-accent-600 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {i < current ? <Check size={16} /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-body font-medium ${
                i <= current ? 'text-accent-600' : 'text-neutral-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${i < current ? 'bg-primary-500' : 'bg-neutral-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Upload Policy Modal (3-step wizard)                                */
/* ------------------------------------------------------------------ */

function UploadPolicyModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean
  onClose: () => void
  onUpload: (policy: Omit<PolicyWithCounts, 'id' | 'upload_date' | 'last_updated' | 'created_at'>) => Promise<void>
}) {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(POLICY_CATEGORIES[0])
  const [version, setVersion] = useState('1.0')
  const [description, setDescription] = useState('')
  const [requiresAck, setRequiresAck] = useState(true)
  const [assignAll, setAssignAll] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(0)
    setFile(null)
    setDragOver(false)
    setTitle('')
    setCategory(POLICY_CATEGORIES[0])
    setVersion('1.0')
    setDescription('')
    setRequiresAck(true)
    setAssignAll(true)
    setErrors({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validateStep1 = () => {
    // Allow proceeding without file for now - PDF upload to Storage is TODO
    setErrors({})
    return true
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!version.trim()) e.version = 'Version is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 0 && validateStep1()) setStep(1)
    else if (step === 1 && validateStep2()) setStep(2)
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))

   const handlePublish = async () => {
    setSubmitting(true)
    try {
      let pdfUrl = ''
      if (file) {
        // Upload PDF to Supabase Storage
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
        const { error: uploadError } = await supabase
          .storage
          .from('policies')
          .upload(fileName, file, {
            contentType: 'application/pdf',
            upsert: false,
          })
        if (uploadError) {
          throw new Error(`PDF upload failed: ${uploadError.message}`)
        }
        pdfUrl = fileName
      }
      
      await onUpload({
        title: title.trim(),
        category,
        version: version.trim(),
        description: description.trim(),
        pdf_url: pdfUrl,
        requires_acknowledgement: requiresAck,
        active: true,
        signed_count: 0,
        total_staff: 16,
        status: 'active',
      })
        } catch (err: any) {
      console.error('Error publishing policy:', err)
      throw err
    } finally {
      setSubmitting(false)
    }
    handleClose()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setErrors({})
    } else {
      setErrors({ file: 'Only PDF files are allowed' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (f.type === 'application/pdf') {
        setFile(f)
        setErrors({})
      } else {
        setErrors({ file: 'Only PDF files are allowed' })
      }
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload New Policy" size="lg">
      <StepIndicator steps={['Upload', 'Details', 'Assign']} current={step} />

      {/* Step 1: Upload PDF */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-accent-500 bg-accent-50'
                : errors.file
                ? 'border-error-400 bg-error-50/50'
                : 'border-neutral-300 bg-neutral-50 hover:border-accent-400 hover:bg-accent-50/50'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={40} className="text-primary-500" />
                <p className="text-sm font-medium font-body text-neutral-700">{file.name}</p>
                <p className="text-xs font-body text-neutral-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-error-500 hover:text-error-600 font-medium mt-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <UploadCloud size={48} className="text-neutral-300 mb-2" />
                <p className="text-base font-medium font-body text-neutral-500">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm font-body text-accent-600 mt-1">or click to browse files</p>
                <p className="text-[11px] font-body text-neutral-400 mt-2">Maximum file size: 50MB (optional - you can skip this)</p>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
          </div>
          {errors.file && <p className="text-xs font-body text-error-500">{errors.file}</p>}

          {/* TODO note */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-3">
            <p className="text-xs font-body text-info-600">
              <strong>Note:</strong> The PDF will be uploaded to Supabase Storage automatically when you click Publish.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Policy Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Title <span className="text-error-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Safeguarding and Child Protection Policy"
              className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all ${
                errors.title ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
              }`}
            />
            {errors.title && <p className="text-xs font-body text-error-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Category <span className="text-error-500">*</span></label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
                >
                  {POLICY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Version <span className="text-error-500">*</span></label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0"
                className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all font-mono ${
                  errors.version ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
                }`}
              />
              {errors.version && <p className="text-xs font-body text-error-500 mt-1">{errors.version}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this policy covers..."
              rows={3}
              className="w-full px-4 py-3 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium font-body text-neutral-700">Requires Acknowledgement</label>
              <p className="text-xs font-body text-neutral-400">Staff must sign to confirm they have read this policy</p>
            </div>
            <button
              onClick={() => setRequiresAck(!requiresAck)}
              className={`relative w-12 h-6 rounded-full transition-colors ${requiresAck ? 'bg-primary-500' : 'bg-neutral-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${requiresAck ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Assign */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
            <h4 className="text-sm font-semibold font-body text-neutral-700">Policy Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-body text-neutral-400">Title</span>
                <p className="font-body text-neutral-700 font-medium">{title || 'Untitled'}</p>
              </div>
              <div>
                <span className="text-xs font-body text-neutral-400">Category</span>
                <p className="font-body text-neutral-700 font-medium">{category}</p>
              </div>
              <div>
                <span className="text-xs font-body text-neutral-400">Version</span>
                <p className="font-mono text-neutral-700">{version}</p>
              </div>
              <div>
                <span className="text-xs font-body text-neutral-400">File</span>
                <p className="font-body text-neutral-700">{file?.name || 'None (will be added later)'}</p>
              </div>
              <div>
                <span className="text-xs font-body text-neutral-400">Requires Acknowledgement</span>
                <p className="font-body text-neutral-700">{requiresAck ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-3">Staff Assignment</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${assignAll ? 'border-accent-600 bg-accent-600' : 'border-neutral-300'}`}>
                  {assignAll && <Check size={12} className="text-white" />}
                </div>
                <input type="radio" checked={assignAll} onChange={() => setAssignAll(true)} className="sr-only" />
                <div>
                  <p className="text-sm font-medium font-body text-neutral-700">All Staff</p>
                  <p className="text-xs font-body text-neutral-400">Assign to all staff members</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!assignAll ? 'border-accent-600 bg-accent-600' : 'border-neutral-300'}`}>
                  {!assignAll && <Check size={12} className="text-white" />}
                </div>
                <input type="radio" checked={!assignAll} onChange={() => setAssignAll(false)} className="sr-only" />
                <div>
                  <p className="text-sm font-medium font-body text-neutral-700">Select Specific Staff</p>
                  <p className="text-xs font-body text-neutral-400">Choose individual staff or departments (coming soon)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Policy'
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Policy Modal                                                  */
/* ------------------------------------------------------------------ */

function EditPolicyModal({
  open,
  onClose,
  policy,
  onSave,
}: {
  open: boolean
  onClose: () => void
  policy: PolicyWithCounts | null
  onSave: (id: string, updates: Partial<PolicyWithCounts>) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [requiresAck, setRequiresAck] = useState(true)
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [currentPdfUrl, setCurrentPdfUrl] = useState('')

  useEffect(() => {
    if (policy) {
      setTitle(policy.title)
      setCategory(policy.category)
      setVersion(policy.version)
      setDescription(policy.description)
      setRequiresAck(policy.requires_acknowledgement)
      setActive(policy.status === 'active')
      setCurrentPdfUrl(policy.pdf_url || '')
      setPdfFile(null)
      setErrors({})
    }
  }, [policy])

  if (!policy) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!version.trim()) e.version = 'Version is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      let pdfUrl = currentPdfUrl

      // Upload new PDF if selected
      if (pdfFile) {
        const fileName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '-')}`
        const { error: uploadError } = await supabase
          .storage
          .from('policies')
          .upload(fileName, pdfFile, {
            contentType: 'application/pdf',
            upsert: false,
          })
        if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)
        pdfUrl = fileName
      }

      await onSave(policy.id, {
        title: title.trim(),
        category,
        version: version.trim(),
        description: description.trim(),
        requires_acknowledgement: requiresAck,
        status: active ? 'active' : 'inactive',
        active,
        pdf_url: pdfUrl,
      })
    } catch (err: any) {
      console.error('Error saving policy:', err)
      setErrors({ submit: err.message })
      return
    } finally {
      setSubmitting(false)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Policy">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Title <span className="text-error-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all ${
              errors.title ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
            }`}
          />
          {errors.title && <p className="text-xs font-body text-error-500 mt-1">{errors.title}</p>}
        </div>

        {/* Category + Version */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
              >
                {POLICY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Version <span className="text-error-500">*</span></label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all font-mono ${
                errors.version ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
              }`}
            />
            {errors.version && <p className="text-xs font-body text-error-500 mt-1">{errors.version}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 resize-none"
          />
        </div>

        {/* PDF Upload Section */}
        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Policy PDF</label>
          {currentPdfUrl && !pdfFile && (
            <div className="flex items-center gap-2 mb-2 p-3 bg-primary-50 rounded-lg">
              <FileText size={16} className="text-primary-600" />
              <span className="text-sm text-primary-700">PDF already uploaded</span>
            </div>
          )}
          <div
            className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-accent-400 hover:bg-accent-50/30 transition-colors cursor-pointer"
            onClick={() => document.getElementById('edit-pdf-input')?.click()}
          >
            <input
              id="edit-pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setPdfFile(f)
              }}
            />
            <Upload size={24} className="text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-600">
              {pdfFile ? pdfFile.name : 'Click to upload new PDF'}
            </p>
            {!pdfFile && <p className="text-xs text-neutral-400 mt-1">Replace existing PDF</p>}
          </div>
        </div>

        {/* Requires Acknowledgement Toggle */}
        <div className="flex items-center justify-between py-2">
          <label className="text-sm font-medium font-body text-neutral-700">Requires Acknowledgement</label>
          <button
            onClick={() => setRequiresAck(!requiresAck)}
            className={`relative w-12 h-7 rounded-full transition-colors ${requiresAck ? 'bg-primary-500' : 'bg-neutral-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${requiresAck ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center justify-between py-2">
          <label className="text-sm font-medium font-body text-neutral-700">Active</label>
          <button
            onClick={() => setActive(!active)}
            className={`relative w-12 h-7 rounded-full transition-colors ${active ? 'bg-primary-500' : 'bg-neutral-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Error */}
        {errors.submit && <p className="text-xs text-error-500">{errors.submit}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-11 bg-primary-600 rounded-xl text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Dropdown Menu                                                      */
/* ------------------------------------------------------------------ */

function ActionsDropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
      >
        <Pencil size={14} className="text-neutral-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg z-30 py-1" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-body transition-colors ${danger ? 'text-error-600 hover:bg-error-50' : 'text-neutral-600 hover:bg-neutral-50'}`}
    >
      <Icon size={16} className={danger ? 'text-error-500' : 'text-neutral-400'} />
      {label}
    </button>
  )
}

function DropdownDivider() {
  return <div className="my-1 border-t border-neutral-200" />
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function PolicyManagement() {
  const [policies, setPolicies] = useState<PolicyWithCounts[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [ackFilter, setAckFilter] = useState<'all' | 'required' | 'not_required'>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<PolicyWithCounts | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivatePolicy, setDeactivatePolicy] = useState<PolicyWithCounts | null>(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  const addToast = useCallback((message: string, variant: Toast['variant'] = 'success') => {
    const id = `${++toastIdCounter}-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Fetch policies from Supabase
  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true)

        // Fetch all policies
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('*')
          .order('created_at', { ascending: false })

        if (policiesError) throw policiesError

        // Fetch total staff count
        const { count: staffCount, error: staffError } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)

        if (staffError) throw staffError

        // Fetch acknowledgement counts per policy
        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('policy_id')

        if (ackError) throw ackError

        const ackCounts: Record<string, number> = {}
        ackData?.forEach((ack: any) => {
          ackCounts[ack.policy_id] = (ackCounts[ack.policy_id] || 0) + 1
        })

        const totalStaff = staffCount || 0

        const mapped: PolicyWithCounts[] = (policiesData || []).map((p: any) => ({
          ...p,
          signed_count: ackCounts[p.id] || 0,
          total_staff: totalStaff,
          status: p.active ? 'active' as const : 'inactive' as const,
        }))

        setPolicies(mapped)
      } catch (err: any) {
        console.error('Error fetching policies:', err)
        addToast(`Failed to load policies: ${err.message}`, 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [addToast])

    const handleEditSave = useCallback(
    async (id: string, updates: Partial<PolicyWithCounts>) => {
      try {
        const { error } = await supabase
          .from('policies')
          .update({
            ...updates,
            last_updated: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) throw error

        setPolicies((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates, last_updated: new Date().toISOString() } : p))
        )
        addToast('Policy updated successfully')
      } catch (err: any) {
        console.error('Error updating policy:', err)
        addToast(`Failed to update: ${err.message}`, 'error')
      }
    },
    [addToast]
  )

  const handleEditSave = useCallback(
    async (id: string, updates: Partial<PolicyWithCounts>) => {
      try {
        const { error } = await supabase
          .from('policies')
          .update({
            ...updates,
            last_updated: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) throw error

        setPolicies((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates, last_updated: new Date().toISOString() } : p))
        )
        addToast('Policy updated successfully')
      } catch (err: any) {
        console.error('Error updating policy:', err)
        addToast(`Failed to update: ${err.message}`, 'error')
      }
    },
    [addToast]
  )

  const handleDeactivate = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('policies')
          .update({
            active: false,
            last_updated: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) throw error

        setPolicies((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'inactive' as const, active: false, last_updated: new Date().toISOString() }
              : p
          )
        )
        addToast('Policy has been deactivated')
      } catch (err: any) {
        console.error('Error deactivating policy:', err)
        addToast(`Failed: ${err.message}`, 'error')
      }
    },
    [addToast]
  )

    const handleToggleStatus = useCallback(
    async (id: string) => {
      const policy = policies.find((p) => p.id === id)
      if (!policy) return

      const newActive = policy.status === 'inactive'

      try {
        const { error } = await supabase
          .from('policies')
          .update({
            active: newActive,
            last_updated: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) throw error

        setPolicies((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: newActive ? 'active' as const : 'inactive' as const, active: newActive, last_updated: new Date().toISOString() }
              : p
          )
        )

        addToast(newActive ? 'Policy has been activated' : 'Policy has been deactivated')
      } catch (err: any) {
        console.error('Error toggling policy status:', err)
        addToast(`Failed: ${err.message}`, 'error')
      }
    },
    [policies, addToast]
  )

  /* Stats */
  const stats = useMemo(() => {
    const total = policies.length
    const active = policies.filter((p) => p.status === 'active').length
    const requiresAck = policies.filter((p) => p.requires_acknowledgement).length
    const categories = new Set(policies.map((p) => p.category)).size
    return { total, active, requiresAck, categories }
  }, [policies])

  /* Filtering */
  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter && p.category !== categoryFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (ackFilter === 'required' && !p.requires_acknowledgement) return false
      if (ackFilter === 'not_required' && p.requires_acknowledgement) return false
      return true
    })
  }, [policies, search, categoryFilter, statusFilter, ackFilter])

  const hasActiveFilters = search || categoryFilter || statusFilter !== 'all' || ackFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setStatusFilter('all')
    setAckFilter('all')
  }

  /* Table columns */
  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Title',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-neutral-400 flex-shrink-0" />
            <span className="text-sm font-medium font-body text-neutral-700 truncate">{row.title}</span>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium font-body border ${getCategoryColor(row.category)}`}
          >
            {row.category}
          </span>
        ),
      },
      {
        key: 'version',
        header: 'Version',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <span className="text-sm font-mono text-neutral-500">{row.version}</span>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        render: (row: PolicyWithCounts) => (
          <span className="text-sm font-body text-neutral-500 truncate block max-w-[200px]">
            {row.description}
          </span>
        ),
      },
      {
        key: 'last_updated',
        header: 'Last Updated',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <span className="text-sm font-mono text-neutral-400">
            {format(new Date(row.last_updated), 'dd MMM yyyy')}
          </span>
        ),
      },
      {
        key: 'requires_acknowledgement',
        header: 'Ack Required',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-body ${
              row.requires_acknowledgement
                ? 'bg-accent-50 text-accent-600 border border-accent-200'
                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
            }`}
          >
            {row.requires_acknowledgement ? 'Required' : 'Not Required'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <button
            onClick={() => handleToggleStatus(row.id)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              row.status === 'active' ? 'bg-primary-500' : 'bg-neutral-300'
            }`}
            title={row.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                row.status === 'active' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        ),
      },
      {
        key: 'signed_count',
        header: 'Signatures',
        sortable: true,
        render: (row: PolicyWithCounts) => (
          <div>
            <span className={`text-sm font-medium font-body ${row.signed_count === row.total_staff ? 'text-primary-600' : 'text-neutral-600'}`}>
              {row.signed_count}/{row.total_staff}
            </span>
            <div className="w-[40px] h-1 bg-neutral-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${(row.signed_count / row.total_staff) * 100}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (row: PolicyWithCounts) => (
          <ActionsDropdown>
            <DropdownItem icon={Eye} label="View" onClick={() => addToast(`Viewing ${row.title}`, 'info')} />
            <DropdownItem
              icon={Pencil}
              label="Edit"
              onClick={() => { setEditPolicy(row); setEditOpen(true) }}
            />
            <DropdownDivider />
            <DropdownItem
              icon={Archive}
              label={row.status === 'active' ? 'Deactivate' : 'Activate'}
              danger={row.status === 'active'}
              onClick={() => {
                if (row.status === 'active') {
                  setDeactivatePolicy(row)
                  setDeactivateOpen(true)
                } else {
                  handleToggleStatus(row.id)
                  addToast('Policy has been activated')
                }
              }}
            />
          </ActionsDropdown>
        ),
      },
    ],
    [addToast, handleToggleStatus]
  )

  /* Category chips with counts */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    POLICY_CATEGORIES.forEach((c) => { counts[c] = 0 })
    policies.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1 })
    return counts
  }, [policies])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading policies...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <h1 className="font-display text-[30px] font-bold text-neutral-800 leading-tight">
            Policy Management
          </h1>
          <p className="text-base font-body text-neutral-400 mt-1">
            Manage all {stats.total} policies across {stats.categories} categories. Upload, edit, and track versions.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors self-start sm:self-auto"
        >
          <UploadCloud size={18} />
          Upload Policy
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          value={String(stats.total)}
          label="Total Policies"
          icon={FileText}
          iconColor="text-neutral-600"
          iconBg="bg-neutral-100"
        />
        <StatCard
          value={String(stats.active)}
          label="Active Policies"
          icon={ShieldCheck}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
        />
        <StatCard
          value={String(stats.requiresAck)}
          label="Requires Acknowledgement"
          icon={FolderOpen}
          iconColor="text-accent-600"
          iconBg="bg-accent-50"
        />
        <StatCard
          value={String(stats.categories)}
          label="Categories"
          icon={Archive}
          iconColor="text-info-500"
          iconBg="bg-info-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by policy title..."
            className="w-full h-12 pl-11 pr-4 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 pl-4 pr-10 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {POLICY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="h-12 pl-4 pr-10 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={ackFilter}
              onChange={(e) => setAckFilter(e.target.value as 'all' | 'required' | 'not_required')}
              className="h-12 pl-4 pr-10 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
            >
              <option value="all">All Ack</option>
              <option value="required">Required</option>
              <option value="not_required">Not Required</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-12 px-4 rounded-[10px] bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-body whitespace-nowrap transition-colors ${
            !categoryFilter ? 'bg-accent-50 text-accent-600 border border-accent-200' : 'bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200'
          }`}
        >
          All <span className="text-[10px] bg-neutral-200 text-neutral-500 rounded-full px-1.5 py-0.5">{policies.length}</span>
        </button>
        {POLICY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-body whitespace-nowrap transition-colors ${
              categoryFilter === cat ? 'bg-accent-50 text-accent-600 border border-accent-200' : 'bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200'
            }`}
          >
            {cat}
            <span className="text-[10px] bg-neutral-200 text-neutral-500 rounded-full px-1.5 py-0.5">{categoryCounts[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          pageSize={10}
          emptyState={
            <div className="flex flex-col items-center py-12">
              <FolderOpen size={48} className="text-neutral-300 mb-3" />
              <p className="text-base font-body font-medium text-neutral-500">No policies found</p>
              <p className="text-sm font-body text-neutral-400 mt-1">Upload your first policy to get started.</p>
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-4 px-5 h-10 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors"
              >
                Upload Policy
              </button>
            </div>
          }
        />
      </div>

      {/* Modals */}
      <UploadPolicyModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <EditPolicyModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditPolicy(null) }}
        policy={editPolicy}
        onSave={handleEditSave}
      />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => { setDeactivateOpen(false); setDeactivatePolicy(null) }}
        onConfirm={() => { if (deactivatePolicy) handleDeactivate(deactivatePolicy.id) }}
        title="Deactivate Policy?"
        message={deactivatePolicy ? `Mark "${deactivatePolicy.title}" as inactive? Staff will no longer need to sign this policy.` : ''}
        confirmLabel="Deactivate"
        confirmVariant="destructive"
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
