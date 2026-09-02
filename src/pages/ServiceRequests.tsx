import { useState, Fragment } from 'react'
import {
  Search, ChevronDown, ChevronRight, FileText, CheckCircle2, Clock,
  Upload, User, Mail, Phone, MapPin, ArrowRight, ArrowLeft
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { CardGrid } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { serviceRequests } from '@/data/services'
import { cn } from '@/lib/utils'
import type { ServiceRequest } from '@/types'

const statusOrder = ['Submitted', 'Document Verification', 'Department Review', 'Field Verification', 'Approval', 'Completed']

const stepFormLabels = ['Applicant Details', 'Select Service', 'Select Parcel', 'Documents', 'Review & Submit']

export default function ServiceRequests() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formStep, setFormStep] = useState(0)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    service: '', ulpin: '', documents: [] as string[],
  })

  const pendingCount = serviceRequests.filter(r => !['completed', 'rejected'].includes(r.currentStatus)).length
  const completedCount = serviceRequests.filter(r => r.currentStatus === 'completed').length

  const filtered = filter === 'all'
    ? serviceRequests
    : serviceRequests.filter(r => r.currentStatus === filter)

  const currentStepIndex = (request: ServiceRequest) => {
    return statusOrder.findIndex(s => s.toLowerCase().replace(/ /g, '_') === request.currentStatus)
  }

  const resetForm = () => {
    setFormStep(0)
    setForm({ name: '', email: '', phone: '', service: '', ulpin: '', documents: [] })
    setShowNewForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all land service applications</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? 'Close Form' : 'New Service Request'}
        </Button>
      </div>

      <CardGrid>
        <StatCard title="Total Applications" value={serviceRequests.length} icon={FileText} change="All time" changeType="neutral" />
        <StatCard title="Pending" value={pendingCount} icon={Clock} change="In progress" changeType="neutral" iconColor="text-amber-600" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle2} change="Successfully processed" changeType="up" iconColor="text-emerald-600" />
        <StatCard title="Avg Processing" value="12 days" icon={Search} change="Last 30 days" changeType="neutral" iconColor="text-slate-600" />
      </CardGrid>

      {showNewForm && (
        <Card title="New Service Request" subtitle={`Step ${formStep + 1} of ${stepFormLabels.length}: ${stepFormLabels[formStep]}`}>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {stepFormLabels.map((label, i) => (
                <Fragment key={i}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                      i < formStep ? 'bg-gov-600 text-white' :
                      i === formStep ? 'bg-gov-600 text-white ring-2 ring-gov-200' :
                      'bg-slate-100 text-slate-400'
                    )}>
                      {i < formStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={cn('text-xs font-medium hidden md:inline', i === formStep ? 'text-gov-700' : 'text-slate-400')}>
                      {label}
                    </span>
                  </div>
                  {i < stepFormLabels.length - 1 && (
                    <div className={cn('flex-1 h-0.5 rounded', i < formStep ? 'bg-gov-600' : 'bg-slate-200')} />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="min-h-[200px]">
            {formStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <User className="w-3 h-3 inline mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="As per Aadhaar"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
                  />
                </div>
              </div>
            )}
            {formStep === 1 && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Select Service</label>
                {['Ownership Verification', 'Mutation Request', 'Encumbrance Certificate', 'Building Permission', 'Land Use Certificate', 'Property Tax', 'Download Land Record'].map(svc => (
                  <button
                    key={svc}
                    onClick={() => setForm(f => ({ ...f, service: svc }))}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                      form.service === svc ? 'border-gov-500 bg-gov-50 text-gov-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            )}
            {formStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    ULPIN (Unique Land Parcel Identification Number)
                  </label>
                  <input
                    type="text"
                    value={form.ulpin}
                    onChange={e => setForm(f => ({ ...f, ulpin: e.target.value }))}
                    placeholder="e.g. TN-MDU-RV-38472916"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
                  />
                </div>
                <p className="text-xs text-slate-500">Enter the ULPIN of the land parcel for which this service is being requested.</p>
              </div>
            )}
            {formStep === 3 && (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-600">Upload Documents</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-gov-300 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB each</p>
                </div>
                <div className="space-y-2">
                  {['Aadhaar Card', 'Sale Deed / Title Deed', 'Patta Certificate'].map(doc => (
                    <div key={doc} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{doc}</span>
                      <span className="ml-auto text-xs text-gov-600 font-medium">Uploaded</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900">Review Application</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="px-3 py-2 rounded-lg bg-slate-50"><span className="text-slate-500">Applicant:</span> <span className="font-medium text-slate-900 ml-1">{form.name || '—'}</span></div>
                  <div className="px-3 py-2 rounded-lg bg-slate-50"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900 ml-1">{form.email || '—'}</span></div>
                  <div className="px-3 py-2 rounded-lg bg-slate-50"><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900 ml-1">{form.phone || '—'}</span></div>
                  <div className="px-3 py-2 rounded-lg bg-slate-50"><span className="text-slate-500">Service:</span> <span className="font-medium text-slate-900 ml-1">{form.service || '—'}</span></div>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 col-span-2"><span className="text-slate-500">ULPIN:</span> <span className="font-mono font-medium text-slate-900 ml-1">{form.ulpin || '—'}</span></div>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  By submitting, you confirm that all provided information is accurate to the best of your knowledge.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" disabled={formStep === 0} onClick={() => setFormStep(s => s - 1)}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {formStep < stepFormLabels.length - 1 ? (
              <Button onClick={() => setFormStep(s => s + 1)}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={resetForm}>Submit Application</Button>
            )}
          </div>
        </Card>
      )}

      <Card title="All Applications" subtitle={`${filtered.length} requests found`} noPadding>
        <div className="px-5 pt-4 flex gap-2 flex-wrap">
          {['all', 'submitted', 'document_verification', 'department_review', 'field_verification', 'approval', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                filter === f ? 'bg-gov-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Application ID</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">ULPIN</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Applicant</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(request => {
                const isExpanded = expandedRow === request.id
                const stepIdx = currentStepIndex(request)
                return (
                  <Fragment key={request.id}>
                    <tr
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : request.id)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          {request.applicationId}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{request.ulpin}</td>
                      <td className="px-5 py-3 text-slate-600">{request.serviceName}</td>
                      <td className="px-5 py-3 text-slate-600">{request.applicantName}</td>
                      <td className="px-5 py-3 text-slate-500">{new Date(request.submittedDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3"><StatusBadge status={request.currentStatus} /></td>
                      <td className="px-5 py-3">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setExpandedRow(isExpanded ? null : request.id) }}>
                          View
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-5 py-5 bg-slate-50/80">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Request Details</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-slate-500">Service:</span> <span className="text-slate-900 ml-1">{request.serviceName}</span></div>
                                <div><span className="text-slate-500">Category:</span> <span className="text-slate-900 ml-1">{request.serviceCategory}</span></div>
                                <div><span className="text-slate-500">Applicant ID:</span> <span className="text-slate-900 ml-1">{request.applicantId}</span></div>
                                <div><span className="text-slate-500">Documents:</span></div>
                                <div className="flex flex-wrap gap-1">
                                  {request.documents.map(doc => (
                                    <span key={doc} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{doc}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Workflow Timeline</h4>
                              <div className="space-y-0">
                                {request.timeline.map((step, i) => {
                                  const isComplete = !!step.date
                                  const isCurrent = i === stepIdx
                                  return (
                                    <div key={i} className="flex gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className={cn(
                                          'w-3 h-3 rounded-full border-2 shrink-0',
                                          isComplete ? 'bg-gov-600 border-gov-600' :
                                          isCurrent ? 'bg-amber-400 border-amber-400' :
                                          'bg-white border-slate-300'
                                        )} />
                                        {i < request.timeline.length - 1 && (
                                          <div className={cn('w-0.5 flex-1 min-h-[24px]', isComplete ? 'bg-gov-200' : 'bg-slate-200')} />
                                        )}
                                      </div>
                                      <div className="pb-4 min-w-0">
                                        <p className={cn('text-sm font-medium', isCurrent ? 'text-gov-700' : isComplete ? 'text-slate-900' : 'text-slate-400')}>
                                          {step.status}
                                          {isCurrent && <span className="ml-2 text-xs text-amber-600">(Current)</span>}
                                        </p>
                                        {isComplete && (
                                          <>
                                            <p className="text-xs text-slate-500">{new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{step.remarks}</p>
                                            {step.officer && <p className="text-xs text-slate-400 mt-0.5">Handled by: {step.officer}</p>}
                                          </>
                                        )}
                                        {!isComplete && step.remarks && (
                                          <p className="text-xs text-slate-400 italic">{step.remarks}</p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
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
