import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Staff } from '@/types'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  profile: Staff | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Staff | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfileByEmail = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('active', true)
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        if (session.user.email) fetchProfileByEmail(session.user.email)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' })
          if (session.user.email) fetchProfileByEmail(session.user.email)
        } else {
          setUser(null)
          setProfile(null)
          setIsAdmin(false)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfileByEmail])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
