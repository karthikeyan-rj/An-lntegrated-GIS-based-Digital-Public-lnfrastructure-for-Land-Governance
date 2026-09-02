export type UserRole = 'citizen' | 'revenue_officer' | 'registration_officer' | 'planning_officer' | 'tax_officer' | 'administrator'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  avatar?: string
  /** True for accounts created against the real MongoDB backend. */
  isReal?: boolean
}

export type OwnershipStatus = 'verified' | 'pending' | 'disputed' | 'unverified'
export type LandUseType = 'residential' | 'commercial' | 'agricultural' | 'industrial' | 'institutional' | 'forest' | 'water' | 'mixed'
export type ZoningType = 'R1' | 'R2' | 'C1' | 'C2' | 'I1' | 'I2' | 'A1' | 'F1' | 'W1' | 'MU1'
export type EncumbranceStatus = 'clear' | 'encumbered' | 'mortgaged' | 'lien'
export type DisputeStatus = 'none' | 'active' | 'under_review' | 'resolved'
export type ServiceStatus = 'submitted' | 'document_verification' | 'department_review' | 'field_verification' | 'approval' | 'completed' | 'rejected'
export type RegistrationStatus = 'pending' | 'registered' | 'rejected' | 'under_review'

export interface Parcel {
  id: string
  ulpin: string
  surveyNumber: string
  village: string
  taluk: string
  district: string
  state: string
  area: number
  areaUnit: 'acres' | 'hectares' | 'sqft'
  coordinates: { lat: number; lng: number }
  bounds?: [[number, number], [number, number]]
  landUse: LandUseType
  zoning: ZoningType
  ownershipStatus: OwnershipStatus
  ownerName: string
  ownerFatherName: string
  ownershipType: 'self' | 'joint' | 'inheritance' | 'corporate'
  encumbranceStatus: EncumbranceStatus
  mortgageBank?: string
  mortgageAmount?: number
  disputeStatus: DisputeStatus
  disputeCaseId?: string
  propertyTaxStatus: 'paid' | 'pending' | 'overdue'
  taxAmount?: number
  buildingPermission: 'approved' | 'pending' | 'none' | 'rejected'
  pattaNumber: string
  classification: string
  verificationStatus: 'digitally_verified' | 'pending_verification' | 'requires_update'
  lastUpdated: string
  registeredDate: string
  restrictions: string[]
  utilities: {
    electricity: boolean
    water: boolean
    sewerage: boolean
    gas: boolean
    telecom: boolean
  }
}

export interface Registration {
  id: string
  ulpin: string
  parcelId: string
  buyerName: string
  sellerName: string
  transactionType: 'sale' | 'gift' | 'mortgage' | 'lease' | 'partition'
  date: string
  amount: number
  status: RegistrationStatus
  documentNumber: string
  subRegistrar: string
  registrationFee: number
}

export interface ServiceRequest {
  id: string
  applicationId: string
  ulpin: string
  parcelId: string
  serviceName: string
  serviceCategory: string
  applicantName: string
  applicantId: string
  submittedDate: string
  currentStatus: ServiceStatus
  timeline: { status: string; date: string; remarks: string; officer?: string }[]
  documents: string[]
}

export interface Dispute {
  id: string
  caseId: string
  ulpin: string
  parcelId: string
  parties: string[]
  disputeType: 'ownership' | 'boundary' | 'inheritance' | 'encroachment' | 'title' | 'mutation'
  court: string
  judge: string
  status: 'active' | 'under_review' | 'resolved' | 'appealed'
  filedDate: string
  lastHearing: string
  nextHearing: string
  priority: 'high' | 'medium' | 'low'
}

export interface BuildingPermission {
  id: string
  applicationNumber: string
  ulpin: string
  parcelId: string
  applicantName: string
  buildingType: string
  proposedArea: number
  floors: number
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'inspection_pending'
  submittedDate: string
  approvedDate?: string
}

export interface Department {
  id: string
  name: string
  shortName: string
  connected: boolean
  latency: number
  lastSync: string
  recordsSynced: number
  apiVersion: string
}

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  department: string
  action: string
  target: string
  targetId: string
  ip: string
  result: 'success' | 'failure' | 'warning'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
  link?: string
}

export interface AIInsight {
  id: string
  type: 'change_detection' | 'ownership_anomaly' | 'land_use_change' | 'fraud_risk' | 'encroachment'
  title: string
  description: string
  ulpin?: string
  parcelId?: string
  confidence: number
  severity: 'high' | 'medium' | 'low'
  date: string
  status: 'new' | 'investigating' | 'resolved' | 'dismissed'
}

export interface AnalyticsData {
  parcelsByLandUse: { name: string; value: number; color: string }[]
  registrationTrends: { month: string; count: number; amount: number }[]
  taxCollection: { month: string; collected: number; target: number }[]
  disputeTrends: { month: string; active: number; resolved: number }[]
  ownershipDistribution: { name: string; value: number }[]
}
