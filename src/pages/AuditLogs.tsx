import { useMemo, useState } from 'react'
import { Shield, Activity, XCircle, Users, Download, Search, X, FileClock } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { auditLogs } from '@/data/services'
import type { AuditLog } from '@/types'

const departments = ['Revenue', 'Planning', 'Citizen', 'Administration', 'System', 'Registration']

const actions = [
  'Viewed Parcel Profile',
  'Approved Mutation',
  'Reviewed Building Permission',
  'Submitted Service Request',
  'API Key Rotated',
  'Failed Login Attempt',
  'Downloaded RoR',
  'Data Sync Completed',
]

function ResultBadge({ result }: { result: AuditLog['result'] }) {
  const variant = result === 'success' ? 'green' : result === 'failure' ? 'red' : 'amber'
  return <Badge variant={variant}>{result.charAt(0).toUpperCase() + result.slice(1)}</Badge>
}

export default function AuditLogs() {
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    dateRange: 'all',
    user: 'all',
    department: 'all',
    action: 'all',
    result: 'all',
  })

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesQuery = log.userName.toLowerCase().includes(query.toLowerCase()) ||
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.targetId.toLowerCase().includes(query.toLowerCase()) ||
        log.ip.includes(query)
      const matchesDepartment = filters.department === 'all' || log.department === filters.department
      const matchesAction = filters.action === 'all' || log.action === filters.action
      const matchesResult = filters.result === 'all' || log.result === filters.result
      return matchesQuery && matchesDepartment && matchesAction && matchesResult
    })
  }, [query, filters])

  const selectDropdown = 'px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-600'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security & Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Immutable record of all activities across the LandStack platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value="12,847" icon={Shield} iconColor="text-blue-600" change="+156 today" changeType="up" />
        <StatCard title="Today's Events" value="156" icon={Activity} iconColor="text-emerald-600" change="Active monitoring" changeType="neutral" />
        <StatCard title="Failed Attempts" value="3" icon={XCircle} iconColor="text-red-600" change="1 flagged for review" changeType="neutral" />
        <StatCard title="Active Users" value="42" icon={Users} iconColor="text-purple-600" change="+5 this month" changeType="up" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">Date Range</label>
          <select className={`${selectDropdown} w-full mt-1`} value={filters.dateRange} onChange={e => setFilters(f => ({ ...f, dateRange: e.target.value }))}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">User</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search user or target..."
            className="w-full mt-1 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">Department</label>
          <select className={`${selectDropdown} w-full mt-1`} value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
            <option value="all">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">Action Type</label>
          <select className={`${selectDropdown} w-full mt-1`} value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
            <option value="all">All actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">Result</label>
          <select className={`${selectDropdown} w-full mt-1`} value={filters.result} onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}>
            <option value="all">All results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
        </div>
        <div className="flex lg:items-end">
          <Button variant="secondary" size="md" onClick={() => setFilters({ dateRange: 'all', user: 'all', department: 'all', action: 'all', result: 'all' })}>
            <X className="w-4 h-4" /> Clear
          </Button>
        </div>
      </div>

      <Card
        title="Audit Trail"
        subtitle={`${filteredLogs.length} of ${auditLogs.length} events shown`}
        action={
          <Button variant="primary" size="sm">
            <Download className="w-3.5 h-3.5" /> Export Logs
          </Button>
        }
        noPadding
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No matching events"
            description="Try adjusting your filters or search query to find the audit entries you're looking for."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Target</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelected(log)}>
                    <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gov-50 text-gov-700 flex items-center justify-center text-[10px] font-semibold">
                          {log.userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.department}</td>
                    <td className="py-3 px-3 text-slate-900">{log.action}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-600">{log.target}</span>
                      <span className="ml-1 font-mono text-[11px] text-slate-400">{log.targetId}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{log.ip}</td>
                    <td className="py-3 px-3"><ResultBadge result={log.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileClock className="w-5 h-5 text-gov-600" />
                <h3 className="text-base font-semibold text-slate-900">Audit Entry Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailItem label="Event ID" value={selected.id} mono />
                <DetailItem label="User ID" value={selected.userId} mono />
                <DetailItem label="Timestamp" value={new Date(selected.timestamp).toLocaleString('en-IN')} />
                <DetailItem label="Action" value={selected.action} />
                <DetailItem label="User" value={selected.userName} />
                <DetailItem label="Department" value={selected.department} />
                <DetailItem label="Target" value={selected.target} />
                <DetailItem label="Target ID" value={selected.targetId} mono />
                <DetailItem label="IP Address" value={selected.ip} mono />
                <DetailItem label="Result" value={selected.result.charAt(0).toUpperCase() + selected.result.slice(1)} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Integrity</p>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 font-mono break-all">
                  sha256:9f7c2b91d4e8a3f0c35d6b7a1e09f2c4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-0.5 text-slate-900 font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
