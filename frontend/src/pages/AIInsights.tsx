import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Brain,
  AlertTriangle,
  Search,
  FileSearch,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { searchParcels } from '@/data/parcels'
import { serviceRequests } from '@/data/services'
import type { Parcel, ServiceRequest } from '@/types'

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */

interface ParcelInsight {
  title: string
  description: string
  confidence: number
  severity: 'high' | 'medium' | 'low'
  action: string
}

interface AppReview {
  summary: string
  requiredDocs: string[]
  providedDocs: string[]
  missingDocs: string[]
  issues: string[]
  confidence: number
  recommendation: string
}

/* ------------------------------------------------------------------ */
/*  Deterministic parcel-insight generator                             */
/* ------------------------------------------------------------------ */

function computeParcelInsights(parcel: Parcel): ParcelInsight[] {
  const insights: ParcelInsight[] = []

  if (parcel.ownershipStatus === 'pending') {
    insights.push({
      title: 'Ownership Verification Pending',
      description: `Ownership for parcel ${parcel.ulpin} (${parcel.surveyNumber}, ${parcel.village}) is pending. Registered claimant "${parcel.ownerName}" has not been fully validated against revenue records.`,
      confidence: 92,
      severity: 'high',
      action: 'Initiate ownership verification through Revenue Department. Cross-check with sub-registrar records and Aadhaar authentication.',
    })
  }

  if (parcel.disputeStatus === 'active') {
    insights.push({
      title: 'Active Dispute on Parcel',
      description: `An active dispute (${parcel.disputeCaseId || 'pending assignment'}) is registered against this parcel. Any transaction, mutation, or permission may be affected by ongoing court proceedings.`,
      confidence: 98,
      severity: 'high',
      action: 'Place a transaction hold. Verify case status with Judiciary API before processing any application.',
    })
  }

  if (parcel.disputeStatus === 'under_review') {
    insights.push({
      title: 'Dispute Under Review',
      description: `A dispute involving this parcel is currently under judicial review. Transactions may proceed with caution but carry residual risk.`,
      confidence: 82,
      severity: 'medium',
      action: 'Monitor dispute status. Require applicant disclosure of pending litigation.',
    })
  }

  if (parcel.propertyTaxStatus === 'pending') {
    insights.push({
      title: 'Property Tax Outstanding',
      description: `Property tax of ₹${(parcel.taxAmount ?? 0).toLocaleString('en-IN')} is pending for this parcel. Outstanding tax may affect transaction eligibility and mutation applications.`,
      confidence: 95,
      severity: 'medium',
      action: 'Verify tax clearance with Property Tax Department. Flag for tax clearance certificate before any registration.',
    })
  }

  if (parcel.propertyTaxStatus === 'overdue') {
    insights.push({
      title: 'Property Tax Significantly Overdue',
      description: `Property tax is overdue beyond the grace period. This may indicate neglect, ownership dispute, or fraudulent occupation.`,
      confidence: 96,
      severity: 'high',
      action: 'Escalate to Tax Officer. Tax clearance certificate mandatory before processing any application.',
    })
  }

  if (parcel.encumbranceStatus === 'mortgaged') {
    insights.push({
      title: 'Active Mortgage Encumbrance',
      description: `This parcel is mortgaged with ${parcel.mortgageBank ?? 'a financial institution'} for ₹${(parcel.mortgageAmount ?? 0).toLocaleString('en-IN')}. Ownership transfer requires lender No-Objection Certificate.`,
      confidence: 97,
      severity: 'high',
      action: 'Request mortgage clearance certificate or bank NOC from the lending institution before any ownership transfer.',
    })
  }

  if (parcel.encumbranceStatus === 'encumbered') {
    insights.push({
      title: 'General Encumbrance Detected',
      description: `This parcel carries an active encumbrance that may restrict transfers. Details need verification with the Registration Department.`,
      confidence: 88,
      severity: 'medium',
      action: 'Obtain updated Encumbrance Certificate from the Sub-Registrar Office.',
    })
  }

  if (parcel.landUse === 'agricultural' && parcel.buildingPermission !== 'none') {
    insights.push({
      title: 'Land-Use vs Building Permission Mismatch',
      description: `Parcel is zoned agricultural (${parcel.zoning}) but carries a building permission (${parcel.buildingPermission}). This may indicate unauthorized non-agricultural conversion.`,
      confidence: 85,
      severity: 'high',
      action: 'Verify if land conversion permission was obtained from Town Planning. Check for Section 144 consent from Collector.',
    })
  }

  if (parcel.landUse === 'forest') {
    insights.push({
      title: 'Reserved Forest Classification',
      description: `Parcel is classified as "${parcel.classification}" under the Forest Conservation Act, 1980. Construction, deforestation, and private transaction are prohibited without Forest Department approval.`,
      confidence: 99,
      severity: 'high',
      action: 'Ensure Forest Department NOC is obtained for any proposed activity. Verify compliance with Forest Rights Act, 2006.',
    })
  }

  if (parcel.ownershipStatus === 'pending' && parcel.disputeStatus === 'active') {
    insights.push({
      title: 'Compound Risk — Unresolved Ownership + Active Dispute',
      description: `This parcel simultaneously has unverified ownership and an active dispute (${parcel.disputeCaseId}). This compound condition represents the highest risk profile for any transaction.`,
      confidence: 94,
      severity: 'high',
      action: 'Place complete transaction hold. Escalate to District Collector for priority review.',
    })
  }

  if (parcel.restrictions.length > 0) {
    const critical = parcel.restrictions.some(
      (r) =>
        r.toLowerCase().includes('no construction') ||
        r.toLowerCase().includes('no private') ||
        r.toLowerCase().includes('protected') ||
        r.toLowerCase().includes('heritage'),
    )
    if (critical) {
      insights.push({
        title: 'Critical Restrictions Active',
        description: `${parcel.restrictions.length} restriction(s) apply: ${parcel.restrictions.join('; ')}. These directly affect permitted use and transferability.`,
        confidence: 90,
        severity: 'medium',
        action: 'Review all applicable restrictions before processing. Consult the relevant controlling department.',
      })
    }
  }

  if (parcel.ownershipStatus === 'verified' && parcel.disputeStatus === 'none' && parcel.encumbranceStatus === 'clear' && parcel.propertyTaxStatus === 'paid') {
    insights.push({
      title: 'No Anomalies Detected',
      description: `Parcel ${parcel.ulpin} shows consistent records across ownership, encumbrance, tax, and dispute databases. No anomalies detected in current analysis.`,
      confidence: 91,
      severity: 'low',
      action: 'No immediate action required. Continue standard periodic monitoring.',
    })
  }

  return insights
}

/* ------------------------------------------------------------------ */
/*  Deterministic application-review generator                         */
/* ------------------------------------------------------------------ */

const REQUIRED_DOCS: Record<string, string[]> = {
  'Ownership Verification': ['Aadhaar Card', 'Sale Deed', 'Patta Certificate', 'Encumbrance Certificate'],
  'Mutation Request': ['Death Certificate', 'Legal Heir Certificate', 'Old Patta', 'Sale Deed', 'Aadhaar Card'],
  'Building Permission': ['Site Plan', 'Building Plan', 'NOC Fire', 'NOC Environment', 'Ownership Proof', 'Tax Clearance'],
  'Encumbrance Certificate': ['Aadhaar Card', 'Sale Deed Copy', 'Patta Certificate'],
}

function computeAppReview(request: ServiceRequest, parcel?: Parcel): AppReview {
  const required = REQUIRED_DOCS[request.serviceName] ?? ['Aadhaar Card', 'Application Form']
  const provided = request.documents
  const missing = required.filter((d) => !provided.includes(d))

  const issues: string[] = []

  if (missing.length > 0) {
    issues.push(`${missing.length} required document(s) missing: ${missing.join(', ')}`)
  }

  if (parcel) {
    if (parcel.disputeStatus === 'active') {
      issues.push(`Active dispute on parcel ${parcel.ulpin} may delay or invalidate this application`)
    }
    if (parcel.propertyTaxStatus !== 'paid') {
      issues.push('Property tax clearance is pending — required for most service requests')
    }
    if (parcel.ownershipStatus === 'pending') {
      issues.push('Ownership verification is incomplete — applicant identity cannot be fully confirmed')
    }
    if (parcel.encumbranceStatus === 'mortgaged' || parcel.encumbranceStatus === 'encumbered') {
      issues.push('Active encumbrance on parcel may restrict the service being requested')
    }
  }

  const completedSteps = request.timeline.filter((t) => t.date !== '').length
  const totalSteps = request.timeline.length
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0

  let confidence = 70 + Math.floor(progress * 20)
  if (issues.length === 0) confidence = Math.min(confidence + 5, 96)
  if (missing.length > 2) confidence = Math.max(confidence - 10, 50)

  const recs: string[] = []
  if (missing.length > 0) recs.push(`Request applicant to submit ${missing.join(', ')}`)
  if (issues.some((i) => i.includes('dispute'))) recs.push('Place application on hold pending dispute resolution')
  if (issues.some((i) => i.includes('tax'))) recs.push('Mandate tax clearance certificate before proceeding')
  if (recs.length === 0) recs.push('Application appears complete. Proceed to next workflow stage.')

  return {
    summary: `${request.serviceName} application (${request.applicationId}) for parcel ${request.ulpin}. Applicant: ${request.applicantName}. Current stage: ${request.currentStatus.replace(/_/g, ' ')}.`,
    requiredDocs: required,
    providedDocs: provided,
    missingDocs: missing,
    issues,
    confidence,
    recommendation: recs.join(' '),
  }
}

/* ------------------------------------------------------------------ */
/*  AI Confidence Bar                                                  */
/* ------------------------------------------------------------------ */

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 tabular-nums">{value}%</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

type Tab = 'parcel' | 'application'

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<Tab>('parcel')

  /* --- Parcel search state --- */
  const [parcelQuery, setParcelQuery] = useState('')
  const [showParcelResults, setShowParcelResults] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [parcelInsights, setParcelInsights] = useState<ParcelInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightSource, setInsightSource] = useState<'gemini' | 'demo' | null>(null)
  const [insightStatus, setInsightStatus] = useState<'ok' | 'degraded' | null>(null)

  const parcelSearchResults = useMemo(() => {
    if (!parcelQuery.trim()) return []
    return searchParcels(parcelQuery).slice(0, 8)
  }, [parcelQuery])

  // Load AI parcel insights from the backend (/api/ai/parcel-insights → Gemini
  // when GEMINI_API_KEY is set, else labeled demo reasoning). Falls back to the
  // local deterministic generator if the backend is unreachable.
  useEffect(() => {
    if (!selectedParcel) {
      setParcelInsights([])
      setInsightSource(null)
      setInsightStatus(null)
      return
    }
    let cancelled = false
    setInsightsLoading(true)
    const fromLocal = () => {
      if (cancelled) return
      setParcelInsights(computeParcelInsights(selectedParcel))
      setInsightStatus('ok')
      setInsightSource('demo')
    }
    ;(async () => {
      try {
        const res = await api.parcelInsights({ ulpin: selectedParcel.ulpin, parcel: selectedParcel })
        if (cancelled) return
        const findings: ParcelInsight[] = (res?.findings ?? []).map((f: any) => ({
          title: f.title,
          description: f.description || f.message || '',
          confidence: typeof f.confidence === 'number' ? f.confidence : 80,
          severity: (f.severity === 'high' || f.severity === 'medium' || f.severity === 'low') ? f.severity : 'medium',
          action: f.action || f.recommendation || 'Verify with the responsible department.',
        }))
        if (findings.length) {
          setParcelInsights(findings)
          setInsightStatus(res?.status === 'degraded' ? 'degraded' : 'ok')
          setInsightSource(res?.provider === 'gemini' ? 'gemini' : 'demo')
        } else {
          fromLocal()
        }
      } catch {
        fromLocal()
      } finally {
        if (!cancelled) setInsightsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedParcel])

  const avgConfidence = useMemo(() => {
    if (parcelInsights.length === 0) return 0
    return Math.round(parcelInsights.reduce((s, i) => s + i.confidence, 0) / parcelInsights.length)
  }, [parcelInsights])

  /* --- Application state --- */
  const [applications, setApplications] = useState<ServiceRequest[]>(serviceRequests)
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [appReview, setAppReview] = useState<AppReview | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === selectedAppId) ?? null,
    [applications, selectedAppId],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.applications()
        if (cancelled) return
        if (res.applications?.length) {
          setApplications(res.applications as unknown as ServiceRequest[])
        }
      } catch {
        // backend unreachable — keep local fallback
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const runAiReview = useCallback(async () => {
    if (!selectedApp) return
    setReviewLoading(true)
    setReviewError(null)
    setAppReview(null)
    try {
      const res = await api.aiReviewApplication(selectedApp.id)
      const raw = res.aiReview ?? res.report
      const parcel = searchParcels(selectedApp.ulpin)[0]
      const computed = computeAppReview(selectedApp, parcel)
      const merged: AppReview = {
        summary: raw?.summary ?? computed.summary,
        requiredDocs: computed.requiredDocs,
        providedDocs: computed.providedDocs,
        missingDocs: computed.missingDocs,
        issues: raw?.issues ?? computed.issues,
        confidence: raw?.confidence ?? computed.confidence,
        recommendation: raw?.recommendation ?? computed.recommendation,
      }
      setAppReview(merged)
    } catch {
      const parcel = searchParcels(selectedApp.ulpin)[0]
      setAppReview(computeAppReview(selectedApp, parcel))
      setReviewError('AI service temporarily unavailable. Showing labeled demo review. Try again.')
    } finally {
      setReviewLoading(false)
    }
  }, [selectedApp])

  const handleParcelSelect = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setParcelQuery('')
    setShowParcelResults(false)
  }, [])

  const handleAppSelect = useCallback((id: string) => {
    setSelectedAppId(id)
    setAppReview(null)
    setReviewError(null)
  }, [])

  /* --------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gov-50 border border-gov-200 flex items-center justify-center">
            <Brain className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI Insights</h1>
            <p className="text-xs text-slate-500">AI-assisted analysis for land governance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] font-medium text-amber-700">AI outputs require human verification</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {([
          { key: 'parcel' as const, label: 'AI Parcel Insights', icon: Search },
          { key: 'application' as const, label: 'AI Application Assistant', icon: FileSearch },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  SECTION 1 — AI Parcel Insights                               */}
      {/* ============================================================ */}
      {activeTab === 'parcel' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Parcel Search</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a parcel to run AI anomaly & risk analysis</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gov-50 border border-gov-200">
                <Brain className="w-3 h-3 text-gov-600" />
                <span className="text-[10px] font-semibold text-gov-700">AI-ASSISTED</span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={parcelQuery}
                onChange={(e) => { setParcelQuery(e.target.value); setShowParcelResults(true) }}
                onFocus={() => setShowParcelResults(true)}
                placeholder="Search by ULPIN, survey number, owner name, or village..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
              />
              {parcelQuery && (
                <button
                  onClick={() => { setParcelQuery(''); setShowParcelResults(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {showParcelResults && parcelSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {parcelSearchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleParcelSelect(p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <p className="text-xs font-mono text-gov-600">{p.ulpin}</p>
                      <p className="text-sm text-slate-900 mt-0.5">{p.surveyNumber} — {p.village}, {p.district}</p>
                      <p className="text-xs text-slate-500">{p.ownerName} · {p.area} {p.areaUnit} · {p.landUse}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected parcel header */}
          {selectedParcel && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gov-600" />
                    <span className="text-xs font-semibold text-slate-900">Selected Parcel</span>
                    <StatusBadge status={selectedParcel.ownershipStatus} />
                  </div>
                  <p className="text-sm font-mono font-bold text-gov-700">{selectedParcel.ulpin}</p>
                  <p className="text-xs text-slate-500">
                    {selectedParcel.surveyNumber}, {selectedParcel.village}, {selectedParcel.district} — {selectedParcel.area} {selectedParcel.areaUnit} ({selectedParcel.landUse})
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedParcel(null); setAppReview(null) }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Overall AI Confidence</span>
                </div>
                <ConfidenceBar value={avgConfidence} />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {insightsLoading
                    ? 'Running AI analysis over backend...'
                    : `Based on ${parcelInsights.length} insight(s) · AI-ASSISTED · requires human verification`}
                </p>
                {insightSource && (
                  <p className={cn(
                    'text-[10px] font-medium mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
                    insightSource === 'gemini' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {insightSource === 'gemini' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {insightSource === 'gemini'
                      ? 'Powered by Gemini'
                      : insightStatus === 'degraded'
                        ? 'AI service unavailable — showing labeled demo reasoning'
                        : 'Demo reasoning (backend AI not configured / unreachable)'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Insight cards */}
          {selectedParcel && parcelInsights.length > 0 && (
            <div className="space-y-3">
              {parcelInsights.map((insight, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        'w-4 h-4 flex-shrink-0',
                        insight.severity === 'high' ? 'text-red-500' : insight.severity === 'medium' ? 'text-amber-500' : 'text-slate-400',
                      )} />
                      <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                    </div>
                    <StatusBadge status={insight.severity} />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{insight.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Confidence</span>
                      <ConfidenceBar value={insight.confidence} />
                    </div>
                    <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gov-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed">{insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty / loading state */}
          {selectedParcel && insightsLoading && parcelInsights.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <Loader2 className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-slate-500">Running AI analysis...</p>
            </div>
          )}
          {selectedParcel && !insightsLoading && parcelInsights.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No insights generated for this parcel.</p>
            </div>
          )}

          {!selectedParcel && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Search and select a parcel above to view AI-powered insights.</p>
              <p className="text-xs text-slate-400 mt-1">Insights are generated from cross-referencing parcel data with governance records.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  SECTION 2 — AI Application Assistant                         */}
      {/* ============================================================ */}
      {activeTab === 'application' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Select Application</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose an application for AI-assisted review</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gov-50 border border-gov-200">
                <Brain className="w-3 h-3 text-gov-600" />
                <span className="text-[10px] font-semibold text-gov-700">AI-ASSISTED</span>
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedAppId}
                onChange={(e) => handleAppSelect(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500 bg-white pr-10"
              >
                <option value="">— Select an application —</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.applicationId} · {app.serviceName} — {app.applicantName} ({app.currentStatus.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Application details + Run button */}
          {selectedApp && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Application</p>
                  <p className="text-xs font-mono font-semibold text-slate-900 mt-0.5">{selectedApp.applicationId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Service</p>
                  <p className="text-xs font-medium text-slate-900 mt-0.5">{selectedApp.serviceName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Applicant</p>
                  <p className="text-xs font-medium text-slate-900 mt-0.5">{selectedApp.applicantName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status</p>
                  <div className="mt-0.5"><StatusBadge status={selectedApp.currentStatus} /></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={runAiReview} disabled={reviewLoading} size="sm">
                  {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {reviewLoading ? 'Running AI Review...' : 'Run AI Review'}
                </Button>
                {reviewError && <span className="text-xs text-red-500">{reviewError}</span>}
              </div>
            </div>
          )}

          {/* AI Review panel */}
          {appReview && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gov-600" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Review Result</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-medium text-amber-700">Requires human verification</span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-700 leading-relaxed">{appReview.summary}</p>
              </div>

              {/* Confidence */}
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">AI Confidence</span>
                <div className="mt-1"><ConfidenceBar value={appReview.confidence} /></div>
              </div>

              {/* Documents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Documents Required ({appReview.requiredDocs.length})</p>
                  <div className="space-y-1">
                    {appReview.requiredDocs.map((doc) => {
                      const provided = appReview.providedDocs.includes(doc)
                      return (
                        <div key={doc} className="flex items-center gap-1.5">
                          {provided ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                          <span className={cn('text-xs', provided ? 'text-slate-700' : 'text-red-600')}>{doc}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Issues Found ({appReview.issues.length})
                  </p>
                  {appReview.issues.length === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-700">No issues detected</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {appReview.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-700 leading-relaxed">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-gov-50 rounded-lg border border-gov-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gov-600" />
                  <span className="text-[10px] font-semibold text-gov-700 uppercase tracking-wider">Recommendation</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{appReview.recommendation}</p>
              </div>
            </div>
          )}

          {!selectedApp && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <FileSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Select an application above to run AI-assisted review.</p>
              <p className="text-xs text-slate-400 mt-1">The AI assistant checks document completeness, cross-references parcel data, and flags potential issues.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
        <p className="text-[11px] text-slate-500">
          AI outputs are assistive only and always require verification by an authorized officer.
        </p>
      </div>
    </div>
  )
}
