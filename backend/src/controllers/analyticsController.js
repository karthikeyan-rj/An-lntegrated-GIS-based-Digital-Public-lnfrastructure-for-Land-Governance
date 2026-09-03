import mongoose from 'mongoose'
import {
  Application, Dispute, LandRecord, Registration, Encumbrance,
} from '../models/LandModels.js'
import Parcel from '../models/Parcel.js'

const dbReady = () => mongoose.connection && mongoose.connection.readyState === 1

/**
 * GET /api/analytics/dashboard — Command Center KPIs + recent activity.
 * Falls back to demo-safe numbers when the DB is unavailable so the dashboard
 * still renders, but flags `isDemo`.
 */
export async function dashboard(req, res) {
  try {
    let data = null
    let isDemo = false

    if (dbReady()) {
      try {
        const [totalParcels, digitizedParcels, verifiedOwnership, activeApplications, pendingMutations, activeDisputes, pendingApprovals] = await Promise.all([
          Parcel.countDocuments({}).catch(() => 0),
          Parcel.countDocuments({ verificationStatus: 'digitally_verified' }).catch(() => 0),
          Parcel.countDocuments({ ownershipStatus: 'verified' }).catch(() => 0),
          Application.countDocuments({ status: { $nin: ['APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT'] } }).catch(() => 0),
          LandRecord.countDocuments({ verificationStatus: 'pending_verification' }).catch(() => 0),
          Dispute.countDocuments({ status: 'active' }).catch(() => 0),
          Application.countDocuments({ status: { $in: ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION'] } }).catch(() => 0),
        ])
        data = {
          totalParcels, digitizedParcels, verifiedOwnership, activeApplications, pendingMutations, activeDisputes, pendingApprovals,
          recentApplications: await Application.find().sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
          recentTransactions: await Registration.find().sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
        }
      } catch (_e) {
        data = null
      }
    }

    if (!data) {
      isDemo = true
      data = {
        totalParcels: 1280,
        digitizedParcels: 1256,
        verifiedOwnership: 1180,
        activeApplications: 42,
        pendingMutations: 12,
        activeDisputes: 7,
        pendingApprovals: 18,
        recentApplications: [],
        recentTransactions: [],
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
