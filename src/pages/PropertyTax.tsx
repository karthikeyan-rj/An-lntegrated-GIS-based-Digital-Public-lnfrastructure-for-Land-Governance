import { useState, useMemo } from 'react'
import {
  Receipt,
  IndianRupee,
  TrendingUp,
  Clock,
  Download,
  CreditCard,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardGrid } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import parcels from '@/data/parcels'

const monthlyTaxData = [
  { month: 'Jan', collected: 62, target: 70 },
  { month: 'Feb', collected: 58, target: 70 },
  { month: 'Mar', collected: 71, target: 75 },
  { month: 'Apr', collected: 55, target: 75 },
  { month: 'May', collected: 48, target: 70 },
  { month: 'Jun', collected: 66, target: 70 },
  { month: 'Jul', collected: 72, target: 80 },
  { month: 'Aug', collected: 80, target: 80 },
  { month: 'Sep', collected: 78, target: 85 },
  { month: 'Oct', collected: 90, target: 90 },
  { month: 'Nov', collected: 85, target: 95 },
  { month: 'Dec', collected: 74, target: 100 },
]

const taxHistory = [
  { year: 'FY 2024-25', collected: 847, target: 973, rate: 87.3 },
  { year: 'FY 2023-24', collected: 791, target: 920, rate: 86.0 },
  { year: 'FY 2022-23', collected: 712, target: 850, rate: 83.8 },
  { year: 'FY 2021-22', collected: 634, target: 800, rate: 79.3 },
  { year: 'FY 2020-21', collected: 521, target: 750, rate: 69.5 },
]

export default function PropertyTax() {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const taxParcels = useMemo(() =>
    parcels.filter(p => p.taxAmount && p.taxAmount > 0).map(p => ({
      ...p,
      annualTax: p.taxAmount!,
      paid: p.propertyTaxStatus === 'paid',
      outstanding: p.propertyTaxStatus !== 'paid' ? p.taxAmount! : 0,
    })),
    []
  )

  const totalTaxable = taxParcels.reduce((s, p) => s + p.annualTax, 0)
  const totalPaid = taxParcels.filter(p => p.paid).reduce((s, p) => s + p.annualTax, 0)
  const totalOutstanding = taxParcels.filter(p => !p.paid).reduce((s, p) => s + p.outstanding, 0)

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="page-header">
        <h1 className="page-title">Property Tax</h1>
        <p className="page-subtitle">Property tax management, collection analytics, and payment tracking</p>
      </div>

      <CardGrid>
        <StatCard title="Total Properties" value="12.4M" icon={Receipt} iconColor="text-blue-600" change="+2.1% from last year" changeType="up" />
        <StatCard title="Tax Collected" value="₹847M" icon={IndianRupee} iconColor="text-emerald-600" change="87.3% of target" changeType="up" />
        <StatCard title="Outstanding" value="₹123M" icon={Clock} iconColor="text-amber-600" change="-12% from last year" changeType="down" />
        <StatCard title="Collection Rate" value="87.3%" icon={TrendingUp} iconColor="text-purple-600" change="+1.3% improvement" changeType="up" />
      </CardGrid>

      <Card title="Monthly Tax Collection" subtitle="Collected vs Target (₹ millions) — FY 2024-25">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTaxData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="M" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value: any, name: any) => [`₹${value}M`, name === 'collected' ? 'Collected' : 'Target']}
              />
              <Legend formatter={(value: string) => value === 'collected' ? 'Collected' : 'Target'} />
              <Bar dataKey="collected" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title="Property Tax Register"
        subtitle={`${taxParcels.length} taxable properties`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download className="w-3.5 h-3.5" />
              Download All
            </Button>
          </div>
        }
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ULPIN</th>
                <th>Owner</th>
                <th>Taxable Value</th>
                <th>Annual Tax</th>
                <th>Status</th>
                <th>Outstanding</th>
                <th>Last Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxParcels.map(p => (
                <tr
                  key={p.id}
                  className={`cursor-pointer ${selectedParcelId === p.id ? 'bg-gov-50/50' : ''}`}
                  onClick={() => setSelectedParcelId(selectedParcelId === p.id ? null : p.id)}
                >
                  <td className="font-mono text-xs">{p.ulpin}</td>
                  <td>{p.ownerName}</td>
                  <td className="tabular-nums">{formatCurrency(p.annualTax * 8)}</td>
                  <td className="tabular-nums font-medium">{formatCurrency(p.annualTax)}</td>
                  <td><StatusBadge status={p.propertyTaxStatus} /></td>
                  <td className="tabular-nums text-amber-600">{p.outstanding > 0 ? formatCurrency(p.outstanding) : '—'}</td>
                  <td className="text-slate-500 text-xs">{new Date(p.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      {p.outstanding > 0 && (
                        <Button size="sm" variant="primary">
                          <CreditCard className="w-3 h-3" />
                          Pay Tax
                        </Button>
                      )}
                      <Button size="sm" variant="secondary">
                        <Download className="w-3 h-3" />
                        Receipt
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Tax History"
        subtitle="Year-over-year collection performance"
        action={
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(!historyOpen)}>
            {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        }
      >
        {historyOpen && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fiscal Year</th>
                  <th>Collected (₹M)</th>
                  <th>Target (₹M)</th>
                  <th>Collection Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {taxHistory.map(row => (
                  <tr key={row.year}>
                    <td className="font-medium">{row.year}</td>
                    <td className="tabular-nums">{formatCurrency(row.collected * 1000000)}</td>
                    <td className="tabular-nums">{formatCurrency(row.target * 1000000)}</td>
                    <td className="tabular-nums font-medium">{row.rate}%</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gov-500 rounded-full"
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!historyOpen && (
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Click to expand historical tax collection data (FY 2020-21 to FY 2024-25)
          </div>
        )}
      </Card>

      {selectedParcelId && (() => {
        const p = parcels.find(pp => pp.id === selectedParcelId)
        if (!p) return null
        return (
          <Card title="Tax Payment" subtitle={`Payment for ${p.ulpin} — ${p.ownerName}`}>
            <div className="max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Annual Tax</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(p.taxAmount || 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Outstanding</p>
                  <p className="text-lg font-bold text-amber-600 mt-0.5">{p.propertyTaxStatus !== 'paid' ? formatCurrency(p.taxAmount || 0) : '₹0'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button>
                  <CreditCard className="w-4 h-4" />
                  Pay {p.taxAmount ? formatCurrency(p.taxAmount) : 'Tax'} Now
                </Button>
                <Button variant="secondary">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
                <Button variant="ghost" onClick={() => setSelectedParcelId(null)}>Close</Button>
              </div>
            </div>
          </Card>
        )
      })()}
    </div>
  )
}
