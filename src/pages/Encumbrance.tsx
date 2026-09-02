import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, AlertTriangle, CheckCircle2, FileText, Download, Eye,
  Search, ChevronDown, ExternalLink, Banknote,
} from 'lucide-react'
import parcels from '@/data/parcels'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import type { EncumbranceStatus as EncStatus } from '@/types'

const encumbranceStatuses: EncStatus[] = ['clear', 'encumbered', 'mortgaged', 'lien']

export default function Encumbrance() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return parcels.filter(p => {
      const matchesSearch = !searchQuery ||
        p.ulpin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || p.encumbranceStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const totalCount = parcels.length
  const clearCount = parcels.filter(p => p.encumbranceStatus === 'clear').length
  const encumberedCount = parcels.filter(p => p.encumbranceStatus === 'encumbered').length
  const mortgagedCount = parcels.filter(p => p.encumbranceStatus === 'mortgaged').length

  const flaggedParcels = parcels.filter(p => p.encumbranceStatus !== 'clear')
  const clearParcels = parcels.filter(p => p.encumbranceStatus === 'clear')

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Encumbrance & Mortgage Registry</h1>
          <p className="text-sm text-slate-500 mt-1">Track and verify encumbrance status for all land parcels</p>
        </div>
        <Button variant="primary">
          <FileText className="w-4 h-4" /> Generate Encumbrance Certificate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Checked" value={totalCount} icon={Search} change="All parcels verified" changeType="neutral" />
        <StatCard title="Clear" value={clearCount} icon={CheckCircle2} change={`${((clearCount / totalCount) * 100).toFixed(1)}% of total`} changeType="up" iconColor="text-emerald-600" />
        <StatCard title="Encumbered" value={encumberedCount} icon={AlertTriangle} change="Requires resolution" changeType="down" iconColor="text-red-600" />
        <StatCard title="Mortgaged" value={mortgagedCount} icon={Banknote} change="Active mortgages" changeType="neutral" iconColor="text-amber-600" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800">No Encumbrance Found</h3>
              <p className="text-sm text-emerald-700 mt-1">
                {clearCount} parcels have been verified as free from any encumbrances, liens, or mortgages.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {clearParcels.slice(0, 4).map(p => (
                  <Link key={p.id} to={`/parcel/${p.id}`}>
                    <Badge variant="green" className="cursor-pointer hover:bg-emerald-100">{p.ulpin}</Badge>
                  </Link>
                ))}
                {clearParcels.length > 4 && (
                  <Badge variant="green">+{clearParcels.length - 4} more</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Encumbrance Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {flaggedParcels.length} parcels have active encumbrances, mortgages, or liens that require attention.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {flaggedParcels.map(p => (
                  <Link key={p.id} to={`/parcel/${p.id}`}>
                    <Badge variant="red" className="cursor-pointer hover:bg-red-100">{p.ulpin}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card noPadding>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ULPIN or Owner..."
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
              {encumbranceStatuses.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</option>
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
            Showing <span className="font-semibold">{filtered.length}</span> parcels
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">ULPIN</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Area</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Encumbrance Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Mortgage Bank</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(parcel => (
                <tr key={parcel.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-medium text-gov-700">{parcel.ulpin}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{parcel.ownerName}</p>
                    <p className="text-xs text-slate-400">{parcel.village}, {parcel.district}</p>
                  </td>
                  <td className="py-3 px-4">{parcel.area} {parcel.areaUnit}</td>
                  <td className="py-3 px-4"><StatusBadge status={parcel.encumbranceStatus} /></td>
                  <td className="py-3 px-4">
                    {parcel.mortgageBank ? (
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm">{parcel.mortgageBank}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {parcel.mortgageAmount ? (
                      <span className="font-semibold text-slate-900">{formatCurrency(parcel.mortgageAmount)}</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/parcel/${parcel.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-3.5 h-3.5" /> Certificate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    No parcels found matching your filters.
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
