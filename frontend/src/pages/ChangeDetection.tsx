import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Radar,
  Images,
  ScanSearch,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { searchParcels, getParcelByULPIN } from '@/data/parcels'
import type { Parcel } from '@/types'

interface DetectionResult {
  changeDetected: boolean
  changeType: string
  confidence: number
  riskLevel: 'high' | 'medium' | 'low'
  details: string
  source: 'ai' | 'local'
  comparedRecords: { name: string; status: string; match: boolean }[]
}

function computeLocalResult(parcel: Parcel): DetectionResult {
  const bp = parcel.buildingPermission
  const lu = parcel.landUse
  const restrictions = parcel.restrictions

  const hasNoPermission = bp === 'none' || bp === 'rejected'
  const isAgricultural = lu === 'agricultural' || lu === 'forest'
  const hasRestrictions = restrictions.length > 0

  if (hasNoPermission && isAgricultural) {
    return {
      changeDetected: true,
      changeType: 'Potential unauthorized development detected',
      confidence: 87,
      riskLevel: 'high',
      details: `Parcel zoned for ${lu} with no building permission on record. Imagery comparison suggests new structural footprint.`,
      source: 'local',
      comparedRecords: [
        { name: 'Building Permission', status: bp, match: false },
        { name: 'Land Use Classification', status: lu, match: false },
        { name: 'Zoning Compliance', status: parcel.zoning, match: true },
        { name: 'Tax Payment Status', status: parcel.propertyTaxStatus, match: true },
      ],
    }
  }

  if (hasNoPermission) {
    return {
      changeDetected: true,
      changeType: 'Possible unauthorized construction',
      confidence: 72,
      riskLevel: 'medium',
      details: `No building permission found. Imagery indicates possible new structure not matching previous records.`,
      source: 'local',
      comparedRecords: [
        { name: 'Building Permission', status: bp, match: false },
        { name: 'Land Use Classification', status: lu, match: true },
        { name: 'Zoning Compliance', status: parcel.zoning, match: true },
        { name: 'Tax Payment Status', status: parcel.propertyTaxStatus, match: true },
      ],
    }
  }

  if (hasRestrictions && bp === 'approved') {
    return {
      changeDetected: true,
      changeType: 'Structure exceeds approved parameters',
      confidence: 65,
      riskLevel: 'medium',
      details: `Building permission exists but parcel has active restrictions. Imagery shows changes that may exceed approved scope.`,
      source: 'local',
      comparedRecords: [
        { name: 'Building Permission', status: bp, match: true },
        { name: 'Land Use Classification', status: lu, match: true },
        { name: 'Zoning Compliance', status: parcel.zoning, match: false },
        { name: 'Tax Payment Status', status: parcel.propertyTaxStatus, match: true },
      ],
    }
  }

  return {
    changeDetected: false,
    changeType: 'No significant change detected',
    confidence: 94,
    riskLevel: 'low',
    details: 'Imagery comparison shows no significant structural changes. All records are consistent with approved data.',
    source: 'local',
    comparedRecords: [
      { name: 'Building Permission', status: bp, match: true },
      { name: 'Land Use Classification', status: lu, match: true },
      { name: 'Zoning Compliance', status: parcel.zoning, match: true },
      { name: 'Tax Payment Status', status: parcel.propertyTaxStatus, match: true },
    ],
  }
}

const STEPS = [
  { label: 'Historical Imagery Comparison', icon: Images, desc: 'Compare historical and recent satellite imagery for the parcel area' },
  { label: 'AI Change Analysis', icon: Radar, desc: 'Run change detection algorithm on imagery pairs' },
  { label: 'Potential Change Identified', icon: ScanSearch, desc: 'Flag differences exceeding threshold for review' },
  { label: 'Compare Approved Records', icon: FileText, desc: 'Cross-reference with building permission, land use, and zoning records' },
  { label: 'Officer Verification', icon: ClipboardCheck, desc: 'Authorized officer must verify before any enforcement action' },
]

export default function ChangeDetection() {
  const [params] = useSearchParams()
  const initialUlpin = params.get('ulpin') || ''

  const [searchQuery, setSearchQuery] = useState(initialUlpin)
  const [showResults, setShowResults] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(
    initialUlpin ? getParcelByULPIN(initialUlpin) || null : null
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'confirmed' | 'flagged'>('none')
  const [verificationNote, setVerificationNote] = useState('')

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchParcels(searchQuery).slice(0, 8)
  }, [searchQuery])

  const handleSelect = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setSearchQuery('')
    setShowResults(false)
    setResult(null)
    setCurrentStep(-1)
    setVerificationStatus('none')
    setVerificationNote('')
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedParcel(null)
    setResult(null)
    setCurrentStep(-1)
    setVerificationStatus('none')
    setVerificationNote('')
  }, [])

  const runDetection = useCallback(async () => {
    if (!selectedParcel) return
    setLoading(true)
    setResult(null)
    setCurrentStep(0)

    const signals = {
      buildingPermission: selectedParcel.buildingPermission,
      landUse: selectedParcel.landUse,
      zoning: selectedParcel.zoning,
      ownershipStatus: selectedParcel.ownershipStatus,
      restrictions: selectedParcel.restrictions,
      propertyTaxStatus: selectedParcel.propertyTaxStatus,
      area: selectedParcel.area,
    }

    let detectionResult: DetectionResult | null = null

    try {
      const response = await api.changeDetection({ ulpin: selectedParcel.ulpin, signals })
      detectionResult = {
        changeDetected: response.changeDetected ?? response.flagged ?? false,
        changeType: response.changeType ?? response.type ?? 'Analysis complete',
        confidence: response.confidence ?? 80,
        riskLevel: response.riskLevel ?? response.severity ?? 'medium',
        details: response.details ?? response.summary ?? 'AI analysis completed.',
        source: 'ai',
        comparedRecords: response.comparedRecords ?? [
          { name: 'Building Permission', status: selectedParcel.buildingPermission, match: selectedParcel.buildingPermission === 'approved' },
          { name: 'Land Use Classification', status: selectedParcel.landUse, match: true },
          { name: 'Zoning Compliance', status: selectedParcel.zoning, match: true },
          { name: 'Tax Payment Status', status: selectedParcel.propertyTaxStatus, match: selectedParcel.propertyTaxStatus === 'paid' },
        ],
      }
    } catch {
      // Backend unreachable — compute locally
      await new Promise((r) => setTimeout(r, 1800))
      detectionResult = computeLocalResult(selectedParcel)
    }

    // Simulate step progression
    for (let i = 0; i <= 4; i++) {
      setCurrentStep(i)
      await new Promise((r) => setTimeout(r, 600))
    }

    setResult(detectionResult)
    setLoading(false)
  }, [selectedParcel])

  const riskBadge = useMemo(() => {
    if (!result) return null
    const map: Record<string, string> = { high: 'red', medium: 'amber', low: 'green' }
    return map[result.riskLevel] || 'slate'
  }, [result])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radar className="w-5 h-5 text-gov-600" />
          <h1 className="text-xl font-bold text-slate-900">Change Detection</h1>
        </div>
        <p className="text-sm text-slate-500 ml-7">
          AI-assisted detection of physical changes on a parcel by comparing satellite imagery with approved records.
        </p>
      </div>

      {/* Parcel Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Select Parcel
        </label>
        {selectedParcel ? (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedParcel.surveyNumber} — {selectedParcel.village}, {selectedParcel.district}
              </p>
              <p className="text-xs font-mono text-gov-600 mt-0.5">{selectedParcel.ulpin}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={selectedParcel.landUse} />
                <StatusBadge status={selectedParcel.buildingPermission} />
              </div>
            </div>
            <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              placeholder="Search by ULPIN, survey number, owner, or village..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((parcel) => (
                  <button
                    key={parcel.id}
                    onClick={() => handleSelect(parcel)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <p className="text-xs font-mono text-gov-600">{parcel.ulpin}</p>
                    <p className="text-sm text-slate-900 mt-0.5">{parcel.surveyNumber} — {parcel.village}, {parcel.district}</p>
                    <p className="text-xs text-slate-500">{parcel.ownerName} · {parcel.area} {parcel.areaUnit}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline + Results */}
      {selectedParcel && (
        <>
          {/* Run Button */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Run Change Detection</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will compare imagery and cross-reference approved records for {selectedParcel.ulpin}
                </p>
              </div>
              <Button
                onClick={runDetection}
                disabled={loading}
                variant="primary"
                size="md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Radar className="w-4 h-4" />
                    Run AI Change Detection
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step Pipeline */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Detection Pipeline</p>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                const isActive = currentStep === i
                const isComplete = currentStep > i
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg transition-colors',
                      isActive && 'bg-gov-50 border border-gov-200',
                      isComplete && 'bg-emerald-50/50',
                      !isActive && !isComplete && 'bg-slate-50 border border-transparent'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                      isActive && 'bg-gov-600 text-white',
                      isComplete && 'bg-emerald-500 text-white',
                      !isActive && !isComplete && 'bg-slate-200 text-slate-500'
                    )}>
                      {isComplete ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          'w-3.5 h-3.5',
                          isActive ? 'text-gov-600' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                        )} />
                        <p className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-gov-700' : isComplete ? 'text-emerald-700' : 'text-slate-500'
                        )}>
                          {step.label}
                        </p>
                        {isActive && (
                          <Loader2 className="w-3.5 h-3.5 text-gov-600 animate-spin ml-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
              {/* Source label */}
              <div className="flex items-center justify-between">
                <Badge variant={result.source === 'ai' ? 'blue' : 'slate'}>
                  {result.source === 'ai' ? 'AI-ASSISTED' : 'LOCAL DEMO'} · requires human verification
                </Badge>
                <StatusBadge status={result.riskLevel} />
              </div>

              {/* Summary */}
              <div className={cn(
                'rounded-lg p-4 border',
                result.changeDetected ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {result.changeDetected ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <p className={cn(
                    'text-sm font-bold',
                    result.changeDetected ? 'text-red-800' : 'text-emerald-800'
                  )}>
                    {result.changeType}
                  </p>
                </div>
                <p className={cn(
                  'text-xs mt-1',
                  result.changeDetected ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {result.details}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="text-xs text-slate-500">
                    Confidence: <span className="font-bold text-slate-700">{result.confidence}%</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Risk: <StatusBadge status={result.riskLevel} />
                  </div>
                </div>
              </div>

              {/* Records comparison */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Approved Records Comparison</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.comparedRecords.map((rec) => (
                    <div
                      key={rec.name}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg border text-xs',
                        rec.match ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                      )}
                    >
                      <div>
                        <p className="font-medium text-slate-700">{rec.name}</p>
                        <p className="text-slate-500 mt-0.5 capitalize">{rec.status.replace(/_/g, ' ')}</p>
                      </div>
                      {rec.match ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Officer Verification */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-4 h-4 text-gov-600" />
                  <p className="text-sm font-semibold text-slate-900">Officer Verification</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  An authorized officer must verify these findings before any enforcement or compliance action is initiated. AI-assisted results are indicative only and do not constitute legal findings.
                </p>

                {verificationStatus === 'none' ? (
                  <div className="space-y-3">
                    <textarea
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      placeholder="Add verification notes (optional)..."
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setVerificationStatus('confirmed'); setVerificationNote('') }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => { setVerificationStatus('flagged'); setVerificationNote('') }}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Flag for Review
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border',
                    verificationStatus === 'confirmed' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                  )}>
                    {verificationStatus === 'confirmed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <p className={cn(
                      'text-xs font-medium',
                      verificationStatus === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
                    )}>
                      {verificationStatus === 'confirmed'
                        ? 'Findings confirmed by officer. No further action required at this time.'
                        : 'Flagged for supervisory review. Investigation pending.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
