import { useState, useMemo } from 'react'
import {
  PieChart as PieChartIcon,
  Home,
  ShoppingBag,
  Wheat,
  Factory,
  GraduationCap,
  TreePine,
  Droplets,
  Shuffle,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import parcels from '@/data/parcels'
import type { LandUseType } from '@/types'

const landUseStats: { label: string; pct: string; icon: typeof Home; color: string; hex: string }[] = [
  { label: 'Residential', pct: '40%', icon: Home, color: 'text-blue-600', hex: '#3b82f6' },
  { label: 'Commercial', pct: '15%', icon: ShoppingBag, color: 'text-emerald-600', hex: '#10b981' },
  { label: 'Agricultural', pct: '25%', icon: Wheat, color: 'text-yellow-500', hex: '#eab308' },
  { label: 'Industrial', pct: '8%', icon: Factory, color: 'text-purple-600', hex: '#a855f7' },
  { label: 'Institutional', pct: '5%', icon: GraduationCap, color: 'text-cyan-600', hex: '#06b6d4' },
  { label: 'Forest', pct: '5%', icon: TreePine, color: 'text-green-700', hex: '#15803d' },
  { label: 'Water', pct: '2%', icon: Droplets, color: 'text-sky-400', hex: '#7dd3fc' },
]

const pieData = landUseStats.map(s => ({
  name: s.label,
  value: parseFloat(s.pct),
  color: s.hex,
}))

const districts = ['All Districts', ...Array.from(new Set(parcels.map(p => p.district)))].sort()

const landUseTypeLabels: Record<LandUseType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  agricultural: 'Agricultural',
  industrial: 'Industrial',
  institutional: 'Institutional',
  forest: 'Forest',
  water: 'Water',
  mixed: 'Mixed Use',
}

const landUseGroupIcons: Record<string, typeof Home> = {
  residential: Home,
  commercial: ShoppingBag,
  agricultural: Wheat,
  industrial: Factory,
  institutional: GraduationCap,
  forest: TreePine,
  water: Droplets,
  mixed: Shuffle,
}

const landUseGroupColors: Record<string, string> = {
  residential: 'bg-blue-500',
  commercial: 'bg-emerald-500',
  agricultural: 'bg-yellow-500',
  industrial: 'bg-purple-500',
  institutional: 'bg-cyan-500',
  forest: 'bg-green-700',
  water: 'bg-sky-300',
  mixed: 'bg-orange-500',
}

export default function LandUse() {
  const [landUseFilter, setLandUseFilter] = useState<string>('all')
  const [districtFilter, setDistrictFilter] = useState('All Districts')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      if (landUseFilter !== 'all' && p.landUse !== landUseFilter) return false
      if (districtFilter !== 'All Districts' && p.district !== districtFilter) return false
      return true
    })
  }, [landUseFilter, districtFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof parcels>()
    for (const p of filteredParcels) {
      if (!map.has(p.landUse)) map.set(p.landUse, [])
      map.get(p.landUse)!.push(p)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [filteredParcels])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Land Use &amp; Zoning</h1>
        <p className="page-subtitle">Visualize land use distribution and zoning classifications across the state</p>
      </div>

      <CardGrid className="lg:grid-cols-7">
        {landUseStats.map(s => (
          <StatCard key={s.label} title={s.label} value={s.pct} icon={s.icon} iconColor={s.color} />
        ))}
      </CardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Land Use Distribution" subtitle="Percentage breakdown by land use type">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(value: any) => [`${value}%`, 'Share']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Parcels by Land Use" subtitle={`${filteredParcels.length} parcels found`} noPadding>
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={landUseFilter}
                onChange={e => setLandUseFilter(e.target.value)}
                className="input-field w-auto text-xs py-1.5"
              >
                <option value="all">All Land Use</option>
                {Object.entries(landUseTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                className="input-field w-auto text-xs py-1.5"
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {grouped.map(([landUse, items]) => {
              const isExpanded = expandedGroups.has(landUse)
              const Icon = landUseGroupIcons[landUse] || Home
              const dotColor = landUseGroupColors[landUse] || 'bg-slate-400'
              return (
                <div key={landUse}>
                  <button
                    onClick={() => toggleGroup(landUse)}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">{landUseTypeLabels[landUse as LandUseType]}</span>
                      <span className="text-xs text-slate-400">({items.length} parcels)</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isExpanded && (
                    <div className="bg-slate-50/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">ULPIN</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Area</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Zoning</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">District</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map(p => (
                            <tr key={p.id} className="hover:bg-white/60">
                              <td className="px-4 py-2 font-mono">{p.ulpin}</td>
                              <td className="px-4 py-2">{p.ownerName}</td>
                              <td className="px-4 py-2 tabular-nums">{p.area} {p.areaUnit}</td>
                              <td className="px-4 py-2"><StatusBadge status={p.zoning} /></td>
                              <td className="px-4 py-2 text-slate-500">{p.district}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
            {grouped.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">No parcels match the current filters.</div>
            )}
          </div>
        </Card>
      </div>

      <Card title="All Parcels by Land Use" subtitle="Complete listing of parcels with zoning information">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ULPIN</th>
                <th>Owner</th>
                <th>Area</th>
                <th>Land Use</th>
                <th>Zoning</th>
                <th>District</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.ulpin}</td>
                  <td>{p.ownerName}</td>
                  <td className="tabular-nums">{p.area} {p.areaUnit}</td>
                  <td><StatusBadge status={p.landUse} /></td>
                  <td><StatusBadge status={p.zoning} /></td>
                  <td className="text-slate-500">{p.district}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
