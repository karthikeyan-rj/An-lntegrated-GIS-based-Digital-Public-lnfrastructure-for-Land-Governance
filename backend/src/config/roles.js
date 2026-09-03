/**
 * CANONICAL role constants for LandStack.
 *
 * Single authoritative source of truth for roles, role → department mapping,
 * and role capability helpers. The same lowercase strings are used everywhere
 * (User model enum, JWT, middleware, controllers, seed, frontend mirror) so
 * there is never a mix of role spellings. See frontend/src/lib/permissions.ts
 * for the mirrored frontend helpers.
 */

export const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  REVENUE_OFFICER: 'revenue_officer',
  REGISTRATION_OFFICER: 'registration_officer',
  PLANNING_OFFICER: 'planning_officer',
  TAX_OFFICER: 'tax_officer',
  ADMINISTRATOR: 'administrator',
})

export const USER_ROLES = Object.freeze([
  ROLES.CITIZEN,
  ROLES.REVENUE_OFFICER,
  ROLES.REGISTRATION_OFFICER,
  ROLES.PLANNING_OFFICER,
  ROLES.TAX_OFFICER,
  ROLES.ADMINISTRATOR,
])

/** Departments (each governing department except ADMIN owns a service area). */
export const DEPARTMENTS = Object.freeze({
  REVENUE: 'REVENUE',
  REGISTRATION: 'REGISTRATION',
  PLANNING: 'PLANNING',
  TAX: 'TAX',
  ADMIN: 'ADMIN',
})

/** Canonical role → department code. Citizens belong to no governance department. */
export const ROLE_DEPARTMENTS = Object.freeze({
  [ROLES.REVENUE_OFFICER]: DEPARTMENTS.REVENUE,
  [ROLES.REGISTRATION_OFFICER]: DEPARTMENTS.REGISTRATION,
  [ROLES.PLANNING_OFFICER]: DEPARTMENTS.PLANNING,
  [ROLES.TAX_OFFICER]: DEPARTMENTS.TAX,
  [ROLES.ADMINISTRATOR]: DEPARTMENTS.ADMIN,
})

/** Officer roles (all governing departments, excludes citizens). */
export const OFFICER_ROLES = Object.freeze([
  ROLES.REVENUE_OFFICER,
  ROLES.REGISTRATION_OFFICER,
  ROLES.PLANNING_OFFICER,
  ROLES.TAX_OFFICER,
])

/** True when the role is a governing officer (department permission applies). */
export function isOfficer(role) {
  return OFFICER_ROLES.includes(role)
}

/** True when the role is the system administrator (full access). */
export function isAdmin(role) {
  return role === ROLES.ADMINISTRATOR
}

/**
 * True when the user may act on the given department.
 * Admins may act on every department; officers only on their own.
 */
export function canAccessDept(user, department) {
  if (!user) return false
  if (isAdmin(user.role)) return true
  return ROLE_DEPARTMENTS[user.role] === department
}

export default {
  ROLES,
  USER_ROLES,
  DEPARTMENTS,
  ROLE_DEPARTMENTS,
  OFFICER_ROLES,
  isOfficer,
  isAdmin,
  canAccessDept,
}
