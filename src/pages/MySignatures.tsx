import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import StatusBadge from '@/components/StatusBadge'
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  Signature,
} from 'lucide-react'
import { format, subMonths, isAfter } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────
interface SignedPolicy {
  id: string
  title: string
  category: string
  version: string
  signed_date: string
}

// ─── Mock Data: 18 Signed Policies (last 3 months) ──────────────────────
const SIGNED_POLICIES: SignedPolicy[] = [
  // January 2025 (8)
  { id: 'p1', title: 'COVID-19 Infection Control Policy', category: 'COVID-19', version: '3.2', signed_date: '2025-01-20T10:30:00Z' },
  { id: 'p8', title: 'Child Protection and Safeguarding Policy 2025', category: 'Child Protection', version: '5.1', signed_date: '2025-01-19T14:15:00Z' },
  { id: 'p24', title: 'CCTV and Digital Surveillance Policy', category: 'GDPR', version: '2.3', signed_date: '2025-01-18T09:45:00Z' },
  { id: 'p13', title: 'Medication Administration Policy', category: 'Health and Well-being', version: '3.8', signed_date: '2025-01-17T11:20:00Z' },
  { id: 'p3', title: 'Individual Care Planning Guidelines', category: 'Care Planning', version: '4.0', signed_date: '2025-01-16T16:00:00Z' },
  { id: 'p4', title: 'Placement Planning and Reviews', category: 'Care Planning', version: '3.5', signed_date: '2025-01-15T08:30:00Z' },
  { id: 'p14', title: 'Mental Health and Emotional Wellbeing', category: 'Health and Well-being', version: '2.5', signed_date: '2025-01-14T13:10:00Z' },
  { id: 'p9', title: 'Allegations Against Staff Procedure', category: 'Child Protection', version: '3.4', signed_date: '2025-01-13T15:45:00Z' },
  // December 2024 (6)
  { id: 'p6', title: 'Listening to Children and Young People', category: 'Views, Wishes and Feelings', version: '2.8', signed_date: '2024-12-18T10:00:00Z' },
  { id: 'p10', title: 'Missing from Care Protocol', category: 'Child Protection', version: '2.7', signed_date: '2024-12-17T09:30:00Z' },
  { id: 'p17', title: 'Education and Achievement Support', category: 'Enjoyment and Achievement', version: '2.4', signed_date: '2024-12-16T14:20:00Z' },
  { id: 'p20', title: 'Restorative Practice and Conflict Resolution', category: 'Positive Relationships', version: '2.1', signed_date: '2024-12-12T11:00:00Z' },
  { id: 'p21', title: 'Fire Safety and Emergency Procedures', category: 'Leadership and Management', version: '4.2', signed_date: '2024-12-10T08:45:00Z' },
  { id: 'p16', title: 'Continuous Improvement Framework', category: 'Quality of Care', version: '1.7', signed_date: '2024-12-05T16:15:00Z' },
  // November 2024 (4)
  { id: 'p18', title: 'Leisure Activities and Enrichment Programme', category: 'Enjoyment and Achievement', version: '1.6', signed_date: '2024-11-28T09:00:00Z' },
  { id: 'p22', title: 'Staff Supervision and Appraisal Policy', category: 'Leadership and Management', version: '3.0', signed_date: '2024-11-25T13:30:00Z' },
]

const TOTAL_POLICIES = 24 // Total policies in the system

const CATEGORY_ORDER = [
  'COVID-19',
  'Care Planning',
  'Views, Wishes and Feelings',
  'Child Protection',
  'Health and Well-being',
  'Quality of Care',
  'Enjoyment and Achievement',
  'Positive Relationships',
  'Leadership and Management',
  'GDPR',
]

// ─── Helpers ─────────────────────────────────────────────────────────────
function formatDateTimeFull(iso: string): string {
  const d = new Date(iso)
  return format(d, 'd MMM yyyy, HH:mm')
}

function getCategoryStreak(signedPolicies: SignedPolicy[]): number {
  const now = new Date('2025-01-21T00:00:00Z')
  let streak = 0
  for (let i = 0; i < 6; i++) {
    const monthStart = subMonths(now, i)
    const monthEnd = subMonths(now, i - 1)
    const hasSigning = signedPolicies.some(p => {
      const d = new Date(p.signed_date)
      return isAfter(d, monthStart) && !isAfter(d, monthEnd)
    })
    if (hasSigning) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ─── Sub-components ──────────────────────────────────────────────────────
function HeaderSection({ name, totalSigned, dateRange }: { name: string; totalSigned: number; dateRange: string }) {
  return (
    <div className="bg-neutral-50 border-b border-neutral-200 rounded-xl px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] font-semibold text-neutral-800 leading-tight">
            My Signatures
          </h2>
          <p className="font-body text-sm text-neutral-500 mt-1">
            {totalSigned} policies signed &middot; {dateRange}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg">
            <Signature size={18} className="text-accent-500" />
            <span className="font-body text-sm text-neutral-600">{name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
  delay,
  mounted,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
  delay: number
  mounted: boolean
}) {
  return (
    <div
      className={[
        'bg-white border border-neutral-200 rounded-xl p-5 transition-all duration-300 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={[`w-10 h-10 rounded-lg flex items-center justify-center`, color.replace('text-', 'bg-').replace('600', '50')].join(' ')}>
          {icon}
        </div>
      </div>
      <div className={`font-display text-[28px] font-bold ${color} leading-tight`}>
        {value}
      </div>
      <div className="font-body text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  )
}

function CategoryBreakdown({ signedPolicies }: { signedPolicies: SignedPolicy[] }) {
  const stats = useMemo(() => {
    return CATEGORY_ORDER.map(cat => {
      const catSigned = signedPolicies.filter(p => p.category === cat).length
      const catTotal = 2 // Each category has 2-4 policies in our mock
      const pct = Math.round((catSigned / catTotal) * 100)
      return { category: cat, signed: catSigned, total: catTotal, pct }
    })
  }, [signedPolicies])

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-1">By Category</h3>
      <p className="font-body text-sm text-neutral-400 mb-5">Signed policies grouped by category</p>

      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.category} className="flex items-center gap-3">
            <span className="font-body text-sm text-neutral-600 w-40 truncate shrink-0" title={stat.category}>
              {stat.category}
            </span>
            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={[
                  'h-full rounded-full transition-all duration-[600ms] ease-out',
                  stat.pct === 100 ? 'bg-primary-500' : 'bg-warning-400',
                ].join(' ')}
                style={{ width: `${stat.pct}%` }}
              />
            </div>
            <span className="font-display text-sm font-semibold text-neutral-700 w-10 text-right shrink-0">
              {stat.signed}/{stat.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignatureTimeline({ policies }: { policies: SignedPolicy[] }) {
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? policies : policies.slice(0, 8)

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, SignedPolicy[]> = {}
    displayed.forEach(p => {
      const key = format(new Date(p.signed_date), 'MMMM yyyy')
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return groups
  }, [displayed])

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
        <div>
          <h3 className="font-display text-[22px] font-semibold text-neutral-800">Signature Timeline</h3>
          <p className="font-body text-sm text-neutral-400 mt-0.5">
            Chronological history of all your policy acknowledgements
          </p>
        </div>
      </div>

      <div className="divide-y divide-neutral-100">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-neutral-400" />
              <span className="font-body text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {month}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((policy) => (
                <Link
                  key={policy.id}
                  to={`/policies/${policy.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors duration-150 group"
                >
                  {/* Verified icon */}
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                    <img
                      src="/verified-badge.svg"
                      alt="Verified"
                      className="w-5 h-5"
                      onError={(e) => {
                        // Fallback if SVG doesn't exist
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-neutral-700 truncate group-hover:text-accent-600 transition-colors">
                      {policy.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium font-body bg-accent-500 text-white">
                        {policy.category}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-400">
                        v{policy.version}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[13px] text-neutral-500">
                      {formatDateTimeFull(policy.signed_date)}
                    </span>
                    <StatusBadge variant="signed" label="Verified" />
                  </div>

                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {policies.length > 8 && (
        <div className="px-6 py-4 border-t border-neutral-100 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="font-body text-sm text-accent-600 hover:underline"
          >
            {showAll ? 'Show less' : `Show all ${policies.length} signatures`}
          </button>
        </div>
      )}
    </div>
  )
}

function ExportSection({ policies }: { policies: SignedPolicy[] }) {
  const handleExport = useCallback(() => {
    const headers = ['Policy Title', 'Category', 'Version', 'Date Signed']
    const rows = policies.map(p => [
      p.title,
      p.category,
      p.version,
      formatDateTimeFull(p.signed_date),
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `signature-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [policies])

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
          <Download size={18} className="text-accent-600" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-neutral-800">Export History</h3>
          <p className="font-body text-sm text-neutral-400">Download your signature history as a CSV file</p>
        </div>
      </div>
      <button
        onClick={handleExport}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-600 text-white text-sm font-body font-medium hover:bg-accent-700 transition-colors duration-150"
      >
        <Download size={16} />
        Download CSV
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img
        src="/empty-state-policies.svg"
        alt="No signatures yet"
        className="w-40 h-40 mb-4"
      />
      <p className="font-display text-xl font-semibold text-neutral-700 mb-2">
        No signatures yet
      </p>
      <p className="font-body text-sm text-neutral-400 max-w-md mb-6">
        You haven&apos;t signed any policies yet. Head over to the policies page to start acknowledging the policies assigned to you.
      </p>
      <Link
        to="/policies"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors duration-150"
      >
        Browse Policies
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

// ─── Main MySignatures Component ─────────────────────────────────────────
export default function MySignatures() {
  const { profile } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const name = profile?.name ?? 'Staff Member'

  const totalSigned = SIGNED_POLICIES.length
  const completionPct = Math.round((totalSigned / TOTAL_POLICIES) * 100)
  const streak = getCategoryStreak(SIGNED_POLICIES)

  const dateRange = useMemo(() => {
    if (SIGNED_POLICIES.length === 0) return ''
    const dates = SIGNED_POLICIES.map(p => new Date(p.signed_date))
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))
    return `${format(earliest, 'd MMM yyyy')} - ${format(latest, 'd MMM yyyy')}`
  }, [])

  if (totalSigned === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={[
          'transition-all duration-400 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        ].join(' ')}
      >
        <HeaderSection name={name} totalSigned={totalSigned} dateRange={dateRange} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<FileText size={18} className="text-primary-600" />}
          value={totalSigned}
          label="Total Signed"
          color="text-primary-600"
          delay={100}
          mounted={mounted}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-accent-600" />}
          value={`${completionPct}%`}
          label="Completion Rate"
          color="text-accent-600"
          delay={160}
          mounted={mounted}
        />
        <StatCard
          icon={<Award size={18} className="text-warning-600" />}
          value={`${streak} month${streak !== 1 ? 's' : ''}`}
          label="Signing Streak"
          color="text-warning-600"
          delay={220}
          mounted={mounted}
        />
      </div>

      {/* Two-column layout: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div
          className={[
            'lg:col-span-2 transition-all duration-400 ease-out',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
          ].join(' ')}
          style={{ transitionDelay: '300ms' }}
        >
          <SignatureTimeline policies={SIGNED_POLICIES} />
        </div>

        {/* Sidebar */}
        <div
          className={[
            'space-y-6 transition-all duration-400 ease-out',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
          ].join(' ')}
          style={{ transitionDelay: '350ms' }}
        >
          <CategoryBreakdown signedPolicies={SIGNED_POLICIES} />
          <ExportSection policies={SIGNED_POLICIES} />
        </div>
      </div>
    </div>
  )
}
