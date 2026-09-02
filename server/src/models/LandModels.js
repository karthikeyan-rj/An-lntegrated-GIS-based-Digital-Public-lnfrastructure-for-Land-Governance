import mongoose from 'mongoose'

// Shared schema option to keep JSON responses clean.
const toJSON = {
  transform(_doc, ret) {
    delete ret.__v
    return ret
  },
}

export const recordOfRightsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    surveyNumber: String,
    pattaNumber: String,
    ownerName: String,
    previousOwners: [{ type: String }],
    ownershipType: String,
    area: Number,
    classification: String,
    cultivationDetails: String,
    verificationStatus: String,
    mutationHistory: [{ date: Date, note: String, officer: String }],
  },
  { timestamps: true, toJSON }
)

export const LandRecord = mongoose.models.LandRecord || mongoose.model('LandRecord', recordOfRightsSchema)

export const registrationsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    registrationId: String,
    buyerName: String,
    sellerName: String,
    transactionType: String,
    amount: Number,
    registrationFee: Number,
    documentNumber: String,
    subRegistrar: String,
    status: String,
    date: Date,
  },
  { timestamps: true, toJSON }
)

export const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationsSchema)

export const encumbrancesSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    status: String, // clear | encumbered | mortgaged | lien
    mortgageBank: String,
    mortgageAmount: Number,
    registrationDate: Date,
    validity: Date,
    releaseStatus: String,
  },
  { timestamps: true, toJSON }
)

export const Encumbrance = mongoose.models.Encumbrance || mongoose.model('Encumbrance', encumbrancesSchema)

export const buildingPermissionsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    applicationNumber: String,
    applicantName: String,
    buildingType: String,
    proposedArea: Number,
    floors: Number,
    status: String,
    submittedDate: Date,
    approvedDate: Date,
  },
  { timestamps: true, toJSON }
)

export const BuildingPermission = mongoose.models.BuildingPermission || mongoose.model('BuildingPermission', buildingPermissionsSchema)

export const landUseSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    landUse: String,
    zoning: String,
    classification: String,
    permittedUses: [String],
    restrictions: [String],
  },
  { timestamps: true, toJSON }
)

export const LandUse = mongoose.models.LandUse || mongoose.model('LandUse', landUseSchema)

export const propertyTaxSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    propertyId: String,
    taxableValue: Number,
    annualTax: Number,
    paidAmount: Number,
    outstanding: Number,
    lastPayment: Date,
    status: String,
    history: [{ date: Date, amount: Number, receiptId: String }],
  },
  { timestamps: true, toJSON }
)

export const PropertyTax = mongoose.models.PropertyTax || mongoose.model('PropertyTax', propertyTaxSchema)

export const utilitiesSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    electricity: Boolean,
    water: Boolean,
    sewerage: Boolean,
    gas: Boolean,
    telecom: Boolean,
    roadDistance: Number,
  },
  { timestamps: true, toJSON }
)

export const UtilityInfo = mongoose.models.UtilityInfo || mongoose.model('UtilityInfo', utilitiesSchema)

export const disputesSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    caseId: String,
    parties: [String],
    disputeType: String,
    court: String,
    judge: String,
    status: String,
    priority: String,
    filedDate: Date,
    lastHearing: Date,
    nextHearing: Date,
  },
  { timestamps: true, toJSON }
)

export const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputesSchema)

export const applicationsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    applicationId: String,
    applicantName: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceName: String,
    serviceCategory: String,
    status: String,
    timeline: [{ status: String, date: Date, remarks: String, officer: String }],
    documents: [String],
  },
  { timestamps: true, toJSON }
)

export const Application = mongoose.models.Application || mongoose.model('Application', applicationsSchema)

export const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    department: String,
    action: String,
    target: String,
    targetId: String,
    ip: String,
    result: String,
  },
  { timestamps: true, toJSON }
)

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
