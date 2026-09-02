import type { Registration, ServiceRequest, Dispute, BuildingPermission, Department, AuditLog, Notification, AIInsight } from '@/types'

export const registrations: Registration[] = [
  { id: 'reg1', ulpin: 'TN-MDU-RV-38472916', parcelId: 'p1', buyerName: 'Ramanathan K', sellerName: 'Krishnasamy K', transactionType: 'sale', date: '2019-06-22', amount: 3200000, status: 'registered', documentNumber: 'DOC-2019-MDU-4821', subRegistrar: 'Madurai North SRO', registrationFee: 32000 },
  { id: 'reg2', ulpin: 'TN-CHN-PM-72618345', parcelId: 'p2', buyerName: 'Meenakshi Sundaram Ltd', sellerName: 'Venkatesh R', transactionType: 'sale', date: '2021-03-10', amount: 8500000, status: 'registered', documentNumber: 'DOC-2021-CHN-1102', subRegistrar: 'Tondiarpet SRO', registrationFee: 85000 },
  { id: 'reg3', ulpin: 'TN-TRZ-KK-45183627', parcelId: 'p4', buyerName: 'Lakshmi Devi P', sellerName: 'Palaniappan P (Estate)', transactionType: 'partition', date: '2023-09-15', amount: 0, status: 'registered', documentNumber: 'DOC-2023-TRZ-3291', subRegistrar: 'Lalgudi SRO', registrationFee: 5000 },
  { id: 'reg4', ulpin: 'CH-CHD-SE-05839271', parcelId: 'p5', buyerName: 'Gupta Family Trust', sellerName: 'Gupta Family Trust', transactionType: 'mortgage', date: '2024-01-18', amount: 2000000, status: 'registered', documentNumber: 'DOC-2024-CHD-0871', subRegistrar: 'Chandigarh SRO-1', registrationFee: 20000 },
  { id: 'reg5', ulpin: 'TN-CBE-GN-91527483', parcelId: 'p3', buyerName: 'Subramanian M', sellerName: 'Velusamy M (Estate)', transactionType: 'gift', date: '2015-11-05', amount: 0, status: 'registered', documentNumber: 'DOC-2015-CBE-2847', subRegistrar: 'Coimbatore South SRO', registrationFee: 1000 },
  { id: 'reg6', ulpin: 'TN-CHN-AD-68294015', parcelId: 'p6', buyerName: 'TN State Government', sellerName: 'Private Landowner', transactionType: 'sale', date: '2010-04-12', amount: 15000000, status: 'registered', documentNumber: 'DOC-2010-CHN-9912', subRegistrar: 'Mylapore SRO', registrationFee: 150000 },
  { id: 'reg7', ulpin: 'TN-MDU-VK-21958374', parcelId: 'p7', buyerName: 'Madurai Industrial Park Pvt Ltd', sellerName: 'SEZ Authority', transactionType: 'sale', date: '2022-08-19', amount: 22000000, status: 'registered', documentNumber: 'DOC-2022-MDU-6634', subRegistrar: 'Madurai South SRO', registrationFee: 220000 },
  { id: 'reg8', ulpin: 'TN-CBE-PE-57431028', parcelId: 'p8', buyerName: 'Selvam R', sellerName: 'Padmavathi S', transactionType: 'sale', date: '2023-05-27', amount: 6800000, status: 'registered', documentNumber: 'DOC-2023-CBE-1978', subRegistrar: 'Coimbatore North SRO', registrationFee: 68000 },
  { id: 'reg9', ulpin: 'TN-MDU-RV-38472916', parcelId: 'p1', buyerName: 'Ramanathan K', sellerName: 'Ramanathan K', transactionType: 'mortgage', date: '2024-11-02', amount: 1500000, status: 'pending', documentNumber: 'DOC-2024-MDU-8841', subRegistrar: 'Madurai North SRO', registrationFee: 15000 },
  { id: 'reg10', ulpin: 'CH-CHD-MZ-83726154', parcelId: 'p9', buyerName: 'Chandigarh Housing Board', sellerName: 'CHB Original', transactionType: 'sale', date: '2017-09-03', amount: 4200000, status: 'registered', documentNumber: 'DOC-2017-CHD-5520', subRegistrar: 'Chandigarh SRO-2', registrationFee: 42000 },
]

export const serviceRequests: ServiceRequest[] = [
  {
    id: 'sr1', applicationId: 'LS-2025-00147', ulpin: 'TN-MDU-RV-38472916', parcelId: 'p1',
    serviceName: 'Ownership Verification', serviceCategory: 'Land Records',
    applicantName: 'Ramanathan K', applicantId: 'CIT-2024-8812',
    submittedDate: '2025-12-01', currentStatus: 'field_verification',
    timeline: [
      { status: 'Submitted', date: '2025-12-01T10:30:00', remarks: 'Application received' },
      { status: 'Document Verification', date: '2025-12-02T14:15:00', remarks: 'All documents verified', officer: 'Suresh B' },
      { status: 'Department Review', date: '2025-12-05T09:00:00', remarks: 'Forwarded for field verification', officer: 'Suresh B' },
      { status: 'Field Verification', date: '', remarks: 'Scheduled for 15 Dec 2025' },
      { status: 'Approval', date: '', remarks: '' },
      { status: 'Completed', date: '', remarks: '' },
    ],
    documents: ['Aadhaar Card', 'Sale Deed', 'Patta Certificate'],
  },
  {
    id: 'sr2', applicationId: 'LS-2025-00203', ulpin: 'TN-TRZ-KK-45183627', parcelId: 'p4',
    serviceName: 'Mutation Request', serviceCategory: 'Land Records',
    applicantName: 'Lakshmi Devi P', applicantId: 'CIT-2024-5523',
    submittedDate: '2025-11-20', currentStatus: 'department_review',
    timeline: [
      { status: 'Submitted', date: '2025-11-20T11:00:00', remarks: 'Mutation application for inheritance' },
      { status: 'Document Verification', date: '2025-11-22T16:30:00', remarks: 'Death certificate and legal heir certificate verified', officer: 'Kavitha S' },
      { status: 'Department Review', date: '2025-11-25T10:00:00', remarks: 'Under review by Revenue Officer', officer: 'Kavitha S' },
      { status: 'Field Verification', date: '', remarks: '' },
      { status: 'Approval', date: '', remarks: '' },
      { status: 'Completed', date: '', remarks: '' },
    ],
    documents: ['Death Certificate', 'Legal Heir Certificate', 'Old Patta', 'Sale Deed'],
  },
  {
    id: 'sr3', applicationId: 'LS-2025-00289', ulpin: 'CH-CHD-SE-05839271', parcelId: 'p5',
    serviceName: 'Building Permission', serviceCategory: 'Planning',
    applicantName: 'Gupta Family Trust', applicantId: 'CIT-2023-1102',
    submittedDate: '2025-11-10', currentStatus: 'approval',
    timeline: [
      { status: 'Submitted', date: '2025-11-10T09:45:00', remarks: 'Building permission for G+2 residential' },
      { status: 'Document Verification', date: '2025-11-12T11:00:00', remarks: 'Documents complete', officer: 'Rajesh M' },
      { status: 'Department Review', date: '2025-11-18T14:00:00', remarks: 'Technical review passed', officer: 'Rajesh M' },
      { status: 'Field Verification', date: '2025-11-25T10:30:00', remarks: 'Site inspected - matches application', officer: 'Amit P' },
      { status: 'Approval', date: '2025-12-08T16:00:00', remarks: 'Approved - within zoning limits', officer: 'Rajesh M' },
      { status: 'Completed', date: '', remarks: '' },
    ],
    documents: ['Site Plan', 'Building Plan', 'NOC Fire', 'NOC Environment', 'Ownership Proof'],
  },
  {
    id: 'sr4', applicationId: 'LS-2025-00312', ulpin: 'TN-CBE-PE-57431028', parcelId: 'p8',
    serviceName: 'Encumbrance Certificate', serviceCategory: 'Transactions',
    applicantName: 'Selvam R', applicantId: 'CIT-2024-3301',
    submittedDate: '2025-12-05', currentStatus: 'submitted',
    timeline: [
      { status: 'Submitted', date: '2025-12-05T08:20:00', remarks: 'Application for encumbrance certificate' },
      { status: 'Document Verification', date: '', remarks: '' },
      { status: 'Department Review', date: '', remarks: '' },
      { status: 'Field Verification', date: '', remarks: '' },
      { status: 'Approval', date: '', remarks: '' },
      { status: 'Completed', date: '', remarks: '' },
    ],
    documents: ['Aadhaar Card', 'Sale Deed Copy'],
  },
]

export const disputes: Dispute[] = [
  {
    id: 'd1', caseId: 'DIS-2025-TRZ-0421', ulpin: 'TN-TRZ-KK-45183627', parcelId: 'p4',
    parties: ['Lakshmi Devi P', 'Rajendran P'], disputeType: 'inheritance',
    court: 'District Court, Tiruchirappalli', judge: 'Hon. Justice Meena S',
    status: 'active', filedDate: '2025-06-15', lastHearing: '2025-11-20',
    nextHearing: '2026-01-15', priority: 'high',
  },
  {
    id: 'd2', caseId: 'DIS-2024-MDU-0198', ulpin: 'TN-MDU-VK-21958374', parcelId: 'p7',
    parties: ['Madurai Industrial Park Pvt Ltd', 'Neighbouring Landowner'], disputeType: 'boundary',
    court: 'Taluk Court, Madurai South', judge: 'Revenue Officer K. Balaji',
    status: 'resolved', filedDate: '2024-03-10', lastHearing: '2024-09-05',
    nextHearing: '', priority: 'medium',
  },
  {
    id: 'd3', caseId: 'DIS-2025-CHN-0087', ulpin: 'TN-CHN-PM-72618345', parcelId: 'p2',
    parties: ['Meenakshi Sundaram Ltd', 'Municipal Corporation Chennai'], disputeType: 'encroachment',
    court: 'High Court of Madras', judge: 'Hon. Justice Ravi Chandran',
    status: 'under_review', filedDate: '2025-08-22', lastHearing: '2025-12-01',
    nextHearing: '2026-02-10', priority: 'high',
  },
]

export const buildingPermissions: BuildingPermission[] = [
  { id: 'bp1', applicationNumber: 'BP-2025-CHD-0042', ulpin: 'CH-CHD-SE-05839271', parcelId: 'p5', applicantName: 'Gupta Family Trust', buildingType: 'Residential G+2', proposedArea: 2400, floors: 3, status: 'approved', submittedDate: '2025-11-10', approvedDate: '2025-12-08' },
  { id: 'bp2', applicationNumber: 'BP-2025-MDU-0078', ulpin: 'TN-MDU-RV-38472916', parcelId: 'p1', applicantName: 'Ramanathan K', buildingType: 'Residential Extension', proposedArea: 800, floors: 1, status: 'pending', submittedDate: '2025-12-01' },
  { id: 'bp3', applicationNumber: 'BP-2025-CBE-0115', ulpin: 'TN-CBE-PE-57431028', parcelId: 'p8', applicantName: 'Selvam R', buildingType: 'Commercial Complex', proposedArea: 5200, floors: 5, status: 'under_review', submittedDate: '2025-11-25' },
  { id: 'bp4', applicationNumber: 'BP-2025-CHN-0031', ulpin: 'TN-CHN-AD-68294015', parcelId: 'p6', applicantName: 'TN State Government', buildingType: 'Government Office', proposedArea: 12000, floors: 6, status: 'approved', submittedDate: '2025-06-15', approvedDate: '2025-09-30' },
  { id: 'bp5', applicationNumber: 'BP-2025-TRZ-0056', ulpin: 'TN-TRZ-ML-74029586', parcelId: 'p10', applicantName: 'Forest Department', buildingType: 'Forest Check Post', proposedArea: 300, floors: 1, status: 'rejected', submittedDate: '2025-04-10' },
]

export const departments: Department[] = [
  { id: 'dept1', name: 'Revenue Department', shortName: 'Revenue', connected: true, latency: 42, lastSync: '2025-12-12T10:30:00', recordsSynced: 1247893, apiVersion: 'v2.1' },
  { id: 'dept2', name: 'Registration Department', shortName: 'Registration', connected: true, latency: 38, lastSync: '2025-12-12T10:28:00', recordsSynced: 892341, apiVersion: 'v1.8' },
  { id: 'dept3', name: 'Municipal Corporation', shortName: 'Municipality', connected: true, latency: 65, lastSync: '2025-12-12T09:45:00', recordsSynced: 534210, apiVersion: 'v1.5' },
  { id: 'dept4', name: 'Town Planning Department', shortName: 'Planning', connected: true, latency: 51, lastSync: '2025-12-12T10:15:00', recordsSynced: 312654, apiVersion: 'v2.0' },
  { id: 'dept5', name: 'Property Tax Department', shortName: 'Taxation', connected: true, latency: 29, lastSync: '2025-12-12T10:32:00', recordsSynced: 987123, apiVersion: 'v2.3' },
  { id: 'dept6', name: 'Public Works Department', shortName: 'Utilities', connected: true, latency: 78, lastSync: '2025-12-12T08:00:00', recordsSynced: 421987, apiVersion: 'v1.2' },
  { id: 'dept7', name: 'Environment & Forest Department', shortName: 'Environment', connected: true, latency: 92, lastSync: '2025-12-11T22:00:00', recordsSynced: 156789, apiVersion: 'v1.0' },
  { id: 'dept8', name: 'Judiciary / Courts', shortName: 'Courts', connected: false, latency: 0, lastSync: '2025-12-08T18:00:00', recordsSynced: 78234, apiVersion: 'v0.9' },
]

export const auditLogs: AuditLog[] = [
  { id: 'al1', timestamp: '2025-12-12T10:32:15', userId: 'u1', userName: 'Suresh B', department: 'Revenue', action: 'Viewed Parcel Profile', target: 'Parcel', targetId: 'TN-MDU-RV-38472916', ip: '10.0.1.45', result: 'success' },
  { id: 'al2', timestamp: '2025-12-12T10:28:42', userId: 'u2', userName: 'Kavitha S', department: 'Revenue', action: 'Approved Mutation', target: 'Service Request', targetId: 'LS-2025-00203', ip: '10.0.1.52', result: 'success' },
  { id: 'al3', timestamp: '2025-12-12T10:15:00', userId: 'u3', userName: 'Rajesh M', department: 'Planning', action: 'Reviewed Building Permission', target: 'Building Permission', targetId: 'BP-2025-CHD-0042', ip: '10.0.2.18', result: 'success' },
  { id: 'al4', timestamp: '2025-12-12T09:55:33', userId: 'u4', userName: 'Ramanathan K', department: 'Citizen', action: 'Submitted Service Request', target: 'Service Request', targetId: 'LS-2025-00312', ip: '192.168.1.105', result: 'success' },
  { id: 'al5', timestamp: '2025-12-12T09:42:18', userId: 'admin1', userName: 'System Admin', department: 'Administration', action: 'API Key Rotated', target: 'System', targetId: 'api-key-revenue', ip: '10.0.0.10', result: 'success' },
  { id: 'al6', timestamp: '2025-12-12T09:30:05', userId: 'u5', userName: 'Amit P', department: 'Planning', action: 'Failed Login Attempt', target: 'Auth', targetId: 'amit.p@planning.gov.in', ip: '203.0.113.42', result: 'failure' },
  { id: 'al7', timestamp: '2025-12-12T09:15:00', userId: 'u6', userName: 'Lakshmi Devi P', department: 'Citizen', action: 'Downloaded RoR', target: 'Document', targetId: 'TN-TRZ-KK-45183627', ip: '172.16.0.88', result: 'success' },
  { id: 'al8', timestamp: '2025-12-12T08:45:22', userId: 'system', userName: 'System', department: 'System', action: 'Data Sync Completed', target: 'Registration API', targetId: 'batch-2025-12-12', ip: '10.0.0.1', result: 'success' },
]

export const notifications: Notification[] = [
  { id: 'n1', title: 'Ownership Verification Completed', message: 'Verification for parcel TN-MDU-RV-38472916 has been completed successfully.', type: 'success', timestamp: '2025-12-12T10:30:00', read: false, link: '/parcel/p1' },
  { id: 'n2', title: 'New Registration Pending', message: 'Registration DOC-2024-MDU-8841 requires attention.', type: 'info', timestamp: '2025-12-12T09:45:00', read: false, link: '/registration' },
  { id: 'n3', title: 'Building Permission Approved', message: 'BP-2025-CHD-0042 has been approved by the Planning Department.', type: 'success', timestamp: '2025-12-12T08:00:00', read: true, link: '/building-permissions' },
  { id: 'n4', title: 'AI Anomaly Detected', message: 'Potential unauthorized development detected on parcel TN-CHN-PM-72618345.', type: 'warning', timestamp: '2025-12-11T22:15:00', read: false, link: '/ai-insights' },
  { id: 'n5', title: 'Data Synchronization Complete', message: 'Revenue Department data sync completed. 1,247,893 records updated.', type: 'info', timestamp: '2025-12-11T20:00:00', read: true },
  { id: 'n6', title: 'Service Request Requires Action', message: 'LS-2025-00203 needs department review approval.', type: 'warning', timestamp: '2025-12-11T16:30:00', read: false, link: '/applications' },
]

export const aiInsights: AIInsight[] = [
  { id: 'ai1', type: 'change_detection', title: 'Potential Unauthorized Development', description: 'Satellite imagery from 2025-11-28 shows a 23% increase in built-up area on this parcel compared to the previous observation. No building permission on record.', ulpin: 'TN-CHN-PM-72618345', parcelId: 'p2', confidence: 91, severity: 'high', date: '2025-12-01', status: 'new' },
  { id: 'ai2', type: 'ownership_anomaly', title: 'Ownership Inconsistency Detected', description: 'The ownership records show a joint ownership claim that conflicts with the registration data from 2021. Manual verification recommended.', ulpin: 'TN-TRZ-KK-45183627', parcelId: 'p4', confidence: 78, severity: 'medium', date: '2025-11-28', status: 'investigating' },
  { id: 'ai3', type: 'encroachment', title: 'Possible Boundary Encroachment', description: 'GPS survey data indicates the physical boundary may extend 1.2m beyond the recorded boundary on the northern edge.', ulpin: 'TN-MDU-VK-21958374', parcelId: 'p7', confidence: 65, severity: 'medium', date: '2025-11-25', status: 'new' },
  { id: 'ai4', type: 'land_use_change', title: 'Land Use Classification Mismatch', description: 'Parcel appears to be used commercially but is registered under agricultural zoning. Recommend reclassification review.', ulpin: 'TN-CBE-GN-91527483', parcelId: 'p3', confidence: 84, severity: 'high', date: '2025-11-20', status: 'investigating' },
  { id: 'ai5', type: 'fraud_risk', title: 'Transaction Requires Additional Verification', description: 'Rapid succession of transactions on this parcel within 6 months flagged by fraud detection model. Recommended for manual review.', ulpin: 'CH-CHD-SE-05839271', parcelId: 'p5', confidence: 72, severity: 'high', date: '2025-11-18', status: 'new' },
]
