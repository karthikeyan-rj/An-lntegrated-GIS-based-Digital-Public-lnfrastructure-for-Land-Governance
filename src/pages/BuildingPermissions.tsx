import { useState } from 'react'
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Upload,
  Send,
  Plus,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { buildingPermissions } from '@/data/services'

const workflowSteps = [
  { label: 'Application', key: 'application' },
  { label: 'Technical Review', key: 'technical' },
  { label: 'Planning Review', key: 'planning' },
  { label: 'Inspection', key: 'inspection' },
  { label: 'Approval', key: 'approval' },
]

function getWorkflowIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    under_review: 2,
    inspection_pending: 3,
    approved: 4,
    rejected: 2,
  }
  return map[status] ?? 0
}

const documentTypes = [
  'Ownership Proof',
  'Site Plan',
  'Building Plan (Blue Print)',
  'NOC Fire Department',
  'NOC Environment',
  'Soil Test Report',
  'Structural Stability Certificate',
  'Land Tax Receipt',
]

export default function BuildingPermissions() {
  const [showForm, setShowForm] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)

  const total = buildingPermissions.length
  const pending = buildingPermissions.filter(b => b.status === 'pending').length
  const approved = buildingPermissions.filter(b => b.status === 'approved').length
  const rejected = buildingPermissions.filter(b => b.status === 'rejected').length
  const underReview = buildingPermissions.filter(b => b.status === 'under_review').length

  const selected = buildingPermissions.find(b => b.id === selectedApp)
  const workflowIdx = selected ? getWorkflowIndex(selected.status) : -1

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Building Permissions</h1>
        <p className="page-subtitle">Manage building permission applications, reviews, and approvals</p>
      </div>

      <CardGrid className="lg:grid-cols-5">
        <StatCard title="Total Applications" value={total} icon={FileText} iconColor="text-blue-600" />
        <StatCard title="Pending" value={pending} icon={Clock} iconColor="text-amber-600" change={`${pending} awaiting review`} changeType="neutral" />
        <StatCard title="Approved" value={approved} icon={CheckCircle} iconColor="text-emerald-600" change={`${approved} this quarter`} changeType="up" />
        <StatCard title="Rejected" value={rejected} icon={XCircle} iconColor="text-red-600" />
        <StatCard title="Under Review" value={underReview} icon={Eye} iconColor="text-purple-600" />
      </CardGrid>

      {selected && (
        <Card title="Application Workflow" subtitle={`${selected.applicationNumber} — ${selected.applicantName}`}>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {workflowSteps.map((step, i) => {
              const isRejected = selected.status === 'rejected' && i === workflowIdx
              const isDone = i < workflowIdx && !isRejected
              const isCurrent = i === workflowIdx
              const isFuture = i > workflowIdx || (isRejected && i > workflowIdx)
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl min-w-[110px] transition-colors ${
                    isCurrent
                      ? isRejected
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gov-50 border border-gov-200'
                      : isDone
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? isRejected
                          ? 'bg-red-500 text-white'
                          : 'bg-gov-600 text-white'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight ${
                      isCurrent ? (isRejected ? 'text-red-700' : 'text-gov-700') : isDone ? 'text-emerald-700' : 'text-slate-400'
                    }`}>{step.label}</span>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isDone ? 'text-emerald-400' : 'text-slate-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span>Submitted: {new Date(selected.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {selected.approvedDate && (
              <span>Approved: {new Date(selected.approvedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
            <StatusBadge status={selected.status} />
          </div>
        </Card>
      )}

      <Card
        title="Building Permission Applications"
        subtitle="All submitted building permission applications"
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5" />
            Apply for Building Permission
          </Button>
        }
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Application No.</th>
                <th>ULPIN</th>
                <th>Applicant</th>
                <th>Building Type</th>
                <th>Area (sqft)</th>
                <th>Floors</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {buildingPermissions.map(bp => (
                <tr
                  key={bp.id}
                  className={`cursor-pointer transition-colors ${selectedApp === bp.id ? 'bg-gov-50/50' : ''}`}
                  onClick={() => setSelectedApp(selectedApp === bp.id ? null : bp.id)}
                >
                  <td className="font-mono text-xs font-medium">{bp.applicationNumber}</td>
                  <td className="font-mono text-xs">{bp.ulpin}</td>
                  <td>{bp.applicantName}</td>
                  <td>{bp.buildingType}</td>
                  <td className="text-right tabular-nums">{bp.proposedArea.toLocaleString('en-IN')}</td>
                  <td className="text-center tabular-nums">{bp.floors}</td>
                  <td><StatusBadge status={bp.status} /></td>
                  <td className="text-slate-500">{new Date(bp.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <Card title="Apply for Building Permission" subtitle="Complete the form below to submit a new building permission application">
          <div className="max-w-3xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ULPIN</label>
                <input type="text" placeholder="Enter ULPIN" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Building Type</label>
                <select className="input-field">
                  <option value="">Select building type</option>
                  <option>Residential Single</option>
                  <option>Residential G+1</option>
                  <option>Residential G+2</option>
                  <option>Residential Extension</option>
                  <option>Commercial Complex</option>
                  <option>Office Building</option>
                  <option>Industrial Structure</option>
                  <option>Government Office</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Proposed Area (sqft)</label>
                <input type="number" placeholder="Enter built-up area" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Number of Floors</label>
                <input type="number" min={1} max={40} placeholder="Enter number of floors" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Applicant Name</label>
                <input type="text" placeholder="Enter full name" className="input-field" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Required Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documentTypes.map(doc => (
                  <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:border-gov-300 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-700">{doc}</span>
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowForm(false)}>
                <Send className="w-3.5 h-3.5" />
                Submit Application
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
