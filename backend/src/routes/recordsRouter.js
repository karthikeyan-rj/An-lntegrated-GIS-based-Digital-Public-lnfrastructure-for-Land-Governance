import { Router } from 'express'
import { recordsResource } from '../controllers/recordsController.js'
import { protect, authorizeDepartment } from '../middleware/auth.js'
import { DEPARTMENTS, isOfficer, isAdmin } from '../config/roles.js'
import Parcel from '../models/Parcel.js'

/**
 * Maps each governance module to its owning department.
 * Officers may access only their department's modules; the Platform Admin
 * may access all. Citizens access only modules scoped to ULPINs they own.
 */
const RESOURCE_DEPT = {
  'land-records': DEPARTMENTS.REVENUE,
  registrations: DEPARTMENTS.REGISTRATION,
  encumbrances: DEPARTMENTS.REGISTRATION,
  'building-permissions': DEPARTMENTS.PLANNING,
  'land-use': DEPARTMENTS.PLANNING,
  'property-tax': DEPARTMENTS.TAX,
  utilities: DEPARTMENTS.TAX,
  restrictions: DEPARTMENTS.PLANNING,
  disputes: DEPARTMENTS.REVENUE,
}

/**
 * One route file per governance module, sharing the resource handler factory.
 * Each module exposes:
 *   GET  /api/<module>          → list (with demo fallback)
 *   GET  /api/<module>/:ulpin   → single record by ULPIN
 *
 * Access is department-scoped for officers, admin for the Platform Admin,
 * and ownership-scoped (own ULPINs) for citizens.
 */
export function makeRecordsRouter(resource, singular) {
  const router = Router()
  const h = recordsResource(resource, singular)
  const dept = RESOURCE_DEPT[resource]

  // Ownership scoping for citizens: restrict records to ULPINs the citizen owns.
  async function scopeCitizen(req, res, next) {
    try {
      const owned = await Parcel.find({ ownerUserId: req.user._id }).select('ulpin').lean()
      const ownedUlpins = new Set(owned.map((p) => p.ulpin))
      req.scopedUlpins = ownedUlpins
      next()
    } catch (e) {
      req.scopedUlpins = new Set()
      next()
    }
  }

  router.use(protect, (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (isAdmin(req.user.role)) return next()
    if (isOfficer(req.user.role)) {
      return authorizeDepartment(dept)(req, res, next)
    }
    // Citizen — scope to owned ULPINs below.
    return scopeCitizen(req, res, next)
  })

  router.get('/', (req, res, next) => {
    // Citizens get a scoped list; the controller honours req.scopedUlpins.
    if (req.scopedUlpins) req.query.__scoped_ulpins = Array.from(req.scopedUlpins)
    next()
  }, h.list)

  router.get('/:ulpin', (req, res, next) => {
    // Citizenship check on single-record access after the record is resolved.
    next()
  }, h.getByUlpin)

  return router
}

export default makeRecordsRouter
