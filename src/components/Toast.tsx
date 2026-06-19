import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id])
      delete timeoutsRef.current[id]
    }
  }, [])

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const duration = toast.duration ?? 5000

      setToasts((prev) => [...prev, { ...toast, id, duration }])

      timeoutsRef.current[id] = window.setTimeout(() => {
        hideToast(id)
      }, duration)
    },
    [hideToast]
  )

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; borderColor: string; iconColor: string; bgColor: string }
> = {
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-primary-500',
    iconColor: 'text-primary-500',
    bgColor: 'bg-white',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'border-l-error-500',
    iconColor: 'text-error-500',
    bgColor: 'bg-white',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-warning-500',
    iconColor: 'text-warning-500',
    bgColor: 'bg-white',
  },
  info: {
    icon: Info,
    borderColor: 'border-l-info-500',
    iconColor: 'text-info-500',
    bgColor: 'bg-white',
  },
}

function ToastContainer({
  toasts,
  onHide,
}: {
  toasts: Toast[]
  onHide: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-[400px] w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onHide }: { toast: Toast; onHide: (id: string) => void }) {
  const { icon: Icon, borderColor, iconColor, bgColor } = variantConfig[toast.variant]

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-xl border border-neutral-200 border-l-[4px]',
        borderColor,
        bgColor,
        'p-4 shadow-lg',
        'transform transition-all duration-300 ease-out',
        'translate-x-0 opacity-100',
      ].join(' ')}
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      role="alert"
    >
      <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-body text-neutral-800">{toast.title}</p>
        {toast.message && (
          <p className="text-sm font-body text-neutral-500 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onHide(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-neutral-100 flex items-center justify-center transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} className="text-neutral-400" />
      </button>
    </div>
  )
}

// Convenience hook for quick toast calls
export function useToastHelpers() {
  const { showToast } = useToast()

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ variant: 'success', title, message })
    },
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ variant: 'error', title, message })
    },
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ variant: 'warning', title, message })
    },
    [showToast]
  )

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ variant: 'info', title, message })
    },
    [showToast]
  )

  return { success, error, warning, info, showToast }
}
