import { Router } from 'express'
import mongoose from 'mongoose'
import Parcel from '../models/Parcel.js'
import {
  LandRecord, Registration, Encumbrance, BuildingPermission, LandUse,
  PropertyTax, UtilityInfo, Dispute, Application,
} from '../models/LandModels.js'
import demoParcelGeoJSON from '../data/demoParcels.js'

const router = Router()

// True only when mongoose has an active, connected state.
const dbReady = () => mongoose.connection.readyState === 1

// ---------- helpers ----------

/**
 * Builds a parcel "governance" bundle from demo defaults so the parcel profile
 * has rich, consistent demo data regardless of DB seed state. In production the
 * real department APIs would supply this data — the shape stays the same.
 */
function buildDemoGovernance(ulpin) {
  return {
    ownership: { ownerName: 'Demo Owner', ownershipType: 'self', verificationStatus: 'digitally_verified' },
    registration: { status: 'registered', count: 1 },
    encumbrance: { status: 'clear', mortgageBank: null, mortgageAmount: null },
    landUse: { permittedUses: ['residential'], restrictions: [] },
    buildingPermission: { status: 'approved' },
    propertyTax: { status: 'paid', annualTax: 0, outstanding: 0 },
    utilities: { electricity: true, water: true, sewerage: true, gas: false, telecom: true },
    disputes: { status: 'none', cases: [] },
  }
}

// ---------- routes ----------

// GET /api/parcels — GeoJSON FeatureCollection of parcels.
// Prefers DB records; falls back to the bundled demo layer so the map always renders.
router.get('/', async (req, res) => {
  try {
    let dbParcels = []
    if (dbReady()) {
      try {
        dbParcels = await Parcel.find({}).lean()
      } catch (_e) {
        dbParcels = []
      }
    }

    // If DB has parcels, return them as GeoJSON; otherwise use the demo layer.
    if (dbParcels && dbParcels.length > 0) {
      const features = dbParcels.map((p) => ({
        type: 'Feature',
        id: p.id || p._id.toString(),
        properties: {
          id: p.id || p._id.toString(),
          ulpin: p.ulpin,
          surveyNumber: p.surveyNumber,
          landUse: p.landUse,
          area: p.area,
          areaUnit: p.areaUnit,
          ownershipStatus: p.ownershipStatus,
          village: p.village,
          district: p.district,
          state: p.state,
          isDemo: !!p.isDemo,
        },
        geometry: p.geometry,
      }))
      return res.json({ type: 'FeatureCollection', features })
    }

    return res.json(demoParcelGeoJSON)
  } catch (error) {
    console.error('GET /api/parcels error:', error.message)
    // Always return the demo layer on any DB error so the GIS map still works.
    return res.json(demoParcelGeoJSON)
  }
})

// GET /api/parcels/:id — detailed parcel + all governance layers.
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    let parcel = null
    if (dbReady()) {
      try {
        parcel = await Parcel.findOne({ $or: [{ ulpin: id }, { _id: id }] }).lean()
      } catch (_e) {
        parcel = null
      }
    }

    if (!parcel) {
      // Look up in the demo layer by feature id or ulpin.
      const feature = demoParcelGeoJSON.features.find(
        (f) => f.properties.id === id || f.properties.ulpin === id
      )
      if (!feature) {
        return res.status(404).json({ message: 'Parcel not found' })
      }
      const props = feature.properties
      parcel = {
        id: props.id,
        ulpin: props.ulpin,
        surveyNumber: props.surveyNumber,
        landUse: props.landUse,
        area: props.area,
        areaUnit: 'acres',
        ownershipStatus: props.ownershipStatus,
        village: props.village || 'Demo Village',
        district: props.district || 'Demo District',
        state: props.state || 'Demo State',
        geometry: feature.geometry,
        isDemo: true,
      }
    }

    let governance = null
    try {
      // In a real deployment these come from the LandStack API integration layer.
      // For the prototype return demo governance data keyed to the ULPIN.
      governance = await Promise.resolve(buildDemoGovernance(parcel.ulpin))
    } catch (_e) {
      governance = buildDemoGovernance(parcel.ulpin)
    }

    res.json({ parcel, governance })
  } catch (error) {
    console.error('GET /api/parcels/:id error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/parcels/:id/governance — governance layers for one parcel.
router.get('/:id/governance', async (req, res) => {
  const { id } = req.params
  const feature = demoParcelGeoJSON.features.find(
    (f) => f.properties.id === id || f.properties.ulpin === id
  )
  if (!feature) return res.status(404).json({ message: 'Parcel not found' })
  try {
    const governance = await Promise.resolve(buildDemoGovernance(feature.properties.ulpin))
    res.json({ ulpin: feature.properties.ulpin, ...governance })
  } catch (error) {
    console.error('governance error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/layers — descriptive list of available GIS layers (for the layer control).
router.get('/layers', (_req, res) => {
  const layers = {
    baseLayers: [
      { id: 'osm', label: 'OpenStreetMap' },
      { id: 'satellite', label: 'Satellite', source: 'Esri World Imagery' },
    ],
    governance: [
      { id: 'parcelBoundaries', label: 'Parcel Boundaries', demo: true },
      { id: 'landUse', label: 'Land Use / Zoning' },
      { id: 'buildingPermissions', label: 'Building Permissions' },
      { id: 'restrictions', label: 'Restrictions & Environmental Zones' },
      { id: 'disputes', label: 'Disputes' },
    ],
    infrastructure: [
      { id: 'roads', label: 'Roads' },
      { id: 'utilities', label: 'Utilities' },
      { id: 'publicInfrastructure', label: 'Public Infrastructure' },
    ],
  }
  res.json(layers)
})

export default router
