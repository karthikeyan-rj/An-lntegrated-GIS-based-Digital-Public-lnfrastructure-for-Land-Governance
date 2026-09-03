/**
 * DEMO / PROTOTYPE parcel geometries (GeoJSON) — canonical source.
 *
 * Geometry + properties are built from the single authoritative dataset in
 * `backend/src/data/demo/parcels.js` so that the map, the DB seed and the
 * parcel profile all show identical, internally-consistent location data.
 *
 * These are SYNTHETIC demo polygons placed at real, known geographic
 * locations. They are NOT official government cadastral data.
 */

import { DEMO_PARCELS, parcelGeometry } from './demo/parcels.js'

function propertiesFor(p) {
  return {
    id: p.id,
    ulpin: p.ulpin,
    surveyNumber: p.surveyNumber,
    state: p.state,
    district: p.district,
    taluk: p.taluk,
    village: p.village,
    landUse: p.landUse,
    zoning: p.zoning,
    area: p.area,
    areaUnit: p.areaUnit,
    ownershipStatus: p.ownershipStatus,
    ownerName: p.ownerName,
    encumbranceStatus: p.encumbranceStatus,
    disputeStatus: p.disputeStatus,
    buildingPermission: p.buildingPermission,
    propertyTaxStatus: p.propertyTaxStatus,
    pattaNumber: p.pattaNumber,
    verificationStatus: p.verificationStatus,
    restrictions: p.restrictions || [],
    utilityElectricity: (p.utilities && p.utilities.electricity) || false,
    utilityWater: (p.utilities && p.utilities.water) || false,
    utilitySewerage: (p.utilities && p.utilities.sewerage) || false,
    isDemo: true,
  }
}

function buildFeature(p) {
  return {
    type: 'Feature',
    id: p.id,
    properties: propertiesFor(p),
    geometry: parcelGeometry(p),
  }
}

export const demoParcelGeoJSON = {
  type: 'FeatureCollection',
  features: DEMO_PARCELS.map(buildFeature),
}

export default demoParcelGeoJSON
