import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ROLES, isOfficer, isAdmin, canAccessDept } from '../config/roles.js'

/**
 * Protect routes: require a valid JWT from a real MongoDB user.
 * Fails 401 (and never falls back to demo/dummy users) if the token is invalid.
 */
export async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'Not authorized — user no longer exists' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — invalid or expired token' })
  }
}

/** Restrict a route to one or more roles. Must run after `protect`. */
export function authorize(...roles) {
  // Accept either authorize('a','b') or authorize(['a','b']) (call sites pass an array).
  const allowed = roles.flat()
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' is not permitted` })
    }
    next()
  }
}

/**
 * Restrict a route to officers of a specific department (or administrators).
 * Must run after `protect`. Uses the canonical department codes from
 * backend/src/config/roles.js (REVENUE/REGISTRATION/PLANNING/TAX).
 */
export function authorizeDepartment(department) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (canAccessDept(req.user, department)) return next()
    return res.status(403).json({ message: `Access denied — not authorized for ${department} department` })
  }
}

/**
 * Restrict a route to the owner of a resource (or administrators/officers).
 *
 * Loads the resource by the route param, then checks that either:
 *   - the requester is the resource owner, OR
 *   - the requester is an administrator (system-wide access), OR
 *   - the requester is a governing officer (role-based access).
 *
 * Guards against IDOR: a citizen may only read/write their own resources.
 *
 * @param {Function} resolver async (idParam) => resource object (lean ok)
 * @param {String} ownerField field on the resource holding the owner ObjectId
 */
export function authorizeResourceOwnership(resolver, ownerField = 'ownerUserId') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    const id = req.params.id
    let resource
    try {
      resource = await resolver(id)
    } catch (e) {
      return res.status(500).json({ message: 'Server error resolving resource' })
    }
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    const ownerId = resource[ownerField]
    const isOwner = ownerId && String(ownerId) === String(req.user._id)
    if (isAdmin(req.user.role) || isOfficer(req.user.role) || isOwner) {
      req.resource = resource
      return next()
    }
    return res.status(403).json({ message: 'Access denied — you do not own this resource' })
  }
}
