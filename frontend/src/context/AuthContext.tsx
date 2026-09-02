import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { api, type AuthUser } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  /** Demo login — instantly logs in as a demo role, no backend required. */
  login: (role: UserRole) => void
  /** Real login against the MongoDB backend. Throws on failure, never demo-falls back. */
  loginReal: (email: string, password: string) => Promise<User>
  /** Real signup/register against the MongoDB backend. */
  register: (payload: { name: string; email: string; password: string; role?: string; department?: string }) => Promise<User>
  logout: () => void
  /** True when the current session uses a real (backend/MongoDB) account. */
  isReal: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'landstack_token'
const USER_KEY = 'landstack_user'

const DEMO_USERS: Record<UserRole, User> = {
  citizen: { id: 'u4', name: 'Ramanathan K', email: 'ramanathan@email.com', role: 'citizen', department: 'Citizen Portal' },
  revenue_officer: { id: 'u1', name: 'Suresh B', email: 'suresh.b@revenue.gov.in', role: 'revenue_officer', department: 'Revenue Department' },
  registration_officer: { id: 'u7', name: 'Priya N', email: 'priya.n@registration.gov.in', role: 'registration_officer', department: 'Registration Department' },
  planning_officer: { id: 'u3', name: 'Rajesh M', email: 'rajesh.m@planning.gov.in', role: 'planning_officer', department: 'Town Planning Department' },
  tax_officer: { id: 'u8', name: 'Arun V', email: 'arun.v@tax.gov.in', role: 'tax_officer', department: 'Property Tax Department' },
  administrator: { id: 'admin1', name: 'System Admin', email: 'admin@landstack.gov.in', role: 'administrator', department: 'Platform Administration' },
}

function toUser(auth: AuthUser, source: 'demo' | 'real'): User {
  const role = isUserRole(auth.role) ? auth.role : 'citizen'
  return {
    id: auth.id,
    name: auth.name,
    email: auth.email,
    role,
    department: auth.department,
    ...(source === 'real' ? { isReal: true as const } : {}),
  }
}

function isUserRole(r: string): r is UserRole {
  return ['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator'].includes(r)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isReal, setIsReal] = useState(false)

  const persistToken = useCallback((token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch { /* ignore */ }
  }, [])

  const login = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role])
    setIsReal(false)
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch { /* ignore */ }
  }, [])

  const loginReal = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    persistToken(res.token)
    const u = toUser(res.user, 'real')
    setUser(u)
    setIsReal(true)
    return u
  }, [persistToken])

  const register = useCallback(async (payload: { name: string; email: string; password: string; role?: string; department?: string }) => {
    const res = await api.register(payload)
    persistToken(res.token)
    const u = toUser(res.user, 'real')
    setUser(u)
    setIsReal(true)
    return u
  }, [persistToken])

  const logout = useCallback(() => {
    setUser(null)
    setIsReal(false)
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginReal, register, logout, isReal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
