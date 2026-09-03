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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
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
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON }
)

export const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputesSchema)

export const APPLICATION_STATUS = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENT_VERIFICATION',
  'ACTION_REQUIRED',
  'FIELD_VERIFICATION',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]

// Dedicated subdocument schema for application documents. Declared explicitly
// because it contains a field literally named `type`; in Mongoose `type` is the
// reserved type-key, so an inline object would otherwise collapse this array to
// [String] and raise "Cast to [string] failed" on object documents.
export const documentSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, default: 'generic' },
    status: { type: String, default: 'uploaded' },
    url: String,
    verifiedBy: String,
  },
  { _id: false }
)

export const applicationsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    applicationId: { type: String, unique: true, index: true },
    applicantName: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applicantEmail: String,
    serviceName: String,
    serviceCategory: String,
    status: { type: String, enum: APPLICATION_STATUS, default: 'DRAFT' },
    // workflow metadata
    currentStep: Number,
    department: { type: String, default: 'Revenue' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigneeName: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    // documents: [{ name, type, status: uploaded|verified|rejected, url }]
    documents: { type: [documentSchema], default: [] },
    notes: String,
    reason: String, // rejection / request-for-information reason
    isDemo: { type: Boolean, default: false },
    aiReview: {
      summary: String,
      issues: [String],
      confidence: Number,
      recommendedAction: String,
      generatedAt: Date,
    },
    timeline: [
      {
        status: String,
        from: String,
        to: String,
        date: Date,
        remarks: String,
        officer: String,
        actorRole: String,
      },
    ],
  },
  { timestamps: true, toJSON }
)

export const Application = mongoose.models.Application || mongoose.model('Application', applicationsSchema)

export const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    role: String,
    department: String,
    action: String,
    resource: String,
    resourceId: String,
    target: String,
    targetId: String,
    ip: String,
    result: { type: String, default: 'success' },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, toJSON }
)

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)

// ---- Additional LandStack collections ----

export const restrictionsSchema = new mongoose.Schema(
  {
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: { type: String, index: true },
    type: String, // environmental | heritage | litigation | zoning | etc
    description: String,
    authority: String,
    startDate: Date,
    endDate: Date,
    status: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON }
)

export const Restriction = mongoose.models.Restriction || mongoose.model('Restriction', restrictionsSchema)

export const notificationsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userId: { type: String, index: true },
    recipientRole: String,
    title: String,
    message: String,
    type: { type: String, default: 'info' }, // info | success | warning | error
    link: String,
    resource: String,
    resourceId: String,
    read: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON }
)

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationsSchema)

export const aiReportsSchema = new mongoose.Schema(
  {
    reportType: String, // document_extraction | anomaly_detection | application_assistant | change_detection | chat
    parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' },
    ulpin: String,
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    summary: String,
    confidence: Number,
    riskScore: Number,
    riskLevel: String,
    findings: [mongoose.Schema.Types.Mixed],
    recommendedAction: String,
    extractedData: mongoose.Schema.Types.Mixed,
    sources: [String],
    requiresHumanVerification: { type: Boolean, default: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON }
)

export const AiReport = mongoose.models.AiReport || mongoose.model('AiReport', aiReportsSchema)

export const departmentsSchema = new mongoose.Schema(
  {
    name: String,
    shortName: String,
    apiUrl: String,
    connected: { type: Boolean, default: false },
    simulated: { type: Boolean, default: true },
    latency: Number,
    lastSync: Date,
    recordsSynced: Number,
    apiVersion: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON }
)

export const Department = mongoose.models.Department || mongoose.model('Department', departmentsSchema)

export const workflowsSchema = new mongoose.Schema(
  {
    serviceCategory: String,
    name: String,
    steps: [
      {
        key: String,
        label: String,
        assignToRole: String,
      },
    ],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON }
)

export const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowsSchema)
