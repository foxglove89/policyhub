import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useAuthGuard() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [user, isLoading, navigate, location])

  return { isLoading, isAuthenticated: !!user }
}

export function useAdminGuard() {
  const { user, isAdmin, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }

    if (!isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, isAdmin, isLoading, navigate, location])

  return { isLoading, isAuthenticated: !!user, isAdmin }
}
