import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  Signature,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { format, subMonths, isAfter } from 'date-fns'
import { POLICY_CATEGORIES } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────
interface SignedPolicy {
  id: string
  title: string
  category: string
  version: string
  signed_date: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function formatDateTimeFull(iso: string): string {
  const d = new Date(iso)
  return format(d, 'd MMM yyyy, HH:mm')
}

function getCategoryStreak(signedPolicies: SignedPolicy[]): number {
  if (signedPolicies.length === 0) return 0
  const now = new Date()
  let streak = 0
  for (let i = 0; i < 6; i++) {
    const monthStart = subMonths(now, i)
    const monthEnd = subMonths(now, i - 1)
    const hasSigning = signedPolicies.some(p => {
      const d = new Date(p.signed_date)
      return isAfter(d, monthStart) && !isAfter(d, monthEnd)
    })
    if (hasSigning) streak++ else break
  }
  return streak
}

// ─── Sub-components ──────────────────────────────────────────────────────

function CategoryBreakdown({ signedPolicies, totalPoliciesByCategory }: { signedPolicies: SignedPolicy[]; totalPoliciesByCategory: Record<string, number> }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 className="font-display text-lg font-semibold text-neutral-800 mb-4">By Category</h3>
      <div className="space-y-3">
        {POLICY_CATEGORIES.map((cat) => {
          const catSigned = signedPolicies.filter(p => p.category === cat).length
          const catTotal = totalPoliciesByCategory[cat] || 0
          const pct = catTotal > 0 ? Math.round((catSigned / catTotal) * 100) : 0
          return (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">{cat}</span>
                <span className="text-neutral-500">{catSigned}/{catTotal}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignatureTimeline({ policies }: { signedPolicies: SignedPolicy[] }) {
  const groups: Record<string, SignedPolicy[]> = {}
  policies.forEach(p => {
    const key = format(new Date(p.signed_date), 'MMMM yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 className="font-display text-lg font-semibold text-neutral-800 mb-4">Signature Timeline</h3>
      {Object.entries(groups).map(([month, policies]) => (
        <div key={month} className="mb-6 last:mb-0">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-accent-500" />
            <span className="font-display font-semibold text-sm text-neutral-700">{month}</span>
          </div>
          <div className="space-y-3 ml-6 border-l-2 border-neutral-200 pl-4">
            {policies.map((policy) => (
              <div key={policy.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-800">{policy.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge variant="signed" />
                    <span className="text-xs text-neutral-400">{formatDateTimeFull(policy.signed_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ExportSection({ policies }: { signedPolicies: SignedPolicy[] }) {
  const handleExport = useCallback(() => {
    const headers = ['Policy Title', 'Category', 'Version', 'Date Signed']
    const rows = policies.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.category,
      p.version,
      formatDateTimeFull(p.signed_date),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `signature-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }, [policies])

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
    >
      <Download size={16} />
      Export CSV
    </button>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function MySignatures() {
  const { user, profile } = useAuth()
  const [signedPolicies, setSignedPolicies] = useState<SignedPolicy[]>([])
  const [totalPolicies, setTotalPolicies] = useState(0)
  const [totalPoliciesByCategory, setTotalPoliciesByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return

    async function fetchData() {
      try {
        setLoading(true)

        const { data: allPolicies, error: policiesError } = await supabase
          .from('policies')
          .select('category')
          .eq('active', true)

        if (policiesError) throw policiesError
        setTotalPolicies((allPolicies || []).length)

        const catCounts: Record<string, number> = {}
        allPolicies?.forEach(p => {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1
        })
        setTotalPoliciesByCategory(catCounts)

        // Use staff table ID for lookup
        const staffId = profile?.id ?? user.id

        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('*, policy:policies(*)')
          .eq('staff_id', staffId)
          .order('signed_date', { ascending: false })

        if (ackError) throw ackError

        const mapped: SignedPolicy[] = (ackData || []).map((ack: any) => ({
          id: ack.policy_id,
          title: ack.policy?.title || 'Unknown Policy',
          category: ack.policy?.category || 'Unknown',
          version: ack.policy?.version || '',
          signed_date: ack.signed_date,
        }))

        setSignedPolicies(mapped)
      } catch (err: any) {
        console.error('Error fetching signatures:', err)
        setError(err.message || 'Failed to load signatures')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, profile?.id])

  const name = profile?.name ?? 'Staff Member'

  const totalSigned = signedPolicies.length
  const completionPct = totalPolicies > 0 ? Math.round((totalSigned / totalPolicies) * 100) : 0
  const streak = getCategoryStreak(signedPolicies)

  const dateRange = useMemo(() => {
    if (signedPolicies.length === 0) return ''
    const dates = signedPolicies.map(p => new Date(p.signed_date))
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))
    return `${format(earliest, 'd MMM yyyy')} - ${format(latest, 'd MMM yyyy')}`
  }, [signedPolicies])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-accent-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={40} className="text-error-500 mb-4" />
        <p className="text-neutral-600 mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="text-accent-600 text-sm">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-neutral-900">My Signatures</h1>
        <p className="text-neutral-500 mt-1">
          {totalSigned > 0
            ? `You have signed ${totalSigned} of ${totalPolicies} policies${dateRange ? ` · ${dateRange}` : ''}`
            : 'You have not signed any policies yet'}
        </p>
      </div>

      {/* Stats */}
      {totalSigned > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <FileText size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-neutral-900">{totalSigned}</p>
                <p className="text-xs text-neutral-500">Policies Signed</p>
              </div>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-xs text-neutral-400 mt-2">{completionPct}% complete</p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-neutral-900">{completionPct}%</p>
                <p className="text-xs text-neutral-500">Completion Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
                <Award size={20} className="text-warning-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-neutral-900">{streak}</p>
                <p className="text-xs text-neutral-500">Month Streak</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline & Breakdown */}
      {totalSigned > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SignatureTimeline policies={signedPolicies} />
          </div>
          <div>
            <CategoryBreakdown signedPolicies={signedPolicies} totalPoliciesByCategory={totalPoliciesByCategory} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <Signature size={48} className="text-neutral-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-neutral-800 mb-2">No Signatures Yet</h3>
          <p className="text-neutral-500 mb-4 max-w-md mx-auto">You haven&apos;t signed any policies yet. Go to the Policies page to start reading and signing.</p>
          <Link
            to="/policies"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            View Policies <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Export */}
      {totalSigned > 0 && <ExportSection policies={signedPolicies} />}
    </div>
  )
}
