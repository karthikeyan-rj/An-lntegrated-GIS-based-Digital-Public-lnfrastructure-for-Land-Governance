import { useState } from 'react'
import { BarChart3, TrendingUp, Filter, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parcelsByLandUse = [
  { name: 'Residential', value: 4235, color: '#3b82f6' },
  { name: 'Commercial', value: 1892, color: '#10b981' },
  { name: 'Agricultural', value: 3654, color: '#f59e0b' },
  { name: 'Industrial', value: 876, color: '#8b5cf6' },
  { name: 'Institutional', value: 445, color: '#ec4899' },
  { name: 'Forest', value: 1203, color: '#065f46' },
  { name: 'Mixed Use', value: 567, color: '#f97316' },
]

const registrationTrends = months.map((m, i) => ({
  month: m,
  count: Math.round(80 + Math.sin(i * 0.8) * 40 + Math.random() * 20),
  amount: Math.round(2.5 + Math.sin(i * 0.6) * 1.2 + Math.random() * 0.5),
}))

const taxCollection = months.map((m, i) => ({
  month: m,
  collected: Math.round(45 + Math.random() * 25 + i * 1.5),
  target: Math.round(70 + i * 0.8),
}))

const disputeTrends = months.map((m, i) => ({
  month: m,
  active: Math.round(12 + Math.sin(i * 1.2) * 5 + Math.random() * 3),
  resolved: Math.round(8 + Math.cos(i * 0.9) * 4 + Math.random() * 2),
}))

const ownershipDistribution = [
  { name: 'Self', value: 5234 },
  { name: 'Joint', value: 2876 },
  { name: 'Inheritance', value: 1945 },
  { name: 'Corporate', value: 821 },
]

const serviceProcessingTimes = [
  { service: 'RoR', avgDays: 1 },
  { service: 'Mutation', avgDays: 22 },
  { service: 'Encumbrance', avgDays: 6 },
  { service: 'Building Permit', avgDays: 32 },
  { service: 'Land Use Cert', avgDays: 8 },
  { service: 'Tax Cert', avgDays: 2 },
]

const ownershipColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

const states = ['All States', 'Tamil Nadu', 'Chandigarh', 'Karnataka', 'Maharashtra']
const districts = ['All Districts', 'Madurai', 'Chennai', 'Coimbatore', 'Tiruchirappalli', 'Chandigarh']

export default function Analytics() {
  const [selectedState, setSelectedState] = useState('All States')
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
  const [dateFrom, setDateFrom] = useState('2025-01-01')
  const [dateTo, setDateTo] = useState('2025-12-31')

  const summaryStats = [
    { label: 'Total Parcels', value: '12,872', change: '+3.2%' },
    { label: 'Total Registrations', value: '1,287', change: '+12.1%' },
    { label: 'Revenue Collected', value: '₹847 Cr', change: '+8.4%' },
    { label: 'Active Disputes', value: '47', change: '-5.3%' },
    { label: 'Avg Processing Time', value: '12.3 days', change: '-2.1 days' },
    { label: 'Digital Verification Rate', value: '94.2%', change: '+4.8%' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive insights into land governance metrics</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <Card noPadding>
        <div className="px-5 py-4 flex flex-wrap items-center gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
          >
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
          >
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Parcels by Land Use" subtitle="Distribution across categories" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={parcelsByLandUse}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={2}
              >
                {parcelsByLandUse.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => v?.toLocaleString('en-IN')} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Registration Trends" subtitle="Monthly registrations and value" action={<TrendingUp className="w-4 h-4 text-slate-400" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `₹${v}Cr`} />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Count" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Value (₹ Cr)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Property Tax Collection" subtitle="Collected vs target (₹ Lakhs)" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taxCollection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
              <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Collected" />
              <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Dispute Trends" subtitle="Active vs resolved disputes" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={disputeTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
              <Line type="monotone" dataKey="active" stroke="#ef4444" strokeWidth={2} name="Active" dot={false} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Ownership Distribution" subtitle="By ownership type">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ownershipDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {ownershipDistribution.map((_, i) => (
                  <Cell key={i} fill={ownershipColors[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => v?.toLocaleString('en-IN')} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Service Processing Times" subtitle="Average days to complete">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceProcessingTimes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" unit=" days" />
              <YAxis type="category" dataKey="service" tick={{ fontSize: 12 }} stroke="#94a3b8" width={100} />
              <Tooltip formatter={(v: any) => `${v} days`} />
              <Bar dataKey="avgDays" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Summary Statistics" subtitle="Key performance indicators">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Metric</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Value</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {summaryStats.map(stat => (
                <tr key={stat.label} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{stat.label}</td>
                  <td className="px-4 py-3 text-right text-slate-700 font-semibold">{stat.value}</td>
                  <td className={`px-4 py-3 text-right font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-slate-500'}`}>
                    {stat.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
