import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  FileText,
  Signature,
  ShieldCheck,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const staffNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Policies', path: '/policies' },
  { icon: Signature, label: 'My Signatures', path: '/signatures' },
]

const adminNavItems = [
  { icon: ShieldCheck, label: 'Admin Dashboard', path: '/admin' },
  { icon: Users, label: 'Manage Staff', path: '/admin/staff' },
  { icon: Settings, label: 'Manage Policies', path: '/admin/policies' },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isAdmin, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activePath = location.pathname

  const navItemClass = (path: string) => {
    const isActive = activePath === path || activePath.startsWith(`${path}/`)
    return [
      'flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-body transition-colors duration-150 cursor-pointer',
      'hover:bg-accent-50 hover:text-accent-600',
      isActive
        ? 'bg-accent-50 text-accent-600 border-l-[3px] border-accent-600'
        : 'text-neutral-600 border-l-[3px] border-transparent',
    ].join(' ')
  }

  const userInitials = profile ? getInitials(profile.name) : '??'
  const userName = profile?.name ?? 'Guest'
  const userRole = profile?.role ?? 'staff'

  const sidebarContent = useMemo(() => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-2.5">
          <img src="/foxglove-icon.svg" alt="Foxglove" className="w-8 h-8" />
          <div>
            <div className="font-display text-xl font-bold text-accent-600 leading-tight">
              Foxglove<span className="text-accent-400">.</span>
            </div>
            <div className="text-[11px] font-body text-neutral-400 tracking-wide">
              Policy Hub
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {staffNavItems.map((item) => (
            <button
              key={item.path}
              className={navItemClass(item.path)}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <item.icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6">
            <div className="px-3 mb-2">
              <span className="text-[11px] font-body font-medium text-neutral-400 uppercase tracking-[0.08em]">
                Administration
              </span>
            </div>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => (
                <button
                  key={item.path}
                  className={navItemClass(item.path)}
                  onClick={() => {
                    navigate(item.path)
                    setMobileOpen(false)
                  }}
                >
                  <item.icon size={20} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold font-display text-accent-700">
              {userInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium font-body text-neutral-700 truncate">
              {userName}
            </div>
            <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize bg-accent-50 text-accent-600 border border-accent-200">
              {userRole}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-body text-neutral-500 rounded-lg hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  ), [activePath, isAdmin, userName, userRole, userInitials, navigate, signOut])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[260px] bg-neutral-50 border-r border-neutral-200 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-neutral-600" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-neutral-900/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={[
          'lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-neutral-50 border-r border-neutral-200 z-50 transition-transform duration-250 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X size={18} className="text-neutral-500" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
