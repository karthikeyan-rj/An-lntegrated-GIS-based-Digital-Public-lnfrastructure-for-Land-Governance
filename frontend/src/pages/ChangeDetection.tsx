import { useState } from 'react'
import { Satellite, TriangleAlert, Eye, CheckCircle2, ShieldQuestion, Search } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ChangeEntry {
  id: string
  type: string
  description: string
  confidence: number
  ulpin: string
  status: 'new' | 'investigating' | 'confirmed' | 'dismissed'
  beforeTone: string
  afterTone: string
  beforeLabel: string
  afterLabel: string
  detected: string
}

const mockChanges: ChangeEntry[] = [
  {
    id: 'cd1',
    type: 'Construction',
    description: 'Unauthorized built-up area expansion detected on the northern edge of the parcel. Estimated 420 sqm of new construction without a matching building permission on record.',
    confidence: 91,
    ulpin: 'TN-CHN-PM-72618345',
    status: 'new',
    beforeTone: 'bg-emerald-100',
    afterTone: 'bg-slate-400',
    beforeLabel: '2025-04-12',
    afterLabel: '2025-11-28',
    detected: '2025-12-01',
  },
  {
    id: 'cd2',
    type: 'Deforestation',
    description: 'Vegetation index decreased by 34% in the reserve forest buffer zone. Possible clearing activity detected near the protected wildlife corridor.',
    confidence: 84,
    ulpin: 'TN-TRZ-ML-74029586',
    status: 'investigating',
    beforeTone: 'bg-emerald-600',
    afterTone: 'bg-amber-200',
    beforeLabel: '2025-05-20',
    afterLabel: '2025-11-15',
    detected: '2025-11-22',
  },
  {
    id: 'cd3',
    type: 'Water Body Change',
    description: 'Surface water extent reduced by 27% in the adjacent irrigation tank. Seasonal fluctuation within normal range, but below the 5-year average summer level.',
    confidence: 66,
    ulpin: 'TN-MDU-RV-38472916',
    status: 'investigating',
    beforeTone: 'bg-cyan-500',
    afterTone: 'bg-cyan-200',
    beforeLabel: '2025-03-08',
    afterLabel: '2025-10-30',
    detected: '2025-11-10',
  },
  {
    id: 'cd4',
    type: 'Boundary Shift',
    description: 'Fence line appears displaced by ~1.2m on the western boundary relative to the recorded survey. Possible encroachment onto the neighboring parcel.',
    confidence: 72,
    ulpin: 'TN-MDU-VK-21958374',
    status: 'investigating',
    beforeTone: 'bg-lime-200',
    afterTone: 'bg-orange-300',
    beforeLabel: '2025-06-14',
    afterLabel: '2025-11-25',
    detected: '2025-11-28',
  },
  {
    id: 'cd5',
    type: 'Agricultural Conversion',
    description: 'Crop cover replaced by impervious surface on a portion of the agricultural land. No conversion approval was issued by the revenue department.',
    confidence: 88,
    ulpin: 'TN-CBE-GN-91527483',
    status: 'confirmed',
    beforeTone: 'bg-green-400',
    afterTone: 'bg-neutral-400',
    beforeLabel: '2025-02-16',
    afterLabel: '2025-11-02',
    detected: '2025-11-18',
  },
  {
    id: 'cd6',
    type: 'Subsidence / Land Shift',
    description: 'Ground elevation change of up to 0.4m detected over a localized area following the monsoon season. Geology department informed for ground verification.',
    confidence: 58,
    ulpin: 'CH-CHD-SE-05839271',
    status: 'dismissed',
    beforeTone: 'bg-blue-200',
    afterTone: 'bg-slate-300',
    beforeLabel: '2025-07-01',
    afterLabel: '2025-10-19',
    detected: '2025-10-21',
  },
]

function ChangeCard({ entry }: { entry: ChangeEntry }) {
  const [localStatus, setLocalStatus] = useState<ChangeEntry['status']>(entry.status)

  const handleInvestigate = () => {
    setLocalStatus('investigating')
  }

  const handleDismiss = () => {
    setLocalStatus('dismissed')
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 gap-2 p-5 pb-3">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Before</span>
          <div className={`h-40 rounded-lg ${entry.beforeTone} relative overflow-hidden`}>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/10 to-transparent p-2">
              <span className="text-[10px] font-medium text-black/60">{entry.beforeLabel}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-16 h-px bg-black/20 rotate-45" />
              <div className="w-16 h-px bg-black/20 -rotate-45" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">After</span>
          <div className={`h-40 rounded-lg ${entry.afterTone} relative overflow-hidden`}>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/10 to-transparent p-2">
              <span className="text-[10px] font-medium text-black/60">{entry.afterLabel}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-16 h-px bg-black/20 rotate-45" />
              <div className="w-16 h-px bg-black/20 -rotate-45" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{entry.type}</span>
            <StatusBadge status={localStatus} />
          </div>
          <span className="font-mono text-[11px] text-slate-400">{entry.ulpin}</span>
        </div>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{entry.description}</p>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Confidence</span>
            <span className="font-semibold text-slate-900">{entry.confidence}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${entry.confidence >= 80 ? 'bg-red-500' : entry.confidence >= 65 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${entry.confidence}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleInvestigate}
            disabled={localStatus === 'confirmed' || localStatus === 'dismissed'}
          >
            <Eye className="w-3.5 h-3.5" />
            {localStatus === 'investigating' && entry.status !== 'investigating' ? 'Investigating' : 'Investigate'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleDismiss}
            disabled={localStatus === 'dismissed'}
          >
            Dismiss
          </Button>
        </div>
        {localStatus === 'investigating' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <ShieldQuestion className="w-3.5 h-3.5" />
            Referred to field verification — {entry.detected}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChangeDetection() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'investigating' | 'confirmed' | 'dismissed'>('all')

  const filtered = mockChanges.filter(c => {
    const matchesQuery = c.ulpin.toLowerCase().includes(query.toLowerCase()) ||
      c.type.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || c.status === filter
    return matchesQuery && matchesFilter
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Satellite Change Detection</h1>
        <p className="text-sm text-slate-500 mt-1">Automated analysis of satellite imagery to detect changes in land use and occupancy</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scans" value={1247} icon={Satellite} iconColor="text-blue-600" change="+340 this month" changeType="up" />
        <StatCard title="Changes Detected" value={89} icon={TriangleAlert} iconColor="text-amber-600" change="+12 since last scan" changeType="up" />
        <StatCard title="Under Investigation" value={23} icon={ShieldQuestion} iconColor="text-orange-600" change="4 high priority" changeType="neutral" />
        <StatCard title="Confirmed" value={45} icon={CheckCircle2} iconColor="text-emerald-600" change="6 resolved this week" changeType="up" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ULPIN or type..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'new', 'investigating', 'confirmed', 'dismissed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-gov-600 text-white border-gov-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(entry => (
          <ChangeCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
