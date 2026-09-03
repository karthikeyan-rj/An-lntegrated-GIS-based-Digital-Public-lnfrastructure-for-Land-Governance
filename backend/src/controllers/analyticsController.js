import mongoose from 'mongoose'
import {
  Application, Dispute, LandRecord, Registration, Encumbrance,
} from '../models/LandModels.js'
import Parcel from '../models/Parcel.js'
import { isOfficer, isAdmin } from '../config/roles.js'

const dbReady = () => mongoose.connection && mongoose.connection.readyState === 1

const ROLE_TO_APP_DEPT = {
  revenue_officer: 'Revenue',
  registration_officer: 'Registration',
  planning_officer: 'Planning',
  tax_officer: 'Tax',
}

/**
 * GET /api/analytics/dashboard — Command Center KPIs + recent activity.
 * Role-aware: citizens see only their own parcels/applications, officers see
 * department-scoped data, and the admin sees system-wide totals. Falls back to
 * demo-safe numbers when the DB is unavailable so the dashboard still renders.
 */
export async function dashboard(req, res) {
  try {
    let data = null
    let isDemo = false

    const role = req.user && req.user.role
    const isCitizen = role === 'citizen'
    const isOfficerRole = isOfficer(role)
    const isAdminRole = isAdmin(role)

    if (dbReady()) {
      try {
        // Restrict parcel + application counts by ownership / department scope.
        const parcelFilter = isCitizen ? { ownerUserId: req.user._id } : {}
        const appFilter = {}
        if (isCitizen) appFilter.user = req.user._id
        else if (isOfficerRole && !isAdminRole) appFilter.department = ROLE_TO_APP_DEPT[role]

        const [totalParcels, digitizedParcels, verifiedOwnership, activeApplications, pendingMutations, activeDisputes, pendingApprovals] = await Promise.all([
          Parcel.countDocuments(parcelFilter).catch(() => 0),
          Parcel.countDocuments({ ...parcelFilter, verificationStatus: 'digitally_verified' }).catch(() => 0),
          Parcel.countDocuments({ ...parcelFilter, ownershipStatus: 'verified' }).catch(() => 0),
          Application.countDocuments({ ...appFilter, status: { $nin: ['APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT'] } }).catch(() => 0),
          isCitizen ? 0 : LandRecord.countDocuments({ verificationStatus: 'pending_verification' }).catch(() => 0),
          isCitizen ? 0 : Dispute.countDocuments({ status: 'active' }).catch(() => 0),
          Application.countDocuments({ ...appFilter, status: { $in: ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION'] } }).catch(() => 0),
        ])
        data = {
          totalParcels, digitizedParcels, verifiedOwnership, activeApplications, pendingMutations, activeDisputes, pendingApprovals,
          recentApplications: await Application.find(appFilter).sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
          recentTransactions: isCitizen ? [] : await Registration.find().sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
          scope: isCitizen ? 'own' : isOfficerRole && !isAdminRole ? 'department' : 'all',
        }
      } catch (_e) {
        data = null
      }
    }

    if (!data) {
      isDemo = true
      const scope = isCitizen ? 'own' : (isOfficerRole && !isAdminRole) ? 'department' : 'all'
      data = {
        totalParcels: isCitizen ? 0 : 1280,
        digitizedParcels: isCitizen ? 0 : 1256,
        verifiedOwnership: isCitizen ? 0 : 1180,
        activeApplications: 0,
        pendingMutations: isCitizen ? 0 : 12,
        activeDisputes: isCitizen ? 0 : 7,
        pendingApprovals: 0,
        recentApplications: [],
        recentTransactions: [],
        scope,
      }
    }

    res.json({ ...data, isDemo })
  } catch (error) {
    console.error('dashboard analytics error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/analytics/parcels-by-landuse
export async function parcelsByLandUse(_req, res) {
  try {
    let result = []
    if (dbReady()) {
      try {
        result = await Parcel.aggregate([{ $group: { _id: '$landUse', value: { $sum: 1 } } }]).catch(() => [])
      } catch (_e) { result = [] }
    }
    if (!result.length) {
      result = [
        { _id: 'residential', value: 620 },
        { _id: 'commercial', value: 180 },
        { _id: 'agricultural', value: 320 },
        { _id: 'industrial', value: 90 },
        { _id: 'institutional', value: 40 },
        { _id: 'forest', value: 30 },
      ]
    }
    res.json({ data: result.map((r) => ({ name: r._id, value: r.value })) })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const analyticsController = { dashboard, parcelsByLandUse }
export default analyticsController
