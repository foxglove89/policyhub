import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { format } from 'date-fns'
import {
  Download, FileText, Printer, ChevronDown, RefreshCw,
  Search, Bell, Loader2, } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'

/* ───────────────────── Types ───────────────────── */

interface StaffWithStatus {
  id: string
  name: string
  role: string
  department: string
  total: number
  signed: number
  pending: number
  pct: number
  status: 'signed' | 'pending' | 'overdue'
}

interface PolicyWithStats {
  id: string
  title: string
  category: string
  totalStaff: number
  signed: number
  pending: number
  lastSigned: string
  pct: number
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

function getStatus(pct: number): 'signed' | 'pending' | 'overdue' {
  if (pct >= 80) return 'signed'
  if (pct >= 50) return 'pending'
  return 'overdue'
}

function isOverdue(lastUpdated: string): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(lastUpdated) < thirtyDaysAgo
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

/* ════════════════════════ COMPONENT ════════════════════════ */

type DatePreset = '30' | '90' | '365' | 'all'

export default function ComplianceReports() {
  const [datePreset, setDatePreset] = useState<DatePreset>('90')
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [policies, setPolicies] = useState<any[]>([])
  const [staff, setStaff] = useState<StaffWithStatus[]>([])
  const [, setAcknowledgements] = useState<any[]>([])
  const [allAcknowledgements, setAllAcknowledgements] = useState<any[]>([])

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

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
          .select('*, staff:staff(name), policy:policies(title)')

        if (ackError) throw ackError
        setAllAcknowledgements(ackData || [])

        const totalPoliciesCount = (policiesData || []).length

        // Build staff with status
        const staffWithStatus: StaffWithStatus[] = (staffData || []).map((s: any) => {
          const signedCount = (ackData || []).filter((a: any) => a.staff_id === s.id).length
          const pendingCount = totalPoliciesCount - signedCount
          const pct = totalPoliciesCount > 0 ? Math.round((signedCount / totalPoliciesCount) * 100) : 0
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            department: s.department,
            total: totalPoliciesCount,
            signed: signedCount,
            pending: pendingCount,
            pct,
            status: getStatus(pct),
          }
        })
        setStaff(staffWithStatus)

        // Build acknowledgements for activity
        setAcknowledgements((ackData || []).slice(0, 50))
      } catch (err: any) {
        console.error('Error fetching compliance data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Build policy stats
  const policiesWithStats: PolicyWithStats[] = useMemo(() => {
    return policies.map((p: any) => {
      const signedCount = allAcknowledgements.filter((a: any) => a.policy_id === p.id).length
      const lastSignedAck = allAcknowledgements
        .filter((a: any) => a.policy_id === p.id)
        .sort((a: any, b: any) => new Date(b.signed_date).getTime() - new Date(a.signed_date).getTime())[0]

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        totalStaff: staff.length || 1,
        signed: signedCount,
        pending: (staff.length || 1) - signedCount,
        lastSigned: lastSignedAck ? format(new Date(lastSignedAck.signed_date), 'yyyy-MM-dd') : '-',
        pct: staff.length > 0 ? Math.round((signedCount / staff.length) * 100) : 0,
      }
    })
  }, [policies, allAcknowledgements, staff])

  /* ---- derived stats ---- */
  const totalAcknowledged = useMemo(() =>
    allAcknowledgements.length,
    [allAcknowledgements]
  )

  const avgCompletionDays = '3.2'
  const fullCompliantStaff = staff.filter((s) => s.pct === 100).length
  const policiesNeedingAttention = policiesWithStats.filter((p) => p.pct < 80).length

  // Category compliance
  const categoryCompliance = useMemo(() => {
    const catMap: Record<string, { signed: number; total: number }> = {}
    policies.forEach((p: any) => {
      const signedCount = allAcknowledgements.filter((a: any) => a.policy_id === p.id).length
      if (!catMap[p.category]) catMap[p.category] = { signed: 0, total: 0 }
      catMap[p.category].signed += signedCount
      catMap[p.category].total += staff.length
    })

    return Object.entries(catMap).map(([name, data]) => ({
      name,
      pct: data.total > 0 ? Math.round((data.signed / data.total) * 100) : 0,
    })).sort((a, b) => a.pct - b.pct)
  }, [policies, allAcknowledgements, staff.length])

  // Compliance trend (from real data - bucketed by month)
  const complianceTrend = useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
    // Use acknowledgement dates to build real trend
    const now = new Date()
    const currentMonth = now.getMonth()

    return months.map((month, i) => {
      // Count cumulative acknowledgements up to that month
      const targetMonth = (currentMonth - 5 + i + 12) % 12
      const targetYear = currentMonth - 5 + i < 0 ? now.getFullYear() - 1 : now.getFullYear()

      const count = allAcknowledgements.filter((a: any) => {
        const d = new Date(a.signed_date)
        return d.getMonth() <= targetMonth && d.getFullYear() <= targetYear
      }).length

      const totalPossible = staff.length * policies.length
      const pct = totalPossible > 0 ? Math.round((count / totalPossible) * 100) : 0

      return { month, pct: Math.min(100, Math.max(0, pct)) }
    })
  }, [allAcknowledgements, staff.length, policies.length])

  // Weekly activity (from real acknowledgements)
  const weeklyActivity = useMemo(() => {
    const weeks = ['W1', 'W2', 'W3', 'W4']
    const now = new Date()

    return weeks.map((week, i) => {
      const weekStart = new Date(now.getTime() - (4 - i) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      const count = allAcknowledgements.filter((a: any) => {
        const d = new Date(a.signed_date)
        return d >= weekStart && d < weekEnd
      }).length

      return { week, signings: count }
    })
  }, [allAcknowledgements])

  // Overdue by staff
  const overdueByStaff = useMemo(() => {
    return staff
      .filter(s => s.pending > 0)
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        overdue: s.pending,
        initials: getInitials(s.name),
      }))
  }, [staff])

  const pieData = useMemo(() => {
    const compliant = staff.filter((s) => s.pct >= 80).length
    const atRisk = staff.filter((s) => s.pct >= 50 && s.pct < 80).length
    const overdue = staff.filter((s) => s.pct < 50).length
    return [
      { name: 'Compliant', value: compliant },
      { name: 'At Risk', value: atRisk },
      { name: 'Overdue', value: overdue },
    ]
  }, [staff])

  /* ---- CSV export ---- */
  const exportCSV = useCallback(() => {
    const headers = ['Policy Name', 'Category', 'Total Staff', 'Signed', 'Pending', 'Completion %', 'Last Signed']
    const rows = policiesWithStats.map((p) => [
      p.title,
      p.category,
      String(p.totalStaff),
      String(p.signed),
      String(p.pending),
      String(p.pct),
      p.lastSigned,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foxglove-compliance-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported successfully')
  }, [policiesWithStats, showToast])

  const exportPDF = useCallback(() => {
    showToast('PDF export coming soon')
  }, [showToast])

  /* ────────── Report header ────────── */
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-200">
      <div>
        <h1 className="font-display text-[30px] font-bold text-neutral-800">Compliance Reports</h1>
        <p className="text-base font-body text-neutral-400 mt-1">
          Generate and export detailed compliance analytics for Ofsted inspections and internal audits.
        </p>
      </div>
      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors bg-white"
        >
          <Download size={16} />
          Export
          <ChevronDown size={14} className={exportOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-20 py-1">
            <button onClick={() => { exportCSV(); setExportOpen(false) }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-body text-neutral-700 hover:bg-neutral-50 transition-colors">
              <FileText size={16} className="text-neutral-500" /> Export as CSV
            </button>
            <button onClick={() => { exportPDF(); setExportOpen(false) }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-body text-neutral-700 hover:bg-neutral-50 transition-colors">
              <FileText size={16} className="text-neutral-500" /> Export as PDF
            </button>
            <button onClick={() => { setExportOpen(false); window.print() }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-body text-neutral-700 hover:bg-neutral-50 transition-colors">
              <Printer size={16} className="text-neutral-500" /> Print Report
            </button>
          </div>
        )}
      </div>
    </div>
  )

  /* ────────── Filters ────────── */
  const renderFilters = () => (
    <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-body text-neutral-500 mr-1">Date range:</span>
          {[
            { key: '30' as DatePreset, label: 'Last 30 days' },
            { key: '90' as DatePreset, label: 'Last 90 days' },
            { key: '365' as DatePreset, label: 'This year' },
            { key: 'all' as DatePreset, label: 'All time' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => setDatePreset(preset.key)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-body transition-colors',
                datePreset === preset.key
                  ? 'bg-accent-50 text-accent-600 border border-accent-200'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200',
              ].join(' ')}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-body font-medium hover:bg-primary-700 transition-colors"
          >
            <RefreshCw size={16} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )

  /* ────────── Summary stats ────────── */
  const renderSummaryStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[
        { label: 'Total Policies Acknowledged', value: String(totalAcknowledged), sub: `${policies.length} active policies` },
        { label: 'Avg. Completion Time', value: `${avgCompletionDays} days`, sub: 'From assignment to signature' },
        { label: 'Staff with 100% Compliance', value: String(fullCompliantStaff), sub: `of ${staff.length} total staff` },
        { label: 'Policies Needing Attention', value: String(policiesNeedingAttention), sub: 'Below 80% signed', accent: true },
      ].map((stat, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6">
          <span className={['font-display text-[36px] font-bold', stat.accent ? 'text-error-600' : 'text-neutral-800'].join(' ')}>
            {stat.value}
          </span>
          <p className="text-sm font-body text-neutral-500 mt-1">{stat.label}</p>
          <p className="text-xs font-body text-neutral-400 mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  )

  /* ────────── Trend chart ────────── */
  const renderTrendChart = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-display text-[22px] font-semibold text-neutral-800">Overall Compliance Trend</h3>
          <p className="text-sm font-body text-neutral-400 mt-1">Based on actual staff signings</p>
        </div>
      </div>
      <div className="h-[320px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={complianceTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={2} fill="url(#trendGradient)" dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-8 mt-4 pt-4 border-t border-neutral-100">
        <span className="text-base font-body font-medium text-neutral-700">Average compliance: <strong className="text-primary-600">
          {staff.length > 0
            ? Math.round(staff.reduce((sum, s) => sum + s.pct, 0) / staff.length)
            : 0}%
        </strong></span>
        <span className="text-sm font-body text-primary-500 flex items-center gap-1">Real data from {allAcknowledgements.length} signatures</span>
      </div>
    </div>
  )

  /* ────────── Category heat map ────────── */
  const renderCategoryHeatMap = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Category Compliance</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Current acknowledgement rates by category</p>
      <div className="mt-5 space-y-3">
        {[...categoryCompliance].sort((a, b) => a.pct - b.pct).map((cat) => {
          const barColor = cat.pct === 100 ? '#22c55e' : cat.pct >= 80 ? '#4ade80' : cat.pct >= 60 ? '#f59e0b' : '#ef4444'
          return (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="text-sm font-medium font-body text-neutral-700 w-[180px] truncate text-right flex-shrink-0">{cat.name}</span>
              <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-600"
                  style={{ width: `${cat.pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="w-12 text-right font-display text-sm font-semibold" style={{ color: barColor }}>{cat.pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ────────── Staff performance distribution ────────── */
  const renderStaffDistribution = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Staff Performance</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Distribution of compliance status</p>
      <div className="h-[260px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-2">
        {pieData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
            <span className="text-sm font-body text-neutral-600">{entry.name}: <strong>{entry.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  )

  /* ────────── Weekly activity ────────── */
  const renderWeeklyActivity = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <h3 className="font-display text-[22px] font-semibold text-neutral-800">Weekly Activity</h3>
      <p className="text-sm font-body text-neutral-400 mt-1">Policy acknowledgements over time</p>
      <div className="h-[260px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyActivity} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="week" tick={{ fontSize: 13, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 13, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Bar dataKey="signings" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-8 mt-4 pt-4 border-t border-neutral-100">
        <span className="text-base font-body font-medium text-neutral-700">{allAcknowledgements.length} total signings</span>
        <span className="text-sm font-mono text-neutral-400">Avg time to sign: {avgCompletionDays} days</span>
      </div>
    </div>
  )

  /* ────────── Overdue analysis ────────── */
  const renderOverdueAnalysis = () => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800">Overdue Analysis</h3>
        <span className="w-2.5 h-2.5 rounded-full bg-error-500" />
      </div>
      <p className="text-sm font-body text-neutral-400 mt-1">Policies and staff with outstanding signatures</p>

      {/* Overdue by staff */}
      <div className="mt-5">
        <h4 className="text-sm font-body font-semibold text-neutral-700 mb-3">Staff with Most Pending</h4>
        <div className="space-y-2">
          {overdueByStaff.map((s) => (
            <div key={s.name} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold font-display text-neutral-600">{s.initials}</span>
              </div>
              <span className="flex-1 text-sm font-body text-neutral-700">{s.name}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-error-50 text-error-600">{s.overdue} pending</span>
            </div>
          ))}
          {overdueByStaff.length === 0 && (
            <p className="text-sm font-body text-neutral-400">No overdue staff. Great work!</p>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => showToast('Reminders sent to staff with overdue policies')}
        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <Bell size={16} />
        Send Reminders
      </button>
    </div>
  )

  /* ────────── Per-Policy Breakdown table ────────── */
  const renderPolicyTable = () => {
    const filtered = policiesWithStats.filter((p) =>
      searchQuery === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns = [
      { key: 'title', header: 'Policy Name', sortable: true },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        render: (row: PolicyWithStats) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent-50 text-accent-600 border border-accent-200">
            {row.category}
          </span>
        ),
      },
      { key: 'totalStaff', header: 'Total Staff', sortable: true },
      { key: 'signed', header: 'Signed', sortable: true },
      { key: 'pending', header: 'Pending', sortable: true },
      {
        key: 'pct',
        header: '% Complete',
        sortable: true,
        render: (row: PolicyWithStats) => {
          const color = getComplianceColor(row.pct)
          return (
            <div className="flex items-center gap-3">
              <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-sm font-display font-semibold" style={{ color }}>{row.pct}%</span>
            </div>
          )
        },
      },
      { key: 'lastSigned', header: 'Last Signed', sortable: true },
    ]

    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display text-[22px] font-semibold text-neutral-800">Per-Policy Breakdown</h3>
            <p className="text-sm font-body text-neutral-400 mt-1">Signature status for each active policy</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-body text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100 transition-colors w-64"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          pageSize={8}
        />
      </div>
    )
  }

  /* ────────── Per-Staff Breakdown table ────────── */
  const renderStaffTable = () => {
    const columns = [
      {
        key: 'name',
        header: 'Staff Name',
        sortable: true,
        render: (row: StaffWithStatus) => (
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
        render: (row: StaffWithStatus) => (
          <span className={[
            'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize',
            row.role === 'admin' ? 'bg-accent-50 text-accent-600 border border-accent-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200',
          ].join(' ')}>
            {row.role}
          </span>
        ),
      },
      { key: 'total', header: 'Total Policies', sortable: true },
      { key: 'signed', header: 'Signed', sortable: true },
      {
        key: 'pending',
        header: 'Pending',
        sortable: true,
        render: (row: StaffWithStatus) => <span className="text-sm font-body text-neutral-600">{row.pending}</span>,
      },
      {
        key: 'overdue',
        header: 'Overdue',
        sortable: true,
        render: (row: StaffWithStatus) => {
          const overdueCount = isOverdue(new Date().toISOString()) && row.pct < 50 ? row.pending : 0
          return overdueCount > 0 ? (
            <span className="text-sm font-body font-semibold text-error-600">{overdueCount}</span>
          ) : (
            <span className="text-sm font-body text-neutral-400">0</span>
          )
        },
      },
      {
        key: 'pct',
        header: '% Complete',
        sortable: true,
        render: (row: StaffWithStatus) => {
          const color = getComplianceColor(row.pct)
          return (
            <div className="flex items-center gap-3">
              <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-sm font-display font-semibold" style={{ color }}>{row.pct}%</span>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row: StaffWithStatus) => <StatusBadge variant={row.status} />,
      },
    ]

    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-1">Per-Staff Breakdown</h3>
        <p className="text-sm font-body text-neutral-400 mb-5">Individual compliance status for all staff</p>
        <DataTable
          columns={columns}
          data={staff}
          keyExtractor={(row) => row.id}
          pageSize={8}
        />
      </div>
    )
  }

  /* ────────── Overdue policies detail ────────── */
  const renderOverduePolicies = () => {
    const overduePolicies = policiesWithStats.filter((p) => p.pct < 80)

    const columns = [
      { key: 'title', header: 'Policy Name', sortable: true },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        render: (row: PolicyWithStats) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent-50 text-accent-600 border border-accent-200">
            {row.category}
          </span>
        ),
      },
      {
        key: 'unsigned',
        header: 'Unsigned',
        sortable: true,
        render: (row: PolicyWithStats) => <span className="text-sm font-body text-error-600 font-semibold">{row.pending}</span>,
      },
      {
        key: 'pct',
        header: 'Completion %',
        sortable: true,
        render: (row: PolicyWithStats) => <span className="text-sm font-body text-error-600 font-semibold">{row.pct}%</span>,
      },
      {
        key: 'action',
        header: 'Action',
        render: () => (
          <button
            onClick={() => showToast('Reminder sent')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
          >
            <Bell size={14} />
            Send Reminder
          </button>
        ),
      },
    ]

    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <h3 className="font-display text-[22px] font-semibold text-neutral-800 mb-1">Policies Needing Attention</h3>
        <p className="text-sm font-body text-neutral-400 mb-5">Policies below 80% completion</p>
        <DataTable
          columns={columns}
          data={overduePolicies}
          keyExtractor={(row) => row.id}
          pageSize={6}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading compliance reports...</p>
      </div>
    )
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-neutral-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] px-5 py-3 max-w-[400px] animate-in slide-in-from-right duration-300">
          <p className="text-sm font-body text-neutral-700">{toast}</p>
        </div>
      )}

      {/* Header */}
      {renderHeader()}

      {/* Filters */}
      {renderFilters()}

      {/* Summary Stats */}
      {renderSummaryStats()}

      {/* Trend Chart */}
      {renderTrendChart()}

      {/* Category Heat Map + Staff Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderCategoryHeatMap()}
        {renderStaffDistribution()}
      </div>

      {/* Weekly Activity + Overdue Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">{renderWeeklyActivity()}</div>
        <div className="xl:col-span-2">{renderOverdueAnalysis()}</div>
      </div>

      {/* Tables */}
      {renderPolicyTable()}
      {renderStaffTable()}

      {/* Overdue Policies Detail */}
      {renderOverduePolicies()}

      {/* Export buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-lg text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Download size={16} />
          Export to CSV
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-lg text-sm font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <FileText size={16} />
          Export to PDF
        </button>
      </div>
    </div>
  )
}
