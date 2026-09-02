import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ClipboardList,
  Shield,
  Home,
  Satellite,
  Mountain,
  Map as MapIcon,
} from 'lucide-react'
import parcels from '@/data/parcels'
import { searchParcels } from '@/data/parcels'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Parcel } from '@/types'

interface LayerConfig {
  id: string
  label: string
  checked: boolean
}

const defaultCoreLayers: LayerConfig[] = [
  { id: 'cadastral', label: 'Cadastral Parcels', checked: true },
  { id: 'ulpin', label: 'ULPIN', checked: true },
  { id: 'ror', label: 'Record of Rights', checked: true },
  { id: 'registration', label: 'Registration', checked: true },
  { id: 'encumbrance', label: 'Encumbrance', checked: true },
  { id: 'masterplan', label: 'Master Plan', checked: true },
  { id: 'landuse', label: 'Land Use / Zoning', checked: true },
]

const defaultAdditionalLayers: LayerConfig[] = [
  { id: 'tax', label: 'Property Tax', checked: false },
  { id: 'utilities', label: 'Utilities', checked: false },
  { id: 'roads', label: 'Roads', checked: false },
  { id: 'environment', label: 'Environmental Zones', checked: false },
  { id: 'restricted', label: 'Restricted Areas', checked: false },
]

const baseLayers = [
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'streets', label: 'Streets', icon: MapIcon },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
]

function getLandUseColor(landUse: string): string {
  const colors: Record<string, string> = {
    residential: '#3b82f6',
    commercial: '#f59e0b',
    agricultural: '#22c55e',
    industrial: '#8b5cf6',
    institutional: '#06b6d4',
    forest: '#166534',
    water: '#0ea5e9',
    mixed: '#ec4899',
  }
  return colors[landUse] || '#6b7280'
}

export default function GISExplorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [baseLayer, setBaseLayer] = useState('satellite')
  const [coreLayers, setCoreLayers] = useState(defaultCoreLayers)
  const [additionalLayers, setAdditionalLayers] = useState(defaultAdditionalLayers)
  const [showCoreLayers, setShowCoreLayers] = useState(true)
  const [showAdditionalLayers, setShowAdditionalLayers] = useState(false)
  const [mapZoom, setMapZoom] = useState(7)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchParcels(searchQuery).slice(0, 8)
  }, [searchQuery])

  const toggleCoreLayer = useCallback((id: string) => {
    setCoreLayers(prev => prev.map(l => (l.id === id ? { ...l, checked: !l.checked } : l)))
  }, [])

  const toggleAdditionalLayer = useCallback((id: string) => {
    setAdditionalLayers(prev => prev.map(l => (l.id === id ? { ...l, checked: !l.checked } : l)))
  }, [])

  const handleSelectParcel = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setShowSearchResults(false)
  }, [])

  const handleResultClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setSearchQuery('')
    setShowSearchResults(false)
    setMapZoom(12)
  }, [])

  const handleMapMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y })
  }, [mapOffset])

  const handleMapMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setMapOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [isDragging, dragStart])

  const handleMapMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const zoomIn = () => setMapZoom(z => Math.min(z + 1, 18))
  const zoomOut = () => setMapZoom(z => Math.max(z - 1, 3))

  const getParcelScreenPos = useCallback((parcel: Parcel) => {
    const mapCenter = { lat: 10.5, lng: 78.5 }
    const scale = Math.pow(2, mapZoom - 3) * 40
    const x = (parcel.coordinates.lng - mapCenter.lng) * scale + 400 + mapOffset.x
    const y = (mapCenter.lat - parcel.coordinates.lat) * scale + 250 + mapOffset.y
    return { x, y }
  }, [mapZoom, mapOffset])

  const visibleParcels = useMemo(() => {
    return parcels.map(p => ({
      ...p,
      pos: getParcelScreenPos(p),
    })).filter(p =>
      p.pos.x > -100 && p.pos.x < 1200 && p.pos.y > -100 && p.pos.y < 700
    )
  }, [getParcelScreenPos])

  const baseLayerBg = useMemo(() => {
    if (baseLayer === 'satellite') return 'from-emerald-900 via-teal-800 to-cyan-900'
    if (baseLayer === 'terrain') return 'from-amber-700 via-yellow-600 to-emerald-700'
    return 'from-slate-200 via-slate-300 to-slate-200'
  }, [baseLayer])

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 flex bg-slate-100 z-40" style={{ top: 0 }}>
      {/* Left Sidebar */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-lg">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-gov-600" />
            <span className="text-sm font-semibold text-slate-900">Layer Controls</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search by ULPIN, Survey Number, Owner..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearchResults(false) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {searchResults.map(parcel => (
                <button
                  key={parcel.id}
                  onClick={() => handleResultClick(parcel)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                >
                  <p className="text-xs font-mono text-gov-600">{parcel.ulpin}</p>
                  <p className="text-sm text-slate-900 mt-0.5">{parcel.village}, {parcel.district}</p>
                  <p className="text-xs text-slate-500">{parcel.ownerName} · {parcel.area} {parcel.areaUnit}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Base Layer */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Base Layer</p>
            <div className="space-y-1">
              {baseLayers.map(bl => (
                <label
                  key={bl.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    baseLayer === bl.id ? 'bg-gov-50 text-gov-700' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name="baseLayer"
                    checked={baseLayer === bl.id}
                    onChange={() => setBaseLayer(bl.id)}
                    className="w-3.5 h-3.5 text-gov-600 focus:ring-gov-500"
                  />
                  <bl.icon className="w-4 h-4" />
                  <span className="text-sm">{bl.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Core Layers */}
          <div>
            <button
              onClick={() => setShowCoreLayers(!showCoreLayers)}
              className="flex items-center gap-1.5 w-full text-left mb-2"
            >
              {showCoreLayers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Core Governance Layers</p>
            </button>
            {showCoreLayers && (
              <div className="space-y-1 ml-2">
                {coreLayers.map(layer => (
                  <label key={layer.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={layer.checked}
                      onChange={() => toggleCoreLayer(layer.id)}
                      className="w-3.5 h-3.5 rounded text-gov-600 focus:ring-gov-500"
                    />
                    {layer.checked ? <Eye className="w-3.5 h-3.5 text-gov-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={cn('text-sm', layer.checked ? 'text-slate-700' : 'text-slate-400')}>{layer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Additional Layers */}
          <div>
            <button
              onClick={() => setShowAdditionalLayers(!showAdditionalLayers)}
              className="flex items-center gap-1.5 w-full text-left mb-2"
            >
              {showAdditionalLayers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Additional Layers</p>
            </button>
            {showAdditionalLayers && (
              <div className="space-y-1 ml-2">
                {additionalLayers.map(layer => (
                  <label key={layer.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={layer.checked}
                      onChange={() => toggleAdditionalLayer(layer.id)}
                      className="w-3.5 h-3.5 rounded text-gov-600 focus:ring-gov-500"
                    />
                    {layer.checked ? <Eye className="w-3.5 h-3.5 text-gov-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={cn('text-sm', layer.checked ? 'text-slate-700' : 'text-slate-400')}>{layer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">{parcels.length} parcels loaded · Zoom {mapZoom}x</p>
        </div>
      </div>

      {/* Map Area */}
      <div
        className={cn('flex-1 relative overflow-hidden cursor-grab select-none bg-gradient-to-br', baseLayerBg)}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`v${i}`} x1={`${(i * 80 + mapOffset.x) % 800}`} y1="0" x2={`${(i * 80 + mapOffset.x) % 800}`} y2="100%" stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i * 80 + mapOffset.y) % 600}`} x2="100%" y2={`${(i * 80 + mapOffset.y) % 600}`} stroke="white" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Latitude/Longitude labels */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={`lat${i}`} className="absolute text-[9px] text-white/30 font-mono" style={{ left: 8, top: `${(i + 1) * 8}%` }}>
              {(15 - i * 0.8).toFixed(1)}°N
            </span>
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={`lng${i}`} className="absolute text-[9px] text-white/30 font-mono" style={{ top: 8, left: `${(i + 1) * 6}%` }}>
              {(74 + i * 0.5).toFixed(1)}°E
            </span>
          ))}
        </div>

        {/* Tamil Nadu label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-white/10 text-6xl font-bold tracking-[0.3em]">TAMIL NADU</span>
        </div>

        {/* Parcel markers */}
        <div className="absolute inset-0">
          {visibleParcels.map(parcel => {
            const isSelected = selectedParcel?.id === parcel.id
            const color = getLandUseColor(parcel.landUse)
            return (
              <div
                key={parcel.id}
                className={cn(
                  'absolute transition-all duration-200 cursor-pointer group',
                  isSelected && 'z-20'
                )}
                style={{ left: parcel.pos.x, top: parcel.pos.y, transform: 'translate(-50%, -50%)' }}
                onClick={e => { e.stopPropagation(); handleSelectParcel(parcel) }}
              >
                {/* Parcel boundary rectangle */}
                <div
                  className={cn(
                    'w-16 h-12 rounded border-2 transition-all duration-200',
                    isSelected
                      ? 'border-blue-400 bg-blue-400/30 shadow-lg shadow-blue-500/20 scale-110'
                      : 'border-white/30 bg-white/10 hover:border-white/60 hover:bg-white/20'
                  )}
                />

                {/* Label */}
                <div
                  className={cn(
                    'absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-medium transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-black/60 text-white/90 group-hover:bg-black/80'
                  )}
                >
                  {parcel.surveyNumber}
                </div>

                {/* ULPIN tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-slate-900 text-white text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {parcel.ulpin}
                </div>

                {/* Color dot indicator */}
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/50"
                  style={{ backgroundColor: color }}
                />
              </div>
            )
          })}
        </div>

        {/* Map controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-1 z-10">
          <button onClick={zoomIn} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomOut} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setMapOffset({ x: 0, y: 0 }); setMapZoom(7) }} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-10">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Land Use</p>
          <div className="space-y-1.5">
            {[
              { label: 'Residential', color: '#3b82f6' },
              { label: 'Commercial', color: '#f59e0b' },
              { label: 'Agricultural', color: '#22c55e' },
              { label: 'Industrial', color: '#8b5cf6' },
              { label: 'Forest', color: '#166534' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scale bar */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-1 z-10">
          <div className="h-0.5 w-24 bg-white/70" />
          <span className="text-[9px] text-white/70 font-mono">
            {mapZoom >= 10 ? '5 km' : mapZoom >= 7 ? '50 km' : '200 km'}
          </span>
        </div>

        {/* Coordinates display */}
        <div className="absolute left-4 top-4 bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-mono px-2 py-1 rounded z-10">
          Center: 10.5000°N, 78.5000°E · Zoom: {mapZoom}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={cn(
          'w-[360px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-lg transition-transform duration-300',
          selectedParcel ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}
      >
        {selectedParcel && (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Parcel Selected</p>
                <p className="text-xs text-slate-500 mt-0.5">Detailed information</p>
              </div>
              <button
                onClick={() => setSelectedParcel(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ULPIN</p>
                <p className="text-lg font-mono font-bold text-gov-700 mt-0.5">{selectedParcel.ulpin}</p>
              </div>

              <div className="p-4 space-y-3">
                <InfoRow label="Survey Number" value={selectedParcel.surveyNumber} />
                <InfoRow label="Village" value={selectedParcel.village} />
                <InfoRow label="District" value={selectedParcel.district} />
                <InfoRow label="Area" value={`${selectedParcel.area} ${selectedParcel.areaUnit}`} />
                <InfoRow label="Land Use" value={<StatusBadge status={selectedParcel.landUse} />} isReact />
                <InfoRow label="Ownership Status" value={<StatusBadge status={selectedParcel.ownershipStatus} />} isReact />
                <InfoRow label="Encumbrance Status" value={<StatusBadge status={selectedParcel.encumbranceStatus} />} isReact />
                <InfoRow label="Dispute Status" value={<StatusBadge status={selectedParcel.disputeStatus} />} isReact />
                <InfoRow label="Building Permission" value={<StatusBadge status={selectedParcel.buildingPermission} />} isReact />
                <InfoRow label="Property Tax Status" value={<StatusBadge status={selectedParcel.propertyTaxStatus} />} isReact />
                <InfoRow label="Owner" value={selectedParcel.ownerName} />
                <InfoRow label="Patta Number" value={selectedParcel.pattaNumber} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <Link to={`/parcel/${selectedParcel.id}`} className="block">
                <Button variant="primary" size="md" className="w-full">
                  <Home className="w-4 h-4" />
                  View Complete Parcel
                </Button>
              </Link>
              <Button variant="secondary" size="md" className="w-full">
                <Shield className="w-4 h-4" />
                Verify Ownership
              </Button>
              <Button variant="secondary" size="md" className="w-full">
                <FileText className="w-4 h-4" />
                View Documents
              </Button>
              <Button variant="secondary" size="md" className="w-full">
                <ClipboardList className="w-4 h-4" />
                Start Service Request
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, isReact }: { label: string; value: React.ReactNode; isReact?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      {isReact ? value : <span className="text-xs font-medium text-slate-900">{value}</span>}
    </div>
  )
}
