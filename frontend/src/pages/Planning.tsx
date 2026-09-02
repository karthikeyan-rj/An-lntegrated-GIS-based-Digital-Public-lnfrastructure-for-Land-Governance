import { useState, useMemo } from 'react'
import {
  Map,
  Layers,
  TreePine,
  Droplets,
  Building2,
  Factory,
  GraduationCap,
  Home,
  ShoppingBag,
  Wheat,
  Shuffle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import parcels from '@/data/parcels'
import { getParcelByULPIN } from '@/data/parcels'
import type { Parcel, ZoningType } from '@/types'

const zoningLegend: { label: string; color: string; bg: string; icon: typeof Home }[] = [
  { label: 'Residential', color: 'text-blue-600', bg: 'bg-blue-500', icon: Home },
  { label: 'Commercial', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: ShoppingBag },
  { label: 'Agricultural', color: 'text-yellow-600', bg: 'bg-yellow-500', icon: Wheat },
  { label: 'Industrial', color: 'text-purple-600', bg: 'bg-purple-500', icon: Factory },
  { label: 'Institutional', color: 'text-cyan-600', bg: 'bg-cyan-500', icon: GraduationCap },
  { label: 'Forest', color: 'text-green-800', bg: 'bg-green-700', icon: TreePine },
  { label: 'Water', color: 'text-sky-400', bg: 'bg-sky-300', icon: Droplets },
  { label: 'Mixed Use', color: 'text-orange-600', bg: 'bg-orange-500', icon: Shuffle },
]

const zoningColorMap: Record<string, string> = {
  R1: 'bg-blue-400/70',
  R2: 'bg-blue-500/70',
  C1: 'bg-emerald-400/70',
  C2: 'bg-emerald-500/70',
  A1: 'bg-yellow-400/70',
  I1: 'bg-purple-400/70',
  I2: 'bg-purple-500/70',
  F1: 'bg-green-700/70',
  W1: 'bg-sky-300/70',
  MU1: 'bg-orange-400/70',
}

interface ZoningResult {
  parcel: Parcel
  permittedUse: string
  far: string
  maxHeight: string
  setback: string
  roadWidth: string
  restrictions: string[]
}

function getZoningInfo(zoning: ZoningType): Omit<ZoningResult, 'parcel' | 'restrictions'> {
  const map: Record<ZoningType, Omit<ZoningResult, 'parcel' | 'restrictions'>> = {
    R1: { permittedUse: 'Single-family residential, Community facilities', far: '1.5', maxHeight: '15m (G+3)', setback: '3m front, 2m sides', roadWidth: '9m minimum' },
    R2: { permittedUse: 'Multi-family residential, Row housing', far: '2.0', maxHeight: '18m (G+4)', setback: '4m front, 2m sides', roadWidth: '12m minimum' },
    C1: { permittedUse: 'Retail, Offices, Restaurants, Banks', far: '2.5', maxHeight: '24m (G+6)', setback: '5m front, 3m sides', roadWidth: '15m minimum' },
    C2: { permittedUse: 'Mixed commercial, Malls, Showrooms', far: '3.5', maxHeight: '30m (G+8)', setback: '6m front, 4m sides', roadWidth: '18m minimum' },
    A1: { permittedUse: 'Agriculture only, Farm buildings, Agro-processing', far: '0.3', maxHeight: '9m (G+1)', setback: '3m all sides', roadWidth: '6m minimum' },
    I1: { permittedUse: 'Light industry, Warehousing, IT parks', far: '1.0', maxHeight: '15m (G+3)', setback: '8m front, 5m sides', roadWidth: '18m minimum' },
    I2: { permittedUse: 'Heavy industry, Manufacturing', far: '0.5', maxHeight: '12m (G+2)', setback: '10m front, 8m sides', roadWidth: '20m minimum' },
    F1: { permittedUse: 'Forest activities only, No construction', far: 'N/A', maxHeight: 'N/A', setback: 'N/A', roadWidth: 'N/A' },
    W1: { permittedUse: 'Water body, No construction', far: 'N/A', maxHeight: 'N/A', setback: '50m buffer', roadWidth: 'N/A' },
    MU1: { permittedUse: 'Residential + Commercial, Mixed-use development', far: '3.5', maxHeight: '40m (G+10)', setback: '5m front, 3m sides', roadWidth: '15m minimum' },
  }
  return map[zoning]
}

const planningApplications = [
  { ulpin: 'TN-CHN-PM-72618345', type: 'Change of Land Use', status: 'under_review', date: '2025-11-28' },
  { ulpin: 'CH-CHD-SE-05839271', type: 'Layout Approval', status: 'approved', date: '2025-11-15' },
  { ulpin: 'TN-CBE-GN-91527483', type: 'Subdivision Request', status: 'pending', date: '2025-12-05' },
  { ulpin: 'TN-MDU-VK-21958374', type: 'Building Plan Approval', status: 'approved', date: '2025-10-22' },
  { ulpin: 'TN-TRZ-KK-45183627', type: 'Zone Variance', status: 'rejected', date: '2025-12-01' },
  { ulpin: 'TN-CBE-PE-57431028', type: 'FAR Exception', status: 'pending', date: '2025-12-08' },
  { ulpin: 'CH-CHD-MZ-83726154', type: 'Heritage Zone Clearance', status: 'under_review', date: '2025-11-20' },
  { ulpin: 'TN-CHN-AD-68294015', type: 'Layout Approval', status: 'approved', date: '2025-09-10' },
]

export default function Planning() {
  const [searchUlpin, setSearchUlpin] = useState('')
  const [zoningResult, setZoningResult] = useState<ZoningResult | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [legendOpen, setLegendOpen] = useState(true)

  const handleSearch = () => {
    const parcel = getParcelByULPIN(searchUlpin.trim())
    if (parcel) {
      const info = getZoningInfo(parcel.zoning)
      setZoningResult({ ...info, parcel, restrictions: parcel.restrictions })
    } else {
      setZoningResult(null)
    }
  }

  const gridParcels = useMemo(() => parcels.slice(0, 8), [])

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Master Plan &amp; Planning</h1>
        <p className="page-subtitle">GIS-based zoning map, development regulations, and planning applications</p>
      </div>

      <CardGrid>
        <StatCard title="Master Plans" value={24} icon={FileText} iconColor="text-blue-600" change="2 new drafts" changeType="up" />
        <StatCard title="Active Zones" value={156} icon={Layers} iconColor="text-emerald-600" change="8 updated" changeType="up" />
        <StatCard title="Reserved Areas" value={43} icon={AlertTriangle} iconColor="text-amber-600" change="3 added" changeType="up" />
        <StatCard title="Development Projects" value={18} icon={Building2} iconColor="text-purple-600" change="5 in progress" changeType="neutral" />
      </CardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card noPadding className="lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-gov-600" />
              <h3 className="text-sm font-semibold text-slate-900">Zoning Map View</h3>
            </div>
            <span className="text-xs text-slate-400">Tamil Nadu &amp; Chandigarh Overview</span>
          </div>
          <div className="relative overflow-hidden" style={{ height: 480 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-emerald-50/40 to-sky-50">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              {gridParcels.map((p, i) => {
                const col = i % 4
                const row = Math.floor(i / 4)
                const left = 8 + col * 24
                const top = 8 + row * 45
                return (
                  <div
                    key={p.id}
                    className={`absolute rounded-lg border border-white/60 shadow-sm flex items-center justify-center text-[10px] font-mono text-white/90 cursor-pointer hover:scale-105 transition-transform ${zoningColorMap[p.zoning] || 'bg-slate-300/70'}`}
                    style={{ left: `${left}%`, top: `${top}%`, width: '18%', height: '38%' }}
                    title={`${p.ulpin} — ${p.village}`}
                  >
                    <div className="text-center leading-tight">
                      <div className="font-semibold">{p.zoning}</div>
                      <div className="opacity-75 text-[9px]">{p.district}</div>
                    </div>
                  </div>
                )
              })}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg border border-slate-200">
                <div className="flex items-center gap-4 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400/70 inline-block" /> R1/R2</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400/70 inline-block" /> C1/C2</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400/70 inline-block" /> A1</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-400/70 inline-block" /> I1/I2</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-700/70 inline-block" /> F1</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Zoning Legend" className="lg:col-span-1">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Zone Types</span>
            {legendOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {legendOpen && (
            <div className="mt-3 space-y-2">
              {zoningLegend.map(z => (
                <div key={z.label} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className={`w-4 h-4 rounded-sm shrink-0 ${z.bg}`} />
                  <z.icon className={`w-3.5 h-3.5 shrink-0 ${z.color}`} />
                  <span className="text-xs text-slate-700 font-medium">{z.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="What can I legally build on this land?" subtitle="Search by ULPIN to check zoning regulations">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUlpin}
              onChange={e => setSearchUlpin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter ULPIN (e.g. TN-MDU-RV-38472916)"
              className="input-field pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Check Zoning</Button>
        </div>

        {zoningResult && (
          <div className="mt-5 p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{zoningResult.parcel.ulpin}</span>
              <StatusBadge status={zoningResult.parcel.landUse} />
              <span className="text-xs text-slate-500">{zoningResult.parcel.village}, {zoningResult.parcel.district}</span>
              <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">Zone: {zoningResult.parcel.zoning}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Permitted Use', value: zoningResult.permittedUse },
                { label: 'Floor Area Ratio', value: zoningResult.far },
                { label: 'Max Height', value: zoningResult.maxHeight },
                { label: 'Setback', value: zoningResult.setback },
                { label: 'Road Width', value: zoningResult.roadWidth },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
            {zoningResult.restrictions.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Development Restrictions</p>
                <ul className="space-y-1">
                  {zoningResult.restrictions.map((r, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!zoningResult && searchUlpin && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center">
            <p className="text-sm text-slate-500">No parcel found with ULPIN "{searchUlpin}". Please check and try again.</p>
          </div>
        )}
      </Card>

      <Card
        title="Recent Planning Applications"
        subtitle="Latest submissions to the Town Planning Department"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}>
            <FileText className="w-3.5 h-3.5" />
            New Application
          </Button>
        }
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ULPIN</th>
                <th>Application Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {planningApplications.map((app, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{app.ulpin}</td>
                  <td>{app.type}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td className="text-slate-500">{new Date(app.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <Card title="Submit New Planning Application" subtitle="Fill in the details below to submit a new application">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ULPIN</label>
              <input type="text" placeholder="Enter ULPIN" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Application Type</label>
              <select className="input-field">
                <option value="">Select type</option>
                <option>Change of Land Use</option>
                <option>Layout Approval</option>
                <option>Subdivision Request</option>
                <option>Building Plan Approval</option>
                <option>Zone Variance</option>
                <option>FAR Exception</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea className="input-field" rows={3} placeholder="Describe the planning request..." />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button onClick={() => setShowForm(false)}>Submit Application</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
