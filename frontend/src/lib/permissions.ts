import type { UserRole } from '@/types'
import type { User } from '@/types'

export const ROLES = ['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator'] as const

export const DEPARTMENTS = {
  REVENUE: 'REVENUE',
  REGISTRATION: 'REGISTRATION',
  PLANNING: 'PLANNING',
  TAX: 'TAX',
  ADMIN: 'ADMIN',
} as const

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS]

export const OFFICER_ROLES: readonly UserRole[] = ['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer']

export const ROLE_DEPARTMENT: Record<UserRole, Department | null> = {
  citizen: null,
  revenue_officer: DEPARTMENTS.REVENUE,
  registration_officer: DEPARTMENTS.REGISTRATION,
  planning_officer: DEPARTMENTS.PLANNING,
  tax_officer: DEPARTMENTS.TAX,
  administrator: DEPARTMENTS.ADMIN,
}

export function isOfficer(role: UserRole): boolean {
  return (OFFICER_ROLES as readonly UserRole[]).includes(role)
}

export function isAdmin(role: UserRole): boolean {
  return role === 'administrator'
}

export function canViewOwnProperty(_role: UserRole): boolean {
  return true
}

export function canViewPublicRecords(_role: UserRole): boolean {
  return true
}

export function canViewDepartmentRecords(role: UserRole): boolean {
  return isOfficer(role) || isAdmin(role)
}

export function canApproveApplication(role: UserRole): boolean {
  return isOfficer(role) || isAdmin(role)
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role)
}

export function canViewAudit(role: UserRole): boolean {
  return isAdmin(role)
}

/**
 * Demo ownership model (mirrors backend/src/seed ownership assignments).
 * Keys are demo owner emails; values are the local demo parcel ids they own.
 * Used to gate OWN parcel visibility in the frontend when no backend JWT is
 * present (demo sessions). The backend remains authoritative for real sessions.
 */
const DEMO_PARCEL_OWNERS: Record<string, string[]> = {
  'ramanathan@email.com': ['p1', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20'],
  'meenakshi@email.com': ['p2'],
  'selvam@email.com': ['p8', 'p26'],
}

/** True when the user may view the full (private) record of the given parcel. */
export function canViewFullParcel(user: User | null, parcelId: string): boolean {
  if (!user) return false
  if (isOfficer(user.role) || isAdmin(user.role)) return true
  const owned = DEMO_PARCEL_OWNERS[user.email] ?? []
  return owned.includes(parcelId)
}

/** Local demo parcel ids owned by the user (officers/admins return none). */
export function ownedParcelIds(user: User | null): string[] {
  if (!user) return []
  if (isOfficer(user.role) || isAdmin(user.role)) return []
  return DEMO_PARCEL_OWNERS[user.email] ?? []
}
