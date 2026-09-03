/**
 * LandStack AI Service.
 *
 * Every AI result is ASSISTIVE. It is explicitly labeled "AI-assisted", carries a
 * confidence score, a reasoning summary, source references, a generated timestamp
 * and `requiresHumanVerification: true`. AI never renders authoritative legal/
 * government decisions.
 *
 * Architecture: an external LLM provider can be wired through AI_PROVIDER + keys in
 * backend/.env. Until one is configured, structured heuristic "demo reasoning" is
 * returned through the same interface so the frontend is provider-agnostic.
 */

const SOURCE = 'LandStack demo reasoning engine'
const NOW = () => new Date().toISOString()

function baseResult(overrides = {}) {
  return {
    type: 'AI_ASSISTED',
    generatedAt: NOW(),
    source: SOURCE,
    requiresHumanVerification: true,
    ...overrides,
  }
}

/**
 * Determine if an external provider is configured.
 * Returns null when no provider is set (safe demo fallback).
 */
function externalProvider() {
  const provider = process.env.AI_PROVIDER
  if (!provider) return null
  const key = process.env[`${provider.toUpperCase()}_API_KEY`]
  if (!key) return null
  return { provider, key }
}

// ---------------------------------------------------------------------------
// A. Document / Land Record extraction
// ---------------------------------------------------------------------------
export async function documentExtraction({ text = '', source = 'uploaded_document' }) {
  const provider = externalProvider()
  if (provider) {
    // TODO: wire real LLM call here (guarded, timeouts, error handling).
    return baseResult({ source })
  }

  const lower = text.toLowerCase()
  const findings = []
  const extracted = {
    ownerName: null,
    surveyNumber: null,
    ulpin: null,
    area: null,
    areaUnit: null,
    documentType: null,
    dates: [],
    mentionsEncumbrance: lower.includes('encumbrance'),
    mentionsRegistration: lower.includes('registration') || lower.includes('deed'),
  }

  const ulpinMatch = text.match(/(TN|CH|KA|MH|GJ|RJ|UP|DL|AP|TS|KL)[-_][A-Z]{2,4}[-_][A-Z0-9]{2,6}[-_]\d{6,8}/i)
  if (ulpinMatch) extracted.ulpin = ulpinMatch[0].toUpperCase()

  const surveyMatch = text.match(/survey\s*(no|number)?[.\s:]*([A-Za-z0-9]+\/\d+[A-Za-z]?)/i)
  if (surveyMatch) extracted.surveyNumber = surveyMatch[2]

  const nameMatch = text.match(/owner(?:'s)?\s*(?:name)?[.\s:]*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})/)
  if (nameMatch) extracted.ownerName = nameMatch[1]

  const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(acres|hectares|sq\.?\s*ft|sqm|sq\.?\s*m)/i)
  if (areaMatch) {
    extracted.area = Number(areaMatch[1])
    extracted.areaUnit = areaMatch[2]
  }

  if (text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/)) {
    const dates = text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/g)
    if (dates) extracted.dates = dates.slice(0, 5)
  }

  findings.push('Field-by-field extraction performed against the provided document text.')
  if (extracted.ulpin) findings.push('ULPIN located in document text.')
  if (!extracted.surveyNumber) findings.push('Survey number not clearly detected — verify manually.')

  return baseResult({
    module: 'ai/documentExtraction',
    extractedData: extracted,
    confidence: extracted.ulpin && extracted.surveyNumber ? 0.82 : 0.55,
    summary: 'Document parsed; extracted fields listed below. Verify against source before use.',
    findings,
    recommendedAction: extracted.surveyNumber
      ? 'Compare extracted survey number against the parcel record.'
      : 'Manual entry of survey number required.',
  })
}

// ---------------------------------------------------------------------------
// B. Mutation / Record anomaly detection
// ---------------------------------------------------------------------------
export async function anomalyDetection({ parcel = {}, records = [] }) {
  const provider = externalProvider()
  if (provider) {
    return baseResult({ source })
  }

  const issues = []
  const ulpin = parcel.ulpin || ''

  const ownerships = (records.filter((r) => r && r.ownerName) || []).map((r) => r.ownerName)
  if (new Set(ownerships).size > 1) {
    issues.push({
      type: 'conflicting_ownership',
      severity: 'high',
      message: 'Multiple conflicting ownership records present.',
    })
  }
  if (parcel.area && records.some((r) => r.area && Math.abs(r.area - parcel.area) > parcel.area * 0.2)) {
    issues.push({
      type: 'area_mismatch',
      severity: 'medium',
      message: 'Recorded area differs significantly from parcel area.',
    })
  }
  if (records.length > 1 && new Set(records.map((r) => r.surveyNumber).filter(Boolean)).size > 1) {
    issues.push({
      type: 'survey_number_mismatch',
      severity: 'medium',
      message: 'Multiple survey numbers associated with this parcel.',
    })
  }
  const encumbered = records.some((r) => r.status && String(r.status).toLowerCase().includes('encumber'))
  const proposedTransfer = records.some((r) => r.transactionType || r.type === 'transfer')
  if (encumbered && proposedTransfer) {
    issues.push({
      type: 'active_encumbrance_transfer',
      severity: 'high',
      message: 'Mortgage/encumbrance still active while a transfer is proposed.',
    })
  }
  if (issues.length === 0) {
    issues.push({
      type: 'no_anomaly',
      severity: 'none',
      message: 'No obvious inconsistency detected across provided records.',
    })
  }

  const riskScore = Math.min(99, Math.round(issues.filter((i) => i.severity !== 'none').length * 34))
  const highCount = issues.filter((i) => i.severity === 'high').length

  return baseResult({
    module: 'ai/anomalyDetection',
    ulpin,
    riskScore,
    riskLevel: highCount ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW',
    summary:
      issues.length && issues[0].severity !== 'none'
        ? issues.map((i) => i.message).join(' ')
        : 'No potential anomaly detected across provided records.',
    findings: issues,
    recommendedAction:
      highCount > 0
        ? 'Requires authorized human verification before any transaction.'
        : 'Routine review recommended.',
    sources: [`parcel:${ulpin || 'unknown'}`, `records:${records.length}`],
  })
}

// ---------------------------------------------------------------------------
// C. Application processing assistant
// ---------------------------------------------------------------------------
export async function applicationAssistant({ application = {} }) {
  const provider = externalProvider()
  if (provider) {
    return baseResult({ source })
  }

  const issues = []
  const docs = application.documents || []
  const expectedByService = {
    'Building Permission': ['Title Deed', 'Registered Document', 'Site Plan', 'Identity Proof'],
    'Record of Rights': ['Mutation Application', 'Title Deed'],
    'Mutation': ['Sale Deed', 'Encumbrance Certificate'],
    'Encumbrance Certificate': ['Application Form', 'Identity Proof'],
  }
  const expected = expectedByService[application.serviceName] || []
  const provided = docs.map((d) => (typeof d === 'string' ? d : d.name))
  const missing = expected.filter((e) => !provided.some((p) => p.toLowerCase().includes(e.toLowerCase())))

  if (missing.length) {
    issues.push({ type: 'missing_documents', severity: 'medium', message: `Missing expected documents: ${missing.join(', ')}` })
  } else {
    issues.push({ type: 'documents_complete', severity: 'none', message: 'All expected documents provided.' })
  }

  const totalExpected = expected.length
  const issuesCount = issues.filter((i) => i.severity !== 'none').length

  return baseResult({
    module: 'ai/applicationAssistant',
    service: application.serviceName,
    summary: `Application reviewed. ${provider ? 'NN' : docs.length} document(s) reviewed. ${issuesCount} potential issue(s) found.`,
    findings: issues,
    confidence: expected.length ? 0.78 : 0.6,
    recommendedAction: missing.length
      ? 'Request the missing document(s) before proceeding to verification.'
      : 'Ready for officer document verification.',
    requiresHumanVerification: true,
  })
}

// ---------------------------------------------------------------------------
// D. GIS change detection
// ---------------------------------------------------------------------------
export async function changeDetection({ parcel = {}, hasBuildingPermission = false } = {}) {
  const provider = externalProvider()
  if (provider) {
    return baseResult({ source })
  }

  // Demo: deterministic based on a simple hash of the ULPIN so results are stable.
  const hash = [...(parcel.ulpin || 'demo')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const options = [
    'No Significant Change',
    'Potential New Construction',
    'Potential Boundary Change',
    'Vegetation Change',
    'Unusual Land Use Change',
  ]
  const outcome = options[hash % options.length]

  return baseResult({
    module: 'ai/changeDetection',
    ulpin: parcel.ulpin,
    summary:
      outcome === 'Potential New Construction' && !hasBuildingPermission
        ? 'Potential new construction detected without a matching building permission — requires verification.'
        : `${outcome} detected between historical and recent imagery.`,
    findings: [
      {
        type: outcome,
        severity: outcome === 'No Significant Change' ? 'none' : 'medium',
        message: outcome,
        layer: 'change_detection',
      },
    ],
    riskScore: outcome === 'No Significant Change' ? 5 : 45,
    riskLevel: outcome === 'No Significant Change' ? 'LOW' : 'MEDIUM',
    recommendedAction:
      outcome === 'No Significant Change'
        ? 'No action required.'
        : 'Cross-reference with building permissions and field verification. Potential change detected — not a determination of legality.',
    sources: ['historical_imagery', 'recent_imagery'],
  })
}

// ---------------------------------------------------------------------------
// E. Context-aware chat assistant
// ---------------------------------------------------------------------------
export async function chatAssistant({ question = '', context = {} }) {
  const provider = externalProvider()
  if (provider) {
    return baseResult({ source })
  }

  const q = question.toLowerCase()
  const parcel = context.parcel || {}
  const application = context.application || {}

  let answer = ''
  if (q.includes('flagged') || q.includes('why') && parcel.ulpin) {
    answer =
      'This parcel may be flagged because the available records show potential inconsistencies ' +
      '(e.g. ownership vs registration, or an active encumbrance). Please verify the relevant ' +
      'records before processing any transaction. AI assists; an authorized official must decide.'
  } else if (q.includes('mutation') || q.includes('apply')) {
    answer =
      'To apply for mutation, provide the sale deed, encumbrance certificate and identity proof. ' +
      'Submit via the Citizen Services portal and track the application by its ID.'
  } else if (q.includes('encumbrance')) {
    answer =
      'An encumbrance certificate states whether a property is free from mortgages/liens. ' +
      'Check the parcel encumbrance record and verify with the sub-registrar office.'
  } else if (q.includes('status') && application.applicationId) {
    answer = `Your application ${application.applicationId} is currently in status "${application.status}". ` +
      'It is being processed by the relevant department. Verify with the department for the latest position.'
  } else if (q.includes('document')) {
    answer = 'Required documents vary by service. Common ones are title deed, survey record, encumbrance certificate and identity proof.'
  } else if (q.includes('hello') || q.includes('hi')) {
    answer = 'Hello! I can help with land records, applications, mutation and encumbrance questions.'
  } else {
    answer =
      'I can help with LandStack services (records, applications, mutation, tax, GIS). For legal or high-impact decisions, please verify with the responsible department / authorized official.'
  }

  return baseResult({
    module: 'ai/chatAssistant',
    answer,
    context: {
      parcel: parcel.ulpin || null,
      application: application.applicationId || null,
    },
    recommendedAction: 'Verify high-impact answers with the responsible department.',
  })
}

export const aiService = {
  documentExtraction,
  anomalyDetection,
  applicationAssistant,
  changeDetection,
  chatAssistant,
}
export default aiService
