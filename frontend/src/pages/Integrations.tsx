import { Fragment, useEffect, useState } from 'react'
import {
  Wifi,
  Database,
  Clock,
  Plug,
  RefreshCw,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { cn, formatNumber } from '@/lib/utils'
import { api } from '@/lib/api'
import { departments as fallbackDepts } from '@/data/services'
import type { Department } from '@/types'

export default function Integrations() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const deptData = await api.departments()
        if (cancelled) return
        setDepartments(deptData.departments as Department[])
      } catch {
        if (cancelled) return
        setDepartments(fallbackDepts)
        setIsDemo(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-50 border border-gov-200 flex items-center justify-center">
            <Plug className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Integrations</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              DPI interoperability — connected government departments and APIs powering land governance
            </p>
          </div>
        </div>
        {isDemo && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
            DEMO
          </span>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Connected', value: departments.filter((d) => d.connected).length, icon: Wifi, color: 'text-emerald-600' },
          { label: 'Total Records', value: departments.reduce((s, d) => s + d.recordsSynced, 0), icon: Database, color: 'text-gov-600' },
          { label: 'Avg Latency', value: Math.round(departments.filter((d) => d.connected).reduce((s, d) => s + d.latency, 0) / Math.max(departments.filter((d) => d.connected).length, 1)) + 'ms', icon: Clock, color: 'text-amber-600' },
          { label: 'Departments', value: departments.length, icon: Plug, color: 'text-purple-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className={cn('w-4 h-4', item.color)} />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading integrations...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Plug className="w-8 h-8 mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No integrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Department</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Latency</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Records Synced</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">API Version</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Last Sync</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((dept) => {
                  const isExpanded = expandedId === dept.id
                  return (
                    <Fragment key={dept.id}>
                      <tr
                        className={cn('hover:bg-slate-50/50 transition-colors cursor-pointer', isExpanded && 'bg-slate-50/30')}
                        onClick={() => toggle(dept.id)}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {dept.shortName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{dept.name}</p>
                              <p className="text-xs text-slate-400">{dept.shortName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          {dept.connected ? (
                            <span className="inline-flex items-center gap-1.5">
                              <StatusBadge status="success" />
                              <span className="text-[10px] text-emerald-600 font-medium">Connected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <StatusBadge status="failure" />
                              <span className="text-[10px] text-red-500 font-medium">Disconnected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={cn(
                            'font-mono text-xs',
                            dept.latency === 0 ? 'text-slate-400' : dept.latency < 50 ? 'text-emerald-600' : dept.latency < 80 ? 'text-amber-600' : 'text-red-500'
                          )}>
                            {dept.latency ? `${dept.latency}ms` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-slate-700">{formatNumber(dept.recordsSynced)}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-medium text-slate-600">{dept.apiVersion}</span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateSafe(dept.lastSync)}
                        </td>
                        <td className="py-2.5 px-4">
                          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 pb-3 pt-1">
                            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <RefreshCw className="w-3.5 h-3.5 text-gov-600" />
                                <span className="text-xs font-semibold text-slate-700">Integration Details — {dept.shortName}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <DetailCard
                                  label="Sample Endpoint"
                                  value={`/api/v1/${dept.shortName.toLowerCase()}/records`}
                                  mono
                                />
                                <DetailCard label="Record Count" value={formatNumber(dept.recordsSynced)} />
                                <DetailCard label="API Status" value={dept.connected ? 'Operational' : 'Unavailable'} ok={dept.connected} />
                                <DetailCard
                                  label="Last Synchronization"
                                  value={formatDateSafe(dept.lastSync)}
                                />
                              </div>
                              {!dept.connected && (
                                <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                  This integration is currently simulated for prototype demonstration. The live connection will be established once the department API is provisioned.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {departments.filter((d) => d.connected).length} of {departments.length} departments connected
          </span>
          {isDemo && (
            <span className="text-[10px] text-amber-500 font-medium">Using local demo data</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value, mono, ok }: { label: string; value: string; mono?: boolean; ok?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={cn(
        'mt-0.5 text-xs font-medium break-all',
        mono ? 'font-mono text-slate-600' : ok === true ? 'text-emerald-700' : ok === false ? 'text-red-600' : 'text-slate-900'
      )}>
        {value}
      </p>
    </div>
  )
}

/** Render a date string defensively — an invalid date must never crash the page. */
function formatDateSafe(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
