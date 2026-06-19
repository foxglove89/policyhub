import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ProgressRing from '@/components/ProgressRing'
import StatusBadge from '@/components/StatusBadge'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  FilePlus,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────
interface MockPolicy {
  id: string
  title: string
  category: string
  version: string
  last_updated: string
  due_date: string
  signed_date: string | null
  status: 'signed' | 'pending' | 'overdue'
}

interface ActivityItem {
  id: string
  type: 'signed' | 'new_policy' | 'reminder' | 'update'
  message: string
  timestamp: string
}

// ─── Mock Data: 24 Policies ──────────────────────────────────────────────
const MOCK_POLICIES: MockPolicy[] = [
  // COVID-19 (2)
  { id: 'p1', title: 'COVID-19 Infection Control Policy', category: 'COVID-19', version: '3.2', last_updated: '2025-01-10T09:00:00Z', due_date: '2025-01-20T00:00:00Z', signed_date: '2025-01-12T14:30:00Z', status: 'signed' },
  { id: 'p2', title: 'Pandemic Response and Business Continuity', category: 'COVID-19', version: '2.1', last_updated: '2025-01-08T11:00:00Z', due_date: '2025-01-28T00:00:00Z', signed_date: null, status: 'pending' },
  // Care Planning (3)
  { id: 'p3', title: 'Individual Care Planning Guidelines', category: 'Care Planning', version: '4.0', last_updated: '2024-12-15T10:00:00Z', due_date: '2025-01-15T00:00:00Z', signed_date: '2025-01-10T09:15:00Z', status: 'signed' },
  { id: 'p4', title: 'Placement Planning and Reviews', category: 'Care Planning', version: '3.5', last_updated: '2024-12-20T14:00:00Z', due_date: '2025-01-18T00:00:00Z', signed_date: '2025-01-14T16:45:00Z', status: 'signed' },
  { id: 'p5', title: 'Transition and Leaving Care Protocol', category: 'Care Planning', version: '2.3', last_updated: '2025-01-05T08:30:00Z', due_date: '2025-01-25T00:00:00Z', signed_date: null, status: 'pending' },
  // Views, Wishes and Feelings (2)
  { id: 'p6', title: 'Listening to Children and Young People', category: 'Views, Wishes and Feelings', version: '2.8', last_updated: '2024-11-28T09:00:00Z', due_date: '2025-01-12T00:00:00Z', signed_date: '2025-01-08T11:20:00Z', status: 'signed' },
  { id: 'p7', title: 'Advocacy and Independent Visitor Policy', category: 'Views, Wishes and Feelings', version: '1.9', last_updated: '2024-12-01T13:00:00Z', due_date: '2025-01-14T00:00:00Z', signed_date: null, status: 'overdue' },
  // Child Protection (4)
  { id: 'p8', title: 'Child Protection and Safeguarding Policy 2025', category: 'Child Protection', version: '5.1', last_updated: '2025-01-12T10:00:00Z', due_date: '2025-01-15T00:00:00Z', signed_date: '2025-01-13T08:45:00Z', status: 'signed' },
  { id: 'p9', title: 'Allegations Against Staff Procedure', category: 'Child Protection', version: '3.4', last_updated: '2024-12-18T11:00:00Z', due_date: '2025-01-20T00:00:00Z', signed_date: '2025-01-16T14:00:00Z', status: 'signed' },
  { id: 'p10', title: 'Missing from Care Protocol', category: 'Child Protection', version: '2.7', last_updated: '2024-12-10T15:00:00Z', due_date: '2025-01-22T00:00:00Z', signed_date: '2025-01-18T10:30:00Z', status: 'signed' },
  { id: 'p11', title: 'Whistleblowing Policy', category: 'Child Protection', version: '2.2', last_updated: '2025-01-06T09:00:00Z', due_date: '2025-01-13T00:00:00Z', signed_date: null, status: 'overdue' },
  // Health and Well-being (3)
  { id: 'p12', title: 'Health and Safety Protocol Revision', category: 'Health and Well-being', version: '4.3', last_updated: '2025-01-10T12:00:00Z', due_date: '2025-01-28T00:00:00Z', signed_date: null, status: 'pending' },
  { id: 'p13', title: 'Medication Administration Policy', category: 'Health and Well-being', version: '3.8', last_updated: '2024-12-22T10:00:00Z', due_date: '2025-01-16T00:00:00Z', signed_date: '2025-01-14T09:30:00Z', status: 'signed' },
  { id: 'p14', title: 'Mental Health and Emotional Wellbeing', category: 'Health and Well-being', version: '2.5', last_updated: '2024-12-05T14:00:00Z', due_date: '2025-01-19T00:00:00Z', signed_date: '2025-01-17T11:00:00Z', status: 'signed' },
  // Quality of Care (2)
  { id: 'p15', title: 'Ofsted Inspection Preparation Guide', category: 'Quality of Care', version: '2.0', last_updated: '2025-01-03T09:00:00Z', due_date: '2025-01-21T00:00:00Z', signed_date: null, status: 'pending' },
  { id: 'p16', title: 'Continuous Improvement Framework', category: 'Quality of Care', version: '1.7', last_updated: '2024-11-25T11:00:00Z', due_date: '2025-01-10T00:00:00Z', signed_date: '2025-01-09T15:45:00Z', status: 'signed' },
  // Enjoyment and Achievement (2)
  { id: 'p17', title: 'Education and Achievement Support', category: 'Enjoyment and Achievement', version: '2.4', last_updated: '2024-12-12T10:00:00Z', due_date: '2025-01-17T00:00:00Z', signed_date: '2025-01-15T10:00:00Z', status: 'signed' },
  { id: 'p18', title: 'Leisure Activities and Enrichment Programme', category: 'Enjoyment and Achievement', version: '1.6', last_updated: '2024-12-08T13:00:00Z', due_date: '2025-01-12T00:00:00Z', signed_date: '2025-01-11T14:20:00Z', status: 'signed' },
  // Positive Relationships (2)
  { id: 'p19', title: 'Positive Behaviour Support Guidelines', category: 'Positive Relationships', version: '3.3', last_updated: '2025-01-07T09:00:00Z', due_date: '2025-01-26T00:00:00Z', signed_date: null, status: 'pending' },
  { id: 'p20', title: 'Restorative Practice and Conflict Resolution', category: 'Positive Relationships', version: '2.1', last_updated: '2024-12-14T11:00:00Z', due_date: '2025-01-14T00:00:00Z', signed_date: '2025-01-13T16:30:00Z', status: 'signed' },
  // Leadership and Management (2)
  { id: 'p21', title: 'Fire Safety and Emergency Procedures', category: 'Leadership and Management', version: '4.2', last_updated: '2024-12-28T10:00:00Z', due_date: '2025-01-11T00:00:00Z', signed_date: '2025-01-10T09:00:00Z', status: 'signed' },
  { id: 'p22', title: 'Staff Supervision and Appraisal Policy', category: 'Leadership and Management', version: '3.0', last_updated: '2025-01-09T14:00:00Z', due_date: '2025-01-23T00:00:00Z', signed_date: '2025-01-20T11:45:00Z', status: 'signed' },
  // GDPR (2)
  { id: 'p23', title: 'Data Handling and GDPR Compliance', category: 'GDPR', version: '3.6', last_updated: '2025-01-11T08:00:00Z', due_date: '2025-01-14T00:00:00Z', signed_date: null, status: 'overdue' },
  { id: 'p24', title: 'CCTV and Digital Surveillance Policy', category: 'GDPR', version: '2.3', last_updated: '2024-12-16T09:00:00Z', due_date: '2025-01-18T00:00:00Z', signed_date: '2025-01-16T13:15:00Z', status: 'signed' },
]

// ─── Mock Activity Feed ──────────────────────────────────────────────────
const ACTIVITY_FEED: ActivityItem[] = [
  { id: 'a1', type: 'signed', message: 'You signed Safeguarding Policy v2.1', timestamp: '2025-01-20T14:00:00Z' },
  { id: 'a2', type: 'new_policy', message: 'New policy uploaded: Fire Safety 2025', timestamp: '2025-01-20T09:00:00Z' },
  { id: 'a3', type: 'reminder', message: 'Reminder: 3 policies need attention', timestamp: '2025-01-19T08:00:00Z' },
  { id: 'a4', type: 'signed', message: 'You signed Data Retention Policy', timestamp: '2025-01-18T16:30:00Z' },
  { id: 'a5', type: 'update', message: 'Admin updated Behaviour Management Guide', timestamp: '2025-01-17T11:00:00Z' },
  { id: 'a6', type: 'signed', message: 'You signed Health and Safety Protocol', timestamp: '2025-01-16T10:15:00Z' },
  { id: 'a7', type: 'new_policy', message: 'New policy: Transition and Leaving Care Protocol', timestamp: '2025-01-15T13:00:00Z' },
  { id: 'a8', type: 'signed', message: 'You signed Fire Safety and Emergency Procedures', timestamp: '2025-01-14T09:00:00Z' },
]

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
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(dateStr: string): string {
  const now = new Date('2025-01-21T10:00:00Z')
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return format(then, 'd MMM yyyy')
}

function activityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'signed': return <CheckCircle2 size={16} className="text-white" />
    case 'new_policy': return <FilePlus size={16} className="text-white" />
    case 'reminder': return <Bell size={16} className="text-white" />
    case 'update': return <RefreshCw size={16} className="text-white" />
  }
}

function activityIconBg(type: ActivityItem['type']): string {
  switch (type) {
    case 'signed': return 'bg-primary-500'
    case 'new_policy': return 'bg-info-500'
    case 'reminder': return 'bg-warning-500'
    case 'update': return 'bg-accent-500'
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────
function WelcomeBanner({ name, pendingCount, overdueCount }: { name: string; pendingCount: number; overdueCount: number }) {
  const greeting = getGreeting()
  const statusText = overdueCount > 0
    ? `You have ${overdueCount} overdue polic${overdueCount === 1 ? 'y' : 'ies'}. Please review urgently.`
    : pendingCount > 0
      ? `You have ${pendingCount} polic${pendingCount === 1 ? 'y' : 'ies'} waiting for your signature.`
      : 'All policies are up to date. Great work!'
  const statusColor = overdueCount > 0 ? 'text-error-600' : pendingCount > 0 ? 'text-warning-600' : 'text-primary-600'

  return (
    <div className="bg-neutral-50 border-b border-neutral-200 rounded-xl px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="font-display text-[28px] font-semibold text-primary-900 leading-tight">
          {greeting}, {name}
        </h2>
        <p className={`font-body text-base mt-1 ${statusColor}`}>
          {statusText}
        </p>
      </div>
      <Link
        to="/policies"
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors duration-150 shrink-0"
      >
        View All Policies
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

function ProgressCard({ percentage, signed, total, overdue }: { percentage: number; signed: number; total: number; overdue: number }) {
  const [showOverdue, setShowOverdue] = useState(overdue > 0)
  const pendingCount = total - signed

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm transition-all duration-200 hover:shadow-md"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Progress Ring */}
      <div className="flex flex-col items-center mb-6">
        <ProgressRing size={140} strokeWidth={8} progress={percentage} color="#22c55e" trackColor="#e7e5e4" />
        <div className="text-center mt-3">
          <div className="font-display text-[32px] font-bold text-primary-700 leading-none">
            {Math.round(percentage)}%
          </div>
          <div className="font-body text-sm text-neutral-500 mt-1">Complete</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="font-display text-[28px] font-bold text-primary-600 leading-tight">{signed}</div>
          <div className="font-body text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-1">Signed</div>
        </div>
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className={`font-display text-[28px] font-bold leading-tight ${overdue > 0 ? 'text-error-500' : pendingCount > 0 ? 'text-warning-500' : 'text-neutral-500'}`}>
            {showOverdue ? overdue : pendingCount}
          </div>
          <div className="font-body text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-1">
            {showOverdue ? 'Overdue' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Toggle */}
      {overdue > 0 && pendingCount > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowOverdue(!showOverdue)}
            className="text-xs font-body text-accent-600 hover:underline"
          >
            Show {showOverdue ? 'Pending' : 'Overdue'} instead
          </button>
        </div>
      )}

      {/* Linear progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-xs text-neutral-500">Overall Progress</span>
          <span className="font-body text-xs text-neutral-500">{signed}/{total} policies</span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-[800ms] ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function PendingPoliciesCard({ policies }: { policies: MockPolicy[] }) {
  const navigate = useNavigate()
  const sorted = useMemo(() => {
    return [...policies]
      .filter(p => p.status !== 'signed')
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1
        if (a.status !== 'overdue' && b.status === 'overdue') return 1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      .slice(0, 5)
  }, [policies])

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-[22px] font-semibold text-neutral-800">Pending Policies</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning-500 text-white text-xs font-medium">
            {sorted.length}
          </span>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <CheckCircle2 size={40} className="text-primary-500 mb-3" />
          <p className="font-body text-base text-neutral-500 font-medium">All caught up!</p>
          <p className="font-body text-sm text-neutral-400 mt-1">You have no pending policies.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {sorted.map((policy) => {
            const isOverdue = policy.status === 'overdue'
            return (
              <div
                key={policy.id}
                onClick={() => navigate(`/policies/${policy.id}`)}
                className={[
                  'flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors duration-150',
                  'hover:bg-neutral-50',
                  isOverdue ? 'border-l-[3px] border-l-error-500 bg-error-50/40' : 'border-l-[3px] border-l-warning-500',
                ].join(' ')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/policies/${policy.id}`) }}
              >
                <div className="shrink-0">
                  {isOverdue ? (
                    <AlertTriangle size={20} className="text-error-500" />
                  ) : (
                    <Clock size={20} className="text-warning-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-neutral-700 truncate">
                    {policy.title}
                  </p>
                  <p className="font-body text-[11px] text-neutral-400 mt-0.5">
                    {policy.category}
                  </p>
                </div>
                <StatusBadge variant={policy.status} />
                <ChevronRight size={16} className="text-neutral-300 shrink-0" />
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-neutral-100">
        <Link
          to="/policies"
          className="inline-flex items-center gap-1 font-body text-sm text-accent-600 hover:underline"
        >
          View All Policies
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

function CategoryBreakdown({ policies }: { policies: MockPolicy[] }) {
  const categoryStats = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const catPolicies = policies.filter(p => p.category === cat)
      const total = catPolicies.length
      const signed = catPolicies.filter(p => p.status === 'signed').length
      const hasOverdue = catPolicies.some(p => p.status === 'overdue')
      const pct = total > 0 ? Math.round((signed / total) * 100) : 0
      return { category: cat, total, signed, pct, hasOverdue }
    })
  }, [policies])

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800">Your Progress by Category</h3>
        <p className="font-body text-sm text-neutral-400 mt-1">
          Track your acknowledgement status across all policy areas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {categoryStats.map((stat) => (
          <div
            key={stat.category}
            className="bg-white border border-neutral-200 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <p className="font-body text-sm font-semibold text-neutral-700 truncate" title={stat.category}>
              {stat.category}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`font-display text-[22px] font-bold leading-tight ${stat.pct === 100 ? 'text-primary-600' : 'text-neutral-700'}`}>
                {stat.signed}/{stat.total}
              </span>
              <span className="font-body text-xs text-neutral-400">{stat.pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full mt-3 overflow-hidden">
              <div
                className={[
                  'h-full rounded-full transition-all duration-[600ms] ease-out',
                  stat.hasOverdue ? 'bg-error-400' : stat.pct === 100 ? 'bg-primary-500' : 'bg-warning-400',
                ].join(' ')}
                style={{ width: `${stat.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div>
      <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-4">Recent Activity</h3>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="divide-y divide-neutral-100">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors duration-100">
              <div className={[`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5`, activityIconBg(activity.type)].join(' ')}>
                {activityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-neutral-700 leading-snug">
                  {activity.message}
                </p>
              </div>
              <span className="font-mono text-[13px] text-neutral-400 shrink-0">
                {relativeTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Component ────────────────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuth()
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const name = profile?.name?.split(' ')[0] ?? 'Sarah'

  const stats = useMemo(() => {
    const total = MOCK_POLICIES.length
    const signed = MOCK_POLICIES.filter(p => p.status === 'signed').length
    const pending = MOCK_POLICIES.filter(p => p.status === 'pending').length
    const overdue = MOCK_POLICIES.filter(p => p.status === 'overdue').length
    const percentage = total > 0 ? (signed / total) * 100 : 0
    return { total, signed, pending, overdue, percentage }
  }, [])

  const statCards = [
    { label: 'Total Policies', value: stats.total, color: 'text-neutral-700', bg: 'bg-neutral-50', border: 'border-neutral-200' },
    { label: 'Signed', value: stats.signed, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200' },
    { label: 'Pending', value: stats.pending, color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200' },
    { label: 'Overdue', value: stats.overdue, color: 'text-error-600', bg: 'bg-error-50', border: 'border-error-200' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div
        className={[
          'transition-all duration-400 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        ].join(' ')}
      >
        <WelcomeBanner
          name={name}
          pendingCount={stats.pending}
          overdueCount={stats.overdue}
        />
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={[
              'bg-white border rounded-xl p-5 transition-all duration-300 ease-out cursor-pointer hover:shadow-md hover:-translate-y-0.5',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            ].join(' ')}
            style={{
              borderColor: card.border.replace('border-', '').replace('-200', ''),
              borderWidth: '1px',
              transitionDelay: `${100 + i * 60}ms`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onClick={() => { if (card.label !== 'Total Policies') navigate('/policies') }}
          >
            <div className={`font-display text-[28px] font-bold ${card.color} leading-tight`}>
              {card.value}
            </div>
            <div className="font-body text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div
          className={[
            'lg:col-span-2 transition-all duration-400 ease-out',
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5',
          ].join(' ')}
          style={{ transitionDelay: '200ms' }}
        >
          <ProgressCard
            percentage={stats.percentage}
            signed={stats.signed}
            total={stats.total}
            overdue={stats.overdue}
          />
        </div>
        <div
          className={[
            'lg:col-span-3 transition-all duration-400 ease-out',
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5',
          ].join(' ')}
          style={{ transitionDelay: '250ms' }}
        >
          <PendingPoliciesCard policies={MOCK_POLICIES} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div
        className={[
          'transition-all duration-400 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        ].join(' ')}
        style={{ transitionDelay: '350ms' }}
      >
        <CategoryBreakdown policies={MOCK_POLICIES} />
      </div>

      {/* Recent Activity */}
      <div
        className={[
          'transition-all duration-400 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        ].join(' ')}
        style={{ transitionDelay: '400ms' }}
      >
        <RecentActivity activities={ACTIVITY_FEED} />
      </div>
    </div>
  )
}
