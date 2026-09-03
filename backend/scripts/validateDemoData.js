/**
 * Demo-data consistency validator.
 *
 * Checks the canonical demo parcel dataset (backend/src/data/demo/parcels.js)
 * for internal contradictions: ULPIN prefix ↔ State/District, coordinates ↔
 * State/Taluk, land-use values, and that every Tamil Nadu parcel sits inside
 * the real Tamil Nadu administrative boundary.
 *
 * Run:  npm run validate:demo   (from backend/)
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DEMO_PARCELS } from '../src/data/demo/parcels.js'

const stateFC = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/data/geometry/tamil_nadu_state.geojson', import.meta.url)), 'utf8')
)

// ULPIN district-code → expected district / state (from our demo canonical set).
const DISTRICT_MAP = {
  MDU: 'Madurai',
  CHN: 'Chennai',
  CBE: 'Coimbatore',
  TRZ: 'Tiruchirappalli',
  SLM: 'Salem',
  CHD: 'Chandigarh',
}

const LAND_USES = new Set(['residential', 'commercial', 'agricultural', 'industrial', 'institutional', 'forest', 'water', 'mixed'])

function pointInRing(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
function pointInState(lng, lat) {
  const geom = stateFC.features[0].geometry
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  for (const coords of polys) {
    const outer = coords[0]
    if (pointInRing(lng, lat, outer)) return true
  }
  return false
}

let errors = 0
for (const p of DEMO_PARCELS) {
  const [stateCode, distCode] = p.ulpin.split('-')
  const ulpinErrors = []

  const expectedState = stateCode === 'TN' ? 'Tamil Nadu' : stateCode === 'CH' ? 'Chandigarh' : null
  if (!expectedState) ulpinErrors.push(`unknown state code "${stateCode}"`)
  else if (p.state !== expectedState) ulpinErrors.push(`state "${p.state}" does not match ULPIN prefix "${stateCode}" (expected ${expectedState})`)

  const expectedDist = DISTRICT_MAP[distCode]
  if (expectedDist && p.district !== expectedDist) ulpinErrors.push(`district "${p.district}" does not match ULPIN district code "${distCode}" (expected ${expectedDist})`)

  if (!LAND_USES.has(p.landUse)) ulpinErrors.push(`landUse "${p.landUse}" is not a known category`)

  if (p.state === 'Tamil Nadu') {
    if (!pointInState(p.coordinates.lng, p.coordinates.lat)) ulpinErrors.push('coordinates fall outside the real Tamil Nadu boundary')
  } else if (p.state === 'Chandigarh') {
    if (p.coordinates.lat < 30.5 || p.coordinates.lat > 30.9 || p.coordinates.lng < 76.6 || p.coordinates.lng > 77.0) {
      ulpinErrors.push('coordinates are not near Chandigarh')
    }
  }

  if (ulpinErrors.length) {
    errors++
    console.log(`[FAIL] ${p.id} (${p.ulpin})`)
    for (const e of ulpinErrors) console.log(`         - ${e}`)
  } else {
    console.log(`[ OK ] ${p.id} (${p.ulpin}) ${p.state} / ${p.district} / ${p.taluk} / ${p.village}`)
  }
}

console.log('')
if (errors) {
  console.log(`⚠  ${errors} parcel(s) have inconsistencies.`)
  process.exit(1)
} else {
  console.log('✔ All demo parcels are internally consistent.')
}
