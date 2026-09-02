import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  ExternalLink, Eye, Search, Filter,
} from 'lucide-react'
import { registrations } from '@/data/services'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import type { Registration, RegistrationStatus } from '@/types'

const transactionTypes = ['sale', 'gift', 'mortgage', 'lease', 'partition'] as const
const statusFilters: RegistrationStatus[] = ['pending', 'registered', 'rejected', 'under_review']

export default function Registration() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    return registrations.filter(r => {
      const matchesSearch = !searchQuery ||
        r.ulpin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || r.status === statusFilter
      const matchesType = !typeFilter || r.transactionType === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [searchQuery, statusFilter, typeFilter])

  const pending = registrations.filter(r => r.status === 'pending').length
  const completed = registrations.filter(r => r.status === 'registered').length

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registration Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage all land transaction registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Registrations" value={registrations.length} icon={FileText} change="+2 this month" changeType="up" />
        <StatCard title="Pending" value={pending} icon={Clock} change={pending > 0 ? 'Requires attention' : 'All clear'} changeType={pending > 0 ? 'down' : 'up'} iconColor="text-amber-600" />
        <StatCard title="Completed" value={completed} icon={CheckCircle2} change={`${completed} registered`} changeType="up" iconColor="text-emerald-600" />
        <StatCard title="Avg Processing Time" value="5 days" icon={Clock} change="-1.2 days from last month" changeType="up" iconColor="text-blue-600" />
      </div>

      {/* Filters */}
      <Card noPadding>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ULPIN, Buyer, Seller, Document No..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-500"
            >
              <option value="">All Status</option>
              {statusFilters.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-500"
            >
              <option value="">All Types</option>
              {transactionTypes.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{filtered.length}</span> registrations
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase w-8"></th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Reg ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">ULPIN</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Buyer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Seller</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => (
                <RegistrationRow
                  key={reg.id}
                  reg={reg}
                  isExpanded={expandedId === reg.id}
                  onToggle={() => toggle(reg.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-slate-500">
                    No registrations found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function RegistrationRow({ reg, isExpanded, onToggle }: { reg: Registration; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className={cn(
          'border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors',
          isExpanded && 'bg-slate-50'
        )}
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </td>
        <td className="py-3 px-4 font-medium text-slate-900">{reg.id.toUpperCase()}</td>
        <td className="py-3 px-4 font-mono text-xs">{reg.ulpin}</td>
        <td className="py-3 px-4">{reg.buyerName}</td>
        <td className="py-3 px-4">{reg.sellerName}</td>
        <td className="py-3 px-4"><Badge variant="blue">{reg.transactionType}</Badge></td>
        <td className="py-3 px-4">{reg.date}</td>
        <td className="py-3 px-4">{reg.amount > 0 ? formatCurrency(reg.amount) : '—'}</td>
        <td className="py-3 px-4"><StatusBadge status={reg.status} /></td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td colSpan={9} className="px-6 py-5">
            <RegistrationDetail reg={reg} />
          </td>
        </tr>
      )}
    </>
  )
}

function RegistrationDetail({ reg }: { reg: Registration }) {
  const steps = [
    { label: 'Document Submitted', date: reg.date, done: true },
    { label: 'Document Verified', date: reg.status !== 'pending' ? reg.date : '', done: reg.status !== 'pending' },
    { label: 'Fee Paid', date: reg.status === 'registered' ? reg.date : '', done: reg.status === 'registered' },
    { label: 'Registration Complete', date: reg.status === 'registered' ? reg.date : '', done: reg.status === 'registered' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500">Document Number</p>
          <p className="text-sm font-mono font-semibold text-slate-900">{reg.documentNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Sub Registrar</p>
          <p className="text-sm font-semibold text-slate-900">{reg.subRegistrar}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Registration Fee</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(reg.registrationFee)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Transaction Amount</p>
          <p className="text-sm font-semibold text-slate-900">{reg.amount > 0 ? formatCurrency(reg.amount) : 'Gift / No Consideration'}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-3">Registration Timeline</p>
        <div className="flex items-center gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2',
                  step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-400'
                )}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <p className={cn('text-xs mt-1 text-center', step.done ? 'text-emerald-700 font-medium' : 'text-slate-400')}>
                  {step.label}
                </p>
                {step.date && <p className="text-[10px] text-slate-400">{step.date}</p>}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1', step.done ? 'bg-emerald-400' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Link to={`/parcel/${reg.parcelId}`}>
          <Button variant="secondary" size="sm">
            <Eye className="w-3.5 h-3.5" /> View Parcel
          </Button>
        </Link>
        <Button variant="secondary" size="sm">
          <FileText className="w-3.5 h-3.5" /> View Document
        </Button>
      </div>
    </div>
  )
}
