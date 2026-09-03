/**
 * DEMO governance record sets for the LandStack backend.
 *
 * These are SYNTHETIC, clearly-labelled demo records (flagged isDemo: true) served
 * so the UI has coherent labelled examples while a real cadastral/government
 * integration is wired in. They are NOT official government records.
 */

const US = { verified: 'verified' }

export const demoRecords = {
  landRecords: [
    { ulpin: 'TN-MDU-RV-38472916', surveyNumber: '123/4A', pattaNumber: 'PA-2024-0847', ownerName: 'Ramanathan K', ownershipType: 'self', area: 2.47, classification: 'Nanjangud', verificationStatus: 'digitally_verified', mutationHistory: [{ date: '2024-03-12', note: 'Title transferred from Krishnasamy K', officer: 'Suresh B' }], isDemo: true, ...US },
    { ulpin: 'TN-CHN-PM-72618345', surveyNumber: '56/2B', pattaNumber: 'PA-2023-1190', ownerName: 'Meenakshi R', ownershipType: 'self', area: 0.85, classification: 'Dry', verificationStatus: 'digitally_verified', mutationHistory: [], isDemo: true, ...US },
  ],
  registrations: [
    { ulpin: 'TN-MDU-RV-38472916', registrationId: 'REG-2201-77814', buyerName: 'Ramanathan K', sellerName: 'Krishnasamy K', transactionType: 'sale', amount: 4750000, registrationFee: 53500, documentNumber: '774/2024', subRegistrar: 'Madurai North', status: 'registered', date: '2024-03-12', isDemo: true, ...US },
    { ulpin: 'TN-CHN-PM-72618345', registrationId: 'REG-2201-55230', buyerName: 'Meenakshi R', sellerName: 'Anand V', transactionType: 'sale', amount: 8900000, registrationFee: 98200, documentNumber: '551/2023', subRegistrar: 'Tondiarpet', status: 'registered', date: '2023-11-02', isDemo: true, ...US },
  ],
  encumbrances: [
    { ulpin: 'TN-MDU-RV-38472916', status: 'clear', mortgageBank: null, mortgageAmount: null, releaseStatus: 'released', isDemo: true, ...US },
    { ulpin: 'TN-CHN-PM-72618345', status: 'mortgaged', mortgageBank: 'State Bank of India', mortgageAmount: 5500000, registrationDate: '2023-11-05', validity: '2028-11-05', releaseStatus: 'active', isDemo: true, ...US },
  ],
  buildingPermissions: [
    { ulpin: 'TN-MDU-RV-38472916', applicationNumber: 'BP-2024-0912', applicantName: 'Ramanathan K', buildingType: 'residential', proposedArea: 1200, floors: 2, status: 'approved', submittedDate: '2024-05-20', approvedDate: '2024-06-18', isDemo: true, ...US },
    { ulpin: 'TN-CBE-GN-91527483', applicationNumber: 'BP-2024-0345', applicantName: 'Farmers Co-op', buildingType: 'agricultural', proposedArea: 800, floors: 1, status: 'under_review', submittedDate: '2025-01-10', isDemo: true, ...US },
  ],
  landUses: [
    { ulpin: 'TN-MDU-RV-38472916', landUse: 'residential', zoning: 'R1', classification: 'Nanjangud', permittedUses: ['residential', 'home office'], restrictions: [], isDemo: true, ...US },
    { ulpin: 'TN-CHN-PM-72618345', landUse: 'commercial', zoning: 'C1', classification: 'Dry', permittedUses: ['commercial', 'retail'], restrictions: ['no high-rise beyond 15m'], isDemo: true, ...US },
  ],
  propertyTaxes: [
    { ulpin: 'TN-MDU-RV-38472916', propertyId: 'PT-4421', taxableValue: 5200000, annualTax: 18500, paidAmount: 18500, outstanding: 0, status: 'paid', lastPayment: '2025-04-01', history: [{ date: '2025-04-01', amount: 18500, receiptId: 'RCP-9910' }], isDemo: true, ...US },
    { ulpin: 'TN-CHN-PM-72618345', propertyId: 'PT-7780', taxableValue: 9800000, annualTax: 34200, paidAmount: 12000, outstanding: 22200, status: 'pending', lastPayment: null, history: [], isDemo: true, ...US },
  ],
  utilities: [
    { ulpin: 'TN-MDU-RV-38472916', electricity: true, water: true, sewerage: true, gas: true, telecom: true, roadDistance: 0.2, isDemo: true, ...US },
    { ulpin: 'TN-CBE-GN-91527483', electricity: true, water: false, sewerage: false, gas: false, telecom: false, roadDistance: 1.8, isDemo: true, ...US },
  ],
  restrictions: [
    { ulpin: 'TN-CBE-PE-57431028', type: 'environmental', description: 'Near water body — construction restrictions apply', authority: 'Environment Dept', status: 'active', isDemo: true, ...US },
    { ulpin: 'TN-TRZ-ML-74029586', type: 'forest', description: 'Classified forest land — no transfer', authority: 'Forest Dept', status: 'active', isDemo: true, ...US },
  ],
  disputes: [
    { ulpin: 'TN-TRZ-KK-45183627', caseId: 'DIS-2023-118', parties: ['Village Panchayat', 'R. Kumar'], disputeType: 'boundary', court: 'District Court, Trichy', judge: 'Hon. Judge V', status: 'active', priority: 'high', filedDate: '2023-07-14', lastHearing: '2025-02-20', nextHearing: '2025-06-10', isDemo: true, ...US },
  ],
}

export function demoFor(resource) {
  return demoRecords[resource] || []
}

export default demoRecords
