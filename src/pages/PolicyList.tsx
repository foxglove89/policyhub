import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import PolicyCard from '@/components/PolicyCard'
import StatusBadge from '@/components/StatusBadge'
import {
  Search,
  X,
  ChevronDown,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Policy, Acknowledgement } from '@/types'
import { POLICY_CATEGORIES } from '@/types'

type StatusFilter = 'all' | 'signed' | 'pending' | 'overdue'
type SortOption = 'due_date' | 'updated' | 'title' | 'category'

const CATEGORIES = ['All', ...POLICY_CATEGORIES]

const PAGE_SIZE = 12

// ─── Helpers ─────────────────────────────────────────────────────────────
function isOverdue(lastUpdated: string): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(lastUpdated) < thirtyDaysAgo
}

interface PolicyWithStatus extends Policy {
  status: 'signed' | 'pending' | 'overdue'
}

function policyToCardPolicy(policy: PolicyWithStatus) {
  return {
    id: policy.id,
    title: policy.title,
    category: policy.category,
    version: policy.version,
    description: policy.description,
    pdf_url: policy.pdf_url,
    upload_date: policy.upload_date,
    last_updated: policy.last_updated,
    requires_acknowledgement: policy.requires_acknowledgement,
    active: policy.active,
    created_at: policy.created_at,
  }
}

// ─── Components ──────────────────────────────────────────────────────────
function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocal(v)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onChange(v), 300)
  }, [onChange])

  return (
    <div className="relative flex-1 min-w-0">
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder="Search policies by title..."
        className={[
          'w-full h-12 pl-12 pr-10 rounded-[10px] border font-body text-sm',
          'bg-neutral-50 border-neutral-200 placeholder:text-neutral-400',
          'focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100',
          'transition-all duration-150',
        ].join(' ')}
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center transition-colors"
        >
          <X size={14} className="text-neutral-400" />
        </button>
      )}
    </div>
  )
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
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
        className={[
          'flex items-center gap-2 h-10 px-4 rounded-lg border border-neutral-200 bg-white',
          'font-body text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150',
          'focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-100',
          'min-w-[140px]',
        ].join(' ')}
      >
        {label && <span className="text-neutral-400 text-xs">{label}</span>}
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0 ml-auto" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={[
                'w-full text-left px-4 py-2.5 font-body text-sm transition-colors duration-100',
                opt.label === value
                  ? 'bg-accent-50 text-accent-600 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PolicyRowCard({ policy, status }: { policy: Policy; status: 'signed' | 'pending' | 'overdue' }) {
  const borderColor = status === 'signed' ? 'border-l-primary-500' : status === 'overdue' ? 'border-l-error-500' : 'border-l-warning-500'
  const dueLabel = status === 'signed'
    ? `Updated: ${format(new Date(policy.last_updated), 'd MMM yyyy')}`
    : `Updated: ${format(new Date(policy.last_updated), 'd MMM yyyy')}`

  return (
    <Link
      to={`/policies/${policy.id}`}
      className={[
        'flex items-center gap-4 px-5 py-4 bg-white border border-neutral-200 rounded-xl',
        'border-l-[3px]',
        borderColor,
        'transition-all duration-200 hover:bg-neutral-50 hover:shadow-md hover:-translate-y-0.5',
      ].join(' ')}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
        <FileText size={20} className="text-neutral-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-body text-sm font-semibold text-neutral-800 truncate">
          {policy.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium font-body bg-accent-500 text-white">
            {policy.category}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <StatusBadge variant={status} />
        <span className="font-mono text-[13px] text-neutral-400 w-32 text-right">
          {dueLabel}
        </span>
        {status === 'pending' || status === 'overdue' ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors">
            View & Sign
            <ChevronRight size={14} className="ml-1" />
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-body font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
            View Policy
            <ChevronRight size={14} className="ml-1" />
          </span>
        )}
      </div>
    </Link>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={[
          'flex items-center gap-1 px-4 py-2 rounded-lg font-body text-sm transition-colors duration-150',
          currentPage === 1
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-100',
        ].join(' ')}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span className="font-body text-sm text-neutral-500 px-3">
        Page {currentPage} of {totalPages}
      </span>

      {/* Page number pills - desktop only */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              'w-9 h-9 rounded-lg font-body text-sm font-medium transition-colors duration-150',
              p === currentPage
                ? 'bg-accent-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100',
            ].join(' ')}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={[
          'flex items-center gap-1 px-4 py-2 rounded-lg font-body text-sm transition-colors duration-150',
          currentPage === totalPages
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-100',
        ].join(' ')}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Main PolicyList Component ───────────────────────────────────────────
export default function PolicyList() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('due_date')
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([])

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

        // Fetch user's acknowledgements
        const { data: ackData, error: ackError } = await supabase
          .from('acknowledgements')
          .select('*')
          .eq('staff_id', user.id)

        if (ackError) throw ackError

        setPolicies(policiesData || [])
        setAcknowledgements(ackData || [])
      } catch (err: any) {
        console.error('Error fetching policies:', err)
        setError(err.message || 'Failed to load policies')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeCategory, statusFilter, sortBy])

  // Build set of signed policy IDs
  const signedPolicyIds = useMemo(() => {
    return new Set(acknowledgements.map(a => a.policy_id))
  }, [acknowledgements])

  // Add status to each policy
  const policiesWithStatus: PolicyWithStatus[] = useMemo(() => {
    return policies.map(p => {
      const isSigned = signedPolicyIds.has(p.id)
      const status: 'signed' | 'pending' | 'overdue' = isSigned
        ? 'signed'
        : isOverdue(p.last_updated)
          ? 'overdue'
          : 'pending'
      return { ...p, status }
    })
  }, [policies, signedPolicyIds])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: policies.length }
    POLICY_CATEGORIES.forEach(cat => {
      counts[cat] = policies.filter(p => p.category === cat).length
    })
    return counts
  }, [policies])

  const filteredPolicies = useMemo(() => {
    let result = [...policiesWithStatus]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }

    // Category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory)
    }

    // Status
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'due_date': {
          const aPrio = a.status === 'overdue' ? 0 : a.status === 'pending' ? 1 : 2
          const bPrio = b.status === 'overdue' ? 0 : b.status === 'pending' ? 1 : 2
          if (aPrio !== bPrio) return aPrio - bPrio
          return new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
        }
        case 'updated':
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'category':
          return a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return result
  }, [policiesWithStatus, search, activeCategory, statusFilter, sortBy])

  const totalPages = Math.ceil(filteredPolicies.length / PAGE_SIZE)
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Signed', value: 'signed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Overdue', value: 'overdue' },
  ]

  const sortOptions = [
    { label: 'Due Date', value: 'due_date' },
    { label: 'Recently Updated', value: 'updated' },
    { label: 'A-Z', value: 'title' },
    { label: 'Category', value: 'category' },
  ]

  const clearAllFilters = () => {
    setSearch('')
    setActiveCategory('All')
    setStatusFilter('all')
    setSortBy('due_date')
  }

  const hasActiveFilters = search || activeCategory !== 'All' || statusFilter !== 'all'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="font-body text-sm text-neutral-500">Loading policies...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={40} className="text-error-500 mb-4" />
        <p className="font-body text-base text-neutral-700 font-medium">Failed to load policies</p>
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
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div
        className={[
          'bg-neutral-50 rounded-xl p-5 transition-all duration-300 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
        ].join(' ')}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <SearchInput value={search} onChange={setSearch} />
          <div className="flex gap-2 shrink-0">
            <Dropdown
              label=""
              value={statusOptions.find(o => o.value === statusFilter)?.label ?? 'All Statuses'}
              options={statusOptions}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
            <Dropdown
              label="Sort"
              value={sortOptions.find(o => o.value === sortBy)?.label ?? 'Due Date'}
              options={sortOptions}
              onChange={(v) => setSortBy(v as SortOption)}
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat, i) => {
          const isActive = activeCategory === cat
          const count = categoryCounts[cat] ?? 0
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'flex items-center gap-2 h-9 px-4 rounded-full font-body text-sm whitespace-nowrap',
                'transition-all duration-150 shrink-0',
                isActive
                  ? 'bg-accent-50 text-accent-600 border border-accent-200 font-medium'
                  : 'bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200',
              ].join(' ')}
              style={{
                animationDelay: `${i * 30}ms`,
              }}
            >
              {cat}
              <span className={[
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-medium',
                isActive ? 'bg-accent-200 text-accent-700' : 'bg-neutral-200 text-neutral-500',
              ].join(' ')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Results info + clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-neutral-500">
            {filteredPolicies.length} result{filteredPolicies.length !== 1 ? 's' : ''} found
          </p>
          <button
            onClick={clearAllFilters}
            className="font-body text-sm text-accent-600 hover:underline flex items-center gap-1"
          >
            <X size={14} />
            Clear all filters
          </button>
        </div>
      )}

      {/* Policy List */}
      {filteredPolicies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <img
            src="/empty-state-policies.svg"
            alt="No policies found"
            className="w-40 h-40 mb-4"
          />
          <p className="font-body text-base font-medium text-neutral-600">
            No policies found
          </p>
          <p className="font-body text-sm text-neutral-400 mt-1">
            Try adjusting your search or filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 font-body text-sm text-accent-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* List View */}
          <div className="flex flex-col gap-3">
            {paginatedPolicies.map((policy, i) => (
              <div
                key={policy.id}
                className={[
                  'transition-all duration-300 ease-out',
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                ].join(' ')}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <PolicyRowCard policy={policy} status={policy.status} />
              </div>
            ))}
          </div>

          {/* Card Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {paginatedPolicies.map((policy, i) => (
              <div
                key={`grid-${policy.id}`}
                className={[
                  'transition-all duration-300 ease-out',
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                ].join(' ')}
                style={{ transitionDelay: `${i * 40 + 100}ms` }}
              >
                <PolicyCard
                  policy={policyToCardPolicy(policy)}
                  status={policy.status}
                />
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
