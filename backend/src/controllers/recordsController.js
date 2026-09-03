import {
  LandRecord, Registration, Encumbrance, BuildingPermission, LandUse,
  PropertyTax, UtilityInfo, Restriction, Dispute,
} from '../models/LandModels.js'
import { recordAudit } from '../services/auditService.js'
import { demoFor } from '../data/demo/governance.js'

/**
 * Resource registry maps an API resource key to its model and demo data set.
 */
const RESOURCES = {
  'land-records': { model: LandRecord, key: 'landRecords' },
  'registrations': { model: Registration, key: 'registrations' },
  'encumbrances': { model: Encumbrance, key: 'encumbrances' },
  'building-permissions': { model: BuildingPermission, key: 'buildingPermissions' },
  'land-use': { model: LandUse, key: 'landUses' },
  'property-tax': { model: PropertyTax, key: 'propertyTaxes' },
  'utilities': { model: UtilityInfo, key: 'utilities' },
  'restrictions': { model: Restriction, key: 'restrictions' },
  'disputes': { model: Dispute, key: 'disputes' },
}

const AUDIT_ACTIONS = {
  'land-records': 'landRecord.read',
  'registrations': 'registration.read',
  'encumbrances': 'encumbrance.read',
  'building-permissions': 'buildingPermission.read',
  'land-use': 'landUse.read',
  'property-tax': 'propertyTax.read',
  'utilities': 'utility.read',
  'restrictions': 'restriction.read',
  'disputes': 'dispute.read',
}

function makeList(singular, resource) {
  const { model, key } = RESOURCES[resource]
  return async (req, res) => {
    try {
      const { ulpin } = req.query
      const scopedUlpins = req.query.__scoped_ulpins
      const scopedSet = scopedUlpins ? new Set(scopedUlpins) : null
      const withinScope = (r) => !scopedSet || scopedSet.has(r.ulpin)

      const query = {}
      if (ulpin) {
        const demo = demoFor(key).filter((r) => r.ulpin === ulpin && withinScope(r))
        if (demo.length) return res.json({ [key]: demo, count: demo.length, isDemo: true })
        query.ulpin = ulpin
      }
      if (scopedSet) query.ulpin = { $in: Array.from(scopedSet) }
      let rows = []
      try {
        rows = await model.find(query).sort({ createdAt: -1 }).lean()
      } catch (_e) {
        rows = []
      }
      let out = rows.filter(withinScope)
      let isDemo = false
      if (!out.length) {
        out = demoFor(key).filter((r) => (!ulpin || r.ulpin === ulpin) && withinScope(r))
        isDemo = true
      }
      if (req.user) {
        await recordAudit({ user: req.user, action: AUDIT_ACTIONS[resource], resource, resourceId: ulpin || 'all', result: 'success', metadata: { list: true }, ip: req.ip })
      }
      res.json({ [key]: out, count: out.length, isDemo })
    } catch (error) {
      console.error(`${resource} list error:`, error.message)
      res.status(500).json({ message: 'Server error' })
    }
  }
}

function makeGetByUlpin(singular, resource) {
  const { model, key } = RESOURCES[resource]
  return async (req, res) => {
    try {
      const { ulpin } = req.params
      // Citizens may only read records of ULPINs they own.
      if (req.scopedUlpins && !req.scopedUlpins.has(ulpin)) {
        return res.status(403).json({ message: 'Access denied — this record belongs to a ULPIN you do not own' })
      }
      let row = null
      try {
        row = (await model.find({ ulpin }).lean())[0] || null
      } catch (_e) {
        row = null
      }
      if (!row) {
        row = demoFor(key).find((r) => r.ulpin === ulpin) || null
      }
      if (!row) return res.status(404).json({ message: `${resource} record not found for ULPIN ${ulpin}` })
      if (req.user) {
        await recordAudit({ user: req.user, action: AUDIT_ACTIONS[resource], resource, resourceId: ulpin, result: 'success', ip: req.ip })
      }
      res.json({ [singular]: row })
    } catch (error) {
      console.error(`${resource} get error:`, error.message)
      res.status(500).json({ message: 'Server error' })
    }
  }
}

/**
 * Creates CRUD-ish handlers for a governance resource.
 * @param {string} resource one of the keys in RESOURCES
 * @param {string} singular single-item response key, e.g. 'landRecord'
 */
export function recordsResource(resource, singular) {
  return {
    list: makeList(singular, resource),
    getByUlpin: makeGetByUlpin(singular, resource),
  }
}

/** Optional: providers summary of all module availability for /api/apis */
export function moduleStatus() {
  return Object.keys(RESOURCES).map((r) => ({
    module: r,
    model: RESOURCES[r].model.modelName,
    connected: true,
    demo: true,
  }))
}

export default recordsResource
