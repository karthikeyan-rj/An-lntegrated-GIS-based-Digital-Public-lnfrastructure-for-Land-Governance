import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USERS: Record<UserRole, User> = {
  citizen: { id: 'u4', name: 'Ramanathan K', email: 'ramanathan@email.com', role: 'citizen', department: 'Citizen Portal' },
  revenue_officer: { id: 'u1', name: 'Suresh B', email: 'suresh.b@revenue.gov.in', role: 'revenue_officer', department: 'Revenue Department' },
  registration_officer: { id: 'u7', name: 'Priya N', email: 'priya.n@registration.gov.in', role: 'registration_officer', department: 'Registration Department' },
  planning_officer: { id: 'u3', name: 'Rajesh M', email: 'rajesh.m@planning.gov.in', role: 'planning_officer', department: 'Town Planning Department' },
  tax_officer: { id: 'u8', name: 'Arun V', email: 'arun.v@tax.gov.in', role: 'tax_officer', department: 'Property Tax Department' },
  administrator: { id: 'admin1', name: 'System Admin', email: 'admin@landstack.gov.in', role: 'administrator', department: 'Platform Administration' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role])
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
