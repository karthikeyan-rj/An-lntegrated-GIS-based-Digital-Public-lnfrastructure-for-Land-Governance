import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, Loader2, Check, X, RefreshCw, ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { serviceRequests as demoServiceRequests } from '@/data/services'

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCUMENT_VERIFICATION: 'Document Verification',
  ACTION_REQUIRED: 'Additional Info Required',
  FIELD_VERIFICATION: 'Field Verification',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const OFFICER_ROLES = ['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']

function normalize(a: any): any {
  const status = a?.currentStatus ? normalizeStatus(a.currentStatus) : a.status
  return { ...a, status }
}

function normalizeStatus(s: string): string {
  const map: Record<string, string> = {
    submitted: 'SUBMITTED',
    document_verification: 'DOCUMENT_VERIFICATION',
    department_review: 'UNDER_REVIEW',
    field_verification: 'FIELD_VERIFICATION',
    approval: 'UNDER_REVIEW',
    completed: 'APPROVED',
  }
  return map[s] || s
}

export default function Applications() {
  const { user } = useAuth()
  const isOfficer = OFFICER_ROLES.includes(user?.role || '')
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [aiReview, setAiReview] = useState<{ id: string; data: any } | null>(null)
  const [remark, setRemark] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await api.applications()
      const list = (res.applications || []).map(normalize)
      setApps(list)
      setIsDemo(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Demo session — show demo applications
        setApps(demoServiceRequests.map((s) => ({
          _id: s.id,
          applicationId: s.applicationId,
          serviceName: s.serviceName,
          serviceCategory: s.serviceCategory,
          ulpin: s.ulpin,
          applicantName: s.applicantName,
          status: normalizeStatus(s.currentStatus),
          department: deptFor(s.serviceCategory),
          timeline: s.timeline.map((t) => ({ status: t.status, date: t.date, remarks: t.remarks, officer: t.officer })),
        })))
        setIsDemo(true)
      } else {
        setApps(demoServiceRequests.map((s) => ({ _id: s.id, applicationId: s.applicationId, serviceName: s.serviceName, serviceCategory: s.serviceCategory, ulpin: s.ulpin, applicantName: s.applicantName, status: normalizeStatus(s.currentStatus), department: deptFor(s.serviceCategory), timeline: s.timeline })))
        setIsDemo(true)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const filtered = useMemo(() => {
    let list = apps
    if (statusFilter) list = list.filter(a => a.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        String(a.applicationId || '').toLowerCase().includes(q) ||
        String(a.ulpin || '').toLowerCase().includes(q) ||
        String(a.serviceName || '').toLowerCase().includes(q) ||
        String(a.applicantName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [apps, search, statusFilter])

  const selected = apps.find(a => a._id === selectedId) || null

  async function act(id: string, fn: () => Promise<any>, successText: string) {
    setActing(id)
    setActionMsg(null)
    setAiReview(null)
    try {
      await fn()
      setActionMsg({ type: 'success', text: successText })
      await load()
      setActing(null)
    } catch (err) {
      setActing(null)
      setActionMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Action failed' })
    }
  }

  async function runAiReview(app: any) {
    setActing(app._id)
    setAiReview(null)
    try {
      const res = await api.aiReviewApplication(app._id)
      setAiReview({ id: app._id, data: res.aiReview || res.report })
      setActing(null)
    } catch (err) {
      setAiReview({ id: app._id, data: { summary: 'Demo AI review: application appears eligible pending document verification.', confidence: 0.82, recommendedAction: 'Manual verification by authorized officer', issues: ['Verify ownership documents manually'] } })
      setActing(null)
    }
  }

  const statusTabs = ['', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION', 'APPROVED', 'REJECTED']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isOfficer ? 'Review and process land-service applications.' : 'Track your land-service applications.'}
          </p>
        </div>
        {isDemo && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 self-start">DEMO DATA</span>}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              statusFilter === s ? 'bg-gov-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search application ID, ULPIN, service..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500"
        />
      </div>

      {actionMsg && (
        <div className={cn('px-4 py-3 rounded-lg text-sm border', actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200')}>
          {actionMsg.text}
        </div>
      )}

      {/* Selected detail */}
      {selected && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gov-700">{selected.applicationId}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-sm text-slate-600 mt-1">{selected.serviceName} · {selected.serviceCategory}</p>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-4 bg-slate-50/50 text-sm">
            <Detail label="Parcel / ULPIN" value={<Link className="text-gov-600 hover:underline" to={`/parcel/${selected.ulpin}`}>{selected.ulpin}</Link>} />
            <Detail label="Applicant" value={selected.applicantName} />
            <Detail label="Department" value={selected.department} />
            <Detail label="Priority" value={<StatusBadge status={(selected.priority || 'medium')} />} />
          </div>

          {isOfficer && (
            <div className="px-5 py-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Advance to:</label>
                {['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION', 'ACTION_REQUIRED'].map(s => (
                  <Button key={s} variant="secondary" size="sm" disabled={acting === selected._id}
                    onClick={() => act(selected._id, () => api.updateApplicationStatus(selected._id, s, remark), `Moved to ${STATUS_LABELS[s]}`)}>
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
                <Button variant="primary" size="sm" disabled={acting === selected._id}
                  onClick={() => act(selected._id, () => api.approveApplication(selected._id, remark), 'Application approved')}>
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button variant="danger" size="sm" disabled={acting === selected._id}
                  onClick={() => act(selected._id, () => api.rejectApplication(selected._id, remark || 'Rejected by officer'), 'Application rejected')}>
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
              <input
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Remarks / reason (optional)"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500"
              />
              <Button variant="ghost" size="sm" disabled={acting === selected._id} onClick={() => runAiReview(selected)}>
                <Brain className="w-4 h-4" /> Run AI Review (assistive)
              </Button>
            </div>
          )}

          {aiReview && aiReview.id === selected._id && (
            <div className="px-5 py-4 border-t border-slate-100 bg-gov-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gov-700 uppercase tracking-wider">AI Review</span>
                <span className="text-[10px] font-medium text-amber-700 px-2 py-0.5 rounded-full bg-amber-100">AI-ASSISTED · requires human verification</span>
              </div>
              <p className="text-sm text-slate-700">{aiReview.data.summary}</p>
              {(aiReview.data.issues || []).length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {(aiReview.data.issues as string[]).map((iss, i) => <li key={i} className="flex gap-2"><span className="text-amber-600">•</span>{iss}</li>)}
                </ul>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Confidence:</span>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gov-500" style={{ width: `${Math.round((aiReview.data.confidence || 0) * 100)}%` }} />
                </div>
                <span>{Math.round((aiReview.data.confidence || 0) * 100)}%</span>
              </div>
              {aiReview.data.recommendedAction && <p className="mt-2 text-xs text-slate-600">Recommendation: {aiReview.data.recommendedAction}</p>}
            </div>
          )}

          {(selected.timeline || []).length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Workflow History</p>
              <div className="space-y-0">
                {selected.timeline.map((t: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gov-500" />
                      {i !== (selected.timeline.length - 1) && <div className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-slate-800">{t.status}</p>
                      <p className="text-xs text-slate-500">{t.remarks}{t.officer ? ` — ${t.officer}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /><span className="ml-2 text-sm">Loading applications...</span></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No applications found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">Application ID</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">ULPIN</th>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => (
                  <tr key={a._id} onClick={() => setSelectedId(selectedId === a._id ? null : a._id)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gov-700">{a.applicationId}</td>
                    <td className="px-4 py-3 text-slate-800">{a.serviceName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.ulpin}</td>
                    <td className="px-4 py-3 text-slate-600">{a.applicantName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-slate-300">{selectedId === a._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filtered.length} application{filtered.length !== 1 ? 's' : ''}</span>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-gov-600 hover:text-gov-700"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          </div>
        </div>
      )}
    </div>
  )
}

function deptFor(category?: string): string {
  const map: Record<string, string> = { 'Land Records': 'Revenue', 'Planning': 'Planning', 'Transactions': 'Registration' }
  return map[category || ''] || 'Revenue'
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  )
}
