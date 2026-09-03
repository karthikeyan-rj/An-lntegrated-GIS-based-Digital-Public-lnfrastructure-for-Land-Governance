import mongoose from 'mongoose'
import Parcel from '../models/Parcel.js'
import { recordAudit } from '../services/auditService.js'
import demoParcelGeoJSON from '../data/demoParcels.js'

const dbReady = () => mongoose.connection.readyState === 1

/** Build a GeoJSON feature from a DB parcel. */
function parcelToFeature(p) {
  return {
    type: 'Feature',
    id: p.id || p._id.toString(),
    properties: {
      id: p.id || p._id.toString(),
      ulpin: p.ulpin,
      surveyNumber: p.surveyNumber,
      landUse: p.landUse,
      zoning: p.zoning,
      area: p.area,
      areaUnit: p.areaUnit,
      ownershipStatus: p.ownershipStatus,
      encumbranceStatus: p.encumbranceStatus,
      disputeStatus: p.disputeStatus,
      buildingPermission: p.buildingPermission,
      propertyTaxStatus: p.propertyTaxStatus,
      pattaNumber: p.pattaNumber,
      village: p.village,
      taluk: p.taluk,
      district: p.district,
      state: p.state,
      ownerName: p.ownerName,
      isDemo: !!p.isDemo,
    },
    geometry: p.geometry,
  }
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
          query.$or = [{ ulpin: rx }, { surveyNumber: rx }, { village: rx }, { taluk: rx }, { district: rx }, { ownerName: rx }]
        }
        dbParcels = await Parcel.find(query).lean()
      } catch (_e) {
        dbParcels = []
      }
    }

    if (dbParcels && dbParcels.length > 0) {
      return res.json({ type: 'FeatureCollection', features: dbParcels.map(parcelToFeature) })
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
    return res.json({ type: 'FeatureCollection', features })
  } catch (error) {
    console.error('GET /api/parcels error:', error.message)
    return res.json(demoParcelGeoJSON)
  }
}

async function resolveParcel(id) {
  let parcel = null
  if (dbReady()) {
    try {
      parcel = await Parcel.findOne({ $or: [{ ulpin: id }, { _id: id }] }).lean()
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
    area: props.area,
    areaUnit: 'acres',
    ownershipStatus: props.ownershipStatus,
    village: props.village || 'Demo Village',
    taluk: props.taluk || '-',
    district: props.district || 'Demo District',
    state: props.state || 'Demo State',
    geometry: feature.geometry,
    isDemo: true,
  }
}

// GET /api/parcels/:id — parcel + governance
export async function getParcel(req, res) {
  const { id } = req.params
  try {
    const parcel = await resolveParcel(id)
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' })
    const governance = governanceFallback(parcel.ulpin)

    if (req.user) {
      await recordAudit({ user: req.user, action: 'parcel.read', resource: 'parcel', resourceId: parcel.ulpin, result: 'success', ip: req.ip, metadata: { id } })
    }

    res.json({ parcel, governance })
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

export const parcelController = { listParcels, getParcel, getParcelGovernance, getLayers }
export default parcelController
