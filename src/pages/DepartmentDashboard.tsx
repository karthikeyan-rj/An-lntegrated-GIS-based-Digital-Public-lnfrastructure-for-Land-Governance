import { useMemo, useState } from 'react'
import {
  Landmark,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
  Activity,
  Building2,
  Receipt,
  TrendingUp,
  Network,
  Globe,
  Clock,
  Database,
  GitBranch,
  Zap,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatNumber, timeAgo } from '@/lib/utils'
import { departments, auditLogs } from '@/data/services'
import type { Department } from '@/types'

const departmentPerformance = [
  { name: 'Revenue', processingTime: 3.2, target: 5 },
  { name: 'Registration', processingTime: 2.1, target: 4 },
  { name: 'Planning', processingTime: 6.8, target: 7 },
  { name: 'Taxation', processingTime: 1.4, target: 3 },
  { name: 'Utilities', processingTime: 4.5, target: 5 },
  { name: 'Environment', processingTime: 8.2, target: 10 },
]

const crossDepartmentActivity = [
  {
    id: 1,
    title: 'Mutation Approved — Revenue → Registration',
    description: 'Revenue officer approved the mutation for LS-2025-00203. Registration record queued for update.',
    department: 'Revenue',
    time: '10:28 AM',
    icon: Database,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 2,
    title: 'Building Permission Approved — Planning → Municipality',
    description: 'Approval BP-2025-CHD-0042 pushed to municipal authority for tax reassessment and occupancy.',
    department: 'Planning',
    time: '10:15 AM',
    icon: Building2,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 3,
    title: 'Property Tax Assessment — Municipality → Taxation',
    description: 'Municipal new assessment record synced to the Property Tax Department for 2025-26 billing.',
    department: 'Taxation',
    time: '09:45 AM',
    icon: Receipt,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 4,
    title: 'Utility Connection Request — Citizen → Utilities',
    description: 'Electricity service connection request forwarded to Public Works Department from the citizen portal.',
    department: 'Utilities',
    time: '09:20 AM',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 5,
    title: 'Encroachment Flag — Environment → Revenue',
    description: 'Satellite change detection alerted the Revenue Department of potential encroachment on TN-MDU-VK-21958374.',
    department: 'Environment',
    time: '08:55 AM',
    icon: Globe,
    color: 'bg-teal-100 text-teal-600',
  },
]

function ConnectedDepartmentRow({ dept }: { dept: Department }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-3 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dept.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{dept.name}</p>
              <p className="text-xs text-slate-400">{dept.shortName}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-3">
          <Badge variant={dept.connected ? 'green' : 'red'}>
            <span className={`w-1.5 h-1.5 rounded-full ${dept.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {dept.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </td>
        <td className="py-3 px-3 text-sm text-slate-600 tabular-nums">{dept.latency ? `${dept.latency}ms` : '—'}</td>
        <td className="py-3 px-3 text-xs text-slate-500">{timeAgo(dept.lastSync)}</td>
        <td className="py-3 px-3 text-sm text-slate-700 tabular-nums">{formatNumber(dept.recordsSynced)}</td>
        <td className="py-3 px-3">
          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{dept.apiVersion}</span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={6} className="py-3 px-3">
            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Endpoint: <span className="font-mono">/api/v1/{dept.shortName.toLowerCase()}</span></span>
              <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5 text-slate-400" /> OAuth2 Client: <span className="font-mono">landstack-{dept.shortName.toLowerCase()}</span></span>
              <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-slate-400" /> Last sync batch: <span className="font-mono">batch-{dept.lastSync.slice(0, 10)}</span></span>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function DepartmentDashboard() {
  const connectedDepts = useMemo(() => departments, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Cross-department performance and interoperability overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Parcels" value="12.4M" icon={Landmark} iconColor="text-blue-600" change="+2.3% this quarter" changeType="up" />
        <StatCard title="Verified Parcels" value="8.2M" icon={CheckCircle2} iconColor="text-emerald-600" change="66.1% verified" changeType="neutral" />
        <StatCard title="Pending Mutations" value={formatNumber(1247)} icon={RotateCcw} iconColor="text-amber-600" change="+12 since yesterday" changeType="up" />
        <StatCard title="Registration Requests" value={342} icon={ClipboardList} iconColor="text-purple-600" change="-8% from last week" changeType="down" />
        <StatCard title="Active Disputes" value={89} icon={Activity} iconColor="text-rose-600" change="3 high priority" changeType="neutral" />
        <StatCard title="Planning Applications" value={156} icon={Building2} iconColor="text-indigo-600" change="+23 new" changeType="up" />
        <StatCard title="Tax Collection" value="₹847M" icon={Receipt} iconColor="text-emerald-600" change="91.2% of target" changeType="up" />
        <StatCard title="Data Quality Issues" value={234} icon={TrendingUp} iconColor="text-orange-600" change="-15 resolved today" changeType="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Department Performance" subtitle="Average processing time (days) vs target" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(value: any, name: any) => [`${value} days`, name === 'processingTime' ? 'Actual' : 'Target']}
                />
                <Bar dataKey="processingTime" name="Actual" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Cross-Department Activity" subtitle="Workflow events across systems">
          <div className="space-y-5">
            {crossDepartmentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{activity.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="Connected Departments"
        subtitle="Interoperability status of all linked government systems"
        action={<Badge variant="blue"><Network className="w-3 h-3" /> {connectedDepts.filter(d => d.connected).length}/{connectedDepts.length} online</Badge>}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Latency</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Sync</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Records Synced</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">API Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {connectedDepts.map(dept => (
                <ConnectedDepartmentRow key={dept.id} dept={dept} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Audit Trail Digest" subtitle="Latest cross-system events from the security log">
        <div className="space-y-3">
          {auditLogs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.result === 'success' ? 'bg-emerald-500' : log.result === 'failure' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900"><span className="font-medium">{log.userName}</span> <span className="text-slate-500">— {log.action}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">{log.department} · {log.target} · {timeAgo(log.timestamp)}</p>
              </div>
              <Badge variant={log.result === 'success' ? 'green' : log.result === 'failure' ? 'red' : 'amber'}>{log.result}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
