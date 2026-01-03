import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export interface UserPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  isAdmin: boolean
}

export interface SystemRole {
  id: string
  name: string
  slug: string
  description: string | null
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  is_admin: boolean
}

export interface SystemUser {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  role_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  role?: SystemRole
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  allowedInboxIds: string[]
  // New: User permissions
  systemUser: SystemUser | null
  permissions: UserPermissions
  role: SystemRole | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock function to simulate getting inbox permissions
// In production, this would be an API call to your backend
function getMockInboxPermissions(): string[] {
  // Simulate that all users have access to all inboxes for now
  // You can replace this with actual logic later
  return ['inbox-1', 'inbox-2', 'inbox-3']
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [allowedInboxIds, setAllowedInboxIds] = useState<string[]>([])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setAllowedInboxIds(getMockInboxPermissions())
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setAllowedInboxIds(getMockInboxPermissions())
      } else {
        setAllowedInboxIds([])
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch system user and permissions
  const { data: systemUserData } = useQuery({
    queryKey: ['current-system-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('system_users')
        .select(`
          *,
          role:system_roles(*)
        `)
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching system user:', error)
        return null
      }

      return data as SystemUser
    },
    enabled: !!user?.id
  })

  const permissions: UserPermissions = {
    canView: systemUserData?.role?.can_view ?? false,
    canCreate: systemUserData?.role?.can_create ?? false,
    canEdit: systemUserData?.role?.can_edit ?? false,
    isAdmin: systemUserData?.role?.is_admin ?? false
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        session, 
        loading, 
        signIn, 
        signOut, 
        allowedInboxIds,
        systemUser: systemUserData ?? null,
        permissions,
        role: systemUserData?.role ?? null
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
