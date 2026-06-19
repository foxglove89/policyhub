import { useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Check,
  Clock,
  ChevronDown,
  PenTool,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ToastProvider, useToastHelpers } from '@/components/Toast'
import PDFViewer from '@/components/PDFViewer'
import StatusBadge from '@/components/StatusBadge'
import type { StatusVariant } from '@/types'

// --- Types ---

interface VersionEntry {
  version: string
  date: string
  author: string
  changes: string
}

interface RelatedPolicy {
  id: string
  title: string
  category: string
  status: StatusVariant
  last_updated: string
}

// --- Mock Data ---

const mockPolicy = {
  id: '1',
  title: 'Safeguarding and Child Protection Policy',
  category: 'Child Protection',
  version: '4.0',
  description:
    'This policy outlines the procedures for safeguarding children and young people in our care, including reporting concerns, risk assessments, and staff responsibilities. It covers all aspects of child protection including recognition of abuse categories, responding to disclosures, and information sharing protocols with external agencies.',
  pdf_url: '/sample-policy.pdf',
  upload_date: '2024-03-15',
  last_updated: '2024-09-01',
  requires_acknowledgement: true,
  active: true,
  created_at: '2024-03-15T10:00:00Z',
}

const versionHistory: VersionEntry[] = [
  {
    version: '4.0',
    date: '2024-09-01',
    author: 'Andy Brierley',
    changes: 'Updated to reflect new statutory guidance and added risk assessment procedures',
  },
  {
    version: '3.0',
    date: '2024-06-15',
    author: 'Uzair Saeed',
    changes: 'Revised staff training requirements and added DSL responsibilities section',
  },
  {
    version: '2.0',
    date: '2024-01-10',
    author: 'Andy Brierley',
    changes: 'Major rewrite following Ofsted inspection recommendations',
  },
  {
    version: '1.0',
    date: '2023-10-01',
    author: 'Uzair Saeed',
    changes: 'Initial policy creation',
  },
]

const relatedPolicies: RelatedPolicy[] = [
  {
    id: '3',
    title: 'Missing from Care and Absconding Policy',
    category: 'Child Protection',
    status: 'pending',
    last_updated: '2024-08-20',
  },
  {
    id: '7',
    title: 'Behaviour Management and Physical Intervention',
    category: 'Child Protection',
    status: 'signed',
    last_updated: '2024-07-15',
  },
  {
    id: '12',
    title: 'Allegations Against Staff Procedure',
    category: 'Child Protection',
    status: 'overdue',
    last_updated: '2024-06-01',
  },
]

// --- Confirmation Modal ---

function ConfirmSignatureModal({
  open,
  policyTitle,
  onConfirm,
  onCancel,
  isSigning,
}: {
  open: boolean
  policyTitle: string
  onConfirm: () => void
  onCancel: () => void
  isSigning: boolean
}) {
  const [confirmed, setConfirmed] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-[560px] z-10"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h3 className="font-display text-[22px] font-semibold text-neutral-800 leading-tight">
            Confirm Signature
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-400">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-4">
          <div className="flex items-start gap-3 mb-5">
            <AlertCircle size={20} className="text-accent-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm font-body text-neutral-600 leading-relaxed">
              By signing, you confirm that you have read and understood <span className="font-medium text-neutral-800">{policyTitle}</span>. This action cannot be undone and constitutes a legally binding electronic acknowledgment.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={[
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
                  confirmed
                    ? 'bg-accent-500 border-accent-500'
                    : 'border-neutral-300 bg-white',
                ].join(' ')}
              >
                {confirmed && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-sm font-body text-neutral-700 leading-relaxed">
              I understand this is a legal acknowledgment and I have read the policy in its entirety.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="px-5 h-11 rounded-lg text-sm font-medium font-body text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || isSigning}
            className={[
              'px-6 h-11 rounded-lg text-sm font-medium font-body text-white transition-all duration-150 flex items-center gap-2 cursor-pointer',
              confirmed && !isSigning
                ? 'bg-accent-600 hover:bg-accent-700 active:bg-accent-800'
                : 'bg-neutral-300 cursor-not-allowed',
            ].join(' ')}
          >
            {isSigning ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing...
              </>
            ) : (
              <>
                <PenTool size={16} strokeWidth={2} />
                Confirm Signature
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Version History Accordion ---

function VersionHistory() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-6 pt-6 border-t border-neutral-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <h3 className="text-base font-semibold font-body text-neutral-700">
          Version History
        </h3>
        <span
          className={[
            'transition-transform duration-300 ease-out text-neutral-400',
            expanded ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
        >
          <ChevronDown size={20} />
        </span>
      </button>

      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-out',
          expanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="relative pl-4">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" />

          <div className="space-y-4">
            {versionHistory.map((entry, index) => (
              <div key={entry.version} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div
                  className={[
                    'w-[15px] h-[15px] rounded-full border-2 flex-shrink-0 mt-0.5 relative z-10 bg-white',
                    index === 0 ? 'border-accent-500' : 'border-neutral-300',
                  ].join(' ')}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body text-neutral-700">
                    Version {entry.version}
                    {index === 0 && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-50 text-accent-600 border border-accent-200">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-body text-neutral-400 mt-0.5">
                    Updated {format(new Date(entry.date), 'd MMMM yyyy')} by {entry.author}
                  </p>
                  <p className="text-sm font-body text-neutral-500 mt-1">{entry.changes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Related Policies ---

function RelatedPoliciesSection({
  policies,
  currentPolicyId,
}: {
  policies: RelatedPolicy[]
  currentPolicyId: string
}) {
  return (
    <div className="mt-6 pt-6 border-t border-neutral-200">
      <h3 className="text-base font-semibold font-body text-neutral-700 mb-4">
        Related Policies
      </h3>
      <div className="space-y-3">
        {policies
          .filter((p) => p.id !== currentPolicyId)
          .slice(0, 2)
          .map((policy) => (
            <Link
              key={policy.id}
              to={`/policies/${policy.id}`}
              className="block bg-neutral-50 border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 hover:bg-neutral-100 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-body text-neutral-700 group-hover:text-neutral-900 line-clamp-2 leading-snug">
                    {policy.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-body bg-accent-50 text-accent-600 border border-accent-200">
                      {policy.category}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {format(new Date(policy.last_updated), 'd MMM yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge variant={policy.status} />
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}

// --- Signed State ---

function SignedConfirmation({
  signedName,
  signedDate,
  signatureId,
}: {
  signedName: string
  signedDate: string
  signatureId: string
}) {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 text-center">
      <img
        src="/verified-badge.svg"
        alt="Verified"
        className="w-16 h-16 mx-auto mb-4"
        onError={(e) => {
          // Fallback if SVG doesn't exist
          const target = e.currentTarget
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      {/* Fallback icon if verified-badge.svg is not available */}
      <div
        className="hidden w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 items-center justify-center"
      >
        <ShieldCheck size={32} className="text-primary-500" strokeWidth={1.5} />
      </div>

      <h3 className="font-display text-[22px] font-bold text-primary-700 mb-2">
        Policy Signed
      </h3>
      <p className="text-base font-body text-neutral-600 mb-1">
        You acknowledged this policy on{' '}
        <span className="font-medium text-neutral-700">
          {format(new Date(signedDate), 'd MMMM yyyy')}
        </span>{' '}
        at{' '}
        <span className="font-medium text-neutral-700">
          {format(new Date(signedDate), 'HH:mm')}
        </span>
      </p>
      <p className="text-sm font-body text-neutral-500 mb-3">
        Signed as:{' '}
        <span className="font-mono text-[13px] text-neutral-600">{signedName}</span>
      </p>
      <p className="text-[10px] font-mono text-neutral-400">
        Signature ID: {signatureId}
      </p>
    </div>
  )
}

// --- Signature Form ---

function SignatureForm({
  userName,
  policyTitle,
  onSign,
  isSigning,
}: {
  userName: string
  policyTitle: string
  onSign: (name: string) => void
  isSigning: boolean
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [fullName, setFullName] = useState(userName)
  const [checkboxError, setCheckboxError] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentDate = useMemo(() => format(new Date(), 'd MMMM yyyy'), [])
  const canSubmit = confirmed && fullName.trim().length >= 3

  const handleSignClick = () => {
    if (!confirmed) {
      setCheckboxError(true)
      return
    }
    if (fullName.trim().length < 3) return
    setShowConfirmModal(true)
  }

  const handleConfirmSign = () => {
    onSign(fullName.trim())
    setShowConfirmModal(false)
  }

  return (
    <>
      <div>
        <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-4">
          Acknowledge This Policy
        </h3>
        <div className="border-t border-neutral-200 mb-5" />

        {/* Checkbox */}
        <div className="mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked)
                  if (e.target.checked) setCheckboxError(false)
                }}
                className="sr-only peer"
              />
              <div
                className={[
                  'w-[22px] h-[22px] rounded flex items-center justify-center transition-all duration-150',
                  confirmed
                    ? 'bg-accent-500 border-2 border-accent-500'
                    : checkboxError
                      ? 'border-2 border-error-500 bg-white'
                      : 'border-2 border-neutral-300 bg-white hover:border-neutral-400',
                ].join(' ')}
              >
                {confirmed && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-base font-body text-neutral-700 leading-relaxed">
              I confirm that I have read and understood this policy in its entirety. I agree to comply with the guidelines and procedures outlined within.
            </span>
          </label>
          {checkboxError && (
            <p className="text-sm font-body text-error-500 mt-2 ml-8">
              You must confirm you have read the policy.
            </p>
          )}
        </div>

        {/* Full Name Input */}
        <div className="mb-5">
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">
            Your Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Type your full name as a digital signature"
            className={[
              'w-full h-12 bg-neutral-50 border border-neutral-200 rounded-[10px] px-4',
              'font-body text-base text-neutral-800 placeholder:text-neutral-400',
              'focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100',
              'transition-all duration-150',
            ].join(' ')}
          />
          <p className="text-xs font-medium font-body text-neutral-400 mt-1.5">
            Entering your name constitutes a legally binding electronic signature.
          </p>
        </div>

        {/* Date Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium font-body text-neutral-700 mb-2">
            Date
          </label>
          <span className="font-mono text-[13px] text-neutral-600">{currentDate}</span>
        </div>

        {/* Sign Button */}
        <button
          onClick={handleSignClick}
          disabled={!canSubmit || isSigning}
          className={[
            'w-full sm:w-auto sm:min-w-[280px] h-12 rounded-lg text-sm font-medium font-body',
            'flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer',
            canSubmit && !isSigning
              ? 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
          ].join(' ')}
        >
          {isSigning ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing...
            </>
          ) : (
            <>
              <PenTool size={18} strokeWidth={2} />
              Sign Policy
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmSignatureModal
        open={showConfirmModal}
        policyTitle={policyTitle}
        onConfirm={handleConfirmSign}
        onCancel={() => setShowConfirmModal(false)}
        isSigning={isSigning}
      />
    </>
  )
}

// --- Main Policy Detail Page ---

function PolicyDetailContent() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { success } = useToastHelpers()

  // Simulate policy status — in production this comes from an API
  const [isSigned, setIsSigned] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signedData, setSignedData] = useState<{
    name: string
    date: string
    signatureId: string
  } | null>(null)

  const policyStatus: StatusVariant = useMemo(() => {
    if (isSigned) return 'signed'
    // Simulate different statuses based on policy ID
    if (id === '1') return 'overdue'
    if (id === '3') return 'pending'
    return 'pending'
  }, [isSigned, id])

  const formattedLastUpdated = useMemo(
    () => format(new Date(mockPolicy.last_updated), 'd MMMM yyyy'),
    []
  )

  const userName = profile?.name ?? ''

  const handleSign = useCallback(
    (name: string) => {
      setIsSigning(true)

      // Simulate API call
      setTimeout(() => {
        const now = new Date().toISOString()
        const sigId = `fox-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`

        setSignedData({ name, date: now, signatureId: sigId })
        setIsSigned(true)
        setIsSigning(false)

        success(
          'Policy Signed Successfully',
          `You have acknowledged the ${mockPolicy.title}.`
        )
      }, 1500)
    },
    [success]
  )

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Back link */}
      <div className="mb-4 animate-[fadeIn_200ms_ease-out]">
        <Link
          to="/policies"
          className="inline-flex items-center gap-1.5 text-sm font-medium font-body text-accent-600 hover:underline transition-all duration-150"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Policies
        </Link>
      </div>

      {/* Policy Header */}
      <div
        className="bg-white rounded-xl border border-neutral-200 p-6 mb-6"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="font-display text-[26px] font-bold text-neutral-800 leading-tight mb-3"
              style={{ animationDelay: '100ms' }}
            >
              {mockPolicy.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Category badge */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium font-body bg-accent-50 text-accent-600 border border-accent-200">
                {mockPolicy.category}
              </span>

              {/* Version */}
              <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-neutral-500">
                <Clock size={14} strokeWidth={1.5} className="text-neutral-400" />
                Version {mockPolicy.version}
              </span>

              {/* Last Updated */}
              <span className="font-mono text-[13px] text-neutral-500">
                Updated {formattedLastUpdated}
              </span>
            </div>
          </div>

          {/* Status badge - large */}
          <div className="flex-shrink-0">
            <StatusBadge variant={policyStatus} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: PDF Viewer */}
        <div
          className="w-full lg:w-[60%] h-[50vh] sm:h-[60vh] lg:h-[70vh]"
          style={{ animationDelay: '300ms' }}
        >
          <PDFViewer
            policyTitle={mockPolicy.title}
            category={mockPolicy.category}
            version={mockPolicy.version}
            lastUpdated={mockPolicy.last_updated}
          />
        </div>

        {/* Right: Policy Info & Signature */}
        <div className="w-full lg:w-[40%] space-y-6">
          {/* Description Card */}
          <div
            className="bg-white rounded-xl border border-neutral-200 p-6"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-accent-500" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-neutral-800">
                  About This Policy
                </h2>
              </div>
            </div>
            <p className="text-sm font-body text-neutral-600 leading-relaxed">
              {mockPolicy.description}
            </p>
          </div>

          {/* Signature or Signed State */}
          <div
            className="bg-white rounded-xl border border-neutral-200 p-6 lg:p-8"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            {isSigned && signedData ? (
              <SignedConfirmation
                signedName={signedData.name}
                signedDate={signedData.date}
                signatureId={signedData.signatureId}
              />
            ) : (
              <SignatureForm
                userName={userName}
                policyTitle={mockPolicy.title}
                onSign={handleSign}
                isSigning={isSigning}
              />
            )}
          </div>

          {/* Version History */}
          <div
            className="bg-white rounded-xl border border-neutral-200 p-6"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <VersionHistory />
          </div>

          {/* Related Policies */}
          <div
            className="bg-white rounded-xl border border-neutral-200 p-6"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <RelatedPoliciesSection
              policies={relatedPolicies}
              currentPolicyId={id ?? mockPolicy.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap with ToastProvider so the page has access to toasts
export default function PolicyDetail() {
  return (
    <ToastProvider>
      <PolicyDetailContent />
    </ToastProvider>
  )
}
