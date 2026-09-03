import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, FileText, Shield, Scale, Building2, Droplets,
  Zap, Wifi, Flame, Trash2, Ban, AlertTriangle, CheckCircle2, Clock,
  Download, Eye, ExternalLink, Landmark, DollarSign, Home, Map,
  Users, BookOpen, FolderOpen, History, Search, Printer, Tag,
  CircleDollarSign, Pipette, Hammer, Receipt, UtilityPole, ShieldAlert,
  Brain, ListChecks,
} from 'lucide-react'
import { getParcelById } from '@/data/parcels'
import { registrations, disputes, buildingPermissions, auditLogs, serviceRequests } from '@/data/services'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import type { Parcel } from '@/types'

const TABS = [
  'Overview', 'Ownership/RoR', 'Registration', 'Encumbrance', 'Land Use',
  'Building Permissions', 'Property Tax', 'Utilities', 'Restrictions',
  'Disputes', 'Documents', 'Applications', 'AI Insights', 'Activity Timeline',
] as const

type Tab = (typeof TABS)[number]

function OverviewTab({ parcel }: { parcel: Parcel }) {
  const utilityCount = Object.values(parcel.utilities).filter(Boolean).length
  return (
    <div className="space-y-6">
      <Card title="Parcel Summary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <InfoRow label="ULPIN" value={parcel.ulpin} mono />
            <InfoRow label="Survey Number" value={parcel.surveyNumber} />
            <InfoRow label="Village" value={parcel.village} />
            <InfoRow label="Taluk" value={parcel.taluk} />
            <InfoRow label="District" value={parcel.district} />
            <InfoRow label="State" value={parcel.state} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Area" value={`${parcel.area} ${parcel.areaUnit}`} />
            <InfoRow label="Land Use" value={parcel.landUse} />
            <InfoRow label="Zoning" value={parcel.zoning} />
            <InfoRow label="Classification" value={parcel.classification} />
            <InfoRow label="Registered Date" value={parcel.registeredDate} />
            <InfoRow label="Last Updated" value={parcel.lastUpdated} />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Area" value={`${parcel.area} ${parcel.areaUnit}`} icon={Map} />
        <StatCard title="Tax Amount" value={parcel.taxAmount ? formatCurrency(parcel.taxAmount) : 'N/A'} icon={DollarSign} />
        <StatCard title="Utilities" value={`${utilityCount}/5 Connected`} icon={UtilityPole} />
        <StatCard title="Restrictions" value={String(parcel.restrictions.length)} icon={Ban} />
      </div>
      <Card title="Quick Info">
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={parcel.ownershipStatus} />
          <StatusBadge status={parcel.verificationStatus} />
          <StatusBadge status={parcel.encumbranceStatus} />
          <StatusBadge status={parcel.disputeStatus} />
          <StatusBadge status={parcel.propertyTaxStatus} />
          <StatusBadge status={parcel.buildingPermission} />
        </div>
      </Card>
    </div>
  )
}

function OwnershipTab({ parcel }: { parcel: Parcel }) {
  const parcelRegistrations = registrations.filter(r => r.parcelId === parcel.id)
  return (
    <div className="space-y-6">
      <Card title="Owner Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <InfoRow label="Owner Name" value={parcel.ownerName} />
            <InfoRow label="Father / Guardian Name" value={parcel.ownerFatherName} />
            <InfoRow label="Ownership Type" value={parcel.ownershipType.replace(/^\w/, c => c.toUpperCase())} />
            <InfoRow label="Patta Number" value={parcel.pattaNumber} mono />
          </div>
          <div className="space-y-3">
            <InfoRow label="Classification" value={parcel.classification} />
            <InfoRow label="Verification Status" value="" badge={<StatusBadge status={parcel.verificationStatus} />} />
            <InfoRow label="Ownership Status" value="" badge={<StatusBadge status={parcel.ownershipStatus} />} />
            <InfoRow label="ULPIN" value={parcel.ulpin} mono />
          </div>
        </div>
      </Card>
      <Card title="Mutation History" subtitle="History of ownership changes for this parcel">
        {parcelRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Document No</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">From</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">To</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parcelRegistrations.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs">{r.documentNumber}</td>
                    <td className="py-3 px-4"><Badge variant="blue">{r.transactionType}</Badge></td>
                    <td className="py-3 px-4">{r.sellerName}</td>
                    <td className="py-3 px-4">{r.buyerName}</td>
                    <td className="py-3 px-4">{r.date}</td>
                    <td className="py-3 px-4">{r.amount > 0 ? formatCurrency(r.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<History className="w-6 h-6" />} title="No Mutation History" description="No registration records found for this parcel." />
        )}
      </Card>
    </div>
  )
}

function RegistrationTab({ parcel }: { parcel: Parcel }) {
  const parcelRegistrations = registrations.filter(r => r.parcelId === parcel.id)
  return (
    <Card title="Registrations" subtitle={`All registrations linked to ${parcel.ulpin}`}>
      {parcelRegistrations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Registration ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Document No</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Transaction</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Buyer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Seller</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">SRO</th>
              </tr>
            </thead>
            <tbody>
              {parcelRegistrations.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{r.id.toUpperCase()}</td>
                  <td className="py-3 px-4 font-mono text-xs">{r.documentNumber}</td>
                  <td className="py-3 px-4"><Badge variant="blue">{r.transactionType}</Badge></td>
                  <td className="py-3 px-4">{r.buyerName}</td>
                  <td className="py-3 px-4">{r.sellerName}</td>
                  <td className="py-3 px-4">{r.date}</td>
                  <td className="py-3 px-4">{r.amount > 0 ? formatCurrency(r.amount) : '—'}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-xs text-slate-500">{r.subRegistrar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<FileText className="w-6 h-6" />} title="No Registrations" description="No registration records found for this parcel." />
      )}
    </Card>
  )
}

function EncumbranceTab({ parcel }: { parcel: Parcel }) {
  return (
    <div className="space-y-6">
      <Card title="Encumbrance Status">
        <div className="flex items-center gap-4 mb-6">
          <StatusBadge status={parcel.encumbranceStatus} />
          {parcel.encumbranceStatus === 'clear' && (
            <span className="text-sm text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> No encumbrances found on this parcel
            </span>
          )}
          {parcel.encumbranceStatus !== 'clear' && (
            <span className="text-sm text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Encumbrance detected on this parcel
            </span>
          )}
        </div>
        {(parcel.encumbranceStatus === 'mortgaged' || parcel.encumbranceStatus === 'encumbered') && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-red-800">Mortgage Details</h4>
            {parcel.mortgageBank && <InfoRow label="Bank / Institution" value={parcel.mortgageBank} />}
            {parcel.mortgageAmount && <InfoRow label="Mortgage Amount" value={formatCurrency(parcel.mortgageAmount)} />}
            <InfoRow label="Encumbrance Type" value={parcel.encumbranceStatus.replace(/^\w/, c => c.toUpperCase())} />
          </div>
        )}
      </Card>
      <Card title="Generate Encumbrance Certificate">
        <p className="text-sm text-slate-600 mb-4">
          Generate an official Encumbrance Certificate for parcel <span className="font-mono font-semibold">{parcel.ulpin}</span>.
          This certificate confirms whether the property is free from any legal dues or encumbrances.
        </p>
        <Button variant="primary">
          <FileText className="w-4 h-4" />
          Generate Encumbrance Certificate
        </Button>
      </Card>
    </div>
  )
}

function LandUseTab({ parcel }: { parcel: Parcel }) {
  const permittedUses: Record<string, string[]> = {
    R1: ['Single-family residential', 'Home offices', 'Parks'],
    R2: ['Multi-family residential', 'Townhouses', 'Community facilities'],
    C1: ['Retail shops', 'Offices', 'Restaurants'],
    C2: ['Large-scale commercial', 'Shopping centers', 'Hotels'],
    I1: ['Light manufacturing', 'Warehousing', 'Research labs'],
    I2: ['Heavy manufacturing', 'Chemical processing', 'Power generation'],
    A1: ['Crop cultivation', 'Animal husbandry', 'Agricultural processing'],
    F1: ['Conservation', 'Wildlife habitat', 'Recreational forests'],
    W1: ['Water body protection', 'Wetland conservation', 'Floodplain'],
    MU1: ['Mixed residential-commercial', 'Transit-oriented development', 'Live-work spaces'],
  }
  return (
    <div className="space-y-6">
      <Card title="Land Use Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <InfoRow label="Current Land Use" value={parcel.landUse.replace(/^\w/, c => c.toUpperCase())} />
            <InfoRow label="Zoning Code" value={parcel.zoning} />
            <InfoRow label="Classification" value={parcel.classification} />
          </div>
          <div className="space-y-3">
            <InfoRow label="District" value={parcel.district} />
            <InfoRow label="Village" value={parcel.village} />
            <InfoRow label="Area" value={`${parcel.area} ${parcel.areaUnit}`} />
          </div>
        </div>
      </Card>
      <Card title="Permitted Uses" subtitle={`Under zoning ${parcel.zoning}`}>
        <ul className="space-y-2">
          {(permittedUses[parcel.zoning] || ['Contact planning department']).map((use, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {use}
            </li>
          ))}
        </ul>
      </Card>
      {parcel.restrictions.length > 0 && (
        <Card title="Restrictions">
          <ul className="space-y-2">
            {parcel.restrictions.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function BuildingPermissionsTab({ parcel }: { parcel: Parcel }) {
  const bp = buildingPermissions.find(b => b.parcelId === parcel.id)
  return (
    <div className="space-y-6">
      <Card title="Building Permission Status">
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge status={parcel.buildingPermission} />
          {parcel.buildingPermission === 'none' && (
            <span className="text-sm text-slate-500">No building permission on record</span>
          )}
        </div>
        {bp ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <InfoRow label="Application Number" value={bp.applicationNumber} mono />
              <InfoRow label="Applicant" value={bp.applicantName} />
              <InfoRow label="Building Type" value={bp.buildingType} />
            </div>
            <div className="space-y-3">
              <InfoRow label="Proposed Area" value={`${formatNumber(bp.proposedArea)} sq ft`} />
              <InfoRow label="Floors" value={String(bp.floors)} />
              <InfoRow label="Submitted" value={bp.submittedDate} />
              {bp.approvedDate && <InfoRow label="Approved" value={bp.approvedDate} />}
            </div>
          </div>
        ) : (
          <EmptyState icon={<Building2 className="w-6 h-6" />} title="No Application Found" description="No building permission application exists for this parcel." />
        )}
      </Card>
    </div>
  )
}

function PropertyTaxTab({ parcel }: { parcel: Parcel }) {
  return (
    <div className="space-y-6">
      <Card title="Property Tax Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <InfoRow label="Tax Status" value="" badge={<StatusBadge status={parcel.propertyTaxStatus} />} />
            <InfoRow label="Annual Tax" value={parcel.taxAmount ? formatCurrency(parcel.taxAmount) : 'N/A (Exempt)'} />
            <InfoRow label="Parcel" value={parcel.ulpin} mono />
          </div>
          <div className="space-y-3">
            <InfoRow label="Area" value={`${parcel.area} ${parcel.areaUnit}`} />
            <InfoRow label="Land Use" value={parcel.landUse.replace(/^\w/, c => c.toUpperCase())} />
            <InfoRow label="District" value={parcel.district} />
          </div>
        </div>
      </Card>
      <Card title="Payment History">
        {parcel.taxAmount && parcel.taxAmount > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Year</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Paid Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="py-3 px-4">2025-26</td>
                  <td className="py-3 px-4">{formatCurrency(parcel.taxAmount)}</td>
                  <td className="py-3 px-4"><StatusBadge status={parcel.propertyTaxStatus} /></td>
                  <td className="py-3 px-4">2025-06-15</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="py-3 px-4">2024-25</td>
                  <td className="py-3 px-4">{formatCurrency(Math.round(parcel.taxAmount * 0.92))}</td>
                  <td className="py-3 px-4"><Badge variant="green">Paid</Badge></td>
                  <td className="py-3 px-4">2024-05-28</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="py-3 px-4">2023-24</td>
                  <td className="py-3 px-4">{formatCurrency(Math.round(parcel.taxAmount * 0.85))}</td>
                  <td className="py-3 px-4"><Badge variant="green">Paid</Badge></td>
                  <td className="py-3 px-4">2023-06-10</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Receipt className="w-6 h-6" />} title="Tax Exempt" description="This parcel is exempt from property tax." />
        )}
      </Card>
    </div>
  )
}

function UtilitiesTab({ parcel }: { parcel: Parcel }) {
  const utilityList = [
    { key: 'electricity' as const, label: 'Electricity', icon: Zap },
    { key: 'water' as const, label: 'Water Supply', icon: Droplets },
    { key: 'sewerage' as const, label: 'Sewerage', icon: Trash2 },
    { key: 'gas' as const, label: 'Gas Pipeline', icon: Flame },
    { key: 'telecom' as const, label: 'Telecom / Internet', icon: Wifi },
  ]
  return (
    <Card title="Utility Connections">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {utilityList.map(u => {
          const connected = parcel.utilities[u.key]
          return (
            <div
              key={u.key}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border',
                connected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
              )}>
                <u.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{u.label}</p>
                <p className={cn('text-xs font-semibold', connected ? 'text-emerald-600' : 'text-slate-400')}>
                  {connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RestrictionsTab({ parcel }: { parcel: Parcel }) {
  return (
    <Card title="Restrictions on Parcel">
      {parcel.restrictions.length > 0 ? (
        <ul className="space-y-3">
          {parcel.restrictions.map((r, i) => (
            <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Ban className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Restriction {i + 1}</p>
                <p className="text-sm text-amber-700">{r}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          title="No Restrictions"
          description="There are no restrictions currently imposed on this parcel."
        />
      )}
    </Card>
  )
}

function DisputesTab({ parcel }: { parcel: Parcel }) {
  const parcelDisputes = disputes.filter(d => d.parcelId === parcel.id)
  return (
    <Card title="Active Disputes">
      {parcelDisputes.length > 0 ? (
        <div className="space-y-4">
          {parcelDisputes.map(d => (
            <div key={d.id} className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-red-800">{d.caseId}</h4>
                <StatusBadge status={d.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Dispute Type" value={d.disputeType.replace(/^\w/, c => c.toUpperCase())} />
                <InfoRow label="Priority" value="" badge={<StatusBadge status={d.priority} />} />
                <InfoRow label="Court" value={d.court} />
                <InfoRow label="Judge" value={d.judge} />
                <InfoRow label="Filed" value={d.filedDate} />
                <InfoRow label="Next Hearing" value={d.nextHearing || 'N/A'} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Parties Involved</p>
                <div className="flex flex-wrap gap-2">
                  {d.parties.map((p, i) => (
                    <Badge key={i} variant="slate">{p}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Scale className="w-6 h-6 text-emerald-500" />}
          title="No Active Disputes"
          description="There are no disputes currently associated with this parcel."
        />
      )}
    </Card>
  )
}

function DocumentsTab({ parcel }: { parcel: Parcel }) {
  const docs = [
    { name: 'Record of Rights (RoR)', icon: BookOpen, status: 'available' },
    { name: 'Registration Certificate', icon: FileText, status: parcel.registeredDate ? 'available' : 'unavailable' },
    { name: 'Tax Receipt', icon: Receipt, status: parcel.taxAmount ? 'available' : 'unavailable' },
    { name: 'Encumbrance Certificate', icon: Shield, status: 'available' },
    { name: 'Building Permission', icon: Hammer, status: parcel.buildingPermission !== 'none' ? 'available' : 'unavailable' },
    { name: 'Survey Map', icon: Map, status: 'available' },
    { name: 'Patta Copy', icon: Landmark, status: 'available' },
  ]
  return (
    <Card title="Documents">
      <div className="space-y-2">
        {docs.map((doc, i) => {
          const disabled = doc.status !== 'available'
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <doc.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.status === 'available' ? 'Available' : 'Not Available'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={disabled} onClick={() => viewDocument(parcel, doc.name)}>
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
                <Button variant="ghost" size="sm" disabled={disabled} onClick={() => downloadDocument(parcel, doc.name)}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ActivityTimelineTab({ parcel }: { parcel: Parcel }) {
  const logs = auditLogs.filter(l => l.targetId === parcel.ulpin)
  const events = [
    { date: parcel.registeredDate, title: 'Parcel Registered', desc: `Initial registration completed for ${parcel.ulpin}`, color: 'bg-blue-500' },
    { date: parcel.lastUpdated, title: 'Record Updated', desc: 'Last modification to parcel record', color: 'bg-amber-500' },
    ...logs.map(l => ({
      date: l.timestamp.split('T')[0],
      title: l.action,
      desc: `By ${l.userName} (${l.department}) — ${l.result}`,
      color: l.result === 'success' ? 'bg-emerald-500' : l.result === 'failure' ? 'bg-red-500' : 'bg-amber-500',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card title="Activity Timeline" subtitle="Chronological record of all events">
      {events.length > 0 ? (
        <div className="relative ml-3">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-6">
            {events.map((ev, i) => (
              <div key={i} className="relative pl-6">
                <div className={cn('absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white', ev.color)} />
                <p className="text-xs text-slate-400">{ev.date}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{ev.title}</p>
                <p className="text-sm text-slate-600">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon={<Clock className="w-6 h-6" />} title="No Activity" description="No activity has been recorded for this parcel yet." />
      )}
    </Card>
  )
}

function InfoRow({ label, value, mono, badge }: { label: string; value?: string; mono?: boolean; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      {badge ?? (
        <span className={cn('text-sm font-medium text-slate-900 text-right', mono && 'font-mono')}>{value || '—'}</span>
      )}
    </div>
  )
}

function exportParcel(parcel: Parcel) {
  const blob = new Blob([JSON.stringify(parcel, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${parcel.ulpin}-parcel.json`
  a.click()
  URL.revokeObjectURL(url)
}

function docSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function buildDocumentContent(parcel: Parcel, name: string): string {
  const gen = (title: string, rows: Array<[string, string | number | boolean | undefined]>) =>
    [
      `${'='.repeat(60)}`,
      title,
      `Parcel: ${parcel.ulpin} (${parcel.surveyNumber}, ${parcel.village}, ${parcel.district})`,
      `Generated: ${new Date().toLocaleString()}`,
      `${'='.repeat(60)}`,
      ...rows.map(([k, v]) => `${k}: ${v ?? '—'}`),
      '',
    ].join('\n')

  const common: Array<[string, string | number | boolean | undefined]> = [
    ['ULPIN', parcel.ulpin],
    ['Survey Number', parcel.surveyNumber],
    ['Village', parcel.village],
    ['Taluk', parcel.taluk],
    ['District', parcel.district],
    ['State', parcel.state],
    ['Owner', parcel.ownerName],
    ['Father / Guardian', parcel.ownerFatherName],
    ['Area', `${formatNumber(parcel.area)} ${parcel.areaUnit}`],
    ['Classification', parcel.classification],
    ['Patta Number', parcel.pattaNumber],
  ]

  switch (name) {
    case 'Record of Rights (RoR)':
      return gen(`RECORD OF RIGHTS (RoR) — ${parcel.ulpin}`, [
        ...common,
        ['Registered Date', parcel.registeredDate],
        ['Ownership Status', parcel.ownershipStatus],
        ['Ownership Type', parcel.ownershipType],
        ['Verification', parcel.verificationStatus],
        ['Restrictions', parcel.restrictions.length ? parcel.restrictions.join(', ') : 'None'],
      ])
    case 'Registration Certificate':
      return gen(`REGISTRATION CERTIFICATE — ${parcel.ulpin}`, [
        ...common,
        ['Registration Date', parcel.registeredDate],
        ['Registered Under (Owner)', parcel.ownerName],
        ['Dispute Status', parcel.disputeStatus],
      ])
    case 'Tax Receipt':
      return gen(`PROPERTY TAX RECEIPT — ${parcel.ulpin}`, [
        ...common,
        ['Annual Tax', parcel.taxAmount ? formatCurrency(parcel.taxAmount) : '—'],
        ['Tax Status', parcel.propertyTaxStatus],
      ])
    case 'Encumbrance Certificate':
      return gen(`ENCUMBRANCE CERTIFICATE — ${parcel.ulpin}`, [
        ...common,
        ['Encumbrance Status', parcel.encumbranceStatus],
        ['Mortgage Bank', parcel.mortgageBank ?? 'None'],
        ['Mortgage Amount', parcel.mortgageAmount ? formatCurrency(parcel.mortgageAmount) : '—'],
        ['Restrictions', parcel.restrictions.length ? parcel.restrictions.join(', ') : 'None'],
      ])
    case 'Building Permission':
      return gen(`BUILDING PERMISSION — ${parcel.ulpin}`, [
        ...common,
        ['Permission', parcel.buildingPermission],
        ['Zoning', parcel.zoning],
      ])
    case 'Survey Map':
      return gen(`SURVEY MAP (GeoJSON) — ${parcel.ulpin}`, [
        ...common,
        ['ULPIN (Key)', parcel.ulpin],
        ['Centroid Coordinates', JSON.stringify(parcel.coordinates)],
        ['Bounds', JSON.stringify(parcel.bounds ?? '—', null, 2)],
      ])
    case 'Patta Copy':
      return gen(`PATTA COPY — ${parcel.ulpin}`, [
        ...common,
        ['Patta Number', parcel.pattaNumber],
        ['Ownership Status', parcel.ownershipStatus],
        ['Verification', parcel.verificationStatus],
      ])
    default:
      return gen(`${name} — ${parcel.ulpin}`, common)
  }
}

function openDocument(parcel: Parcel, name: string, preferDownload: boolean) {
  const content = buildDocumentContent(parcel, name)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  if (preferDownload) {
    const a = document.createElement('a')
    a.href = url
    a.download = `${parcel.ulpin}-${docSlug(name)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    window.open(url, '_blank')
    window.setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
}

function viewDocument(parcel: Parcel, name: string) {
  openDocument(parcel, name, false)
}

function downloadDocument(parcel: Parcel, name: string) {
  openDocument(parcel, name, true)
}

function ApplicationsTab({ parcel }: { parcel: Parcel }) {
  const apps = serviceRequests.filter(r => r.ulpin === parcel.ulpin)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Applications for this Parcel</h3>
        <Link to={`/services?ulpin=${parcel.ulpin}`}>
          <Button size="sm"><ListChecks className="w-3.5 h-3.5" /> Request a Service</Button>
        </Link>
      </div>
      {apps.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Service</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Applicant</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Filed</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{a.serviceName}</td>
                  <td className="py-3 px-4 text-slate-600">{a.applicantName}</td>
                  <td className="py-3 px-4 text-slate-600">{a.submittedDate}</td>
                  <td className="py-3 px-4"><StatusBadge status={a.currentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<ListChecks className="w-6 h-6" />} title="No Applications" description="No service applications found for this parcel yet." />
      )}
    </div>
  )
}

function AIInsightsTab({ parcel }: { parcel: Parcel }) {
  const insights: { title: string; detail: string; severity: 'high' | 'medium' | 'low' }[] = []
  const confidence = 82

  if (parcel.ownershipStatus === 'pending') {
    insights.push({ title: 'Ownership unverified', detail: 'Ownership has not been verified against sub-registrar and revenue records. Transactions may carry title risk.', severity: 'high' })
  }
  if (parcel.disputeStatus === 'active') {
    insights.push({ title: 'Active dispute', detail: `An active dispute (${parcel.disputeCaseId || 'pending case'}) is registered. A transaction hold is recommended.`, severity: 'high' })
  }
  if (parcel.propertyTaxStatus === 'pending' || parcel.propertyTaxStatus === 'overdue') {
    insights.push({ title: 'Outstanding property tax', detail: `Tax of ${formatCurrency(parcel.taxAmount ?? 0)} is outstanding. A tax clearance may be required before registration.`, severity: 'medium' })
  }
  if (parcel.encumbranceStatus === 'mortgaged' || parcel.encumbranceStatus === 'encumbered') {
    insights.push({ title: 'Parcel encumbered', detail: 'The parcel carries an encumbrance / mortgage. Obtain an updated Encumbrance Certificate or bank NOC.', severity: 'medium' })
  }
  if (parcel.restrictions.length > 0) {
    insights.push({ title: `${parcel.restrictions.length} restriction(s) apply`, detail: parcel.restrictions.join(', '), severity: 'low' })
  }
  if (insights.length === 0) {
    insights.push({ title: 'Parcel appears clear', detail: 'Ownership verified, no active dispute, tax paid, no encumbrance. No immediate action required.', severity: 'low' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-medium text-amber-700">AI-ASSISTED · requires human verification · confidence {confidence}%</p>
      </div>
      <Card title="Parcel Risk Assessment" subtitle="Automated review of governance records for this parcel">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${confidence}%` }} />
          </div>
          <span className="text-sm font-semibold text-slate-700 tabular-nums">Clearance {confidence}%</span>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className={cn('mt-1 w-2 h-2 rounded-full shrink-0', ins.severity === 'high' ? 'bg-red-500' : ins.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')} />
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-gov-600" /> {ins.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{ins.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function ParcelProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const parcel = getParcelById(id ?? '')

  if (!parcel) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="Parcel Not Found"
          description={`No parcel found with ID "${id}". Please check the URL and try again.`}
          action={<Button onClick={() => navigate('/land-records')}>Browse Land Records</Button>}
        />
      </div>
    )
  }

  const tabContent: Record<Tab, React.ReactNode> = {
    Overview: <OverviewTab parcel={parcel} />,
    'Ownership/RoR': <OwnershipTab parcel={parcel} />,
    Registration: <RegistrationTab parcel={parcel} />,
    Encumbrance: <EncumbranceTab parcel={parcel} />,
    'Land Use': <LandUseTab parcel={parcel} />,
    'Building Permissions': <BuildingPermissionsTab parcel={parcel} />,
    'Property Tax': <PropertyTaxTab parcel={parcel} />,
    Utilities: <UtilitiesTab parcel={parcel} />,
    Restrictions: <RestrictionsTab parcel={parcel} />,
    Disputes: <DisputesTab parcel={parcel} />,
    Documents: <DocumentsTab parcel={parcel} />,
    Applications: <ApplicationsTab parcel={parcel} />,
    'AI Insights': <AIInsightsTab parcel={parcel} />,
    'Activity Timeline': <ActivityTimelineTab parcel={parcel} />,
  }

  const utilityCount = Object.values(parcel.utilities).filter(Boolean).length

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Header Card */}
      <Card noPadding>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Preview */}
            <div className="w-full lg:w-72 shrink-0 h-48 lg:h-auto rounded-xl bg-gradient-to-br from-gov-100 to-gov-200 border border-gov-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <MapPin className="w-8 h-8 text-gov-600 mb-2" />
              <p className="text-xs font-medium text-gov-700 text-center">Map Preview</p>
              <div className="mt-3 text-center">
                <p className="text-xs font-mono text-gov-800">{parcel.coordinates.lat.toFixed(4)}°N</p>
                <p className="text-xs font-mono text-gov-800">{parcel.coordinates.lng.toFixed(4)}°E</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/explorer?parcel=${parcel.id}`)}>
                  <ExternalLink className="w-3 h-3" /> Full Map
                </Button>
              </div>
            </div>

            {/* Parcel Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Unique Land Parcel Identification Number</p>
                  <h1 className="mt-1 text-2xl font-bold font-mono text-slate-900 tracking-wide">{parcel.ulpin}</h1>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {parcel.village}, {parcel.taluk}, {parcel.district}, {parcel.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</Button>
                  <Button variant="secondary" size="sm" onClick={() => exportParcel(parcel)}><Download className="w-3.5 h-3.5" /> Export</Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={parcel.ownershipStatus} />
                <StatusBadge status={parcel.verificationStatus} />
                <StatusBadge status={parcel.encumbranceStatus} />
                <StatusBadge status={parcel.disputeStatus} />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Survey No.</p>
                  <p className="font-semibold text-slate-900">{parcel.surveyNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Area</p>
                  <p className="font-semibold text-slate-900">{parcel.area} {parcel.areaUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Coordinates</p>
                  <p className="font-mono text-xs text-slate-900">{parcel.coordinates.lat}, {parcel.coordinates.lng}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <p className="font-semibold text-slate-900">{parcel.ownerName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Ownership', status: parcel.ownershipStatus, icon: Users },
          { label: 'Land Use', status: parcel.landUse, icon: Home },
          { label: 'Encumbrance', status: parcel.encumbranceStatus, icon: ShieldAlert },
          { label: 'Registration', status: parcel.registeredDate ? 'registered' : 'pending', icon: FileText },
          { label: 'Tax', status: parcel.propertyTaxStatus, icon: CircleDollarSign },
          { label: 'Dispute', status: parcel.disputeStatus, icon: Scale },
          { label: 'Building', status: parcel.buildingPermission, icon: Building2 },
          { label: 'Utilities', status: utilityCount >= 3 ? 'verified' : 'pending', icon: Pipette },
        ].map((item, i) => (
          <div key={i} className="card p-3 flex flex-col items-center text-center gap-1.5">
            <item.icon className="w-5 h-5 text-slate-400" />
            <p className="text-[10px] font-medium text-slate-500 uppercase">{item.label}</p>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0 overflow-x-auto -mb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
                activeTab === tab
                  ? 'border-gov-600 text-gov-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>{tabContent[activeTab]}</div>
    </div>
  )
}
