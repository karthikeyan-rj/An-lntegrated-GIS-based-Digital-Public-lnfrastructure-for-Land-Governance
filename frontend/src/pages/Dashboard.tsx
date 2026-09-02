import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  ClipboardList,
  Clock,
  CheckCircle,
  Search,
  Shield,
  FileSearch,
  BadgeCheck,
  RotateCcw,
  BookOpen,
  Building2,
  Receipt,
  Hammer,
  ArrowRight,
  MapPin,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNumber, timeAgo } from '@/lib/utils'
import { serviceRequests, auditLogs } from '@/data/services'
import type { Parcel } from '@/types'

const citizenProperties: Parcel[] = [
  {
    id: 'p1',
    ulpin: 'TN-MDU-RV-38472916',
    surveyNumber: '123/4A',
    village: 'River Ward',
    taluk: 'Madurai North',
    district: 'Madurai',
    state: 'Tamil Nadu',
    area: 2.47,
    areaUnit: 'acres',
    coordinates: { lat: 9.9252, lng: 78.1198 },
    landUse: 'residential',
    zoning: 'R1',
    ownershipStatus: 'verified',
    ownerName: 'Ramanathan K',
    ownerFatherName: 'Krishnasamy K',
    ownershipType: 'self',
    encumbranceStatus: 'clear',
    disputeStatus: 'none',
    propertyTaxStatus: 'paid',
    taxAmount: 18500,
    buildingPermission: 'approved',
    pattaNumber: 'PA-2024-0847',
    classification: 'Nanjangud',
    verificationStatus: 'digitally_verified',
    lastUpdated: '2025-11-15',
    registeredDate: '2019-06-22',
    restrictions: [],
    utilities: { electricity: true, water: true, sewerage: true, gas: false, telecom: true },
  },
  {
    id: 'p2',
    ulpin: 'TN-CHN-PM-72618345',
    surveyNumber: '56/2B',
    village: 'Park Town',
    taluk: 'Tondiarpet',
    district: 'Chennai',
    state: 'Tamil Nadu',
    area: 0.85,
    areaUnit: 'acres',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    landUse: 'commercial',
    zoning: 'C1',
    ownershipStatus: 'verified',
    ownerName: 'Meenakshi Sundaram Ltd',
    ownerFatherName: '—',
    ownershipType: 'corporate',
    encumbranceStatus: 'mortgaged',
    mortgageBank: 'State Bank of India',
    mortgageAmount: 4500000,
    disputeStatus: 'none',
    propertyTaxStatus: 'paid',
    taxAmount: 52000,
    buildingPermission: 'approved',
    pattaNumber: 'PA-2023-1205',
    classification: 'Commercial',
    verificationStatus: 'digitally_verified',
    lastUpdated: '2025-12-01',
    registeredDate: '2021-03-10',
    restrictions: ['Heritage Zone - Additional approvals required'],
    utilities: { electricity: true, water: true, sewerage: true, gas: true, telecom: true },
  },
]

const departmentPerformance = [
  { name: 'Revenue', performance: 85 },
  { name: 'Registration', performance: 78 },
  { name: 'Planning', performance: 72 },
  { name: 'Taxation', performance: 91 },
  { name: 'Utilities', performance: 65 },
]

const quickServices = [
  { label: 'Search Land', icon: Search, color: 'bg-blue-50 text-blue-600' },
  { label: 'Verify Ownership', icon: Shield, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Check Encumbrance', icon: FileSearch, color: 'bg-amber-50 text-amber-600' },
  { label: 'Track Registration', icon: BadgeCheck, color: 'bg-purple-50 text-purple-600' },
  { label: 'Apply for Mutation', icon: RotateCcw, color: 'bg-rose-50 text-rose-600' },
  { label: 'Request Land Record', icon: BookOpen, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'View Property Tax', icon: Receipt, color: 'bg-orange-50 text-orange-600' },
  { label: 'Building Permission', icon: Hammer, color: 'bg-indigo-50 text-indigo-600' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatShortDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function CitizenDashboard() {
  const { user } = useAuth()

  const myRequest = useMemo(() => serviceRequests.find(r => r.applicantId === 'CIT-2024-8812'), [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{getGreeting()}, {user?.name}</h1>
        <p className="text-sm text-slate-500 mt-1">{formatShortDate()}</p>
      </div>

      <CardGrid>
        <StatCard title="My Properties" value={2} icon={Landmark} iconColor="text-blue-600" />
        <StatCard title="Active Applications" value={1} icon={ClipboardList} iconColor="text-amber-600" />
        <StatCard title="Pending Actions" value={1} icon={Clock} iconColor="text-rose-600" />
        <StatCard title="Completed Services" value={3} icon={CheckCircle} iconColor="text-emerald-600" />
      </CardGrid>

      <Card title="Quick Services" subtitle="Access land governance services instantly">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickServices.map(s => (
            <button
              key={s.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{s.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="My Properties" subtitle="Your registered land parcels">
        <div className="space-y-4">
          {citizenProperties.map(p => (
            <div key={p.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">{p.village}, {p.district}</span>
                  <StatusBadge status={p.ownershipStatus} />
                  <StatusBadge status={p.landUse} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="font-mono">{p.ulpin}</span>
                  <span>{p.area} {p.areaUnit}</span>
                  <span>Tax: {p.propertyTaxStatus}</span>
                </div>
              </div>
              <Link to={`/parcel/${p.id}`}>
                <Button variant="secondary" size="sm">
                  View Property
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {myRequest && (
        <Card title="Active Applications" subtitle="LS-2025-00147 — Ownership Verification">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {myRequest.timeline.map((step, i) => {
                const isDone = !!step.date
                const isCurrent = i === 3
                return (
                  <div key={i} className="relative flex items-start gap-4 pl-10">
                    <div
                      className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100'
                          : isDone
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                    <div>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(step.date).toLocaleString('en-IN')}
                          {step.officer && ` — ${step.officer}`}
                        </p>
                      )}
                      {step.remarks && (
                        <p className="text-xs text-slate-400 mt-0.5">{step.remarks}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function GovernmentDashboard() {
  const recentLogs = useMemo(() => auditLogs.slice(0, 6), [])
  const pendingRequests = useMemo(() => serviceRequests.filter(r => r.currentStatus !== 'completed' && r.currentStatus !== 'rejected'), [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Land Governance Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of land administration across the state</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Parcels" value="12.4M" icon={Landmark} iconColor="text-blue-600" change="+2.3% this quarter" changeType="up" />
        <StatCard title="Verified Parcels" value="8.2M" icon={CheckCircle} iconColor="text-emerald-600" change="66.1% verified" changeType="neutral" />
        <StatCard title="Pending Mutations" value={formatNumber(1247)} icon={RotateCcw} iconColor="text-amber-600" change="+12 since yesterday" changeType="up" />
        <StatCard title="Registration Requests" value={342} icon={ClipboardList} iconColor="text-purple-600" change="-8% from last week" changeType="down" />
        <StatCard title="Active Disputes" value={89} icon={Activity} iconColor="text-rose-600" change="3 high priority" changeType="neutral" />
        <StatCard title="Planning Applications" value={156} icon={Building2} iconColor="text-indigo-600" change="+23 new" changeType="up" />
        <StatCard title="Tax Collection" value="₹847M" icon={Receipt} iconColor="text-emerald-600" change="91.2% of target" changeType="up" />
        <StatCard title="Data Quality Issues" value={234} icon={TrendingUp} iconColor="text-orange-600" change="-15 resolved today" changeType="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Department Performance" subtitle="Service delivery metrics (%)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(value: any) => [`${value}%`, 'Performance']}
                />
                <Bar dataKey="performance" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Activity" subtitle="Latest audit log entries">
          <div className="space-y-3">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  log.result === 'success' ? 'bg-emerald-500' : log.result === 'failure' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{log.userName}</span>
                    <span className="text-slate-500"> — {log.action}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.department} · {log.target} · {timeAgo(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Pending Actions" subtitle="Service requests requiring attention">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Application</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Applicant</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">ULPIN</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs text-slate-700">{req.applicationId}</td>
                  <td className="py-3 px-3 text-slate-900">{req.serviceName}</td>
                  <td className="py-3 px-3 text-slate-700">{req.applicantName}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">{req.ulpin}</td>
                  <td className="py-3 px-3"><StatusBadge status={req.currentStatus} /></td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{timeAgo(req.submittedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {user.role === 'citizen' ? <CitizenDashboard /> : <GovernmentDashboard />}
    </div>
  )
}
