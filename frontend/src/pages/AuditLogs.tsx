import { useEffect, useMemo, useState } from 'react'
import { Shield, Search, Filter, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { auditLogs as fallbackLogs } from '@/data/services'
import type { AuditLog } from '@/types'

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failure' | 'warning'>('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.audit()
        if (cancelled) return
        setLogs(data.logs as AuditLog[])
      } catch {
        if (cancelled) return
        setLogs(fallbackLogs)
        setIsDemo(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter((l) => {
      const matchesSearch =
        !q ||
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.targetId.toLowerCase().includes(q)
      const matchesResult = resultFilter === 'all' || l.result === resultFilter
      return matchesSearch && matchesResult
    })
  }, [logs, search, resultFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-50 border border-gov-200 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Immutable record of all system and user activity across the platform
            </p>
          </div>
        </div>
        {isDemo && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
            DEMO
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, action, or resource..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as typeof resultFilter)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-600"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading audit logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Shield className="w-8 h-8 mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No matching audit entries</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">Role / Dept</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">Resource</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gov-50 text-gov-700 flex items-center justify-center text-[9px] font-bold">
                          {log.userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.department}</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{log.action}</td>
                    <td className="py-2 px-3">
                      <span className="text-slate-600">{log.target}</span>
                      <span className="ml-1 font-mono text-slate-400">{log.targetId}</span>
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={log.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Showing {filtered.length} of {logs.length} entries
          </span>
          {isDemo && (
            <span className="text-[10px] text-amber-500 font-medium">Using local demo data</span>
          )}
        </div>
      </div>
    </div>
  )
}
