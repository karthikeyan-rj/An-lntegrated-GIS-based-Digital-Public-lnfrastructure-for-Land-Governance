import { useState, useMemo } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  Wifi,
  Route,
  GitBranch,
  Map,
  CheckCircle,
  XCircle,
  MapPin,
  Cable,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import parcels from '@/data/parcels'

interface UtilityLayer {
  id: string
  label: string
  icon: typeof Zap
  color: string
  bg: string
  border: string
  enabled: boolean
}

const defaultLayers: UtilityLayer[] = [
  { id: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', enabled: true },
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', enabled: true },
  { id: 'sewerage', label: 'Sewerage', icon: Wind, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', enabled: false },
  { id: 'gas', label: 'Gas', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', enabled: false },
  { id: 'telecom', label: 'Telecom', icon: Wifi, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', enabled: true },
  { id: 'roads', label: 'Roads', icon: Route, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', enabled: false },
  { id: 'drainage', label: 'Drainage', icon: GitBranch, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', enabled: false },
]

export default function UtilitiesPage() {
  const [layers, setLayers] = useState<UtilityLayer[]>(defaultLayers)
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l))
  }

  const selectedParcel = useMemo(
    () => parcels.find(p => p.id === selectedParcelId) || null,
    [selectedParcelId]
  )

  const connectedCount = parcels.filter(p => p.utilities.electricity).length
  const waterCount = parcels.filter(p => p.utilities.water).length
  const sewerCount = parcels.filter(p => p.utilities.sewerage).length

  const isRoadsEnabled = layers.find(l => l.id === 'roads')?.enabled
  const isElecEnabled = layers.find(l => l.id === 'electricity')?.enabled
  const isWaterEnabled = layers.find(l => l.id === 'water')?.enabled
  const isTelecomEnabled = layers.find(l => l.id === 'telecom')?.enabled
  const isDrainageEnabled = layers.find(l => l.id === 'drainage')?.enabled
  const isGasEnabled = layers.find(l => l.id === 'gas')?.enabled
  const isSewerageEnabled = layers.find(l => l.id === 'sewerage')?.enabled

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Utilities &amp; Infrastructure</h1>
        <p className="page-subtitle">Monitor utility infrastructure, connections, and coverage across parcels</p>
      </div>

      <CardGrid>
        <StatCard title="Electricity Connections" value={`${connectedCount}/${parcels.length}`} icon={Zap} iconColor="text-yellow-600" change={`${Math.round(connectedCount / parcels.length * 100)}% coverage`} changeType="up" />
        <StatCard title="Water Connections" value={`${waterCount}/${parcels.length}`} icon={Droplets} iconColor="text-blue-600" change={`${Math.round(waterCount / parcels.length * 100)}% coverage`} changeType="up" />
        <StatCard title="Sewerage Coverage" value={`${sewerCount}/${parcels.length}`} icon={Wind} iconColor="text-teal-600" change={`${Math.round(sewerCount / parcels.length * 100)}% connected`} changeType="neutral" />
        <StatCard title="Fiber/Broadband" value={parcels.filter(p => p.utilities.telecom).length} icon={Wifi} iconColor="text-purple-600" change="Active connections" changeType="up" />
      </CardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card noPadding className="lg:col-span-3">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
            <Map className="w-4 h-4 text-gov-600" />
            <h3 className="text-sm font-semibold text-slate-900">Infrastructure Map</h3>
          </div>
          <div className="relative overflow-hidden" style={{ height: 480 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#roadGrid)" />
                {isRoadsEnabled && (
                  <g>
                    <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
                    <line x1="50%" y1="5%" x2="50%" y2="95%" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
                    <line x1="15%" y1="20%" x2="85%" y2="80%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,3" opacity="0.4" />
                  </g>
                )}
                {isElecEnabled && (
                  <g>
                    <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7" />
                    <line x1="10%" y1="70%" x2="90%" y2="70%" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7" />
                    <circle cx="20%" cy="30%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="40%" cy="30%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="60%" cy="30%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="80%" cy="30%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="25%" cy="70%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="50%" cy="70%" r="3" fill="#eab308" opacity="0.8" />
                    <circle cx="75%" cy="70%" r="3" fill="#eab308" opacity="0.8" />
                  </g>
                )}
                {isWaterEnabled && (
                  <g>
                    <line x1="20%" y1="10%" x2="20%" y2="90%" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
                    <line x1="60%" y1="10%" x2="60%" y2="90%" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
                    <circle cx="20%" cy="50%" r="5" fill="#3b82f6" opacity="0.5" />
                    <circle cx="60%" cy="50%" r="5" fill="#3b82f6" opacity="0.5" />
                  </g>
                )}
                {isTelecomEnabled && (
                  <g>
                    <circle cx="35%" cy="40%" r="60" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,2" opacity="0.3" />
                    <circle cx="70%" cy="60%" r="50" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,2" opacity="0.3" />
                    <circle cx="35%" cy="40%" r="4" fill="#a855f7" opacity="0.8" />
                    <circle cx="70%" cy="60%" r="4" fill="#a855f7" opacity="0.8" />
                  </g>
                )}
                {isDrainageEnabled && (
                  <path d="M 10% 85% Q 30% 75% 50% 85% Q 70% 95% 90% 80%" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5" />
                )}
                {isGasEnabled && (
                  <g>
                    <line x1="30%" y1="15%" x2="30%" y2="85%" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6,2" opacity="0.6" />
                    <line x1="75%" y1="15%" x2="75%" y2="85%" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6,2" opacity="0.6" />
                  </g>
                )}
                {isSewerageEnabled && (
                  <g>
                    <line x1="15%" y1="45%" x2="85%" y2="45%" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
                    <line x1="45%" y1="15%" x2="45%" y2="85%" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
                  </g>
                )}
              </svg>
              {parcels.map((p, i) => {
                const col = i % 4
                const row = Math.floor(i / 4)
                const left = 6 + col * 24
                const top = 6 + row * 45
                const isSelected = selectedParcelId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedParcelId(isSelected ? null : p.id)}
                    className={`absolute rounded-lg border-2 shadow-sm flex flex-col items-center justify-center text-[10px] font-mono cursor-pointer transition-all hover:scale-105 ${
                      isSelected
                        ? 'border-gov-500 bg-gov-50/90 shadow-md ring-2 ring-gov-200'
                        : 'border-white/70 bg-white/80 hover:shadow-md'
                    }`}
                    style={{ left: `${left}%`, top: `${top}%`, width: '18%', height: '36%' }}
                  >
                    <MapPin className={`w-3 h-3 mb-0.5 ${isSelected ? 'text-gov-600' : 'text-slate-400'}`} />
                    <div className="font-semibold text-slate-700 text-center leading-tight">{p.village}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{p.district}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Utility Layers">
            <div className="space-y-1.5">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg transition-colors ${
                    layer.enabled ? `${layer.bg} ${layer.border} border` : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${layer.enabled ? layer.bg : 'bg-slate-100'}`}>
                    <layer.icon className={`w-3.5 h-3.5 ${layer.enabled ? layer.color : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-xs font-medium flex-1 text-left ${layer.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                    {layer.label}
                  </span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layer.enabled ? 'bg-gov-500' : 'bg-slate-200'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.25 ${layer.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedParcel && (
            <Card title="Nearest Infrastructure" subtitle={selectedParcel.ulpin}>
              <div className="space-y-2.5">
                {([
                  { label: 'Electricity', status: selectedParcel.utilities.electricity, icon: Zap },
                  { label: 'Water', status: selectedParcel.utilities.water, icon: Droplets },
                  { label: 'Sewerage', status: selectedParcel.utilities.sewerage, icon: Wind },
                  { label: 'Gas', status: selectedParcel.utilities.gas, icon: Flame },
                  { label: 'Telecom/Fiber', status: selectedParcel.utilities.telecom, icon: Wifi },
                ] as const).map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700">{item.label}</span>
                    </div>
                    {item.status ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                        <XCircle className="w-3 h-3" /> Not Connected
                      </span>
                    )}
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-slate-700 flex items-center gap-2"><Cable className="w-3.5 h-3.5 text-slate-400" /> Road Distance</span>
                    <span className="text-xs font-medium text-slate-600">{selectedParcel.district === 'Chennai' ? '15m' : selectedParcel.district === 'Chandigarh' ? '25m' : '50m'} from main road</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card title="Parcels Utility Status" subtitle="Utility connectivity status for all parcels">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ULPIN</th>
                <th>Owner</th>
                <th>District</th>
                <th className="text-center"><span className="flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Elec.</span></th>
                <th className="text-center"><span className="flex items-center justify-center gap-1"><Droplets className="w-3 h-3" /> Water</span></th>
                <th className="text-center"><span className="flex items-center justify-center gap-1"><Wind className="w-3 h-3" /> Sewer</span></th>
                <th className="text-center"><span className="flex items-center justify-center gap-1"><Flame className="w-3 h-3" /> Gas</span></th>
                <th className="text-center"><span className="flex items-center justify-center gap-1"><Wifi className="w-3 h-3" /> Telecom</span></th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr
                  key={p.id}
                  className={`cursor-pointer ${selectedParcelId === p.id ? 'bg-gov-50/50' : ''}`}
                  onClick={() => setSelectedParcelId(selectedParcelId === p.id ? null : p.id)}
                >
                  <td className="font-mono text-xs">{p.ulpin}</td>
                  <td>{p.ownerName}</td>
                  <td className="text-slate-500">{p.district}</td>
                  <td className="text-center">
                    {p.utilities.electricity ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.utilities.water ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.utilities.sewerage ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.utilities.gas ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {p.utilities.telecom ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
