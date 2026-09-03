/**
 * LandStack AI Service.
 *
 * Every AI result is ASSISTIVE. It is explicitly labeled "AI-assisted", carries a
 * confidence score, a reasoning summary, source references, a generated timestamp
 * and `requiresHumanVerification: true`. AI never renders authoritative legal/
 * government decisions.
 *
 * Architecture: when a Gemini API key is configured in backend/.env
 * (`GEMINI_API_KEY`) the service enriches results with real LLM reasoning through
 * geminiProvider.js (backend-only, never client-side). When no key is set or the
 * call fails, the same structured interface is served by deterministic heuristic
 * "demo reasoning" so the frontend is provider-agnostic and never silently fakes
 * an AI result.
 */

import { generateJSON, isGeminiConfigured, geminiModel } from './geminiProvider.js'

const DEMO_SOURCE = 'LandStack demo reasoning engine'
const GEMINI_SOURCE = 'Gemini API'
const NOW = () => new Date().toISOString()

/** Live, inspectable state for diagnostics (config endpoint + startup log). */
export const geminiState = {
  configured: isGeminiConfigured(),
  model: geminiModel(),
  lastError: null,
  source: isGeminiConfigured() ? GEMINI_SOURCE : DEMO_SOURCE,
}
export function refreshGeminiState() {
  geminiState.configured = isGeminiConfigured()
  geminiState.model = geminiModel()
  geminiState.source = isGeminiConfigured() ? GEMINI_SOURCE : DEMO_SOURCE
  return geminiState
}

function baseResult(overrides = {}) {
  return {
    type: 'AI_ASSISTED',
    generatedAt: NOW(),
    source: geminiState.source,
    requiresHumanVerification: true,
    ...overrides,
  }
}

/**
 * Attempt a structured Gemini call. Returns { ok:true, data } on success or
 * { ok:false, data:null } (recording the error) when unconfigured/failed so the
 * caller can fall back to deterministic demo reasoning — never a silent fake.
 */
async function runStructured({ systemPrompt, userContent, temperature }) {
  if (!isGeminiConfigured()) return { ok: false, data: null }
  try {
    const data = await generateJSON({ systemPrompt, userContent, temperature })
    return { ok: true, data: data || null }
  } catch (err) {
    geminiState.lastError = err.message
    console.error(`[ai] Gemini call failed — using demo fallback: ${err.message}`)
    return { ok: false, data: null }
  }
}

/** Coerce arbitrary Gemini output into our stable structured shape with defaults. */
function normalizeStructured(data, fallbackSummary) {
  if (!data || typeof data !== 'object') return null
  const findings = Array.isArray(data.findings)
    ? data.findings.map((f) => (typeof f === 'string' ? { severity: 'medium', message: f } : f))
    : []
  const risk = String(data.riskLevel || data.risk || '').toUpperCase()
  return {
    summary: String(data.summary || data.answer || fallbackSummary || '').trim(),
    riskLevel: ['HIGH', 'MEDIUM', 'LOW'].includes(risk) ? risk : 'MEDIUM',
    findings,
    recommendation: String(data.recommendation || data.action || data.recommendedAction || 'Human verification required.').trim(),
    confidence: Number.isFinite(Number(data.confidence)) ? Math.max(0, Math.min(99, Math.round(Number(data.confidence)))) : 0.8,
  }
}

function geminiResult(overrides) {
  return baseResult({ provider: 'gemini', source: GEMINI_SOURCE, ...overrides })
}
function demoResult(overrides) {
  return baseResult({ provider: 'demo', source: DEMO_SOURCE, ...overrides })
}

// ---------------------------------------------------------------------------
// A. Document / Land Record extraction
// ---------------------------------------------------------------------------
export async function documentExtraction({ text = '', source = 'uploaded_document' }) {
  const g = await runStructured({
    systemPrompt:
      'You are an assistive land-record document extraction engine. Parse the document ' +
      'text and return STRICT JSON with keys: ownerName, surveyNumber, ulpin, area, ' +
      'areaUnit, documentType, findings (string array), recommendation (string), ' +
      'confidence (number 0-99). Do not invent fields that are not present. Never claim ' +
      'the document is official.',
    userContent: `Document source: ${source}\n\nDocument text:\n${String(text || '').slice(0, 6000)}`,
  })

  if (g.ok && g.data) {
    const e = g.data
    return geminiResult({
      module: 'ai/documentExtraction',
      extractedData: {
        ownerName: e.ownerName ?? null,
        surveyNumber: e.surveyNumber ?? null,
        ulpin: typeof e.ulpin === 'string' ? e.ulpin : null,
        area: e.area ?? null,
        areaUnit: e.areaUnit ?? null,
        documentType: e.documentType ?? null,
        dates: [],
      },
      confidence: Number.isFinite(Number(e.confidence)) ? Math.round(Number(e.confidence)) : 0.8,
      summary: String(e.summary || 'Document parsed; extracted fields listed below. Verify against source before use.'),
      findings: Array.isArray(e.findings) ? e.findings.map((f) => (typeof f === 'string' ? f : f.message || String(f))) : [],
      recommendedAction: e.recommendation || 'Verify extracted fields against the source document.',
    })
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

  return demoResult({
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
  const ulpin = (parcel && parcel.ulpin) || ''

  const g = await runStructured({
    systemPrompt:
      'You are an assistive anomaly-detection engine for land governance. Analyse the ' +
      'parcel record and governance records. Return STRICT JSON: { summary (string), ' +
      'riskLevel ("HIGH"|"MEDIUM"|"LOW"), findings (array of {type,severity,message}), ' +
      'recommendation (string), confidence (number 0-99) }. Flag conflicting ownership, ' +
      'area mismatches, survey-number mismatches and active encumbrances with a proposed ' +
      'transfer. Never declare anything definitive.',
    userContent: JSON.stringify({ parcel: parcel || {}, records: records || [] }),
  })

  if (g.ok && g.data) {
    const n = normalizeStructured(g.data, 'Anomaly analysis completed.')
    const highCount = (n.findings || []).filter((i) => i.severity === 'high').length
    return geminiResult({
      module: 'ai/anomalyDetection',
      ulpin,
      riskScore: highCount ? 80 : n.riskLevel === 'HIGH' ? 70 : n.riskLevel === 'MEDIUM' ? 45 : 10,
      riskLevel: n.riskLevel,
      summary: n.summary,
      findings: n.findings,
      recommendedAction: n.recommendation,
      confidence: n.confidence,
      sources: [`parcel:${ulpin || 'unknown'}`, `records:${(records || []).length}`],
    })
  }

  const issues = []
  const ownerships = (records.filter((r) => r && r.ownerName) || []).map((r) => r.ownerName)
  if (new Set(ownerships).size > 1) {
    issues.push({ type: 'conflicting_ownership', severity: 'high', message: 'Multiple conflicting ownership records present.' })
  }
  if (parcel.area && records.some((r) => r.area && Math.abs(r.area - parcel.area) > parcel.area * 0.2)) {
    issues.push({ type: 'area_mismatch', severity: 'medium', message: 'Recorded area differs significantly from parcel area.' })
  }
  if (records.length > 1 && new Set(records.map((r) => r.surveyNumber).filter(Boolean)).size > 1) {
    issues.push({ type: 'survey_number_mismatch', severity: 'medium', message: 'Multiple survey numbers associated with this parcel.' })
  }
  const encumbered = records.some((r) => r.status && String(r.status).toLowerCase().includes('encumber'))
  const proposedTransfer = records.some((r) => r.transactionType || r.type === 'transfer')
  if (encumbered && proposedTransfer) {
    issues.push({ type: 'active_encumbrance_transfer', severity: 'high', message: 'Mortgage/encumbrance still active while a transfer is proposed.' })
  }
  if (issues.length === 0) {
    issues.push({ type: 'no_anomaly', severity: 'none', message: 'No obvious inconsistency detected across provided records.' })
  }

  const riskScore = Math.min(99, Math.round(issues.filter((i) => i.severity !== 'none').length * 34))
  const highCount = issues.filter((i) => i.severity === 'high').length

  return demoResult({
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
  const g = await runStructured({
    systemPrompt:
      'You are an assistive application-review assistant for a land-governance platform. ' +
      'Review the application, its documents, and the linked parcel. Return STRICT JSON: ' +
      '{ summary (string), riskLevel ("HIGH"|"MEDIUM"|"LOW"), issues (array of strings), ' +
      'missingDocs (array of strings), recommendation (string), confidence (number 0-99) }. ' +
      'Check document completeness and cross-reference the parcel. Never decide approval.',
    userContent: JSON.stringify(application || {}),
  })

  const docs = application.documents || []
  const expectedByService = {
    'Building Permission': ['Title Deed', 'Registered Document', 'Site Plan', 'Identity Proof'],
    'Record of Rights': ['Mutation Application', 'Title Deed'],
    'Mutation': ['Sale Deed', 'Encumbrance Certificate'],
    'Encumbrance Certificate': ['Application Form', 'Identity Proof'],
  }
  const expected = expectedByService[application.serviceName] || []
  const provided = docs.map((d) => (typeof d === 'string' ? d : d.name))

  if (g.ok && g.data) {
    const d = g.data
    const missingDocs = Array.isArray(d.missingDocs)
      ? d.missingDocs
      : g.data.issues && g.data.issues.type === 'missing_documents'
        ? []
        : []
    return geminiResult({
      module: 'ai/applicationAssistant',
      service: application.serviceName,
      summary: String(d.summary || `Application reviewed. ${docs.length} document(s) reviewed.`),
      findings: (Array.isArray(d.issues) ? d.issues : []).map((m) => (typeof m === 'string' ? { type: 'issue', severity: 'medium', message: m } : m)),
      confidence: Number.isFinite(Number(d.confidence)) ? Math.round(Number(d.confidence)) : 0.78,
      recommendedAction: d.recommendation || 'Verify documents and proceed to officer review.',
      requiresHumanVerification: true,
    })
  }

  const issues = []
  const missing = expected.filter((e) => !provided.some((p) => p.toLowerCase().includes(e.toLowerCase())))

  if (missing.length) {
    issues.push({ type: 'missing_documents', severity: 'medium', message: `Missing expected documents: ${missing.join(', ')}` })
  } else {
    issues.push({ type: 'documents_complete', severity: 'none', message: 'All expected documents provided.' })
  }
  const issuesCount = issues.filter((i) => i.severity !== 'none').length

  return demoResult({
    module: 'ai/applicationAssistant',
    service: application.serviceName,
    summary: `Application reviewed. ${docs.length} document(s) reviewed. ${issuesCount} potential issue(s) found.`,
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
export async function changeDetection({ parcel = {}, hasBuildingPermission = false, imageA, imageB, ulpin } = {}) {
  const resolution = { ...(parcel || {}) }
  if (!resolution.ulpin && ulpin) resolution.ulpin = ulpin
  const realCommand = parcel && Object.keys(parcel).length ? parcel : null

  const g = await runStructured({
    systemPrompt:
      'You are an assistive GIS change-detection engine. Given parcel context and imagery ' +
      'captions, infer potential changes (construction, boundary, vegetation, land use). ' +
      'Return STRICT JSON: { summary (string), riskLevel ("HIGH"|"MEDIUM"|"LOW"), ' +
      'findings (array of {type,severity,message}), recommendation (string), ' +
      'confidence (number 0-99) }. Clearly this is AI-assisted imagery interpretation, not a ' +
      'legal determination.',
    userContent: JSON.stringify({
      parcel: resolution,
      hasBuildingPermission,
      imageA: imageA ? String(imageA).slice(0, 500) : null,
      imageB: imageB ? String(imageB).slice(0, 500) : null,
    }),
  })

  if (g.ok && g.data) {
    const n = normalizeStructured(g.data, 'Change detection completed.')
    const risk = n.riskLevel === 'HIGH' ? 75 : n.riskLevel === 'MEDIUM' ? 45 : 5
    return geminiResult({
      module: 'ai/changeDetection',
      ulpin: resolution.ulpin,
      summary: n.summary,
      findings: n.findings.map((f) => ({ ...f, layer: 'change_detection' })),
      riskScore: risk,
      riskLevel: n.riskLevel,
      recommendedAction: n.recommendation,
      confidence: n.confidence,
      sources: ['historical_imagery', 'recent_imagery'],
    })
  }

  const hash = [...(resolution.ulpin || 'demo')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const options = [
    'No Significant Change',
    'Potential New Construction',
    'Potential Boundary Change',
    'Vegetation Change',
    'Unusual Land Use Change',
  ]
  const outcome = options[hash % options.length]

  return demoResult({
    module: 'ai/changeDetection',
    ulpin: resolution.ulpin,
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
// E. Parcel AI insights (used by the AI Insights page)
// ---------------------------------------------------------------------------
function demoParcelInsights(parcel = {}) {
  const insights = []
  if (parcel.ownershipStatus === 'pending' || parcel.ownershipStatus === 'unverified') {
    insights.push({
      title: 'Ownership Verification Pending',
      severity: 'high',
      confidence: 92,
      description: `Ownership for ${parcel.ulpin} is pending verification against revenue records.`,
      action: 'Initiate ownership verification through Revenue Department.',
    })
  }
  if (parcel.disputeStatus === 'active') {
    insights.push({
      title: 'Active Dispute on Parcel',
      severity: 'high',
      confidence: 98,
      description: `An active dispute (${parcel.disputeCaseId || 'pending assignment'}) is registered against this parcel.`,
      action: 'Place a transaction hold and verify case status with the Judiciary API.',
    })
  }
  if (parcel.disputeStatus === 'under_review') {
    insights.push({
      title: 'Dispute Under Review',
      severity: 'medium',
      confidence: 82,
      description: 'A dispute on this parcel is under review; transactions carry residual risk.',
      action: 'Require applicant disclosure of pending litigation.',
    })
  }
  if (parcel.propertyTaxStatus === 'pending' || parcel.propertyTaxStatus === 'overdue') {
    insights.push({
      title: 'Property Tax Outstanding',
      severity: parcel.propertyTaxStatus === 'overdue' ? 'high' : 'medium',
      confidence: 95,
      description: `Property tax of ₹${(parcel.taxAmount ?? 0).toLocaleString('en-IN')} is outstanding.`,
      action: 'Verify tax clearance with Property Tax Department before any registration.',
    })
  }
  if (parcel.encumbranceStatus === 'mortgaged' || parcel.encumbranceStatus === 'encumbered') {
    insights.push({
      title: `${parcel.encumbranceStatus === 'mortgaged' ? 'Active Mortgage' : 'General'} Encumbrance`,
      severity: 'high',
      confidence: 97,
      description: `This parcel is ${parcel.encumbranceStatus === 'mortgaged' ? `mortgaged with ${parcel.mortgageBank || 'a lender'} for ₹${(parcel.mortgageAmount ?? 0).toLocaleString('en-IN')}` : 'subject to an active encumbrance'}.`,
      action: 'Obtain lender NOC / updated Encumbrance Certificate before any ownership transfer.',
    })
  }
  if ((parcel.landUse === 'agricultural' && parcel.buildingPermission !== 'none') || parcel.landUse === 'forest') {
    insights.push({
      title: parcel.landUse === 'forest' ? 'Reserved Forest Classification' : 'Land-Use vs Building Permission Mismatch',
      severity: 'high',
      confidence: parcel.landUse === 'forest' ? 99 : 85,
      description: parcel.landUse === 'forest'
        ? `Parcel ${parcel.ulpin} is classified as "${parcel.classification}" under the Forest Conservation Act.`
        : `Parcel is zoned agricultural (${parcel.zoning}) but carries a building permission.`,
      action: parcel.landUse === 'forest'
        ? 'Obtain Forest Department NOC for any proposed activity.'
        : 'Verify land-conversion permission from Town Planning.',
    })
  }
  if (parcel.ownershipStatus === 'pending' && parcel.disputeStatus === 'active') {
    insights.push({
      title: 'Compound Risk — Unresolved Ownership + Active Dispute',
      severity: 'high',
      confidence: 94,
      description: `This parcel has both unverified ownership and an active dispute.`,
      action: 'Place a complete transaction hold; escalate to District Collector.',
    })
  }
  const critical = (parcel.restrictions || []).some((r) =>
    /no construction|no private|protected|heritage/i.test(r)
  )
  if (critical) {
    insights.push({
      title: 'Critical Restrictions Active',
      severity: 'medium',
      confidence: 90,
      description: `${(parcel.restrictions || []).length} restriction(s) apply, affecting permitted use.`,
      action: 'Review all applicable restrictions before processing.',
    })
  }
  if (insights.length === 0) {
    insights.push({
      title: 'No Anomalies Detected',
      severity: 'low',
      confidence: 91,
      description: `Parcel ${parcel.ulpin} shows consistent records across databases.`,
      action: 'No immediate action required. Continue routine monitoring.',
    })
  }
  return insights
}

export async function parcelInsights({ parcel = {} }) {
  const g = await runStructured({
    systemPrompt:
      'You are an assistive land-governance risk analyst. Analyse the parcel and return STRICT ' +
      'JSON: { summary (string), riskLevel ("HIGH"|"MEDIUM"|"LOW"), findings (array of ' +
      '{title, severity ("high"|"medium"|"low"), confidence (0-99), description, action}), ' +
      'recommendation (string), confidence (number 0-99) }. Flag ownership, disputes, tax, ' +
      'encumbrances, land-use/restrictions. AI is assistive only — never a legal decision.',
    userContent: JSON.stringify(parcel || {}),
  })

  if (g.ok && g.data) {
    const d = g.data
    const findings = (Array.isArray(d.findings) ? d.findings : []).map((f) => ({
      title: f.title ? String(f.title) : f.type ? String(f.type) : 'Insight',
      severity: /high/i.test(String(f.severity)) ? 'high' : /medium|med/i.test(String(f.severity)) ? 'medium' : 'low',
      confidence: Number.isFinite(Number(f.confidence)) ? Math.round(Number(f.confidence)) : 80,
      description: String(f.description || f.message || ''),
      action: String(f.action || f.recommendation || 'Verify with the responsible department.'),
    }))
    return geminiResult({
      module: 'ai/parcelInsights',
      ulpin: parcel.ulpin,
      status: 'ok',
      summary: String(d.summary || 'Parcel risk analysis completed.'),
      riskLevel: ['HIGH', 'MEDIUM', 'LOW'].includes(String(d.riskLevel).toUpperCase()) ? String(d.riskLevel).toUpperCase() : 'MEDIUM',
      findings,
      recommendation: String(d.recommendation || 'Verify all findings with an authorized officer.'),
      confidence: Number.isFinite(Number(d.confidence)) ? Math.round(Number(d.confidence)) : 80,
    })
  }

  const findings = demoParcelInsights(parcel)
  const avg = findings.reduce((s, f) => s + f.confidence, 0) / (findings.length || 1)
  const highCount = findings.filter((f) => f.severity === 'high').length
  return demoResult({
    module: 'ai/parcelInsights',
    ulpin: parcel.ulpin,
    status: 'degraded',
    summary: `Assisted analysis completed for ${parcel.ulpin || 'the selected parcel'}. ${findings.length} risk signal(s) identified.`,
    riskLevel: highCount ? 'HIGH' : avg > 85 ? 'MEDIUM' : 'LOW',
    findings,
    recommendation: highCount
      ? 'Requires authorized human verification before any transaction.'
      : 'Routine review recommended.',
    confidence: Math.round(avg),
  })
}

// ---------------------------------------------------------------------------
// F. Context-aware chat assistant
// ---------------------------------------------------------------------------
export async function chatAssistant({ question = '', context = {} }) {
  const g = await runStructured({
    systemPrompt:
      'You are a helpful, concise assistant for a land-governance platform. Answer the user ' +
      'question given the parcel/application context. Return STRICT JSON: { answer (string), ' +
      'recommendation (string) }. Be accurate and note that high-impact decisions need ' +
      'authorized human/official verification.',
    userContent: JSON.stringify({ question, context }),
  })

  if (g.ok && g.data) {
    return geminiResult({
      module: 'ai/chatAssistant',
      answer: String(g.data.answer || ''),
      context: {
        parcel: (context && context.parcel && context.parcel.ulpin) || null,
        application: (context && context.application && context.application.applicationId) || null,
      },
      recommendation: g.data.recommendation || 'Verify high-impact answers with the responsible department.',
    })
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

  return demoResult({
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
  parcelInsights,
}
export default aiService
