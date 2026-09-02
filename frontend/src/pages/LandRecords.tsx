import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Download, Filter, FileText, CheckCircle2, Clock, AlertTriangle,
  Eye, ChevronDown,
} from 'lucide-react'
import parcels from '@/data/parcels'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { cn, formatNumber } from '@/lib/utils'
import type { LandUseType, OwnershipStatus } from '@/types'

const districts = [...new Set(parcels.map(p => p.district))].sort()
const landUses: LandUseType[] = ['residential', 'commercial', 'agricultural', 'industrial', 'institutional', 'forest', 'mixed']
const verificationStatuses = ['digitally_verified', 'pending_verification', 'requires_update'] as const

export default function LandRecords() {
  const [searchQuery, setSearchQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [landUseFilter, setLandUseFilter] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('')

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const matchesSearch = !searchQuery ||
        p.ulpin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.village.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDistrict = !districtFilter || p.district === districtFilter
      const matchesLandUse = !landUseFilter || p.landUse === landUseFilter
      const matchesVerification = !verificationFilter || p.verificationStatus === verificationFilter
      return matchesSearch && matchesDistrict && matchesLandUse && matchesVerification
    })
  }, [searchQuery, districtFilter, landUseFilter, verificationFilter])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Land Records Management</h1>
          <p className="text-sm text-slate-500 mt-1">Complete registry of all land parcels and their digital records</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={formatNumber(10_800_000)} icon={FileText} change="+12,400 this month" changeType="up" />
        <StatCard title="Verified" value={formatNumber(8_200_000)} icon={CheckCircle2} change="75.9% of total" changeType="up" iconColor="text-emerald-600" />
        <StatCard title="Pending Verification" value={formatNumber(1_200_000)} icon={Clock} change="-3.2% from last month" changeType="down" iconColor="text-amber-600" />
        <StatCard title="Requires Update" value={formatNumber(1_400_000)} icon={AlertTriangle} change="12.9% of total" changeType="neutral" iconColor="text-red-600" />
      </div>

      {/* Filters */}
      <Card noPadding>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ULPIN, Survey No, Owner, Village..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
          </div>
          <div className="relative">
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-500"
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={landUseFilter}
              onChange={e => setLandUseFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-500"
            >
              <option value="">All Land Use</option>
              {landUses.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={verificationFilter}
              onChange={e => setVerificationFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-500"
            >
              <option value="">All Status</option>
              {verificationStatuses.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{filteredParcels.length}</span> of <span className="font-semibold">{parcels.length}</span> records
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">ULPIN</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Survey No</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Village</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">District</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Area</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Land Use</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Verification</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.map(parcel => (
                <tr key={parcel.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-medium text-gov-700">{parcel.ulpin}</td>
                  <td className="py-3 px-4">{parcel.surveyNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{parcel.ownerName}</p>
                    <p className="text-xs text-slate-400">{parcel.ownerFatherName !== '—' ? parcel.ownerFatherName : ''}</p>
                  </td>
                  <td className="py-3 px-4">{parcel.village}</td>
                  <td className="py-3 px-4">{parcel.district}</td>
                  <td className="py-3 px-4">{parcel.area} {parcel.areaUnit}</td>
                  <td className="py-3 px-4">
                    <Badge variant={parcel.landUse === 'residential' ? 'blue' : parcel.landUse === 'commercial' ? 'amber' : parcel.landUse === 'agricultural' ? 'green' : 'slate'}>
                      {parcel.landUse}
                    </Badge>
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={parcel.verificationStatus} /></td>
                  <td className="py-3 px-4">
                    <Link to={`/parcel/${parcel.id}`}>
                      <Button variant="primary" size="sm">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredParcels.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-slate-500">
                    No records found matching your filters.
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
