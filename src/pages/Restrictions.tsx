import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  TreePine,
  Waves,
  Landmark,
  Leaf,
  Map,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import parcels from '@/data/parcels'

interface RestrictionZone {
  id: string
  label: string
  color: string
  bg: string
  mapBg: string
  icon: typeof AlertTriangle
}

const restrictionZones: RestrictionZone[] = [
  { id: 'flood', label: 'Flood Zones', color: 'text-sky-600', bg: 'bg-sky-50', mapBg: 'bg-sky-300/30', icon: Waves },
  { id: 'protected', label: 'Protected Areas', color: 'text-amber-600', bg: 'bg-amber-50', mapBg: 'bg-amber-300/30', icon: ShieldAlert },
  { id: 'forest', label: 'Forest Boundaries', color: 'text-green-700', bg: 'bg-green-50', mapBg: 'bg-green-500/30', icon: TreePine },
  { id: 'crz', label: 'Coastal Regulation Zones', color: 'text-red-600', bg: 'bg-red-50', mapBg: 'bg-red-300/30', icon: Waves },
  { id: 'heritage', label: 'Heritage Zones', color: 'text-purple-600', bg: 'bg-purple-50', mapBg: 'bg-purple-300/30', icon: Landmark },
  { id: 'environmental', label: 'Environmental Restrictions', color: 'text-red-800', bg: 'bg-red-100', mapBg: 'bg-red-400/20', icon: Leaf },
]

const parcelRestrictions: Record<string, { zone: string; status: 'none' | 'conditional' | 'restricted'; detail: string }[]> = {
  p1: [],
  p2: [
    { zone: 'Heritage Zones', status: 'conditional', detail: 'Heritage Zone - Additional approvals required from Archaeological Survey of India' },
  ],
  p3: [
    { zone: 'Environmental Restrictions', status: 'restricted', detail: 'Agricultural land - No non-agricultural construction permitted under Land Use Act' },
  ],
  p4: [],
  p5: [
    { zone: 'Coastal Regulation Zones', status: 'conditional', detail: 'CRZ-II applicable - Height restriction: 15m maximum' },
    { zone: 'Environmental Restrictions', status: 'conditional', detail: 'Height restriction: 15m as per coastal zone management plan' },
  ],
  p6: [
    { zone: 'Protected Areas', status: 'conditional', detail: 'Government property - No private transaction permitted without cabinet approval' },
  ],
  p7: [
    { zone: 'Environmental Restrictions', status: 'conditional', detail: 'Pollution control board clearance required before operations' },
  ],
  p8: [],
  p9: [
    { zone: 'Environmental Restrictions', status: 'conditional', detail: 'Floor Area Ratio max 3.5, Max height 40m' },
  ],
  p10: [
    { zone: 'Forest Boundaries', status: 'restricted', detail: 'No construction permitted under Forest Conservation Act' },
    { zone: 'Protected Areas', status: 'restricted', detail: 'Protected wildlife zone - Complete restriction on development' },
    { zone: 'Environmental Restrictions', status: 'restricted', detail: 'Forest Conservation Act applicable - Zero development allowed' },
  ],
}

const restrictionStatusConfig = {
  none: { icon: CheckCircle, color: 'text-emerald-500', label: 'No Restriction', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  conditional: { icon: AlertCircle, color: 'text-amber-500', label: 'Conditional Restriction', bg: 'bg-amber-50', border: 'border-amber-200' },
  restricted: { icon: XCircle, color: 'text-red-500', label: 'Restricted', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function Restrictions() {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [activeZones, setActiveZones] = useState<Set<string>>(new Set(restrictionZones.map(z => z.id)))
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const toggleZone = (id: string) => {
    setActiveZones(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedParcel = useMemo(
    () => parcels.find(p => p.id === selectedParcelId) || null,
    [selectedParcelId]
  )

  const selectedRestrictions = useMemo(() => {
    if (!selectedParcelId) return []
    return parcelRestrictions[selectedParcelId] || []
  }, [selectedParcelId])

  const filteredRestrictions = useMemo(() => {
    if (statusFilter === 'all') return selectedRestrictions
    return selectedRestrictions.filter(r => {
      if (statusFilter === 'none') return r.status === 'none'
      if (statusFilter === 'conditional') return r.status === 'conditional'
      if (statusFilter === 'restricted') return r.status === 'restricted'
      return true
    })
  }, [selectedRestrictions, statusFilter])

  const parcelsWithRestrictions = useMemo(() => {
    return parcels.filter(p => {
      const restrictions = parcelRestrictions[p.id] || []
      if (statusFilter === 'none') return restrictions.length === 0 || restrictions.every(r => r.status === 'none')
      if (statusFilter === 'conditional') return restrictions.some(r => r.status === 'conditional')
      if (statusFilter === 'restricted') return restrictions.some(r => r.status === 'restricted')
      return true
    })
  }, [statusFilter])

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Restrictions &amp; Environmental Zones</h1>
        <p className="page-subtitle">Identify environmental, heritage, and regulatory restrictions affecting land parcels</p>
      </div>

      <CardGrid className="lg:grid-cols-6">
        <StatCard title="Flood Zones" value={2} icon={Waves} iconColor="text-sky-600" change="2 parcels affected" changeType="neutral" />
        <StatCard title="Protected Areas" value={2} icon={ShieldAlert} iconColor="text-amber-600" change="Government owned" changeType="neutral" />
        <StatCard title="Forest Boundaries" value={1} icon={TreePine} iconColor="text-green-700" change="Reserved forest" changeType="neutral" />
        <StatCard title="CRZ Areas" value={1} icon={AlertTriangle} iconColor="text-red-600" change="Coastal zone" changeType="neutral" />
        <StatCard title="Heritage Zones" value={1} icon={Landmark} iconColor="text-purple-600" change="Heritage overlay" changeType="neutral" />
        <StatCard title="Env. Restrictions" value={5} icon={Leaf} iconColor="text-red-800" change="Active restrictions" changeType="neutral" />
      </CardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card noPadding className="lg:col-span-3">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
            <Map className="w-4 h-4 text-gov-600" />
            <h3 className="text-sm font-semibold text-slate-900">Restriction Zone Map</h3>
          </div>
          <div className="relative overflow-hidden" style={{ height: 480 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-sky-50/30">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="restrictionGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.4" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#restrictionGrid)" />
                {activeZones.has('flood') && (
                  <>
                    <ellipse cx="25%" cy="60%" rx="12%" ry="18%" className="fill-sky-300/25 stroke-sky-400/40" strokeWidth="1" strokeDasharray="4,2" />
                    <ellipse cx="72%" cy="35%" rx="10%" ry="14%" className="fill-sky-300/25 stroke-sky-400/40" strokeWidth="1" strokeDasharray="4,2" />
                  </>
                )}
                {activeZones.has('protected') && (
                  <>
                    <rect x="55%" y="40%" width="18%" height="20%" rx="8" className="fill-amber-300/20 stroke-amber-400/40" strokeWidth="1" strokeDasharray="5,3" />
                    <rect x="8%" y="15%" width="14%" height="16%" rx="8" className="fill-amber-300/20 stroke-amber-400/40" strokeWidth="1" strokeDasharray="5,3" />
                  </>
                )}
                {activeZones.has('forest') && (
                  <rect x="60%" y="65%" width="30%" height="25%" rx="6" className="fill-green-500/15 stroke-green-600/30" strokeWidth="1" strokeDasharray="3,2" />
                )}
                {activeZones.has('crz') && (
                  <path d="M 0% 20% Q 15% 12% 30% 18% Q 45% 24% 60% 16% Q 75% 8% 90% 15% L 100% 0% L 0% 0% Z" className="fill-red-300/20 stroke-red-400/30" strokeWidth="1" />
                )}
                {activeZones.has('heritage') && (
                  <circle cx="40%" cy="30%" r="5%" className="fill-purple-300/20 stroke-purple-400/40" strokeWidth="1" strokeDasharray="4,2" />
                )}
                {activeZones.has('environmental') && (
                  <>
                    <rect x="10%" y="65%" width="22%" height="22%" rx="4" className="fill-red-400/10 stroke-red-500/25" strokeWidth="1" strokeDasharray="3,2" />
                    <rect x="42%" y="12%" width="15%" height="14%" rx="4" className="fill-red-400/10 stroke-red-500/25" strokeWidth="1" strokeDasharray="3,2" />
                  </>
                )}
                {parcels.map((p, i) => {
                  const col = i % 4
                  const row = Math.floor(i / 4)
                  const left = 6 + col * 24
                  const top = 6 + row * 45
                  const restrictions = parcelRestrictions[p.id] || []
                  const hasRestricted = restrictions.some(r => r.status === 'restricted')
                  const hasConditional = restrictions.some(r => r.status === 'conditional')
                  const isSelected = selectedParcelId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedParcelId(isSelected ? null : p.id)}
                      className={`absolute rounded-lg border-2 shadow-sm flex flex-col items-center justify-center text-[10px] font-mono cursor-pointer transition-all hover:scale-105 ${
                        isSelected
                          ? 'border-gov-500 bg-gov-50/90 shadow-md ring-2 ring-gov-200'
                          : hasRestricted
                          ? 'border-red-300 bg-red-50/80'
                          : hasConditional
                          ? 'border-amber-300 bg-amber-50/80'
                          : 'border-emerald-200 bg-emerald-50/60'
                      }`}
                      style={{ left: `${left}%`, top: `${top}%`, width: '18%', height: '36%' }}
                    >
                      {hasRestricted ? (
                        <XCircle className="w-4 h-4 text-red-500 mb-0.5" />
                      ) : hasConditional ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 mb-0.5" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mb-0.5" />
                      )}
                      <div className="font-semibold text-slate-700 text-center leading-tight">{p.village}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{p.district}</div>
                    </div>
                  )
                })}
              </svg>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Restriction Zones">
            <div className="space-y-1.5">
              {restrictionZones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg transition-colors ${
                    activeZones.has(zone.id) ? `${zone.bg} border border-current/10` : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${activeZones.has(zone.id) ? zone.bg : 'bg-slate-100'}`}>
                    <zone.icon className={`w-3.5 h-3.5 ${activeZones.has(zone.id) ? zone.color : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-xs font-medium flex-1 text-left ${activeZones.has(zone.id) ? 'text-slate-900' : 'text-slate-500'}`}>
                    {zone.label}
                  </span>
                  <div className={`w-8 h-4.5 rounded-full transition-colors ${activeZones.has(zone.id) ? 'bg-gov-500' : 'bg-slate-200'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform mt-0.25 ${activeZones.has(zone.id) ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedParcel && (
            <Card title="Restriction Analysis" subtitle={selectedParcel.ulpin}>
              <div className="flex gap-2 mb-3">
                {(['all', 'restricted', 'conditional', 'none'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                      statusFilter === f
                        ? 'bg-gov-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'none' ? 'Clear' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {filteredRestrictions.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-emerald-700">No restrictions found for this parcel</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRestrictions.map((r, i) => {
                    const config = restrictionStatusConfig[r.status]
                    return (
                      <div key={i} className={`p-2.5 rounded-lg border ${config.bg} ${config.border}`}>
                        <div className="flex items-center gap-1.5">
                          <config.icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
                          <span className={`text-xs font-semibold ${config.color}`}>{r.zone}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-auto ${
                            r.status === 'restricted' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{config.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{r.detail}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <Card
        title="Parcel Restrictions Summary"
        subtitle="Overview of all parcels and their restriction statuses"
        action={
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field w-auto text-xs py-1.5"
            >
              <option value="all">All Status</option>
              <option value="restricted">Restricted</option>
              <option value="conditional">Conditional</option>
              <option value="none">No Restriction</option>
            </select>
          </div>
        }
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ULPIN</th>
                <th>Owner</th>
                <th>District</th>
                <th>Land Use</th>
                <th>Restrictions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parcelsWithRestrictions.map(p => {
                const restrictions = parcelRestrictions[p.id] || []
                const worstStatus = restrictions.some(r => r.status === 'restricted')
                  ? 'restricted'
                  : restrictions.some(r => r.status === 'conditional')
                  ? 'conditional'
                  : 'none'
                const config = restrictionStatusConfig[worstStatus]
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer ${selectedParcelId === p.id ? 'bg-gov-50/50' : ''}`}
                    onClick={() => setSelectedParcelId(selectedParcelId === p.id ? null : p.id)}
                  >
                    <td className="font-mono text-xs">{p.ulpin}</td>
                    <td>{p.ownerName}</td>
                    <td className="text-slate-500">{p.district}</td>
                    <td><StatusBadge status={p.landUse} /></td>
                    <td className="text-xs text-slate-500">{restrictions.length === 0 ? '—' : `${restrictions.length} restriction${restrictions.length > 1 ? 's' : ''}`}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.border} border ${config.color}`}>
                        <config.icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
