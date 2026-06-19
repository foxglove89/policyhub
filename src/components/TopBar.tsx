import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, HelpCircle } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/policies': 'Policies',
  '/policies/': 'Policy Detail',
  '/signatures': 'My Signatures',
  '/admin': 'Admin Dashboard',
  '/admin/staff': 'Manage Staff',
  '/admin/policies': 'Manage Policies',
  '/admin/reports': 'Compliance Reports',
}

function getPageTitle(path: string): string {
  if (routeTitles[path]) return routeTitles[path]
  if (path.startsWith('/policies/')) return 'Policy Detail'
  for (const [route, title] of Object.entries(routeTitles)) {
    if (path.startsWith(route) && route !== '/') return title
  }
  return 'Dashboard'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function TopBar() {
  const location = useLocation()
  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname])
  const today = useMemo(() => formatDate(), [])

  return (
    <header className="hidden lg:flex fixed top-0 right-0 left-[260px] h-16 bg-white border-b border-neutral-200 z-30 items-center justify-between px-8"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Left: Page title */}
      <div>
        <h1 className="font-display text-[22px] font-semibold text-neutral-800 leading-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Date + icons */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-[13px] text-neutral-400">
          {today}
        </span>
        <button className="relative w-10 h-10 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Notifications">
          <Bell size={20} className="text-neutral-500" strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full animate-pulse" />
        </button>
        <button className="w-10 h-10 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Help">
          <HelpCircle size={20} className="text-neutral-400" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
