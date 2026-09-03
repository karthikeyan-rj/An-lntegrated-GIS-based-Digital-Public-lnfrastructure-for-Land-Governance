import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import Parcel from '../models/Parcel.js'
import { Application, Notification } from '../models/LandModels.js'
import { DEMO_PARCELS } from '../data/demo/parcels.js'
import mongoose from 'mongoose'

const router = Router()
const dbReady = () => mongoose.connection.readyState === 1

const demoIdByUlpin = Object.fromEntries(DEMO_PARCELS.map((p) => [p.ulpin, p.id]))

// GET /api/me — current user profile (public-safe view of own account)
router.get('/me', protect, (req, res) => {
  const u = req.user
  res.json({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    isDemo: !!u.isDemo,
  })
})

// GET /api/me/properties — parcels owned by the current citizen
router.get('/me/properties', protect, async (req, res) => {
  try {
    const owned = []
    if (dbReady()) {
      const found = await Parcel.find({ ownerUserId: req.user._id }).lean()
      for (const p of found) {
        owned.push({
          id: demoIdByUlpin[p.ulpin] || p._id.toString(),
          ulpin: p.ulpin,
          surveyNumber: p.surveyNumber,
          village: p.village,
          taluk: p.taluk,
          district: p.district,
          state: p.state,
          landUse: p.landUse,
          zoning: p.zoning,
          area: p.area,
          areaUnit: p.areaUnit,
          ownershipStatus: p.ownershipStatus,
          propertyTaxStatus: p.propertyTaxStatus,
          coordinates: p.coordinates,
        })
      }
    }
    res.json({ count: owned.length, properties: owned })
  } catch (e) {
    console.error('GET /api/me/properties error:', e.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/me/applications — applications submitted by the current citizen
router.get('/me/applications', protect, async (req, res) => {
  try {
    let apps = []
    if (dbReady()) {
      apps = await Application.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
    }
    res.json({ count: apps.length, applications: apps })
  } catch (e) {
    console.error('GET /api/me/applications error:', e.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/me/notifications — notifications for the current user
router.get('/me/notifications', protect, async (req, res) => {
  try {
    let notifs = []
    if (dbReady()) {
      notifs = await Notification.find({ $or: [{ user: req.user._id }, { userId: String(req.user._id) }] })
        .sort({ createdAt: -1 })
        .lean()
    }
    res.json({ count: notifs.length, notifications: notifs })
  } catch (e) {
    console.error('GET /api/me/notifications error:', e.message)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
