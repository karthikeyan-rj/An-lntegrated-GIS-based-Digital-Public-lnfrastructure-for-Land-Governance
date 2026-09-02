import { useState, Fragment } from 'react'
import { Scale, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronRight, Plus, FileText, User, MapPin } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CardGrid } from '@/components/ui/Card'
import { disputes } from '@/data/services'
import { getParcelById } from '@/data/parcels'
import { cn } from '@/lib/utils'
import type { Dispute } from '@/types'

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'amber',
  low: 'slate',
}

const disputeTypeLabels: Record<string, string> = {
  ownership: 'Ownership',
  boundary: 'Boundary',
  inheritance: 'Inheritance',
  encroachment: 'Encroachment',
  title: 'Title',
  mutation: 'Mutation',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  under_review: 'Under Review',
  resolved: 'Resolved',
  appealed: 'Appealed',
}

export default function Disputes() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showNewDispute, setShowNewDispute] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const activeCount = disputes.filter(d => d.status === 'active').length
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length
  const reviewCount = disputes.filter(d => d.status === 'under_review').length
  const highPriorityCount = disputes.filter(d => d.priority === 'high').length

  const filteredDisputes = filter === 'all'
    ? disputes
    : disputes.filter(d => d.status === filter)

  const hearingTimeline = (dispute: Dispute) => {
    const events = [
      { label: 'Case Filed', date: dispute.filedDate, done: true },
      { label: 'First Hearing', date: dispute.lastHearing, done: !!dispute.lastHearing },
      { label: 'Next Hearing', date: dispute.nextHearing, done: false },
    ]
    if (dispute.status === 'resolved') {
      events.push({ label: 'Resolved', date: dispute.lastHearing, done: true })
    }
    return events
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage land disputes across jurisdictions</p>
        </div>
        <Button onClick={() => setShowNewDispute(!showNewDispute)}>
          <Plus className="w-4 h-4" />
          File New Dispute
        </Button>
      </div>

      <CardGrid>
        <StatCard
          title="Active Disputes"
          value={activeCount}
          icon={AlertTriangle}
          change="+1 this month"
          changeType="up"
          iconColor="text-red-600"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle2}
          change="This quarter"
          changeType="neutral"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Under Review"
          value={reviewCount}
          icon={Clock}
          change="Pending hearings"
          changeType="neutral"
          iconColor="text-amber-600"
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          icon={Scale}
          change="Requires attention"
          changeType="down"
          iconColor="text-red-600"
        />
      </CardGrid>

      {showNewDispute && (
        <Card title="File New Dispute" subtitle="Register a new land dispute case">
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowNewDispute(false) }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ULPIN</label>
                <input type="text" placeholder="e.g. TN-MDU-RV-38472916" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dispute Type</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500">
                  <option>Ownership</option>
                  <option>Boundary</option>
                  <option>Inheritance</option>
                  <option>Encroachment</option>
                  <option>Title</option>
                  <option>Mutation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Party 1</label>
                <input type="text" placeholder="Complainant name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Party 2</label>
                <input type="text" placeholder="Respondent name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Court</label>
                <input type="text" placeholder="e.g. District Court, Madurai" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea rows={3} placeholder="Detailed description of the dispute..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setShowNewDispute(false)}>Cancel</Button>
              <Button type="submit">Submit Dispute</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Dispute Cases" subtitle={`${filteredDisputes.length} cases found`} noPadding>
        <div className="px-5 pt-4 flex gap-2">
          {['all', 'active', 'under_review', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                filter === f ? 'bg-gov-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f === 'all' ? 'All' : statusLabels[f] || f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Case ID</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">ULPIN</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Parties</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Dispute Type</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Court</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Filed Date</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Next Hearing</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map(dispute => {
                const parcel = getParcelById(dispute.parcelId)
                const isExpanded = expandedRow === dispute.id
                return (
                  <Fragment key={dispute.id}>
                    <tr
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : dispute.id)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          {dispute.caseId}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{dispute.ulpin}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-[200px] truncate">{dispute.parties.join(' vs ')}</td>
                      <td className="px-5 py-3 text-slate-600">{disputeTypeLabels[dispute.disputeType]}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-[180px] truncate">{dispute.court}</td>
                      <td className="px-5 py-3"><StatusBadge status={dispute.status} /></td>
                      <td className="px-5 py-3 text-slate-500">{new Date(dispute.filedDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 text-slate-500">{dispute.nextHearing ? new Date(dispute.nextHearing).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={priorityColors[dispute.priority] as 'red' | 'amber' | 'slate'}>{dispute.priority.charAt(0).toUpperCase() + dispute.priority.slice(1)}</Badge>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="px-5 py-4 bg-slate-50/80">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Case Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <Scale className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-slate-500">Judge:</span>
                                    <span className="ml-1 text-slate-900">{dispute.judge}</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-slate-500">Parties:</span>
                                    <span className="ml-1 text-slate-900">{dispute.parties.join(' vs ')}</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-slate-500">Court:</span>
                                    <span className="ml-1 text-slate-900">{dispute.court}</span>
                                  </div>
                                </div>
                                {parcel && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="text-slate-500">Parcel:</span>
                                      <span className="ml-1 text-slate-900">{parcel.surveyNumber}, {parcel.village}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Hearing Timeline</h4>
                              <div className="space-y-0">
                                {hearingTimeline(dispute).map((event, i) => (
                                  <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={cn('w-3 h-3 rounded-full border-2 shrink-0', event.done ? 'bg-gov-600 border-gov-600' : 'bg-white border-slate-300')} />
                                      {i < hearingTimeline(dispute).length - 1 && (
                                        <div className={cn('w-0.5 flex-1 min-h-[24px]', event.done ? 'bg-gov-200' : 'bg-slate-200')} />
                                      )}
                                    </div>
                                    <div className="pb-4">
                                      <p className="text-sm font-medium text-slate-900">{event.label}</p>
                                      <p className="text-xs text-slate-500">
                                        {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
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
      </Card>
    </div>
  )
}
