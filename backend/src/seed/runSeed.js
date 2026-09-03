import 'dotenv/config'
import connectDB from '../config/db.js'
import User, { USER_ROLES } from '../models/User.js'
import Parcel from '../models/Parcel.js'
import {
  LandRecord, Registration, Encumbrance, BuildingPermission, LandUse,
  PropertyTax, UtilityInfo, Dispute, Restriction, Application, Department, Notification,
} from '../models/LandModels.js'
import demoParcelGeoJSON from '../data/demoParcels.js'
import { DEMO_PARCELS } from '../data/demo/parcels.js'

/**
 * Seeds the MongoDB collections ("tables") with clearly-labelled DEMO data
 * so the integrated Parcel Profile, Applications workflow, Integrations and
 * Audit trail are demonstrable end-to-end.
 *
 * Everything inserted is flagged isDemo where the schema supports it. No fake
 * data is ever presented as official/government records.
 *
 * Run with:  npm run seed   (from backend/)
 */
const COLLECTIONS = {
  User, Parcel, LandRecord, Registration, Encumbrance, BuildingPermission,
  LandUse, PropertyTax, UtilityInfo, Dispute, Restriction, Application, Department, Notification,
}

async function seed() {
  await connectDB()

  // 1. Demo users (password: demo1234 for all)
  const demoUsers = [
    { name: 'Ramanathan K', email: 'ramanathan@email.com', role: 'citizen', department: 'Citizen Portal' },
    { name: 'Suresh B', email: 'suresh.b@revenue.gov.in', role: 'revenue_officer', department: 'Revenue Department' },
    { name: 'Priya N', email: 'priya.n@registration.gov.in', role: 'registration_officer', department: 'Registration Department' },
    { name: 'Rajesh M', email: 'rajesh.m@planning.gov.in', role: 'planning_officer', department: 'Town Planning Department' },
    { name: 'Arun V', email: 'arun.v@tax.gov.in', role: 'tax_officer', department: 'Property Tax Department' },
    { name: 'System Admin', email: 'admin@landstack.gov.in', role: 'administrator', department: 'Platform Administration' },
  ]
  let users = []
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email })
    if (!user) {
      user = await User.create({ ...u, passwordHash: 'demo1234', isDemo: true })
    }
    users.push(user)
  }
  const citizen = users.find((u) => u.role === 'citizen')
  console.log(`✔ users: ${users.length} demo users (password for all: demo1234)`)

  // 2. Parcels (canonical demo dataset — internally consistent locations)
  await Parcel.deleteMany({ isDemo: true })
  const canonicalById = Object.fromEntries(DEMO_PARCELS.map((p) => [p.id, p]))
  const parcelDocs = demoParcelGeoJSON.features.map((f) => {
    const c = canonicalById[f.properties.id] || {}
    return {
      ulpin: f.properties.ulpin,
      surveyNumber: f.properties.surveyNumber,
      village: c.village || 'Demo Village',
      taluk: c.taluk || 'Demo Taluk',
      district: c.district || 'Demo District',
      state: c.state || 'Demo State',
      coordinates: c.coordinates,
      area: f.properties.area,
      areaUnit: f.properties.areaUnit || 'acres',
      landUse: String(f.properties.landUse || 'residential').toLowerCase(),
      zoning: c.zoning || '',
      ownershipStatus: String(f.properties.ownershipStatus || 'verified').toLowerCase(),
      ownerName: c.ownerName || 'Demo Owner',
      ownerFatherName: c.ownerFatherName || '',
      ownershipType: c.ownershipType || 'self',
      encumbranceStatus: c.encumbranceStatus || 'clear',
      disputeStatus: c.disputeStatus || 'none',
      buildingPermission: c.buildingPermission || 'none',
      propertyTaxStatus: c.propertyTaxStatus || 'paid',
      pattaNumber: c.pattaNumber || '',
      classification: c.classification || '',
      verificationStatus: f.properties.verificationStatus || 'digitally_verified',
      restrictions: c.restrictions || [],
      utilities: c.utilities || {},
      isDemo: true,
      geometry: f.geometry,
    }
  })
  const parcels = await Parcel.insertMany(parcelDocs)
  console.log(`✔ parcels: ${parcels.length} demo parcels with geometry`)

  const parcelByUlpin = (ulpin) => parcels.find((p) => p.ulpin === ulpin)?._id

  // 3. Governance records per relevant parcel
  await Promise.all([
    LandRecord.deleteMany({ isDemo: true }),
    Registration.deleteMany({ isDemo: true }),
    Encumbrance.deleteMany({ isDemo: true }),
    BuildingPermission.deleteMany({ isDemo: true }),
    LandUse.deleteMany({ isDemo: true }),
    PropertyTax.deleteMany({ isDemo: true }),
    UtilityInfo.deleteMany({ isDemo: true }),
    Dispute.deleteMany({ isDemo: true }),
    Restriction.deleteMany({ isDemo: true }),
  ])

  const r1 = 'TN-MDU-RV-38472916'
  const r2 = 'TN-CHN-PM-72618345'
  const r4 = 'TN-TRZ-KK-45183627'
  const r5 = 'CH-CHD-SE-05839271'
  const r10 = 'TN-TRZ-ML-74029586'

  await LandRecord.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, surveyNumber: '123/4A', pattaNumber: 'PA-2024-0847', ownerName: 'Ramanathan K', previousOwners: ['Krishnasamy K'], ownershipType: 'self', area: 2.47, classification: 'Nanjangud', verificationStatus: 'digitally_verified', mutationHistory: [{ date: new Date(), note: 'Title transferred from Krishnasamy K', officer: 'Suresh B' }], isDemo: true },
    { parcel: parcelByUlpin(r2), ulpin: r2, surveyNumber: '56/2B', pattaNumber: 'PA-2023-1205', ownerName: 'Meenakshi Sundaram Ltd', previousOwners: ['Venkatesh R'], ownershipType: 'corporate', area: 0.85, classification: 'Commercial', verificationStatus: 'digitally_verified', mutationHistory: [], isDemo: true },
    { parcel: parcelByUlpin(r4), ulpin: r4, surveyNumber: '34/3C', pattaNumber: 'PA-2022-0618', ownerName: 'Lakshmi Devi P', previousOwners: ['Palaniappan P (Estate)'], ownershipType: 'inheritance', area: 1.25, classification: 'Residential', verificationStatus: 'pending_verification', mutationHistory: [], isDemo: true },
  ])

  await Registration.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, registrationId: 'REG-2201-77814', buyerName: 'Ramanathan K', sellerName: 'Krishnasamy K', transactionType: 'sale', amount: 4750000, registrationFee: 53500, documentNumber: '774/2024', subRegistrar: 'Madurai North SRO', status: 'registered', date: new Date('2024-03-12'), isDemo: true },
    { parcel: parcelByUlpin(r2), ulpin: r2, registrationId: 'REG-2201-55230', buyerName: 'Meenakshi Sundaram Ltd', sellerName: 'Venkatesh R', transactionType: 'sale', amount: 8900000, registrationFee: 98200, documentNumber: '551/2023', subRegistrar: 'Tondiarpet SRO', status: 'registered', date: new Date('2023-11-02'), isDemo: true },
  ])

  await Encumbrance.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, status: 'clear', mortgageBank: null, mortgageAmount: null, releaseStatus: 'released', isDemo: true },
    { parcel: parcelByUlpin(r2), ulpin: r2, status: 'mortgaged', mortgageBank: 'State Bank of India', mortgageAmount: 5500000, registrationDate: new Date('2023-11-05'), validity: new Date('2028-11-05'), releaseStatus: 'active', isDemo: true },
  ])

  await BuildingPermission.insertMany([
    { parcel: parcelByUlpin(r5), ulpin: r5, applicationNumber: 'BP-2025-CHD-0042', applicantName: 'Gupta Family Trust', buildingType: 'Residential G+2', proposedArea: 2400, floors: 3, status: 'approved', submittedDate: new Date('2025-11-10'), approvedDate: new Date('2025-12-08'), isDemo: true },
    { parcel: parcelByUlpin(r1), ulpin: r1, applicationNumber: 'BP-2025-MDU-0078', applicantName: 'Ramanathan K', buildingType: 'Residential Extension', proposedArea: 800, floors: 1, status: 'pending', submittedDate: new Date('2025-12-01'), isDemo: true },
  ])

  await LandUse.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, landUse: 'residential', zoning: 'R1', classification: 'Nanjangud', permittedUses: ['residential', 'home office'], restrictions: [], isDemo: true },
    { parcel: parcelByUlpin(r2), ulpin: r2, landUse: 'commercial', zoning: 'C1', classification: 'Commercial', permittedUses: ['commercial', 'retail'], restrictions: ['no high-rise beyond 15m'], isDemo: true },
  ])

  await PropertyTax.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, propertyId: 'PT-4421', taxableValue: 5200000, annualTax: 18500, paidAmount: 18500, outstanding: 0, status: 'paid', lastPayment: new Date('2025-04-01'), history: [{ date: new Date('2025-04-01'), amount: 18500, receiptId: 'RCP-9910' }], isDemo: true },
    { parcel: parcelByUlpin(r2), ulpin: r2, propertyId: 'PT-7780', taxableValue: 9800000, annualTax: 34200, paidAmount: 12000, outstanding: 22200, status: 'pending', lastPayment: null, history: [], isDemo: true },
  ])

  await UtilityInfo.insertMany([
    { parcel: parcelByUlpin(r1), ulpin: r1, electricity: true, water: true, sewerage: true, gas: true, telecom: true, roadDistance: 0.2, isDemo: true },
  ])

  await Dispute.insertMany([
    { parcel: parcelByUlpin(r4), ulpin: r4, caseId: 'DIS-2025-TRZ-0421', parties: ['Lakshmi Devi P', 'Rajendran P'], disputeType: 'inheritance', court: 'District Court, Tiruchirappalli', judge: 'Hon. Justice Meena S', status: 'active', priority: 'high', filedDate: new Date('2025-06-15'), lastHearing: new Date('2025-11-20'), nextHearing: new Date('2026-01-15'), isDemo: true },
  ])

  await Restriction.insertMany([
    { parcel: parcelByUlpin(r10), ulpin: r10, type: 'forest', description: 'Classified forest land - no transfer', authority: 'Forest Dept', status: 'active', isDemo: true },
  ])
  console.log('✔ land-records, registrations, encumbrances, building-permissions, land-use, property-tax, utilities, disputes, restrictions')

  // 4. Demo applications in various workflow states
  await Application.deleteMany({ isDemo: true })
  const apps = [
    { ulpin: r1, serviceName: 'Mutation Request', serviceCategory: 'Land Records', status: 'UNDER_REVIEW', department: 'Revenue', priority: 'medium', applicantName: 'Ramanathan K', user: citizen._id, documents: [{ name: 'Aadhaar Card', status: 'verified' }, { name: 'Sale Deed', status: 'verified' }] },
    { ulpin: r1, serviceName: 'Ownership Verification', serviceCategory: 'Land Records', status: 'DOCUMENT_VERIFICATION', department: 'Revenue', priority: 'high', applicantName: 'Ramanathan K', user: citizen._id, documents: [{ name: 'Aadhaar Card', status: 'uploaded' }] },
    { ulpin: r5, serviceName: 'Building Permission', serviceCategory: 'Planning', status: 'FIELD_VERIFICATION', department: 'Planning', priority: 'high', applicantName: 'Ramanathan K', user: citizen._id, documents: [{ name: 'Site Plan', status: 'verified' }, { name: 'Building Plan', status: 'verified' }] },
    { ulpin: r5, serviceName: 'Building Permission', serviceCategory: 'Planning', status: 'APPROVED', department: 'Planning', priority: 'medium', applicantName: 'Ramanathan K', user: citizen._id, documents: [{ name: 'Site Plan', status: 'verified' }] },
  ]
  for (let i = 0; i < apps.length; i++) {
    const a = apps[i]
    await Application.create({
      ...a,
      applicationId: `APL-DEMO-${i + 1001}`,
      isDemo: true,
      currentStep: 1,
      timeline: [{ status: a.status, from: 'DRAFT', to: a.status, date: new Date(), remarks: 'Seeded demo application', officer: 'System', actorRole: 'system' }],
      aiReview: {
        summary: 'Demo application ready for review.',
        issues: ['Verify documents manually'],
        confidence: 0.82,
        recommendedAction: 'Manual verification by authorized officer',
        generatedAt: new Date(),
      },
    })
  }
  console.log('✔ applications: 4 demo applications across workflow states')

  // 5. Departments (interoperability status)
  await Department.deleteMany({ isDemo: true })
  await Department.insertMany([
    { name: 'Revenue Department', shortName: 'Revenue', connected: true, simulated: false, latency: 34, lastSync: new Date(), recordsSynced: 1247893, apiVersion: 'v2.1', isDemo: true },
    { name: 'Registration Department', shortName: 'Registration', connected: true, simulated: false, latency: 38, lastSync: new Date(), recordsSynced: 892341, apiVersion: 'v1.8', isDemo: true },
    { name: 'Town Planning Department', shortName: 'Planning', connected: true, simulated: false, latency: 51, lastSync: new Date(), recordsSynced: 312654, apiVersion: 'v2.0', isDemo: true },
    { name: 'Property Tax Department', shortName: 'Tax', connected: true, simulated: false, latency: 29, lastSync: new Date(), recordsSynced: 987123, apiVersion: 'v2.3', isDemo: true },
    { name: 'Public Works Department', shortName: 'Utilities', connected: false, simulated: true, latency: 0, lastSync: new Date(), recordsSynced: 0, apiVersion: 'v0 (simulated)', isDemo: true },
    { name: 'Environment & Forest', shortName: 'Environment', connected: false, simulated: true, latency: 0, lastSync: new Date(), recordsSynced: 0, apiVersion: 'v0 (simulated)', isDemo: true },
  ])
  console.log('✔ departments: 6 integrations')

  // 6. Notifications for the demo citizen
  await Notification.deleteMany({ isDemo: true })
  await Notification.insertMany([
    { user: citizen._id, userId: String(citizen._id), title: 'Application Under Review', message: 'Your Mutation Request APL-DEMO-1001 is now under review.', type: 'info', link: '/applications', resource: 'application', resourceId: 'APL-DEMO-1001', read: false, isDemo: true },
    { user: citizen._id, userId: String(citizen._id), title: 'Building Permission Approved', message: 'Your Building Permission application was approved by Planning.', type: 'success', link: '/applications', resource: 'application', resourceId: 'APL-DEMO-1004', read: false, isDemo: true },
  ])
  console.log('✔ notifications: 2 demo notifications')

  console.log('\n✔ Seeding complete. Collections created/updated:')
  for (const name of Object.keys(COLLECTIONS)) console.log(`  - ${name.toLowerCase()}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
