import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, FileText, Building2, Gavel, Landmark, Receipt, Zap, Shield, MapPin, ExternalLink, Info } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api'
import { searchParcels, getParcelByULPIN } from '@/data/parcels'
import { registrations as demoRegistrations, disputes as demoDisputes, buildingPermissions as demoBuildingPermissions } from '@/data/services'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Parcel, Registration, Dispute, BuildingPermission } from '@/types'

interface SectionState<T> {
  data: T[]
  isDemo: boolean
  loading: boolean
  error: boolean
}

const resources = [
  { key: 'land-records', label: 'Land Records / Ownership', icon: FileText },
  { key: 'registrations', label: 'Registrations', icon: Landmark },
  { key: 'encumbrances', label: 'Encumbrances', icon: Shield },
  { key: 'building-permissions', label: 'Building Permissions', icon: Building2 },
  { key: 'land-use', label: 'Land Use / Zoning', icon: MapPin },
  { key: 'property-tax', label: 'Property Tax', icon: Receipt },
  { key: 'utilities', label: 'Utilities', icon: Zap },
  { key: 'disputes', label: 'Disputes', icon: Gavel },
] as const

function formatCurrencyOrZero(amount?: number): string {
  if (amount === undefined || amount === null) return '—'
  return amount === 0 ? 'Nil' : formatCurrency(amount)
}

function DefinitionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-700">{children}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, isDemo, loading, error, children, count }: {
  title: string
  icon: React.ElementType
  isDemo: boolean
  loading: boolean
  error: boolean
  children: React.ReactNode
  count?: number
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gov-600" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-slate-400">({count})</span>
          )}
        </div>
        {isDemo && <Badge variant="amber">DEMO</Badge>}
      </div>
      <div className="px-4 py-3">
        {loading && <p className="text-xs text-slate-400">Loading...</p>}
        {error && <p className="text-xs text-red-500">Unable to fetch records</p>}
        {!loading && !error && children}
      </div>
    </div>
  )
}

function OwnershipSection({ parcel }: { parcel: Parcel }) {
  return (
    <div className="space-y-0.5">
      <DefinitionRow label="Owner">{parcel.ownerName}</DefinitionRow>
      <DefinitionRow label="Father / Guardian">{parcel.ownerFatherName}</DefinitionRow>
      <DefinitionRow label="Ownership Type">
        <span className="capitalize">{parcel.ownershipType}</span>
      </DefinitionRow>
      <DefinitionRow label="Status"><StatusBadge status={parcel.ownershipStatus} /></DefinitionRow>
      <DefinitionRow label="Patta No.">{parcel.pattaNumber}</DefinitionRow>
      <DefinitionRow label="Registered">{parcel.registeredDate}</DefinitionRow>
    </div>
  )
}

function RegistrationsTable({ rows }: { rows: Registration[] }) {
  if (!rows.length) return <p className="text-xs text-slate-400">No registration records found.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="pb-1.5 font-medium">Document</th>
            <th className="pb-1.5 font-medium">Type</th>
            <th className="pb-1.5 font-medium">Buyer</th>
            <th className="pb-1.5 font-medium">Seller</th>
            <th className="pb-1.5 font-medium text-right">Amount</th>
            <th className="pb-1.5 font-medium">Date</th>
            <th className="pb-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 font-medium text-slate-700">{r.documentNumber}</td>
              <td className="py-1.5 capitalize">{r.transactionType}</td>
              <td className="py-1.5 max-w-[120px] truncate">{r.buyerName}</td>
              <td className="py-1.5 max-w-[120px] truncate">{r.sellerName}</td>
              <td className="py-1.5 text-right">{formatCurrencyOrZero(r.amount)}</td>
              <td className="py-1.5">{r.date}</td>
              <td className="py-1.5"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BuildingPermissionsTable({ rows }: { rows: BuildingPermission[] }) {
  if (!rows.length) return <p className="text-xs text-slate-400">No building permissions found.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="pb-1.5 font-medium">Application</th>
            <th className="pb-1.5 font-medium">Type</th>
            <th className="pb-1.5 font-medium text-right">Area (sqft)</th>
            <th className="pb-1.5 font-medium text-right">Floors</th>
            <th className="pb-1.5 font-medium">Submitted</th>
            <th className="pb-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(bp => (
            <tr key={bp.id} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 font-medium text-slate-700">{bp.applicationNumber}</td>
              <td className="py-1.5">{bp.buildingType}</td>
              <td className="py-1.5 text-right">{bp.proposedArea.toLocaleString()}</td>
              <td className="py-1.5 text-right">{bp.floors}</td>
              <td className="py-1.5">{bp.submittedDate}</td>
              <td className="py-1.5"><StatusBadge status={bp.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DisputesTable({ rows }: { rows: Dispute[] }) {
  if (!rows.length) return <p className="text-xs text-slate-400">No disputes found.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="pb-1.5 font-medium">Case ID</th>
            <th className="pb-1.5 font-medium">Type</th>
            <th className="pb-1.5 font-medium">Parties</th>
            <th className="pb-1.5 font-medium">Court</th>
            <th className="pb-1.5 font-medium">Filed</th>
            <th className="pb-1.5 font-medium">Next Hearing</th>
            <th className="pb-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(d => (
            <tr key={d.id} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 font-medium text-slate-700">{d.caseId}</td>
              <td className="py-1.5 capitalize">{d.disputeType}</td>
              <td className="py-1.5 max-w-[140px] truncate">{d.parties.join(', ')}</td>
              <td className="py-1.5 max-w-[120px] truncate">{d.court}</td>
              <td className="py-1.5">{d.filedDate}</td>
              <td className="py-1.5">{d.nextHearing || '—'}</td>
              <td className="py-1.5"><StatusBadge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GenericKeyValueSection({ data, isDemo }: { data: Record<string, unknown>[]; isDemo: boolean }) {
  if (!data.length) return <p className="text-xs text-slate-400">No records found.</p>
  return (
    <div className="space-y-2">
      {data.map((row, i) => (
        <div key={i} className="bg-slate-50 rounded-md p-2.5 space-y-0.5">
          {Object.entries(row).filter(([k]) => !['_id', 'id', '__v', 'ulpin'].includes(k)).map(([k, v]) => (
            <DefinitionRow key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}>
              {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '—')}
            </DefinitionRow>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function LandRecords() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Parcel[]>([])
  const [selected, setSelected] = useState<Parcel | null>(null)
  const [sections, setSections] = useState<Record<string, SectionState<unknown>>>(
    Object.fromEntries(resources.map(r => [r.key, { data: [], isDemo: false, loading: false, error: false }]))
  )

  useEffect(() => {
    const ulpin = searchParams.get('ulpin')
    if (ulpin) {
      const parcel = getParcelByULPIN(ulpin)
      if (parcel) {
        setSelected(parcel)
        setQuery(ulpin)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setResults(searchParcels(query))
  }, [query])

  const fetchSection = useCallback(async (resource: string, ulpin: string) => {
    setSections(prev => ({ ...prev, [resource]: { ...prev[resource], loading: true, error: false } }))
    try {
      const res = (await api.records(resource, ulpin)) as unknown
      const rec = res as Record<string, unknown> | null
      const rows: unknown[] = Array.isArray(res)
        ? (res as unknown[])
        : Array.isArray(rec?.rows)
          ? (rec.rows as unknown[])
          : rec?.row
            ? [rec.row]
            : (Object.values(rec || {}).find(v => Array.isArray(v)) as unknown[]) || []
      setSections(prev => ({
        ...prev,
        [resource]: { data: rows, isDemo: Boolean((rec as { isDemo?: boolean } | null)?.isDemo), loading: false, error: false },
      }))
    } catch {
      const fallback = getDemoData(resource, ulpin)
      setSections(prev => ({
        ...prev,
        [resource]: { data: fallback, isDemo: true, loading: false, error: false },
      }))
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    const ulpin = selected.ulpin
    resources.forEach(r => fetchSection(r.key, ulpin))
  }, [selected, fetchSection])

  function getDemoData(resource: string, ulpin: string): unknown[] {
    switch (resource) {
      case 'registrations':
        return demoRegistrations.filter(r => r.ulpin === ulpin)
      case 'disputes':
        return demoDisputes.filter(d => d.ulpin === ulpin)
      case 'building-permissions':
        return demoBuildingPermissions.filter(bp => bp.ulpin === ulpin)
      default:
        return []
    }
  }

  function handleSelect(parcel: Parcel) {
    setSelected(parcel)
    setQuery(parcel.ulpin)
    setResults([])
    setSearchParams({ ulpin: parcel.ulpin })
  }

  function renderSection(resource: { key: string; label: string; icon: React.ElementType }) {
    const state = sections[resource.key]
    if (!state || (!state.loading && !state.error && state.data.length === 0)) return null

    switch (resource.key) {
      case 'land-records':
        return selected ? (
          <SectionCard key={resource.key} title={resource.label} icon={resource.icon} isDemo={false} loading={false} error={false}>
            <OwnershipSection parcel={selected} />
          </SectionCard>
        ) : null
      case 'registrations':
        return (
          <SectionCard key={resource.key} title={resource.label} icon={resource.icon} isDemo={state.isDemo} loading={state.loading} error={state.error} count={state.data.length}>
            <RegistrationsTable rows={state.data as Registration[]} />
          </SectionCard>
        )
      case 'disputes':
        return (
          <SectionCard key={resource.key} title={resource.label} icon={resource.icon} isDemo={state.isDemo} loading={state.loading} error={state.error} count={state.data.length}>
            <DisputesTable rows={state.data as Dispute[]} />
          </SectionCard>
        )
      case 'building-permissions':
        return (
          <SectionCard key={resource.key} title={resource.label} icon={resource.icon} isDemo={state.isDemo} loading={state.loading} error={state.error} count={state.data.length}>
            <BuildingPermissionsTable rows={state.data as BuildingPermission[]} />
          </SectionCard>
        )
      default:
        return (
          <SectionCard key={resource.key} title={resource.label} icon={resource.icon} isDemo={state.isDemo} loading={state.loading} error={state.error} count={state.data.length}>
            <GenericKeyValueSection data={state.data as Record<string, unknown>[]} isDemo={state.isDemo} />
          </SectionCard>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Land Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidated governance records for any parcel. Search by ULPIN, survey number, or village.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
            placeholder="Search parcel by ULPIN, survey number, village, or district..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-gov-600 placeholder:text-slate-400"
          />
          {results.length > 0 && !selected && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{p.ulpin}</span>
                      <span className="text-xs text-slate-400 ml-2">S.No {p.surveyNumber}</span>
                    </div>
                    <span className="text-xs text-slate-500">{p.village}, {p.district}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!selected && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-slate-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 mb-1">No parcel selected</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Search for a parcel by ULPIN, survey number, or village name to view all associated governance records.
            </p>
          </div>
        )}

        {/* Selected parcel */}
        {selected && (
          <div className="space-y-4">
            {/* Parcel summary card */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{selected.ulpin}</h2>
                    <StatusBadge status={selected.ownershipStatus} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Survey No. {selected.surveyNumber}</span>
                    <span className="text-slate-300">|</span>
                    <span>{selected.village}, {selected.taluk}</span>
                    <span className="text-slate-300">|</span>
                    <span>{selected.district}, {selected.state}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{selected.area} {selected.areaUnit}</span>
                    <span className="text-slate-300">|</span>
                    <span className="capitalize">{selected.landUse} / {selected.zoning}</span>
                    <span className="text-slate-300">|</span>
                    <span>Owner: {selected.ownerName}</span>
                  </div>
                </div>
                <Link to={`/parcel/${selected.id}`}>
                  <Button variant="secondary" size="sm">
                    View Parcel Profile
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Governance sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {resources.map(renderSection)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
