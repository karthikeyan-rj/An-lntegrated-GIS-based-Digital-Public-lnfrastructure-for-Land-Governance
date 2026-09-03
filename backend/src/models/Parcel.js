import mongoose from 'mongoose'

/**
 * Parcel — central parcel-centric GIS entity keyed by ULPIN.
 * geometry uses GeoJSON so the backend can later be swapped for official
 * cadastral GeoJSON / WFS / OGC sources without changing the API shape.
 */
const parcelSchema = new mongoose.Schema(
  {
    ulpin: { type: String, required: true, unique: true, index: true },
    surveyNumber: { type: String, required: true },
    village: String,
    taluk: String,
    district: String,
    state: String,
    area: Number,
    areaUnit: { type: String, default: 'acres' },
    landUse: String,
    zoning: String,
    ownershipStatus: String,
    ownerName: String,
    ownerFatherName: String,
    ownershipType: String,
    encumbranceStatus: String,
    disputeStatus: String,
    buildingPermission: String,
    propertyTaxStatus: String,
    pattaNumber: String,
    classification: String,
    verificationStatus: String,
    // Ownership: the registered citizen user account that owns this parcel.
    // Only this owner (or administrators) may view the full private record.
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    restrictions: { type: [String], default: [] },
    utilities: {
      type: {
        electricity: { type: Boolean, default: false },
        water: { type: Boolean, default: false },
        sewerage: { type: Boolean, default: false },
        gas: { type: Boolean, default: false },
        telecom: { type: Boolean, default: false },
      },
      default: {},
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isDemo: { type: Boolean, default: true },
    // GeoJSON geometry
    geometry: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon', 'Point'],
        default: 'Polygon',
      },
      coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    // 2dsphere index for spatial queries (geospatial)
  },
  { timestamps: true }
)

parcelSchema.index({ geometry: '2dsphere' })

export const Parcel = mongoose.models.Parcel || mongoose.model('Parcel', parcelSchema)
export default Parcel
