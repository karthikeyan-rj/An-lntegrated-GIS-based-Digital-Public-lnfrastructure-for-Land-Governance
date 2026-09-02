import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  Map as MapIcon,
  Satellite,
  Home,
  FileText,
  Shield,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { searchParcels } from '@/data/parcels'
import localParcels from '@/data/parcels'
import type { Parcel } from '@/types'
import 'leaflet/dist/leaflet.css'

interface FeatureProps {
  properties: Record<string, unknown>
}

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

function toParcel(feature: FeatureProps & { id?: string }): Parcel | null {
  const p = feature.properties || {}
  if (!p.ulpin) return null
  const props = p as Record<string, string | number>
  return {
    id: (feature.id as string) || String(p.id) || String(p.ulpin),
    ulpin: String(p.ulpin),
    surveyNumber: String(p.surveyNumber || '-'),
    village: String(p.village || 'Demo Village'),
    taluk: String(p.taluk || '-'),
    district: String(p.district || '-'),
    state: String(p.state || '-'),
    area: Number(p.area || 0),
    areaUnit: (p.areaUnit as Parcel['areaUnit']) || 'acres',
    coordinates: { lat: 0, lng: 0 },
    landUse: (p.landUse as Parcel['landUse']) || 'residential',
    zoning: 'R1',
    ownershipStatus: (p.ownershipStatus as Parcel['ownershipStatus']) || 'verified',
    ownerName: 'Demo Owner',
    ownerFatherName: '',
    ownershipType: 'self',
    encumbranceStatus: 'clear',
    disputeStatus: 'none',
    propertyTaxStatus: 'paid',
    buildingPermission: 'approved',
    pattaNumber: String(p.pattaNumber || '-'),
    classification: String(p.classification || '-'),
    verificationStatus: 'digitally_verified',
    lastUpdated: '',
    registeredDate: '',
    restrictions: [],
    utilities: { electricity: true, water: true, sewerage: true, gas: false, telecom: true },
  }
}

/** Build a GeoJSON polygon feature from a local Parcel (uses its real coordinates). */
function parcelToFeature(p: Parcel): GeoJSON.Feature<GeoJSON.Polygon> {
  const half = 0.0006
  const lat = p.coordinates?.lat ?? 10.5
  const lng = p.coordinates?.lng ?? 78.5
  return {
    type: 'Feature',
    id: p.id,
    properties: {
      id: p.id,
      ulpin: p.ulpin,
      surveyNumber: p.surveyNumber,
      village: p.village,
      district: p.district,
      landUse: p.landUse,
      area: p.area,
      areaUnit: p.areaUnit,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - half, lat - half],
          [lng - half, lat + half],
          [lng + half, lat + half],
          [lng + half, lat - half],
          [lng - half, lat - half],
        ],
      ],
    },
  }
}

/** Approximate the center of a GeoJSON geometry (lat/lng). */
function featureCenter(geometry: GeoJSON.Geometry | undefined): { lat: number; lng: number } | null {
  if (!geometry || geometry.type === 'GeometryCollection') return null
  if (geometry.type === 'Point') {
    const [x, y] = geometry.coordinates as [number, number]
    return { lat: y, lng: x }
  }
  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    const first = (geometry.coordinates as Array<[number, number]>)[0]
    return first ? { lat: first[1], lng: first[0] } : null
  }
  const ring = (geometry.coordinates as number[][][][])[0]
  if (!ring || !ring.length) return null
  let latSum = 0
  let lngSum = 0
  for (const pt of ring[0] as Array<[number, number]>) {
    latSum += pt[1]
    lngSum += pt[0]
  }
  const n = ring[0].length
  return { lat: latSum / n, lng: lngSum / n }
}

export default function GISExplorer() {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const geoJSONRef = useRef<L.GeoJSON | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [geoFeatures, setGeoFeatures] = useState<GeoJSON.Feature<GeoJSON.Geometry>[]>([])
  const [demoParcels, setDemoParcels] = useState<Parcel[]>([])
  const [baseLayer, setBaseLayer] = useState<'osm' | 'satellite'>('osm')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [coreLayers, setCoreLayers] = useState([
    { id: 'parcelBounds', label: 'Parcel Boundaries', checked: true },
    { id: 'ulpin', label: 'ULPIN Labels', checked: true },
  ])
  const [governanceLayers, setGovernanceLayers] = useState([
    { id: 'landUse', label: 'Land Use / Zoning', checked: false },
    { id: 'buildingPermissions', label: 'Building Permissions', checked: false },
    { id: 'restrictions', label: 'Restrictions & Zones', checked: false },
    { id: 'disputes', label: 'Disputes', checked: false },
  ])
  const [infraLayers, setInfraLayers] = useState([
    { id: 'roads', label: 'Roads', checked: false },
    { id: 'utilities', label: 'Utilities', checked: false },
  ])
  const [showCoreLayers, setShowCoreLayers] = useState(true)
  const [showGovernanceLayers, setShowGovernanceLayers] = useState(false)
  const [showInfraLayers, setShowInfraLayers] = useState(false)

  // Load parcel GeoJSON from backend (/api/parcels), fall back to local demo data.
  useEffect(() => {
    let cancelled = false
    async function loadParcels() {
      setLoading(true)
      let parcels: Parcel[] = []
      let features: GeoJSON.Feature<GeoJSON.Geometry>[] = []
      try {
        const fc = await api.parcels()
        if (cancelled) return
        features = fc.features as unknown as GeoJSON.Feature<GeoJSON.Geometry>[]
        // Resolve each feature's parcel `coordinates` from its geometry for the
        // info panel's zoom-to behavior.
        parcels = fc.features
          .map((f) => {
            const parcel = toParcel(f as never)
            if (parcel) {
              const center = featureCenter(f.geometry)
              if (center) parcel.coordinates = center
            }
            return parcel
          })
          .filter((p): p is Parcel => !!p)
      } catch (err) {
        if (cancelled) return
        // Backend unreachable — use local demo parcels (with real lat/lng).
        setLoadError('Backend API unreachable — showing local DEMO/prototype parcels only.')
        parcels = localParcels
        features = localParcels.map(parcelToFeature)
      }
      if (cancelled) return
      setDemoParcels(parcels.length ? parcels : localParcels)
      setGeoFeatures(features.length ? features : localParcels.map(parcelToFeature))
      setLoading(false)
    }
    loadParcels()
    return () => {
      cancelled = true
    }
  }, [])

  const parcelFeatureCollection = useMemo<GeoJSON.FeatureCollection>(() => {
    return { type: 'FeatureCollection', features: geoFeatures }
  }, [geoFeatures])

  // Initialize Leaflet map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = L.map(mapContainerRef.current, {
      center: [10.5, 78.5],
      zoom: 7,
      zoomControl: false,
    })
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

    const baseLayers: Record<string, L.TileLayer> = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
      satellite: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics' }
      ),
    }
    baseLayers.osm.addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle base layer switch.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const baseLayers: Record<'osm' | 'satellite', L.TileLayer> = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }),
      satellite: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
      ),
    }
    map.eachLayer((l) => {
      if (l instanceof L.TileLayer) map.removeLayer(l)
    })
    baseLayers[baseLayer].addTo(map)
  }, [baseLayer])

  // Render GeoJSON parcels + handle selection.
  useEffect(() => {
    const map = mapRef.current
    if (!map || parcelFeatureCollection.features.length === 0) return

    if (geoJSONRef.current) {
      map.removeLayer(geoJSONRef.current)
      geoJSONRef.current = null
    }

    const layer = L.geoJSON(parcelFeatureCollection, {
      style: () => ({
        color: '#1d4ed8',
        weight: 1.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.25,
      }),
      onEachFeature: (feature, lyr) => {
        const p = (feature.properties || {}) as Record<string, unknown>
        const label = String(p.surveyNumber || '')
        const ulpin = String(p.ulpin || '')
        lyr.bindTooltip(`${label}<br/><small>${ulpin}</small>`, {
          sticky: true,
          direction: 'top',
        })
        lyr.on('click', () => {
          const parcel = toParcel(feature as never)
          if (parcel) {
            setSelectedParcel(parcel)
            const poly = lyr as L.Polyline
            if (poly.getBounds) {
              map.flyTo(poly.getBounds().getCenter(), Math.max(map.getZoom(), 13), { duration: 0.6 })
            }
          }
        })
      },
    })
    layer.addTo(map)
    geoJSONRef.current = layer

    if (!map.getBounds().isValid()) {
      map.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 11 })
    }
  }, [parcelFeatureCollection])

  // Highlight / reset the selected parcel.
  useEffect(() => {
    const map = mapRef.current
    const layer = geoJSONRef.current
    if (!map || !layer) return
    layer.setStyle(() => ({
      color: '#1d4ed8',
      weight: 1.5,
      fillColor: '#3b82f6',
      fillOpacity: 0.25,
    }))
    if (!selectedParcel) return
    layer.eachLayer((lyr) => {
      const styled = lyr as L.Polyline & { feature?: GeoJSON.Feature }
      const props = (styled.feature && styled.feature.properties ? styled.feature.properties : {}) as Record<string, unknown>
      if (String(props.id) === selectedParcel.id || String(props.ulpin) === selectedParcel.ulpin) {
        styled.setStyle({
          color: '#dc2626',
          weight: 3,
          fillColor: '#ef4444',
          fillOpacity: 0.5,
        })
        styled.bringToFront()
      }
    })
  }, [selectedParcel])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchParcels(searchQuery).slice(0, 8)
  }, [searchQuery])

  const toggleLayer = useCallback((setter: React.Dispatch<React.SetStateAction<{ id: string; label: string; checked: boolean }[]>>) => {
    return (id: string) => setter((prev) => prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)))
  }, [])

  const handleResultClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setSearchQuery('')
    setShowSearchResults(false)
    const map = mapRef.current
    if (map) {
      map.flyTo([parcel.coordinates.lat || 10.5, parcel.coordinates.lng || 78.5], 13, { duration: 0.6 })
    }
  }, [])

  const zoomToParcel = useCallback((parcel: Parcel) => {
    const map = mapRef.current
    if (map && parcel.coordinates.lat) {
      map.flyTo([parcel.coordinates.lat, parcel.coordinates.lng], 14, { duration: 0.6 })
    }
  }, [])

  // Placeholder governance layers (not drawn with real data — labeled DEMO).
  const enableUnavailableLayer = useCallback(() => {
    setLoadError('This governance layer is a DEMO placeholder. Real department data is not connected yet.')
  }, [])

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-190px)] min-h-[560px] rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      {/* Left Sidebar — Layer controls */}
      <div className="w-full lg:w-[280px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
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
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search by ULPIN, Survey No..."
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
              {searchResults.map((parcel) => (
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
              {(
                [
                  { id: 'osm', label: 'OpenStreetMap', icon: MapIcon },
                  { id: 'satellite', label: 'Satellite', icon: Satellite },
                ] as const
              ).map((bl) => (
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Core Layers</p>
            </button>
            {showCoreLayers && (
              <div className="space-y-1 ml-2">
                {coreLayers.map((layer) => (
                  <label key={layer.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={layer.checked}
                      onChange={() => setCoreLayers((prev) => prev.map((l) => (l.id === layer.id ? { ...l, checked: !l.checked } : l)))}
                      className="w-3.5 h-3.5 rounded text-gov-600 focus:ring-gov-500"
                    />
                    {layer.checked ? <Eye className="w-3.5 h-3.5 text-gov-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={cn('text-sm', layer.checked ? 'text-slate-700' : 'text-slate-400')}>{layer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Governance Layers */}
          <div>
            <button
              onClick={() => setShowGovernanceLayers(!showGovernanceLayers)}
              className="flex items-center gap-1.5 w-full text-left mb-2"
            >
              {showGovernanceLayers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Governance</p>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">DEMO</span>
            </button>
            {showGovernanceLayers && (
              <div className="space-y-1 ml-2">
                {governanceLayers.map((layer) => (
                  <label key={layer.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={layer.checked}
                      onChange={() => { toggleLayer(setGovernanceLayers)(layer.id); enableUnavailableLayer() }}
                      className="w-3.5 h-3.5 rounded text-gov-600 focus:ring-gov-500"
                    />
                    {layer.checked ? <Eye className="w-3.5 h-3.5 text-gov-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={cn('text-sm', layer.checked ? 'text-slate-700' : 'text-slate-400')}>{layer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Layers */}
          <div>
            <button
              onClick={() => setShowInfraLayers(!showInfraLayers)}
              className="flex items-center gap-1.5 w-full text-left mb-2"
            >
              {showInfraLayers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Infrastructure</p>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">DEMO</span>
            </button>
            {showInfraLayers && (
              <div className="space-y-1 ml-2">
                {infraLayers.map((layer) => (
                  <label key={layer.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={layer.checked}
                      onChange={() => { toggleLayer(setInfraLayers)(layer.id); enableUnavailableLayer() }}
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

        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 text-center">
            {demoParcels.length} demo parcels · OSM + Esri tiles
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Loading / error overlays */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[500]">
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading parcels from backend...</span>
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg shadow-md max-w-[90%]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-1 text-amber-600 hover:text-amber-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* DEMO badge */}
        <div className="absolute left-3 top-3 z-[500] px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-100 text-[10px] font-semibold backdrop-blur-sm">
          DEMO / PROTOTYPE PARCELS
        </div>

        {/* Legend */}
        <div className="absolute left-3 bottom-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-[500]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Land Use</p>
          <div className="space-y-1.5">
            {[
              { label: 'Residential', color: '#3b82f6' },
              { label: 'Commercial', color: '#f59e0b' },
              { label: 'Agricultural', color: '#22c55e' },
              { label: 'Industrial', color: '#8b5cf6' },
              { label: 'Forest', color: '#166534' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — selected parcel */}
      <div
        className={cn(
          'w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0',
          selectedParcel ? 'block' : 'hidden'
        )}
      >
        {selectedParcel && (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Parcel Selected</p>
                <p className="text-xs text-slate-500 mt-0.5">DEMO / PROTOTYPE DATA</p>
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
                <InfoRow label="Owner" value="Demo Owner" />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <Link to={`/parcel/${selectedParcel.id}`} className="block">
                <Button variant="primary" size="md" className="w-full">
                  <Home className="w-4 h-4" />
                  View Complete Parcel
                </Button>
              </Link>
              <Button variant="secondary" size="md" className="w-full" onClick={() => zoomToParcel(selectedParcel)}>
                <MapIcon className="w-4 h-4" />
                Zoom to Parcel
              </Button>
              <Button variant="secondary" size="md" className="w-full">
                <Shield className="w-4 h-4" />
                Verify Ownership
              </Button>
              <Button variant="secondary" size="md" className="w-full">
                <FileText className="w-4 h-4" />
                View Documents
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
