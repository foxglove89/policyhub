import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { Spinner } from '@/components/ui/spinner'

export default function Layout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  const location = useLocation()

  // Only guard authenticated routes
  const isLoginPage = location.pathname === '/login'

  // Use auth guard for non-login pages
  if (!isLoginPage) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
        <Spinner size="lg" className="text-accent-500" />
      </div>
    )
  }

  return <>{children}</>
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { isLoading: guardLoading } = useAuthGuard()
  const { user } = useAuth()

  if (guardLoading || !user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
        <Spinner size="lg" className="text-accent-500" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]">
      <Sidebar />
      <TopBar />
      {/* Desktop: offset for sidebar + topbar */}
      <main className="lg:ml-[260px] lg:mt-16 lg:p-8 xl:p-10 min-h-[100dvh]">
        {/* Mobile: no offset, full width */}
        <div className="lg:hidden pt-20 px-4 pb-8">
          {children}
        </div>
        {/* Desktop content */}
        <div className="hidden lg:block">
          {children}
        </div>
      </main>
    </div>
  )
}
