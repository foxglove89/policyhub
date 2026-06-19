import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Staff } from '@/types'

// Mock mode: enabled when Supabase is not configured (demo/preview)
const isMockMode = !import.meta.env.VITE_SUPABASE_URL

interface MockUser {
  id: string
  email: string
}

interface AuthContextType {
  user: MockUser | null
  profile: Staff | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_ADMIN: Staff = {
  id: 'mock-admin-1',
  name: 'Uzair Saeed',
  email: 'uzair.s@foxglove.care',
  role: 'admin',
  department: 'GRC',
  active: true,
  joined_date: '2023-01-15',
  created_at: '2023-01-15T10:00:00Z',
}

const MOCK_USER_OBJ: MockUser = {
  id: 'mock-admin-1',
  email: 'uzair.s@foxglove.care',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [profile, setProfile] = useState<Staff | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    if (isMockMode) {
      setProfile(MOCK_ADMIN)
      setIsAdmin(true)
      return
    }
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    if (data) {
      setProfile(data as Staff)
      setIsAdmin(data.role === 'admin')
    }
  }, [])

  useEffect(() => {
    if (isMockMode) {
      // In mock mode, auto-login as admin after a brief delay
      const timer = setTimeout(() => {
        setUser(MOCK_USER_OBJ)
        setProfile(MOCK_ADMIN)
        setIsAdmin(true)
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as MockUser)
        fetchProfile(session.user.id)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user as MockUser)
          fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setIsAdmin(false)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, _password: string) => {
    if (isMockMode) {
      setUser(MOCK_USER_OBJ)
      setProfile(MOCK_ADMIN)
      setIsAdmin(true)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: _password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    if (!isMockMode) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
