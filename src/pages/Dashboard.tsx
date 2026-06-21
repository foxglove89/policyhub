import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Policy, Acknowledgement } from '@/types'
import { POLICY_CATEGORIES } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────
interface PolicyWithStatus extends Policy {
  status: 'signed' | 'pending' | 'overdue'
}

interface ActivityItem {
  id: string
  type: 'signed' | 'new_policy' | 'reminder' | 'update'
  message: string
  timestamp: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false }) + ' ago'
  } catch {
    return dateStr
  }
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

function isOverdue(lastUpdated: string): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(lastUpdated) < thirtyDaysAgo
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

function PendingPoliciesCard({ policies, userAckIds }: { policies: PolicyWithStatus[]; userAckIds: Set<string> }) {
  const navigate = useNavigate()
  const sorted = useMemo(() => {
    return [...policies]
      .filter(p => !userAckIds.has(p.id))
      .sort((a, b) => {
        const aOverdue = isOverdue(a.last_updated)
        const bOverdue = isOverdue(b.last_updated)
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
        return new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
      })
      .slice(0, 5)
  }, [policies, userAckIds])

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
            const policyOverdue = isOverdue(policy.last_updated)
            return (
              <div
                key={policy.id}
                onClick={() => navigate(`/policies/${policy.id}`)}
                className={[
                  'flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors duration-150',
                  'hover:bg-neutral-50',
                  policyOverdue ? 'border-l-[3px] border-l-error-500 bg-error-50/40' : 'border-l-[3px] border-l-warning-500',
                ].join(' ')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/policies/${policy.id}`) }}
              >
                <div className="shrink-0">
                  {policyOverdue ? (
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
                <StatusBadge variant={policyOverdue ? 'overdue' : 'pending'} />
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

function CategoryBreakdown({ policies, userAckIds }: { policies: PolicyWithStatus[]; userAckIds: Set<string> }) {
  const categoryStats = useMemo(() => {
    return POLICY_CATEGORIES.map((cat) => {
      const catPolicies = policies.filter(p => p.category === cat)
      const total = catPolicies.length
      const signed = catPolicies.filter(p => userAckIds.has(p.id)).length
      const hasOverdue = catPolicies.some(p => isOverdue(p.last_updated) && !userAckIds.has(p.id))
      const pct = total > 0 ? Math.round((signed / total) * 100) : 0
      return { category: cat, total, signed, pct, hasOverdue }
    })
  }, [policies, userAckIds])

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
  const { profile, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all active policies
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('*')
          .eq('active', true)

        if (policiesError) throw policiesError

        // Fetch user's acknowledgements with policy details
        const staffId = profile?.id ?? user.id
        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('*, policy:policies(*)')
          .eq('staff_id', staffId)
          .order('signed_date', { ascending: false })

        if (ackError) throw ackError

        setPolicies(policiesData || [])
        setAcknowledgements(ackData || [])
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, profile?.id])

  const name = profile?.name?.split(' ')[0] ?? 'Staff Member'

  // Build a set of policy IDs the user has signed
  const userAckIds = useMemo(() => {
    return new Set(acknowledgements.map(a => a.policy_id))
  }, [acknowledgements])

  const stats = useMemo(() => {
    const total = policies.length
    const signed = acknowledgements.length
    const pending = total - signed
    const overdue = policies.filter(p => !userAckIds.has(p.id) && isOverdue(p.last_updated)).length
    const percentage = total > 0 ? (signed / total) * 100 : 0
    return { total, signed, pending, overdue, percentage }
  }, [policies, acknowledgements, userAckIds])

  const statCards = [
    { label: 'Total Policies', value: stats.total, color: 'text-neutral-700', bg: 'bg-neutral-50', border: 'border-neutral-200' },
    { label: 'Signed', value: stats.signed, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200' },
    { label: 'Pending', value: stats.pending, color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200' },
    { label: 'Overdue', value: stats.overdue, color: 'text-error-600', bg: 'bg-error-50', border: 'border-error-200' },
  ]

  // Build activity feed from real acknowledgements
  const activityFeed: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = acknowledgements.slice(0, 8).map((ack, i) => ({
      id: ack.id || `ack-${i}`,
      type: 'signed' as const,
      message: `You signed ${ack.policy?.title ?? 'a policy'}`,
      timestamp: ack.signed_date,
    }))

    // If no real activities, show a welcome message
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        type: 'reminder',
        message: 'Welcome! Start reviewing and signing your policies.',
        timestamp: new Date().toISOString(),
      })
    }

    return activities
  }, [acknowledgements])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading dashboard data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={40} className="text-error-500 mb-4" />
        <p className="font-body text-base text-neutral-700 font-medium">Failed to load dashboard</p>
        <p className="font-body text-sm text-neutral-500 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-body font-medium hover:bg-primary-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

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
          <PendingPoliciesCard policies={policies as PolicyWithStatus[]} userAckIds={userAckIds} />
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
        <CategoryBreakdown policies={policies as PolicyWithStatus[]} userAckIds={userAckIds} />
      </div>

      {/* Recent Activity */}
      <div
        className={[
          'transition-all duration-400 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        ].join(' ')}
        style={{ transitionDelay: '400ms' }}
      >
        <RecentActivity activities={activityFeed} />
      </div>
    </div>
  )
}
