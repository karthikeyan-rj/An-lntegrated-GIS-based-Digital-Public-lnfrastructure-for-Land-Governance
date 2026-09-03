import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Map, ExternalLink, Landmark, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import localParcels from '@/data/parcels'
import type { Parcel } from '@/types'

interface FeatureProps {
  properties: Record<string, unknown>
}

function getLandUseColor(landUse: string): string {
  const colors: Record<string, string> = {
    residential: '#3b82f6',
    commercial: '#f59e0b',
    agricultural: '#22c55e',
    industrial: '#8b5cf6',
    institutional: '#06b6d4',
    forest: '#166534',
    water: '#0ea5e9',
    mixed: '#ec4899',
  }
  return colors[landUse] || '#6b7280'
}

function toParcel(feature: FeatureProps & { id?: string }): Parcel | null {
  const p = feature.properties || {}
  if (!p.ulpin) return null
  const props = p as Record<string, string | number | string[] | { electricity?: boolean; water?: boolean; sewerage?: boolean; gas?: boolean; telecom?: boolean }>
  const utilities = (props.utilities as { electricity?: boolean; water?: boolean; sewerage?: boolean; gas?: boolean; telecom?: boolean }) || {}
  return {
    id: (feature.id as string) || String(p.id) || String(p.ulpin),
    ulpin: String(p.ulpin),
    surveyNumber: String(p.surveyNumber || '-'),
    village: String(props.village || '-'),
    taluk: String(props.taluk || '-'),
    district: String(props.district || '-'),
    state: String(props.state || '-'),
    area: Number(props.area || 0),
    areaUnit: (props.areaUnit as Parcel['areaUnit']) || 'acres',
    coordinates: { lat: 0, lng: 0 },
    landUse: (props.landUse as Parcel['landUse']) || 'residential',
    zoning: (props.zoning as Parcel['zoning']) || 'R1',
    ownershipStatus: (props.ownershipStatus as Parcel['ownershipStatus']) || 'verified',
    ownerName: String(props.ownerName || 'Demo Owner'),
    ownerFatherName: '',
    ownershipType: 'self',
    encumbranceStatus: (props.encumbranceStatus as Parcel['encumbranceStatus']) || 'clear',
    disputeStatus: (props.disputeStatus as Parcel['disputeStatus']) || 'none',
    propertyTaxStatus: (props.propertyTaxStatus as Parcel['propertyTaxStatus']) || 'paid',
    buildingPermission: (props.buildingPermission as Parcel['buildingPermission']) || 'none',
    pattaNumber: String(props.pattaNumber || '-'),
    classification: String(props.classification || '-'),
    verificationStatus: (props.verificationStatus as Parcel['verificationStatus']) || 'digitally_verified',
    lastUpdated: '',
    registeredDate: '',
    restrictions: (props.restrictions as string[]) || [],
    utilities: { electricity: !!utilities.electricity, water: !!utilities.water, sewerage: !!utilities.sewerage, gas: !!utilities.gas, telecom: !!utilities.telecom },
  }
}

function capitalizeLabel(label: string): string {
  return label
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function Parcels() {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadParcels() {
      setLoading(true)
      try {
        const fc = await api.parcels()
        if (cancelled) return
        const mapped = fc.features
          .map((f) => toParcel(f as never))
          .filter((p): p is Parcel => !!p)
        setParcels(mapped.length ? mapped : localParcels)
      } catch (err) {
        if (cancelled) return
        setIsDemo(true)
        setParcels(localParcels)
      }
      if (cancelled) return
      setLoading(false)
    }
    loadParcels()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return parcels
    return parcels.filter(
      (p) =>
        p.ulpin.toLowerCase().includes(q) ||
        p.surveyNumber.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
    )
  }, [parcels, searchQuery])

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-gov-600" />
            <h1 className="text-2xl font-bold text-slate-900">Parcels</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search and review land parcels, ownership status, and land-use classification registered in the registry.
          </p>
        </div>
        <Link to="/explorer" className="shrink-0">
          <Button variant="primary">
            <Map className="w-4 h-4" />
            Open GIS Explorer
          </Button>
        </Link>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg">
          <span className="inline-flex w-1.5 h-1.5 rounded-full bg-amber-400" />
          Showing local DEMO parcels
        </div>
      )}

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ULPIN, survey no, owner, village, district..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading parcels...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No parcels found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ULPIN</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Survey No</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Village</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">District</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Land Use</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ownership Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/parcel/${parcel.id}`}
                        className="font-mono text-xs font-semibold text-gov-600 hover:text-gov-700 hover:underline"
                      >
                        {parcel.ulpin}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{parcel.surveyNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{parcel.ownerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{parcel.village}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{parcel.district}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {parcel.area} <span className="text-xs text-slate-400">{parcel.areaUnit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: getLandUseColor(parcel.landUse) }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        {capitalizeLabel(parcel.landUse)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={parcel.ownershipStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/parcel/${parcel.id}`} className="inline-block">
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {parcels.length} parcel{parcels.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
