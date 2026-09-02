import { useState } from 'react'
import { Landmark, BadgeCheck, Building2, DraftingCompass, Receipt, Zap, Leaf, Server, KeyRound, Eye, FlaskConical, FileJson, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatNumber, timeAgo } from '@/lib/utils'

interface ConnectedSystem {
  id: string
  name: string
  shortName: string
  icon: typeof Landmark
  connected: boolean
  latency: number
  lastSync: string
  recordsSynced: number
  color: string
}

const connectedSystems: ConnectedSystem[] = [
  { id: 's1', name: 'Land Records API', shortName: 'Revenue', icon: Landmark, connected: true, latency: 42, lastSync: '2025-12-12T10:30:00', recordsSynced: 1247893, color: 'bg-blue-50 text-blue-600' },
  { id: 's2', name: 'Registration API', shortName: 'Registration', icon: BadgeCheck, connected: true, latency: 38, lastSync: '2025-12-12T10:28:00', recordsSynced: 892341, color: 'bg-purple-50 text-purple-600' },
  { id: 's3', name: 'Municipal API', shortName: 'Municipality', icon: Building2, connected: true, latency: 65, lastSync: '2025-12-12T09:45:00', recordsSynced: 534210, color: 'bg-indigo-50 text-indigo-600' },
  { id: 's4', name: 'Planning API', shortName: 'Planning', icon: DraftingCompass, connected: true, latency: 51, lastSync: '2025-12-12T10:15:00', recordsSynced: 312654, color: 'bg-cyan-50 text-cyan-600' },
  { id: 's5', name: 'Property Tax API', shortName: 'Taxation', icon: Receipt, connected: true, latency: 29, lastSync: '2025-12-12T10:32:00', recordsSynced: 987123, color: 'bg-orange-50 text-orange-600' },
  { id: 's6', name: 'Utility API', shortName: 'Utilities', icon: Zap, connected: true, latency: 78, lastSync: '2025-12-12T08:00:00', recordsSynced: 421987, color: 'bg-yellow-50 text-yellow-600' },
  { id: 's7', name: 'Environmental API', shortName: 'Environment', icon: Leaf, connected: true, latency: 92, lastSync: '2025-12-11T22:00:00', recordsSynced: 156789, color: 'bg-teal-50 text-teal-600' },
]

interface ApiEntry {
  id: string
  name: string
  department: string
  version: string
  status: 'stable' | 'beta' | 'deprecated'
  auth: 'OAuth2' | 'API Key' | 'mTLS' | 'JWT'
  updated: string
}

const apiCatalog: ApiEntry[] = [
  { id: 'a1', name: 'Parcel Lookup', department: 'Revenue', version: 'v2.1', status: 'stable', auth: 'OAuth2', updated: '2025-11-20' },
  { id: 'a2', name: 'ULPIN Resolution', department: 'Revenue', version: 'v2.0', status: 'stable', auth: 'API Key', updated: '2025-10-05' },
  { id: 'a3', name: 'Registration Records', department: 'Registration', version: 'v1.8', status: 'stable', auth: 'OAuth2', updated: '2025-11-12' },
  { id: 'a4', name: 'Mutation Workflow', department: 'Revenue', version: 'v1.5', status: 'beta', auth: 'OAuth2', updated: '2025-12-01' },
  { id: 'a5', name: 'Building Permission', department: 'Planning', version: 'v2.0', status: 'stable', auth: 'mTLS', updated: '2025-09-28' },
  { id: 'a6', name: 'Zoning Lookup', department: 'Planning', version: 'v1.2', status: 'beta', auth: 'API Key', updated: '2025-12-05' },
  { id: 'a7', name: 'Property Tax Assessment', department: 'Taxation', version: 'v2.3', status: 'stable', auth: 'mTLS', updated: '2025-11-30' },
  { id: 'a8', name: 'Tax Payment Status', department: 'Taxation', version: 'v1.0', status: 'deprecated', auth: 'API Key', updated: '2025-06-15' },
  { id: 'a9', name: 'Utility Connection', department: 'Utilities', version: 'v1.2', status: 'beta', auth: 'JWT', updated: '2025-12-08' },
  { id: 'a10', name: 'Satellite Change Feed', department: 'Environment', version: 'v1.0', status: 'beta', auth: 'JWT', updated: '2025-12-10' },
]

const syncHistory = [
  { id: 1, system: 'Revenue Department', records: 1247893, status: 'success', time: '2025-12-12T10:30:00', duration: '4m 12s' },
  { id: 2, system: 'Registration Department', records: 892341, status: 'success', time: '2025-12-12T10:28:00', duration: '3m 45s' },
  { id: 3, system: 'Property Tax Department', records: 987123, status: 'success', time: '2025-12-12T10:32:00', duration: '4m 02s' },
  { id: 4, system: 'Municipal Corporation', records: 534210, status: 'warning', time: '2025-12-12T09:45:00', duration: '6m 31s' },
  { id: 5, system: 'Public Works Department', records: 421987, status: 'success', time: '2025-12-12T08:00:00', duration: '5m 18s' },
  { id: 6, system: 'Environment & Forest', records: 156789, status: 'warning', time: '2025-12-11T22:00:00', duration: '2m 55s' },
]

export default function APICenter() {
  const [query, setQuery] = useState('')

  const filteredApis = apiCatalog.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.department.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Digital Public Infrastructure - API Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage the integration layer connecting LandStack to state department systems</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {connectedSystems.map(system => (
          <div key={system.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${system.color}`}>
                <system.icon className="w-5 h-5" />
              </div>
              <Badge variant={system.connected ? 'green' : 'red'}>
                <span className={`w-1.5 h-1.5 rounded-full ${system.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {system.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{system.name}</h3>
            <p className="text-xs text-slate-400">{system.shortName} Department</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Latency: <span className="font-medium">{system.latency}ms</span></div>
              <div className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Last sync: <span className="font-medium">{timeAgo(system.lastSync)}</span></div>
              <div className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-slate-400" /> Records: <span className="font-medium">{formatNumber(system.recordsSynced)}</span></div>
            </div>
          </div>
        ))}
      </div>

      <Card
        title="API Catalog"
        subtitle="Registry of all published integration endpoints"
        action={
          <div className="relative">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search APIs..."
              className="pl-3 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-transparent w-44"
            />
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">API Name</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Auth Type</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredApis.map(api => (
                <tr key={api.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-slate-300" />
                      <span className="font-medium text-slate-900">{api.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{api.department}</td>
                  <td className="py-3 px-3"><span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{api.version}</span></td>
                  <td className="py-3 px-3">
                    <Badge variant={api.status === 'stable' ? 'green' : api.status === 'beta' ? 'amber' : 'red'}>{api.status}</Badge>
                  </td>
                  <td className="py-3 px-3"><Badge variant="slate">{api.auth}</Badge></td>
                  <td className="py-3 px-3 text-xs text-slate-500">{timeAgo(api.updated)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-gov-600" title="View"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-gov-600" title="Test"><FlaskConical className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-gov-600" title="Schema"><FileJson className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Data Synchronization" subtitle="Overall integration health" action={<Button variant="secondary" size="sm"><RefreshCw className="w-3.5 h-3.5" /> Sync Now</Button>}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-2xl font-bold text-emerald-700">{formatNumber(4239872)}</p>
              <p className="text-xs text-emerald-600 mt-1">Records Synced</p>
            </div>
            <div className="p-4 rounded-xl bg-gov-50 border border-gov-100 text-center">
              <p className="text-2xl font-bold text-gov-700">7/7</p>
              <p className="text-xs text-gov-600 mt-1">Systems Online</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <p className="text-2xl font-bold text-amber-700">2</p>
              <p className="text-xs text-amber-600 mt-1">Warnings</p>
            </div>
          </div>
        </Card>

        <Card title="Sync History" subtitle="Recent data synchronization runs">
          <div className="space-y-3">
            {syncHistory.map(sync => (
              <div key={sync.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/70">
                {sync.status === 'success'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{sync.system}</p>
                  <p className="text-xs text-slate-500">{formatNumber(sync.records)} records · {sync.duration}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(sync.time)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
