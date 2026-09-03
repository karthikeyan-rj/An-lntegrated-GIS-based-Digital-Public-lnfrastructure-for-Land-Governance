import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { Landmark, BadgeCheck, ClipboardList, Clock, ArrowRight, Map as MapIcon, Brain, Activity } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import { api, ApiError } from '@/lib/api'
import localParcels from '@/data/parcels'
import { serviceRequests as demoRequests, auditLogs, aiInsights } from '@/data/services'
import { timeAgo } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

function parcelToFeature(p: any): GeoJSON.Feature<GeoJSON.Polygon> {
  const half = 0.0006
  const lat = p.coordinates?.lat ?? 10.5
  const lng = p.coordinates?.lng ?? 78.5
  return {
    type: 'Feature', id: p.id,
    properties: { id: p.id, ulpin: p.ulpin, landUse: p.landUse },
    geometry: { type: 'Polygon', coordinates: [[[lng - half, lat - half], [lng - half, lat + half], [lng + half, lat + half], [lng + half, lat - half], [lng - half, lat - half]]] },
  }
}

function landUseColor(lu: string): string {
  const c: Record<string, string> = { residential: '#3b82f6', commercial: '#f59e0b', agricultural: '#22c55e', industrial: '#8b5cf6', institutional: '#06b6d4', forest: '#166534', mixed: '#ec4899' }
  return c[lu] || '#6b7280'
}

const NON_TERMINAL = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'ACTION_REQUIRED', 'FIELD_VERIFICATION']

export default function Dashboard() {
  const { user } = useAuth()
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [stats, setStats] = useState<{ totalParcels: number; verifiedOwnership: number; activeApplications: number; pendingApprovals: number; isDemo: boolean }>({ totalParcels: 0, verifiedOwnership: 0, activeApplications: 0, pendingApprovals: 0, isDemo: true })
  const [pending, setPending] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      let d: any = null
      try { d = await api.dashboard() } catch { d = null }
      if (d && typeof d.totalParcels === 'number') {
        setStats({ totalParcels: d.totalParcels, verifiedOwnership: d.verifiedOwnership ?? d.digitizedParcels ?? 0, activeApplications: d.activeApplications ?? 0, pendingApprovals: d.pendingApprovals ?? d.pendingMutations ?? 0, isDemo: !!d.isDemo })
      } else {
        setStats({ totalParcels: localParcels.length, verifiedOwnership: localParcels.filter(p => p.ownershipStatus === 'verified').length, activeApplications: demoRequests.filter(r => !['completed', 'rejected'].includes(r.currentStatus)).length, pendingApprovals: 4, isDemo: true })
      }

      // Pending applications
      try {
        const res = await api.applications()
        const list = (res.applications || []).filter((a: any) => NON_TERMINAL.includes(a.status))
        setPending(list.slice(0, 5))
      } catch {
        setPending(demoRequests.filter(r => !['completed', 'rejected'].includes(r.currentStatus)).slice(0, 5))
      }

      // Recent activity
      try {
        const res = await api.audit()
        setRecentActivity((res.logs || []).slice(0, 6))
      } catch {
        setRecentActivity(auditLogs.slice(0, 6))
      }
    }
    load()
  }, [])

  const geoJSON = useMemo(() => ({ type: 'FeatureCollection', features: localParcels.map(parcelToFeature) } as GeoJSON.FeatureCollection), [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = L.map(mapContainerRef.current, { center: [10.8, 78.3], zoom: 6, zoomControl: false, attributionControl: true })
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    const layer = L.geoJSON(geoJSON, {
      style: (f) => ({ color: landUseColor(String((f?.properties as any)?.landUse || '')), weight: 1, fillColor: landUseColor(String((f?.properties as any)?.landUse || '')), fillOpacity: 0.5 }),
    })
    layer.addTo(map)
    try { map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 9 }) } catch { /* ignore */ }
    return () => { map.remove(); mapRef.current = null }
  }, [geoJSON])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of land-governance activity across the system.</p>
        </div>
        {stats.isDemo && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">DEMO</span>}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Parcels" value={stats.totalParcels} icon={Landmark} subtitle="Integrated on GIS" />
        <StatCard title="Verified Parcels" value={stats.verifiedOwnership} icon={BadgeCheck} subtitle="Ownership verified" iconColor="text-emerald-600" />
        <StatCard title="Active Applications" value={stats.activeApplications} icon={ClipboardList} subtitle="In progress" iconColor="text-gov-600" />
        <StatCard title="Pending Actions" value={stats.pendingApprovals} icon={Clock} subtitle="Awaiting review" iconColor="text-amber-600" />
      </div>

      {/* GIS preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-gov-600" />
            <span className="text-sm font-semibold text-slate-900">GIS Land Preview</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">DEMO PARCELS</span>
          </div>
          <Link to="/explorer" className="inline-flex items-center gap-1.5 text-sm font-medium text-gov-600 hover:text-gov-700">
            Open Explorer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div ref={mapContainerRef} className="h-64 bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications requiring attention */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gov-600" />
              <span className="text-sm font-semibold text-slate-900">Applications Requiring Attention</span>
            </div>
            <Link to="/applications" className="inline-flex items-center gap-1 text-sm text-gov-600 hover:text-gov-700">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No pending applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-2.5 font-medium">Application</th>
                    <th className="px-5 py-2.5 font-medium">Service</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">ULPIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pending.map((a: any) => (
                    <tr key={a._id || a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-gov-700">{a.applicationId}</td>
                      <td className="px-5 py-3 text-slate-700">{a.serviceName}</td>
                      <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.ulpin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI alerts */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-gov-600" />
            <span className="text-sm font-semibold text-slate-900">AI Alerts</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">ASSISTIVE</span>
          </div>
          <div className="divide-y divide-slate-50">
            {aiInsights.slice(0, 4).map(i => (
              <div key={i.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{i.title}</p>
                  <StatusBadge status={i.severity} />
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{i.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gov-600" />
          <span className="text-sm font-semibold text-slate-900">Recent Parcel Activity</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2.5 font-medium">When</th>
                <th className="px-5 py-2.5 font-medium">User</th>
                <th className="px-5 py-2.5 font-medium">Action</th>
                <th className="px-5 py-2.5 font-medium">Target</th>
                <th className="px-5 py-2.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentActivity.map((a: any, idx: number) => (
                <tr key={a._id || a.id || idx} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-xs text-slate-500">{timeAgo(a.timestamp || a.createdAt)}</td>
                  <td className="px-5 py-3 text-slate-700">{a.userName}</td>
                  <td className="px-5 py-3 text-slate-700">{a.action}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.resourceId || a.targetId || '-'}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.result || 'success'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
