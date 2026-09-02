import { useState } from 'react'
import {
  Brain, AlertTriangle, Eye, Shield, Scan, Search, ChevronRight,
  MapPin, TrendingUp, DollarSign, AlertOctagon, Zap
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CardGrid } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { aiInsights } from '@/data/services'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, React.ElementType> = {
  change_detection: Scan,
  ownership_anomaly: Shield,
  land_use_change: MapPin,
  fraud_risk: AlertOctagon,
  encroachment: Eye,
}

const typeLabels: Record<string, string> = {
  change_detection: 'Change Detection',
  ownership_anomaly: 'Ownership Anomaly',
  land_use_change: 'Land Use Change',
  fraud_risk: 'Fraud Risk',
  encroachment: 'Encroachment',
}

const severityColors: Record<string, string> = {
  high: 'red',
  medium: 'amber',
  low: 'slate',
}

const decisionCards = [
  {
    icon: AlertTriangle,
    title: 'High-Risk Parcels',
    count: 7,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    why: 'Multiple AI models flagged these parcels due to rapid ownership transfers, unusual transaction patterns, or discrepancies between registered data and satellite imagery. These require immediate manual verification.',
  },
  {
    icon: Zap,
    title: 'Unusual Transactions',
    count: 12,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    why: 'Transaction amounts significantly deviate from the registered market value, or multiple transactions occurred in a short period on the same parcel. These patterns are inconsistent with normal property transfers.',
  },
  {
    icon: Eye,
    title: 'Potential Encroachments',
    count: 4,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    why: 'GPS survey data and satellite analysis indicate physical boundaries that do not match registered boundary coordinates. Cross-referencing with neighboring parcel records shows potential overlap.',
  },
  {
    icon: DollarSign,
    title: 'Revenue Anomalies',
    count: 3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    why: 'Property tax payments do not match the expected collection for the parcel classification and area. This may indicate under-assessment, tax evasion, or data entry errors in the revenue records.',
  },
]

export default function AIInsights() {
  const [insightStatuses, setInsightStatuses] = useState<Record<string, string>>(
    Object.fromEntries(aiInsights.map(i => [i.id, i.status]))
  )

  const newCount = aiInsights.filter(i => insightStatuses[i.id] === 'new').length
  const investigatingCount = aiInsights.filter(i => insightStatuses[i.id] === 'investigating').length

  const handleAction = (id: string, action: 'investigating' | 'dismissed' | 'new') => {
    setInsightStatuses(prev => ({ ...prev, [id]: action }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI / ML Intelligence Center</h1>
          <p className="text-sm text-slate-500 mt-1">Automated analysis and anomaly detection for land parcels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-50 rounded-lg border border-gov-200">
            <Brain className="w-4 h-4 text-gov-600" />
            <span className="text-xs font-medium text-gov-700">AI Engine Active</span>
          </div>
        </div>
      </div>

      <CardGrid>
        <StatCard title="New Alerts" value={newCount} icon={AlertTriangle} change="Requires action" changeType="down" iconColor="text-red-600" />
        <StatCard title="Investigating" value={investigatingCount} icon={Search} change="In progress" changeType="neutral" iconColor="text-amber-600" />
        <StatCard title="Total Insights" value={aiInsights.length} icon={Brain} change="All time" changeType="neutral" iconColor="text-gov-600" />
        <StatCard title="Model Accuracy" value="87.3%" icon={TrendingUp} change="+2.1% this month" changeType="up" iconColor="text-emerald-600" />
      </CardGrid>

      <Card title="AI Insights" subtitle="Automated anomaly detection results" noPadding>
        <div className="divide-y divide-slate-100">
          {aiInsights.map(insight => {
            const Icon = typeIcons[insight.type] || Brain
            const currentStatus = insightStatuses[insight.id]
            return (
              <div key={insight.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                        <Badge variant={severityColors[insight.severity] as 'red' | 'amber' | 'slate'}>
                          {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                        </Badge>
                        <StatusBadge status={currentStatus} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{typeLabels[insight.type]}</p>
                      <p className="text-sm text-slate-600 mt-1.5">{insight.description}</p>
                      {insight.ulpin && (
                        <p className="text-xs text-slate-400 mt-1 font-mono">ULPIN: {insight.ulpin}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-500">Date: {new Date(insight.date).toLocaleDateString('en-IN')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Confidence:</span>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', insight.confidence >= 80 ? 'bg-red-500' : insight.confidence >= 60 ? 'bg-amber-500' : 'bg-slate-400')}
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-700">{insight.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 lg:flex-col">
                    {currentStatus === 'new' && (
                      <>
                        <Button size="sm" onClick={() => handleAction(insight.id, 'investigating')}>
                          <Search className="w-3.5 h-3.5" /> Investigate
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction(insight.id, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    )}
                    {currentStatus === 'investigating' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction(insight.id, 'dismissed')}>
                        Dismiss
                      </Button>
                    )}
                    {currentStatus === 'dismissed' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction(insight.id, 'new')}>
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Satellite Change Detection" subtitle="AI-powered comparison of satellite imagery">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl p-6 border border-slate-200 relative overflow-hidden min-h-[240px]">
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="blue">Before</Badge>
              </div>
              <div className="mt-6 text-center">
                <div className="w-full h-40 bg-slate-200/60 rounded-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1 opacity-30">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded bg-green-700/40" />
                      ))}
                    </div>
                  </div>
                  <p className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded">
                    Captured: 2025-09-15
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-2">Previous satellite observation — 85% vegetation cover</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-orange-50 to-slate-100 rounded-xl p-6 border border-slate-200 relative overflow-hidden min-h-[240px]">
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="amber">After</Badge>
              </div>
              <div className="mt-6 text-center">
                <div className="w-full h-40 bg-slate-200/60 rounded-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={cn('w-8 h-8 rounded', (i === 3 || i === 4 || i === 5) ? 'bg-amber-600/70 border-2 border-red-500 border-dashed' : 'bg-green-700/40')} />
                      ))}
                    </div>
                  </div>
                  <p className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded">
                    Captured: 2025-11-28
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-2">Latest observation — 62% vegetation cover, new structures detected</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-red-500 border-dashed bg-red-50" />
              <span className="text-xs text-slate-600">Changed Area (23%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-700/40" />
              <span className="text-xs text-slate-600">Unchanged Vegetation</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">Change Confidence: <span className="text-red-600">91%</span></span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm">
            <Search className="w-3.5 h-3.5" /> Investigate
          </Button>
          <Button size="sm" variant="secondary">
            <MapPin className="w-3.5 h-3.5" /> Create Inspection Request
          </Button>
        </div>
      </Card>

      <Card title="AI Decision Support" subtitle="Intelligent flagging and recommendations">
        <div className="mb-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            AI-assisted insight — Requires official verification
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisionCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.title} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', card.bgColor)}>
                    <Icon className={cn('w-5 h-5', card.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                      <span className={cn('text-xl font-bold', card.color)}>{card.count}</span>
                    </div>
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-600 mb-1">Why was this flagged?</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{card.why}</p>
                    </div>
                    <button className="mt-2 flex items-center gap-1 text-xs font-medium text-gov-600 hover:text-gov-700">
                      View flagged parcels <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
