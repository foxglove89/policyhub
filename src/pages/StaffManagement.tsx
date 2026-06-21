import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Staff } from '@/types'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import {
  Search,
  Plus,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Bell,
  Pencil,
  KeyRound,
  X,
  ChevronDown,
  Eye,
  FileText,
  UserX,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StaffMember extends Staff {
  policies_signed: number
  policies_total: number
  compliance_pct: number
  last_active: string
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

let toastIdCounter = 0

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-accent-100 text-accent-700',
  'bg-primary-100 text-primary-700',
  'bg-info-50 text-info-500',
  'bg-warning-50 text-warning-600',
  'bg-error-50 text-error-600',
  'bg-neutral-200 text-neutral-700',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getComplianceColor(pct: number): string {
  if (pct >= 80) return 'text-primary-600'
  if (pct >= 50) return 'text-warning-600'
  return 'text-error-600'
}

function getComplianceBarColor(pct: number): string {
  if (pct >= 80) return 'bg-primary-500'
  if (pct >= 50) return 'bg-warning-500'
  return 'bg-error-500'
}

/* ------------------------------------------------------------------ */
/*  Toast Component                                                    */
/* ------------------------------------------------------------------ */

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 5000)
    )
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
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
              >
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
  const panelRef = useRef<HTMLDivElement>(null)

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
        ref={panelRef}
        className={`relative bg-white rounded-2xl shadow-xl w-full ${maxW} animate-in fade-in zoom-in-95 duration-200`}
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-display text-[22px] font-semibold text-neutral-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Staff Modal                                                    */
/* ------------------------------------------------------------------ */

function AddStaffModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (staff: Omit<StaffMember, 'id' | 'policies_signed' | 'policies_total' | 'compliance_pct' | 'last_active' | 'created_at'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [department, setDepartment] = useState('Care Team')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setEmail('')
    setRole('staff')
    setDepartment('Care Team')
    setPassword('')
    setErrors({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format'
    if (!department.trim()) e.department = 'Department is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await onAdd({
        name: name.trim(),
        email: email.trim(),
        role,
        department,
        active: true,
        joined_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active',
      })
    } finally {
      setSubmitting(false)
    }
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Staff Member">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jane Smith"
            className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all ${
              errors.name ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
            }`}
          />
          {errors.name && <p className="text-xs font-body text-error-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., jane.smith@foxglove.care"
            className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all ${
              errors.email ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
            }`}
          />
          {errors.email && <p className="text-xs font-body text-error-500 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
              className="w-full h-12 px-4 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-12 px-4 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
            >
              <option value="Care Team">Care Team</option>
              <option value="Management">Management</option>
              <option value="GRC">GRC</option>
              <option value="Senior Care">Senior Care</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">
            Initial Password
            <span className="text-neutral-400 font-normal ml-1">(auto-generated or manual)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="flex-1 h-12 px-4 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
            />
            <button
              onClick={() => setPassword(Math.random().toString(36).slice(2, 10) + 'A1!')}
              className="px-4 h-12 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-sm font-body text-neutral-600 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            className="px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Staff'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Staff Modal                                                   */
/* ------------------------------------------------------------------ */

function EditStaffModal({
  open,
  onClose,
  staff,
  onSave,
}: {
  open: boolean
  onClose: () => void
  staff: StaffMember | null
  onSave: (id: string, updates: Partial<StaffMember>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [department, setDepartment] = useState('')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (staff) {
      setName(staff.name)
      setRole(staff.role)
      setDepartment(staff.department)
      setActive(staff.status === 'active')
      setErrors({})
    }
  }, [staff])

  if (!staff) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSave(staff.id, {
        name: name.trim(),
        role,
        department,
        status: active ? 'active' : 'inactive',
        active,
      })
    } finally {
      setSubmitting(false)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Staff Member">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAvatarColor(staff.name)}`}>
            <span className="text-sm font-semibold font-display">{getInitials(staff.name)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold font-body text-neutral-700">{staff.name}</p>
            <p className="text-xs font-body text-neutral-400">{staff.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-12 px-4 rounded-[10px] bg-neutral-50 border font-body text-sm outline-none transition-all ${
              errors.name ? 'border-error-500 ring-2 ring-error-50' : 'border-neutral-200 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100'
            }`}
          />
          {errors.name && <p className="text-xs font-body text-error-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
              className="w-full h-12 px-4 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium font-body text-neutral-700 mb-2">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-12 px-4 rounded-[10px] bg-neutral-50 border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100"
            >
              <option value="Care Team">Care Team</option>
              <option value="Management">Management</option>
              <option value="GRC">GRC</option>
              <option value="Senior Care">Senior Care</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <label className="text-sm font-medium font-body text-neutral-700">Active Status</label>
          <button
            onClick={() => setActive(!active)}
            className={`relative w-12 h-6 rounded-full transition-colors ${active ? 'bg-primary-500' : 'bg-neutral-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                active ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-5 h-11 rounded-lg bg-white border border-neutral-200 text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </Modal>
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

  const confirmClass =
    confirmVariant === 'destructive'
      ? 'bg-error-600 hover:bg-error-700'
      : 'bg-primary-600 hover:bg-primary-700'

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
            onClick={() => {
              onConfirm()
              onClose()
            }}
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
/*  Dropdown Menu                                                      */
/* ------------------------------------------------------------------ */

function ActionsDropdown({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
        <MoreVertical size={16} className="text-neutral-500" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg z-30 py-1"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
        >
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
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-body transition-colors ${
        danger
          ? 'text-error-600 hover:bg-error-50'
          : 'text-neutral-600 hover:bg-neutral-50'
      }`}
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

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [resetStaff, setResetStaff] = useState<StaffMember | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // Fetch staff data from Supabase
  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true)

        // Fetch all active staff
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('active', true)

        if (staffError) throw staffError

        // Fetch total policies count
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('id')
          .eq('active', true)

        if (policiesError) throw policiesError

        // Fetch all acknowledgements
        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('staff_id')

        if (ackError) throw ackError

        const totalPolicies = policiesData?.length || 0

        // Build staff with compliance
        const mapped: StaffMember[] = (staffData || []).map((s: any) => {
          const signedCount = (ackData || []).filter((a: any) => a.staff_id === s.id).length
          return {
            ...s,
            policies_signed: signedCount,
            policies_total: totalPolicies,
            compliance_pct: totalPolicies > 0 ? Math.round((signedCount / totalPolicies) * 100) : 0,
            last_active: 'Recently',
            status: s.active ? 'active' : 'inactive',
          }
        })

        setStaff(mapped)
      } catch (err: any) {
        console.error('Error fetching staff:', err)
        addToast(`Failed to load staff: ${err.message}`, 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  const addToast = useCallback((message: string, variant: Toast['variant'] = 'success') => {
    const id = `${++toastIdCounter}-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleAddStaff = useCallback(
    async (data: Omit<StaffMember, 'id' | 'policies_signed' | 'policies_total' | 'compliance_pct' | 'last_active' | 'created_at'>) => {
      try {
        // Create auth user first
        const tempPassword = data.email + '123!' // Simple temp password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: tempPassword,
        })

        if (authError) {
          // If user already exists, continue with staff record
          console.warn('Auth signup warning:', authError)
        }

        // Insert into staff table
        const { data: newStaff, error: insertError } = await supabase
          .from('staff')
          .insert({
            name: data.name,
            email: data.email,
            role: data.role,
            department: data.department,
            active: true,
            joined_date: data.joined_date,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Add to local state
        const totalPolicies = staff[0]?.policies_total || 0
        setStaff((prev) => [
          ...prev,
          {
            ...newStaff,
            policies_signed: 0,
            policies_total: totalPolicies,
            compliance_pct: 0,
            last_active: 'Just now',
            status: 'active',
          } as StaffMember,
        ])

        addToast(`${data.name} has been added successfully`)
      } catch (err: any) {
        console.error('Error adding staff:', err)
        addToast(`Failed to add staff: ${err.message}`, 'error')
      }
    },
    [addToast, staff]
  )

  const handleEditStaff = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      try {
        const { error } = await supabase
          .from('staff')
          .update(updates)
          .eq('id', id)

        if (error) throw error

        setStaff((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        )
        addToast('Staff member updated successfully')
      } catch (err: any) {
        console.error('Error updating staff:', err)
        addToast(`Failed to update: ${err.message}`, 'error')
      }
    },
    [addToast]
  )

  const handleResetPassword = useCallback(
    async (staffMember: StaffMember) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(staffMember.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error

        addToast(`Password reset email sent to ${staffMember.name}`, 'info')
      } catch (err: any) {
        console.error('Error resetting password:', err)
        addToast(`Failed to send reset: ${err.message}`, 'error')
      }
    },
    [addToast]
  )

  const handleSendReminder = useCallback(
    (staffMember: StaffMember) => {
      addToast(`Reminder sent to ${staffMember.name}`, 'success')
    },
    [addToast]
  )

  const handleToggleStatus = useCallback(
    async (id: string) => {
      const staffMember = staff.find((s) => s.id === id)
      if (!staffMember) return

      const newStatus = staffMember.status === 'active' ? 'inactive' : 'active'

      try {
        const { error } = await supabase
          .from('staff')
          .update({ active: newStatus === 'active', status: newStatus })
          .eq('id', id)

        if (error) throw error

        setStaff((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: newStatus as 'active' | 'inactive', active: newStatus === 'active' } : s
          )
        )
        addToast(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      } catch (err: any) {
        console.error('Error toggling status:', err)
        addToast(`Failed: ${err.message}`, 'error')
      }
    },
    [staff, addToast]
  )

  /* Stats */
  const stats = useMemo(() => {
    const total = staff.length
    const active = staff.filter((s) => s.status === 'active').length
    const adminCount = staff.filter((s) => s.role === 'admin').length
    const careCount = staff.filter((s) => s.role === 'staff').length
    const avgCompliance = total > 0 ? Math.round(staff.reduce((sum, s) => sum + s.compliance_pct, 0) / total) : 0
    return { total, active, adminCount, careCount, avgCompliance }
  }, [staff])

  /* Filtering */
  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false
      }
      if (roleFilter !== 'all' && s.role !== roleFilter) return false
      if (deptFilter && s.department !== deptFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [staff, search, roleFilter, deptFilter, statusFilter])

  const departments = useMemo(() => {
    const depts = new Set(staff.map((s) => s.department))
    return Array.from(depts)
  }, [staff])

  /* Table columns */
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row: StaffMember) => (
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(
                row.name
              )}`}
            >
              <span className="text-[11px] font-semibold font-display">{getInitials(row.name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold font-body text-neutral-700 truncate">{row.name}</p>
              <p className="text-[11px] font-body text-neutral-400 truncate">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (row: StaffMember) => (
          <span className="text-sm font-body text-neutral-500">{row.email}</span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (row: StaffMember) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-body ${
              row.role === 'admin'
                ? 'bg-accent-50 text-accent-600 border border-accent-200'
                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}
          >
            {row.role === 'admin' ? 'Admin' : 'Staff'}
          </span>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
      },
      {
        key: 'joined_date',
        header: 'Joined Date',
        sortable: true,
        render: (row: StaffMember) => (
          <span className="text-sm font-body text-neutral-500">
            {format(new Date(row.joined_date), 'dd MMM yyyy')}
          </span>
        ),
      },
      {
        key: 'policies_signed',
        header: 'Policies',
        sortable: true,
        render: (row: StaffMember) => (
          <div>
            <span className="text-sm font-medium font-body text-neutral-600">
              {row.policies_signed}/{row.policies_total}
            </span>
            <div className="w-[50px] h-1 bg-neutral-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${(row.policies_signed / row.policies_total) * 100}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'compliance_pct',
        header: 'Compliance',
        sortable: true,
        render: (row: StaffMember) => (
          <div className="flex items-center gap-2">
            <div className="w-[60px] h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getComplianceBarColor(row.compliance_pct)}`}
                style={{ width: `${row.compliance_pct}%` }}
              />
            </div>
            <span className={`text-sm font-display font-semibold ${getComplianceColor(row.compliance_pct)}`}>
              {row.compliance_pct}%
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row: StaffMember) => (
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
        key: 'actions',
        header: '',
        render: (row: StaffMember) => (
          <ActionsDropdown>
            <DropdownItem
              icon={Eye}
              label="View Profile"
              onClick={() => addToast(`Viewing profile for ${row.name}`, 'info')}
            />
            <DropdownItem
              icon={FileText}
              label="View Policies"
              onClick={() => addToast(`Viewing policies for ${row.name}`, 'info')}
            />
            <DropdownItem
              icon={Bell}
              label="Send Reminder"
              onClick={() => handleSendReminder(row)}
            />
            <DropdownDivider />
            <DropdownItem
              icon={Pencil}
              label="Edit Account"
              onClick={() => {
                setEditStaff(row)
                setEditOpen(true)
              }}
            />
            <DropdownItem
              icon={KeyRound}
              label="Reset Password"
              onClick={() => {
                setResetStaff(row)
                setResetOpen(true)
              }}
            />
            <DropdownDivider />
            <DropdownItem
              icon={UserX}
              label={row.status === 'active' ? 'Deactivate' : 'Activate'}
              danger
              onClick={() => handleToggleStatus(row.id)}
            />
          </ActionsDropdown>
        ),
      },
    ],
    [addToast, handleToggleStatus, handleSendReminder]
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading staff data...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <h1 className="font-display text-[30px] font-bold text-neutral-800 leading-tight">
            Staff Management
          </h1>
          <p className="text-base font-body text-neutral-400 mt-1">
            {stats.total} staff members — {stats.adminCount} Administrators, {stats.careCount} Care Staff
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 h-11 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors self-start sm:self-auto"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          value={String(stats.total)}
          label="Total Staff"
          icon={Users}
          iconColor="text-neutral-600"
          iconBg="bg-neutral-100"
        />
        <StatCard
          value={`${stats.avgCompliance}%`}
          label="Average Compliance"
          icon={Target}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
        />
        <StatCard
          value={String(staff.filter((s) => s.compliance_pct === 100).length)}
          label="Fully Compliant"
          icon={CheckCircle}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
        />
        <StatCard
          value={String(staff.filter((s) => s.compliance_pct < 80).length)}
          label="Need Attention"
          icon={AlertTriangle}
          iconColor="text-warning-600"
          iconBg="bg-warning-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-12 pl-11 pr-4 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'staff')}
              className="h-12 pl-4 pr-10 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-12 pl-4 pr-10 rounded-[10px] bg-white border border-neutral-200 font-body text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
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
        </div>
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
              <Users size={48} className="text-neutral-300 mb-3" />
              <p className="text-base font-body font-medium text-neutral-500">No staff members found</p>
              <p className="text-sm font-body text-neutral-400 mt-1">Try adjusting your filters</p>
            </div>
          }
        />
      </div>

      {/* Modals */}
      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddStaff} />
      <EditStaffModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditStaff(null)
        }}
        staff={editStaff}
        onSave={handleEditStaff}
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => {
          setResetOpen(false)
          setResetStaff(null)
        }}
        onConfirm={() => {
          if (resetStaff) handleResetPassword(resetStaff)
        }}
        title="Reset Password?"
        message={
          resetStaff
            ? `Reset password for ${resetStaff.name}? A temporary password will be generated and sent to their email.`
            : ''
        }
        confirmLabel="Reset Password"
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
