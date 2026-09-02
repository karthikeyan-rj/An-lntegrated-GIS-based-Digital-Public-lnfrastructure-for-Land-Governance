/**
 * DEMO / PROTOTYPE parcel geometries.
 *
 * These are SYNTHETIC demo polygons placed at real, known geographic locations
 * (centered on real city/town coordinates) so the map renders "like" a cadastral
 * layer. They are NOT official government cadastral data. They exist only to
 * demonstrate the parcel-centric interaction model and can be replaced by real
 * cadastral GeoJSON / WFS / OGC services later.
 */

// Build a simple rectangular polygon around a center point with a given half-size.
function rectPolygon(lat, lng, halfDeg) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - halfDeg, lat - halfDeg],
        [lng - halfDeg, lat + halfDeg],
        [lng + halfDeg, lat + halfDeg],
        [lng + halfDeg, lat - halfDeg],
        [lng - halfDeg, lat - halfDeg],
      ],
    ],
  }
}

// Demo parcels keyed by the stable demo id used across the frontend (p1..p10).
export const DEMO_PARCELLS = [
  { id: 'p1', lat: 9.9252, lng: 78.1198, half: 0.0009 },
  { id: 'p2', lat: 13.0827, lng: 80.2707, half: 0.0006 },
  { id: 'p3', lat: 11.0168, lng: 76.9558, half: 0.0011 },
  { id: 'p4', lat: 10.7905, lng: 78.7047, half: 0.0008 },
  { id: 'p5', lat: 30.7333, lng: 76.7794, half: 0.0006 },
  { id: 'p6', lat: 13.0063, lng: 80.2574, half: 0.0008 },
  { id: 'p7', lat: 9.9195, lng: 78.1141, half: 0.0008 },
  { id: 'p8', lat: 11.0291, lng: 76.9973, half: 0.0007 },
  { id: 'p9', lat: 30.7525, lng: 76.7841, half: 0.0007 },
  { id: 'p10', lat: 10.86, lng: 78.68, half: 0.001 },
]

const properties = {
  p1: { ulpin: 'TN-MDU-RV-38472916', surveyNumber: '123/4A', landUse: 'Residential', area: 2.47, ownershipStatus: 'Verified' },
  p2: { ulpin: 'TN-CHN-PM-72618345', surveyNumber: '56/2B', landUse: 'Commercial', area: 0.85, ownershipStatus: 'Verified' },
  p3: { ulpin: 'TN-CBE-GN-91527483', surveyNumber: '78/1', landUse: 'Agricultural', area: 5.12, ownershipStatus: 'Verified' },
  p4: { ulpin: 'TN-TRZ-KK-45183627', surveyNumber: '34/3C', landUse: 'Residential', area: 1.25, ownershipStatus: 'Pending' },
  p5: { ulpin: 'CH-CHD-SE-05839271', surveyNumber: 'Chd/112', landUse: 'Residential', area: 0.33, ownershipStatus: 'Verified' },
  p6: { ulpin: 'TN-CHN-AD-68294015', surveyNumber: '45/8', landUse: 'Institutional', area: 1.8, ownershipStatus: 'Verified' },
  p7: { ulpin: 'TN-MDU-VK-21958374', surveyNumber: '91/2A', landUse: 'Industrial', area: 3.6, ownershipStatus: 'Verified' },
  p8: { ulpin: 'TN-CBE-PE-57431028', surveyNumber: '67/4', landUse: 'Commercial', area: 0.65, ownershipStatus: 'Verified' },
  p9: { ulpin: 'CH-CHD-MZ-83726154', surveyNumber: 'Chd/208', landUse: 'Mixed', area: 0.5, ownershipStatus: 'Verified' },
  p10: { ulpin: 'TN-TRZ-ML-74029586', surveyNumber: '15/6', landUse: 'Forest', area: 8.75, ownershipStatus: 'Verified' },
}

function buildFeature(id) {
  const def = DEMO_PARCELLS.find((d) => d.id === id)
  if (!def) throw new Error(`Unknown demo parcel ${id}`)
  return {
    type: 'Feature',
    id,
    properties: {
      id,
      ...properties[id],
    },
    geometry: rectPolygon(def.lat, def.lng, def.half),
  }
}

export const demoParcelGeoJSON = {
  type: 'FeatureCollection',
  features: Object.keys(properties).map(buildFeature),
}

export default demoParcelGeoJSON
