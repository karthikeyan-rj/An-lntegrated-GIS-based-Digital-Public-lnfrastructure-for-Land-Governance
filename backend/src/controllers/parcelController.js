import mongoose from 'mongoose'
import Parcel from '../models/Parcel.js'
import { recordAudit } from '../services/auditService.js'
import { isOfficer, isAdmin } from '../config/roles.js'
import demoParcelGeoJSON from '../data/demoParcels.js'
import { DEMO_PARCELS } from '../data/demo/parcels.js'

const dbReady = () => mongoose.connection.readyState === 1

/** Map ulpin → canonical demo id (p1..p10) so the map links to the right profile. */
const demoIdByUlpin = Object.fromEntries(DEMO_PARCELS.map((p) => [p.ulpin, p.id]))

/**
 * Always-public parcel fields. Never includes owner identifiers so the public
 * map/search never leaks ownership details to citizens or anonymous visitors.
 */
const PUBLIC_FIELDS = [
  'ulpin', 'surveyNumber', 'landUse', 'zoning', 'area', 'areaUnit',
  'ownershipStatus', 'encumbranceStatus', 'disputeStatus', 'buildingPermission',
  'propertyTaxStatus', 'pattaNumber', 'village', 'taluk', 'district', 'state',
  'verificationStatus', 'restrictions', 'utilities', 'isDemo',
]

/**
 * True when the requesting user may see private ownership fields
 * (ownerName / ownerFatherName). Only officers and admins may.
 */
function maySeeOwner(req) {
  return !!req.user && (isOfficer(req.user.role) || isAdmin(req.user.role))
}

/** Build a GeoJSON feature from a DB parcel, scoped by the requester. */
function parcelToFeature(p, req) {
  const id = demoIdByUlpin[p.ulpin] || p.id || p._id.toString()
  const props = {
    id,
    ulpin: p.ulpin,
  }
  for (const f of PUBLIC_FIELDS) {
    if (f === 'ulpin') continue
    props[f] = p[f]
  }
  if (maySeeOwner(req)) {
    props.ownerName = p.ownerName
    props.ownerFatherName = p.ownerFatherName || ''
  }
  return { type: 'Feature', id, properties: props, geometry: p.geometry }
}

function governanceFallback(ulpin) {
  return {
    ownership: { ownerName: 'Demo Owner', ownershipType: 'self', verificationStatus: 'digitally_verified' },
    registration: { status: 'registered', count: 1 },
    encumbrance: { status: 'clear', mortgageBank: null, mortgageAmount: null },
    landUse: { permittedUses: ['residential'], restrictions: [] },
    buildingPermission: { status: 'approved' },
    propertyTax: { status: 'paid', annualTax: 0, outstanding: 0 },
    utilities: { electricity: true, water: true, sewerage: true, gas: false, telecom: true },
    disputes: { status: 'none', cases: [] },
    isDemo: true,
  }
}

// GET /api/parcels — GeoJSON FeatureCollection with optional ?search=
export async function listParcels(req, res) {
  try {
    const { search } = req.query
    let dbParcels = []
    if (dbReady()) {
      try {
        const query = {}
        if (search) {
          const rx = new RegExp(search, 'i')
          query.$or = [{ ulpin: rx }, { surveyNumber: rx }, { village: rx }, { taluk: rx }, { district: rx }]
        }
        dbParcels = await Parcel.find(query).lean()
      } catch (_e) {
        dbParcels = []
      }
    }

    if (dbParcels && dbParcels.length > 0) {
      return res.json({ type: 'FeatureCollection', features: dbParcels.map((p) => parcelToFeature(p, req)) })
    }

    // Demo fallback layer (applies search to demo features too).
    let features = demoParcelGeoJSON.features
    if (search) {
      const rx = new RegExp(search, 'i')
      features = features.filter((f) => {
        const p = f.properties || {}
        return [p.ulpin, p.surveyNumber, p.village, p.district, p.state].some((v) => v && rx.test(String(v)))
      })
    }
    const scoped = features.map((f) => {
      const props = { ...f.properties }
      if (!maySeeOwner(req)) {
        delete props.ownerName
        delete props.ownerFatherName
      }
      return { ...f, properties: props }
    })
    return res.json({ type: 'FeatureCollection', features: scoped })
  } catch (error) {
    console.error('GET /api/parcels error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/parcels/search?q= — public parcel search returning only public fields.
export async function searchParcels(req, res) {
  const { q } = req.query
  if (!q) return res.status(400).json({ message: 'Query param q is required' })
  const rx = new RegExp(q, 'i')
  let results = []
  if (dbReady()) {
    try {
      const found = await Parcel.find({
        $or: [{ ulpin: rx }, { surveyNumber: rx }, { village: rx }, { taluk: rx }, { district: rx }, { state: rx }],
      })
        .select(PUBLIC_FIELDS.join(' '))
        .lean()
      results = found.map((p) => {
        const { _id, geometry, __v, ...publicProps } = p
        publicProps.id = demoIdByUlpin[p.ulpin] || p.id || _id.toString()
        return publicProps
      })
    } catch (_e) {
      results = []
    }
  }
  if (!results.length) {
    results = demoParcelGeoJSON.features
      .map((f) => f.properties)
      .filter((p) => [p.ulpin, p.surveyNumber, p.village, p.district, p.state].some((v) => v && rx.test(String(v))))
      .map((p) => {
        const { ownerName, ownerFatherName, ...publicProps } = p
        return publicProps
      })
  }
  return res.json({ results })
}

async function resolveParcel(id) {
  let parcel = null
  if (dbReady()) {
    try {
      // Only add the _id clause when id can legally be an ObjectId; otherwise a
      // CastError would abort the whole $or query and drop us to the demo layer.
      const or = [{ ulpin: id }]
      if (mongoose.isValidObjectId(id)) or.push({ _id: id })
      parcel = await Parcel.findOne({ $or: or }).lean()
    } catch (_e) {
      parcel = null
    }
  }
  if (parcel) return parcel
  const feature = demoParcelGeoJSON.features.find((f) => f.properties.id === id || f.properties.ulpin === id)
  if (!feature) return null
  const props = feature.properties
  return {
    id: props.id,
    ulpin: props.ulpin,
    surveyNumber: props.surveyNumber,
    landUse: props.landUse,
    zoning: props.zoning,
    area: props.area,
    areaUnit: props.areaUnit,
    ownershipStatus: props.ownershipStatus,
    ownerName: props.ownerName,
    ownerUserId: props.ownerUserId || null,
    village: props.village || 'Demo Village',
    taluk: props.taluk || '-',
    district: props.district || 'Demo District',
    state: props.state || 'Demo State',
    buildingPermission: props.buildingPermission,
    propertyTaxStatus: props.propertyTaxStatus,
    disputeStatus: props.disputeStatus,
    restrictions: props.restrictions || [],
    utilities: props.utilities || {},
    geometry: feature.geometry,
    isDemo: true,
  }
}

/**
 * Does the requester have read access to the FULL private parcel record?
 * Officers and admins always do; a citizen only for parcels they own.
 */
function canViewFullParcel(parcel, req) {
  if (!req.user) return false
  if (isOfficer(req.user.role) || isAdmin(req.user.role)) return true
  if (parcel.ownerUserId) return String(parcel.ownerUserId) === String(req.user._id)
  return false
}

/** Strip private ownership fields from a parcel for non-owners. */
function publicView(parcel, req) {
  const out = { ...parcel }
  for (const f of ['ownerName', 'ownerFatherName', 'ownerUserId', 'pattaNumber']) delete out[f]
  out.restricted = true
  out.restrictedReason = 'You do not own this property and lack officer access to its ownership record'
  out.canViewOwnership = false
  if (req.user) out.canViewOwnership = canViewFullParcel(parcel, req)
  return out
}

// GET /api/parcels/:id — parcel + governance (role/ownership scoped)
export async function getParcel(req, res) {
  const { id } = req.params
  try {
    const parcel = await resolveParcel(id)
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' })
    const full = canViewFullParcel(parcel, req)
    const view = full ? parcel : publicView(parcel, req)
    const governance = governanceFallback(parcel.ulpin)

    if (req.user) {
      await recordAudit({ user: req.user, action: 'parcel.read', resource: 'parcel', resourceId: parcel.ulpin, result: 'success', ip: req.ip, metadata: { id, full: full ? 'full' : 'public' } })
    }

    res.json({ parcel: view, governance, canViewFullRecord: full })
  } catch (error) {
    console.error('GET /api/parcels/:id error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/parcels/:id/governance
export async function getParcelGovernance(req, res) {
  const { id } = req.params
  try {
    const parcel = await resolveParcel(id)
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' })
    res.json({ ulpin: parcel.ulpin, ...governanceFallback(parcel.ulpin) })
  } catch (error) {
    console.error('governance error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/layers
export function getLayers(_req, res) {
  res.json({
    baseLayers: [
      { id: 'osm', label: 'OpenStreetMap', source: 'OpenStreetMap contributors' },
      { id: 'satellite', label: 'Satellite / Imagery', source: 'Esri World Imagery' },
    ],
    governance: [
      { id: 'parcelBounds', label: 'Parcel Boundaries', demo: true },
      { id: 'landUse', label: 'Land Use' },
      { id: 'zoning', label: 'Zoning' },
      { id: 'buildingPermissions', label: 'Building Permissions' },
      { id: 'restrictions', label: 'Restrictions & Environmental Zones' },
      { id: 'disputes', label: 'Disputes' },
    ],
    infrastructure: [
      { id: 'roads', label: 'Roads' },
      { id: 'utilities', label: 'Utilities' },
      { id: 'publicInfrastructure', label: 'Public Infrastructure' },
    ],
  })
}

export const parcelController = { listParcels, searchParcels, getParcel, getParcelGovernance, getLayers }
export default parcelController
