import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import {
  Target, FileText, Users, AlertTriangle, UploadCloud,
  ChevronRight, Bell, AlertCircle, Clock, FilePlus, UserX,
  Crown, TrendingUp, Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProgressRing from '@/components/ProgressRing'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'

/* ───────────────────── Types ───────────────────── */

interface StaffWithCompliance {
  id: string
  name: string
  role: string
  department: string
  signed: number
  total: number
  pct: number
}

interface ActivityItem {
  id: string
  text: string
  time: string
  icon: 'user' | 'file' | 'alert'
  color: string
}

interface AlertItem {
  priority: string
  icon: typeof AlertCircle
  color: string
  message: string
  action: string
}

/* ───────────────────── helpers ───────────────────── */

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getComplianceColor(pct: number) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

function getStatus(pct: number) {
  if (pct >= 80) return 'signed'
  if (pct >= 50) return 'pending'
  return 'overdue'
}

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return format(d, 'd MMM')
  } catch {
    return dateStr
  }
}

function isOverdue(lastUpdated: string): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(lastUpdated) < thirtyDaysAgo
}

/* ───────────────────── count-up animation ───────────────────── */

function useCountUp(target: number, duration = 1000, delay = 300) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        setVal(Math.round(target * progress))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, duration, delay])
  return val
}

/* ════════════════════════ COMPONENT ════════════════════════ */

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policies, setPolicies] = useState<any[]>([])
  const [staff, setStaff] = useState<StaffWithCompliance[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [, setAcknowledgements] = useState<any[]>([])

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all active policies
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('*')
          .eq('active', true)

        if (policiesError) throw policiesError
        setPolicies(policiesData || [])

        // Fetch all active staff
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('active', true)

        if (staffError) throw staffError

        // Fetch all acknowledgements
        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('*, staff:staff(name, role, department), policy:policies(title)')
          .order('signed_date', { ascending: false })
          .limit(50)

        if (ackError) throw ackError
        setAcknowledgements(ackData || [])

        const totalPoliciesCount = (policiesData || []).length

        // Build staff with compliance data
        const staffWithCounts: StaffWithCompliance[] = (staffData || []).map((s: any) => {
          const signedCount = (ackData || []).filter((a: any) => a.staff_id === s.id).length
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            department: s.department,
            signed: signedCount,
            total: totalPoliciesCount,
            pct: totalPoliciesCount > 0 ? Math.round((signedCount / totalPoliciesCount) * 100) : 0,
          }
        })
        setStaff(staffWithCounts)

        // Build activity feed from real acknowledgements
        const activityItems: ActivityItem[] = (ackData || []).slice(0, 10).map((ack: any, i: number) => ({
          id: ack.id || `act-${i}`,
          text: `${ack.staff?.name || 'Staff'} signed ${ack.policy?.title || 'a policy'}`,
          time: formatTimeAgo(ack.signed_date),
          icon: 'user' as const,
          color: 'text-primary-600 bg-primary-50',
        }))

        // Add some system activities if we have few real ones
        if (activityItems.length < 5) {
          activityItems.push({
            id: 'new-policy-reminder',
            text: 'System reminder: Review pending policies',
            time: 'Recently',
            icon: 'alert',
            color: 'text-warning-600 bg-warning-50',
          })
        }

        setActivities(activityItems)
      } catch (err: any) {
        console.error('Error fetching admin data:', err)
        setError(err.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  /* ---- derived stats ---- */
  const totalStaff = staff.length
  const totalPolicies = policies.length
  const overallCompliance = totalStaff > 0
    ? Math.round(staff.reduce((acc, s) => acc + s.pct, 0) / totalStaff)
    : 0
  const overduePolicies = policies.filter((p: any) => isOverdue(p.last_updated)).length

  const complianceColor = getComplianceColor(overallCompliance)

  const animOverall = useCountUp(overallCompliance, 1000, 300)
  const animStaff = useCountUp(totalStaff, 800, 380)
  const animPolicies = useCountUp(totalPolicies, 800, 460)
  const animOverdue = useCountUp(overduePolicies, 600, 540)

  /* ---- leaderboard data ---- */
  const leaderboard = useMemo(
    () =>
      [...staff]
        .sort((a, b) => b.pct - a.pct),
    [staff]
  )

  /* ---- compliance trend (mock for now) ---- */
  const complianceTrend = useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
    // Generate realistic trend data based on current compliance
    const base = Math.max(0, overallCompliance - 15)
    return months.map((month, i) => ({
      month,
      pct: Math.round(base + (overallCompliance - base) * (i / 5)),
    }))
  }, [overallCompliance])

  /* ---- alerts based on real data ---- */
  const alerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = []

    // Overdue policies alert
    if (overduePolicies > 0) {
      items.push({
        priority: 'critical',
        icon: AlertCircle,
        color: 'text-error-500 bg-error-50',
        message: `${overduePolicies} polic${overduePolicies === 1 ? 'y is' : 'ies are'} overdue across the organisation`,
        action: 'Review',
      })
    }

    // Low compliance staff
    const lowComplianceStaff = staff.filter(s => s.pct < 50)
    if (lowComplianceStaff.length > 0) {
      items.push({
        priority: 'warning',
        icon: UserX,
        color: 'text-warning-500 bg-warning-50',
        message: `${lowComplianceStaff.length} staff member${lowComplianceStaff.length === 1 ? '' : 's'} below 50% compliance`,
        action: 'Follow up',
      })

      items.push({
        priority: 'warning',
        icon: Clock,
        color: 'text-warning-500 bg-warning-50',
        message: `${lowComplianceStaff.length} staff need reminder notifications`,
        action: 'View',
      })
    }

    // New policies info
    const recentPolicies = policies.filter((p: any) => {
      const policyDate = new Date(p.created_at || p.last_updated)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return policyDate > weekAgo
    })
    if (recentPolicies.length > 0) {
      items.push({
        priority: 'info',
        icon: FilePlus,
        color: 'text-info-500 bg-info-50',
        message: `${recentPolicies.length} new polic${recentPolicies.length === 1 ? 'y' : 'ies'} uploaded this week`,
        action: 'Review',
      })
    }

    // If no alerts, show a positive message
    if (items.length === 0) {
      items.push({
        priority: 'info',
        icon: FilePlus,
        color: 'text-info-500 bg-info-50',
        message: 'All policies are up to date. Great work!',
        action: 'Review',
      })
    }

    return items.slice(0, 4)
  }, [overduePolicies, staff, policies])

  /* ---- activity icon ---- */
  const renderActivityIcon = (item: ActivityItem) => {
    if (item.icon === 'user') return <Users size={16} className={item.color.split(' ')[0]} />
    if (item.icon === 'file') return <FileText size={16} className={item.color.split(' ')[0]} />
    return <Bell size={16} className={item.color.split(' ')[0]} />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading admin dashboard...</p>
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

  /* ────────── KPI cards ────────── */
  const renderKPICards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
      {/* Overall Compliance */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="font-display text-[36px] font-bold" style={{ color: complianceColor }}>
              {animOverall}%
            </span>
            <p className="text-sm font-body text-neutral-500 mt-1">Organisation-wide compliance rate</p>
            <div className="flex items-center gap-1 mt-2 text-sm font-body">
              <TrendingUp size={14} className="text-primary-500" />
              <span className="text-primary-500 font-medium">Sample data — will populate as staff sign policies</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ProgressRing size={64} progress={overallCompliance} color={complianceColor} />
          </div>
        </div>
      </div>

      {/* Total Policies */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-display text-[36px] font-bold text-accent-600">{animPolicies}</span>
            <p className="text-sm font-body text-neutral-500 mt-1">Active policies across {new Set(policies.map(p => p.category)).size} categories</p>
            {overduePolicies > 0 && (
              <p className="text-sm font-body text-warning-600 mt-2 font-medium">{overduePolicies} need attention</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-accent-600" />
          </div>
        </div>
      </div>

      {/* Staff Members */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-display text-[36px] font-bold text-neutral-800">{animStaff}</span>
            <p className="text-sm font-body text-neutral-500 mt-1">Registered staff members</p>
            <div className="flex items-center gap-1 mt-2 text-sm font-body">
              <TrendingUp size={14} className="text-primary-500" />
              <span className="text-primary-500 font-medium">Active team</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-info-50 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-info-500" />
          </div>
        </div>
      </div>

      {/* Overdue Policies */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-display text-[36px] font-bold text-error-600">{animOverdue}</span>
            <p className="text-sm font-body text-neutral-500 mt-1">Policies past their deadline</p>
            <p className="text-sm font-body text-error-600 mt-2 font-medium">Action required</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-error-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-error-500" />
          </div>
        </div>
      </div>
    </div>
  )

  /* ────────── Trend chart ────────── */
  const renderTrendChart = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Compliance Trend</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Sample data — will populate as staff sign policies</p>
      <div className="mt-5 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={complianceTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 13, fill: '#78716c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ fontSize: 13, color: '#78716c', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(value: number) => [`${value}%`, 'Compliance']}
            />
            <Area type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={2} fill="url(#compGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  /* ────────── Leaderboard ────────── */
  const renderLeaderboard = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Staff Leaderboard</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Ranked by policy completion rate</p>
      <div className="mt-5 space-y-1">
        {leaderboard.slice(0, 8).map((staff, idx) => {
          const pct = staff.pct
          const barColor = getComplianceColor(pct)
          const isAtRisk = pct < 60

          return (
            <div
              key={staff.id}
              className={[
                'flex items-center gap-3 h-12 px-2 rounded-lg transition-colors',
                isAtRisk ? 'bg-error-50 border-l-[3px] border-error-500' : 'border-l-[3px] border-transparent',
              ].join(' ')}
            >
              {/* Rank */}
              <div className="w-6 flex-shrink-0 flex justify-center">
                {idx === 0 ? <Crown size={18} className="text-warning-500" /> :
                 idx === 1 ? <Crown size={18} className="text-neutral-400" /> :
                 idx === 2 ? <Crown size={18} className="text-warning-700" /> :
                 <span className="text-[11px] font-medium text-neutral-400">{idx + 1}</span>}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-semibold font-display text-neutral-600">
                  {getInitials(staff.name)}
                </span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-sm font-medium font-body text-neutral-700 truncate">{staff.name}</span>
                {isAtRisk && <span className="w-1.5 h-1.5 rounded-full bg-error-500 flex-shrink-0" />}
              </div>

              {/* Mini progress bar */}
              <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full transition-all duration-600" style={{ width: `${pct}%`, backgroundColor: barColor }} />
              </div>

              {/* Score */}
              <span className="w-12 text-right font-display text-[13px] font-semibold" style={{ color: barColor }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
      <button
        onClick={() => navigate('/admin/staff')}
        className="mt-4 text-sm font-body font-medium text-accent-600 hover:text-accent-700 transition-colors"
      >
        View All Staff &rarr;
      </button>
    </div>
  )

  /* ────────── Activity feed ────────── */
  const renderActivityFeed = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Recent Staff Activity</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Latest actions across the organisation</p>
      <div className="mt-5 space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {activities.map((item, _i) => (
          <div key={item.id} className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
            <div className={['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', item.color.split(' ')[1]].join(' ')}>
              {renderActivityIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-neutral-700">{item.text}</p>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ────────── Alerts panel ────────── */
  const renderAlerts = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800">Alerts</h3>
        {alerts.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-error-500 text-white text-[10px] font-bold">
            {alerts.length}
          </span>
        )}
      </div>
      <div className="mt-5 space-y-0">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
            <div className={['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', alert.color.split(' ')[1]].join(' ')}>
              <alert.icon size={16} className={alert.color.split(' ')[0]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-body text-neutral-700">{alert.message}</p>
            </div>
            <button className="text-sm font-body font-medium text-accent-600 hover:text-accent-700 transition-colors flex-shrink-0">
              {alert.action} &rarr;
            </button>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
        <Bell size={16} />
        Send Reminders to All
      </button>
    </div>
  )

  /* ────────── Quick actions ────────── */
  const renderQuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
      {[
        {
          icon: <UploadCloud size={24} className="text-primary-600" />,
          bg: 'bg-primary-50',
          title: 'Upload New Policy',
          desc: 'Upload a new policy document and assign it to staff',
          onClick: () => navigate('/admin/policies'),
        },
        {
          icon: <Users size={24} className="text-accent-600" />,
          bg: 'bg-accent-50',
          title: 'Manage Staff',
          desc: 'Add, edit, or remove staff members',
          onClick: () => navigate('/admin/staff'),
        },
        {
          icon: <Target size={24} className="text-info-500" />,
          bg: 'bg-info-50',
          title: 'Export Report',
          desc: 'Download compliance reports in CSV or PDF',
          onClick: () => navigate('/admin/reports'),
        },
      ].map((card, i) => (
        <button
          key={i}
          onClick={card.onClick}
          className="group bg-white border border-neutral-200 rounded-2xl p-7 text-left transition-all duration-250 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-[3px] hover:border-accent-200 cursor-pointer relative"
        >
          <div className={['w-12 h-12 rounded-full flex items-center justify-center', card.bg].join(' ')}>
            {card.icon}
          </div>
          <h4 className="text-base font-body font-semibold text-neutral-800 mt-4">{card.title}</h4>
          <p className="text-sm font-body text-neutral-400 mt-1">{card.desc}</p>
          <ChevronRight size={20} className="absolute bottom-7 right-7 text-neutral-300 group-hover:text-accent-500 transition-colors" />
        </button>
      ))}
    </div>
  )

  /* ────────── Staff compliance table (full) ────────── */
  const renderStaffTable = () => {
    const columns = [
      {
        key: 'name',
        header: 'Staff Member',
        sortable: true,
        render: (row: StaffWithCompliance) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold font-display text-neutral-600">{getInitials(row.name)}</span>
            </div>
            <span className="text-sm font-body text-neutral-700">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (row: StaffWithCompliance) => (
          <span className={[
            'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize',
            row.role === 'admin' ? 'bg-accent-50 text-accent-600 border border-accent-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200',
          ].join(' ')}>
            {row.role}
          </span>
        ),
      },
      { key: 'department', header: 'Department', sortable: true },
      {
        key: 'signed',
        header: 'Policies',
        sortable: true,
        render: (row: StaffWithCompliance) => (
          <span className="text-sm font-body text-neutral-600">{row.signed} / {row.total}</span>
        ),
      },
      {
        key: 'pct',
        header: 'Completion',
        sortable: true,
        render: (row: StaffWithCompliance) => {
          const barColor = getComplianceColor(row.pct)
          return (
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: barColor }} />
              </div>
              <span className="text-sm font-display font-semibold" style={{ color: barColor }}>{row.pct}%</span>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row: StaffWithCompliance) => <StatusBadge variant={getStatus(row.pct) as any} />,
      },
    ]

    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 mt-6">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-1">Staff Compliance Details</h3>
        <p className="text-sm font-body text-neutral-400 mb-5">Full compliance breakdown for all staff members</p>
        <DataTable
          columns={columns}
          data={leaderboard}
          keyExtractor={(row) => row.id}
          pageSize={8}
        />
      </div>
    )
  }

  /* ═══════════ RENDER ═══════════ */

  const now = new Date()
  const periodStart = format(new Date(now.getFullYear(), 0, 1), 'd MMMM yyyy')
  const periodEnd = format(now, 'd MMMM yyyy')

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-neutral-200">
        <h1 className="font-display text-[30px] font-bold text-neutral-800">Admin Dashboard</h1>
        <p className="text-base font-body text-neutral-400 mt-1">
          Foxglove Management Ltd — Compliance overview and management tools
        </p>
        <p className="font-mono text-[13px] text-neutral-400 mt-2">
          Reporting period: {periodStart} — {periodEnd}
        </p>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Trend + Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
        <div className="xl:col-span-3">{renderTrendChart()}</div>
        <div className="xl:col-span-2">{renderLeaderboard()}</div>
      </div>

      {/* Activity + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-6">
        <div className="xl:col-span-3">{renderActivityFeed()}</div>
        <div className="xl:col-span-2">{renderAlerts()}</div>
      </div>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Full Staff Table */}
      {renderStaffTable()}
    </div>
  )
}
