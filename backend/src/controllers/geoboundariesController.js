import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEO_DIR = path.join(__dirname, '..', 'data', 'geometry')

const FILES = {
  state: 'tamil_nadu_state.geojson',
  districts: 'tamil_nadu_districts.geojson',
  taluks: 'tamil_nadu_taluks.geojson',
}

// Load once, in-memory; the simplified files are small (100KB–<1MB).
const cache = {}
function load(kind) {
  if (cache[kind]) return cache[kind]
  try {
    const raw = fs.readFileSync(path.join(GEO_DIR, FILES[kind]), 'utf8')
    cache[kind] = JSON.parse(raw)
  } catch (_e) {
    cache[kind] = null
  }
  return cache[kind]
}

const LICENSE = 'Administrative boundary geometry derived from public-domain India admin boundary data (datta07/INDIAN-SHAPEFILES, Census 2011). Simplified for web display. Not survey-accurate cadastral data.'

// GET /api/geoboundaries/:kind?simplify=1 — serve a GeoJSON FeatureCollection.
// `simplify` (default 1) drops property noise so only display-relevant fields go to the client.
export function getBoundary(req, res) {
  const { kind } = req.params
  if (!FILES[kind]) return res.status(404).json({ message: `Unknown boundary layer '${kind}'. Use one of: ${Object.keys(FILES).join(', ')}` })
  const gj = load(kind)
  if (!gj) return res.status(500).json({ message: 'Boundary geometry unavailable' })

  const features = (gj.features || []).map((f) => {
    const p = f.properties || {}
    const props = { name: p.name, state: p.state }
    if (kind === 'districts') {
      props.district = p.district
      props.id = p.id
    }
    if (kind === 'taluks') {
      props.taluk = p.taluk
      props.district = p.district // parent district, for click-to-identify + search-zoom
      props.id = p.id
    }
    return { type: 'Feature', properties: props, geometry: f.geometry }
  })

  res.set('Cache-Control', 'public, max-age=86400')
  res.json({ type: 'FeatureCollection', features, source: 'public-domain India admin boundaries (simplified)', license: LICENSE })
}

export function geoboundariesIndex(_req, res) {
  res.json({
    layers: [
      { id: 'state', label: 'Tamil Nadu State Boundary', source: 'Census 2011 admin boundaries (simplified)', isReal: true },
      { id: 'districts', label: 'District Boundaries', source: 'Census 2011 admin boundaries (simplified)', isReal: true },
      { id: 'taluks', label: 'Taluk / Sub-District Boundaries', source: 'Census 2011 admin boundaries (simplified)', isReal: true },
    ],
  })
}

export const geoboundariesController = { getBoundary, geoboundariesIndex }
export default geoboundariesController
