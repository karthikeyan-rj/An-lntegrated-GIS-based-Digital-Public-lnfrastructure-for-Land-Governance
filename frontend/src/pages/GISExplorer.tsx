import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  MapPin,
  AlertTriangle,
  Loader2,
  Building2,
  Landmark,
  Scale,
  Gavel,
  Road,
  Wrench,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { searchParcels, getParcelById } from '@/data/parcels'
import localParcels from '@/data/parcels'
import type { Parcel } from '@/types'
import 'leaflet/dist/leaflet.css'

interface FeatureProps {
  properties: Record<string, unknown>
}

const ADMIN_STYLE = {
  state: { color: '#334155', weight: 2, dashArray: undefined as string | undefined, fill: false },
  districts: { color: '#64748b', weight: 1.4, dashArray: '6 3' as string, fill: false },
  taluks: { color: '#94a3b8', weight: 0.8, dashArray: '2 3' as string, fill: false },
}

// Minimum zoom at which each admin layer becomes visible.
const ADMIN_MIN_ZOOM: Record<'districts' | 'taluks', number> = { districts: 7, taluks: 10 }

// Minimum zoom at which per-parcel ULPIN labels are shown (parcels are tiny).
const ULPIN_MIN_ZOOM = 12

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
  const props = p as Record<string, string | number | string[] | { electricity?: boolean; water?: boolean; sewerage?: boolean; gas?: boolean; telecom?: boolean }>
  const utilities = (props.utilities as { electricity?: boolean; water?: boolean; sewerage?: boolean; gas?: boolean; telecom?: boolean }) || {}
  return {
    id: (feature.id as string) || String(p.id) || String(p.ulpin),
    ulpin: String(p.ulpin),
    surveyNumber: String(p.surveyNumber || '-'),
    village: String(props.village || '-'),
    taluk: String(props.taluk || '-'),
    district: String(props.district || '-'),
    state: String(props.state || '-'),
    area: Number(props.area || 0),
    areaUnit: (props.areaUnit as Parcel['areaUnit']) || 'acres',
    coordinates: { lat: 0, lng: 0 },
    landUse: (props.landUse as Parcel['landUse']) || 'residential',
    zoning: (props.zoning as Parcel['zoning']) || 'R1',
    ownershipStatus: (props.ownershipStatus as Parcel['ownershipStatus']) || 'verified',
    ownerName: String(props.ownerName || 'Demo Owner'),
    ownerFatherName: '',
    ownershipType: 'self',
    encumbranceStatus: (props.encumbranceStatus as Parcel['encumbranceStatus']) || 'clear',
    disputeStatus: (props.disputeStatus as Parcel['disputeStatus']) || 'none',
    propertyTaxStatus: (props.propertyTaxStatus as Parcel['propertyTaxStatus']) || 'paid',
    buildingPermission: (props.buildingPermission as Parcel['buildingPermission']) || 'none',
    pattaNumber: String(props.pattaNumber || '-'),
    classification: String(props.classification || '-'),
    verificationStatus: (props.verificationStatus as Parcel['verificationStatus']) || 'digitally_verified',
    lastUpdated: '',
    registeredDate: '',
    restrictions: (props.restrictions as string[]) || [],
    utilities: { electricity: !!utilities.electricity, water: !!utilities.water, sewerage: !!utilities.sewerage, gas: !!utilities.gas, telecom: !!utilities.telecom },
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
      taluk: p.taluk,
      state: p.state,
      landUse: p.landUse,
      zoning: p.zoning,
      area: p.area,
      areaUnit: p.areaUnit,
      ownershipStatus: p.ownershipStatus,
      ownerName: p.ownerName,
      buildingPermission: p.buildingPermission,
      disputeStatus: p.disputeStatus,
      restrictions: p.restrictions,
      utilities: p.utilities,
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
  const coords: any = geometry.coordinates
  const ring = coords && coords[0]
  if (!ring || !ring.length) return null
  let latSum = 0
  let lngSum = 0
  for (const pt of ring) {
    const la = typeof pt?.[1] === 'number' ? pt[1] : NaN
    const lo = typeof pt?.[0] === 'number' ? pt[0] : NaN
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
    latSum += la
    lngSum += lo
  }
  const n = ring.length
  const lat = latSum / n
  const lng = lngSum / n
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/** Ray-casting point-in-polygon. `ring` = array of [lng, lat] positions (well-formed GeoJSON). */
function pointInRing(lng: number, lat: number, ring: any): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// `coords` is Polygon.coordinates = [ [ring], [hole], ... ]
function pointInPolygon(lng: number, lat: number, coords: any): boolean {
  const outer = coords && coords[0]
  if (!outer || outer.length === 0) return false
  if (!pointInRing(lng, lat, outer)) return false
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(lng, lat, coords[i])) return false
  }
  return true
}

function geometryContainsPoint(geometry: any, lng: number, lat: number): boolean {
  if (!geometry) return false
  if (geometry.type === 'Polygon') return pointInPolygon(lng, lat, geometry.coordinates)
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly: any) => pointInPolygon(lng, lat, poly))
  }
  return false
}

/** Compute [ [minLng,minLat],[maxLng,maxLat] ] bounds for a feature. */
function featureBounds(f: any): [[number, number], [number, number]] {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  const walk = (c: any) => {
    if (typeof c[0] === 'number') {
      const x = c[0]
      const y = c[1]
      if (x < minLng) minLng = x
      if (x > maxLng) maxLng = x
      if (y < minLat) minLat = y
      if (y > maxLat) maxLat = y
    } else {
      c.forEach(walk)
    }
  }
  walk(f && f.geometry ? f.geometry.coordinates : null)
  if (minLng === Infinity) return [[0, 0], [0, 0]]
  return [[minLng, minLat], [maxLng, maxLat]]
}

interface LocContext {
  state: string
  district: string | null
  taluk: string | null
  lat: number
  lng: number
  type: 'location' | 'district' | 'taluk'
}

interface BoundaryData {
  state: GeoJSON.FeatureCollection | null
  districts: GeoJSON.FeatureCollection | null
  taluks: GeoJSON.FeatureCollection | null
}

type SearchResult =
  | { type: 'parcel'; parcel: Parcel }
  | { type: 'district'; name: string; feature: GeoJSON.Feature }
  | { type: 'taluk'; name: string; district: string; feature: GeoJSON.Feature }

type OverlayKey = 'landUse' | 'buildingPermissions' | 'restrictions' | 'disputes' | 'roads' | 'utilities'

function buildDivIcon(html: string, size = 22): L.DivIcon {
  return L.divIcon({
    className: 'ls-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function GISExplorer() {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const geoJSONRef = useRef<L.GeoJSON | null>(null)
  const labelLayerRef = useRef<L.LayerGroup | null>(null)
  const overlayRefs = useRef<Record<OverlayKey, L.LayerGroup | null>>({
    landUse: null, buildingPermissions: null, restrictions: null, disputes: null, roads: null, utilities: null,
  })
  const stateLayerRef = useRef<L.GeoJSON | null>(null)
  const districtsLayerRef = useRef<L.GeoJSON | null>(null)
  const taluksLayerRef = useRef<L.GeoJSON | null>(null)
  const fitDoneRef = useRef(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [locContext, setLocContext] = useState<LocContext | null>(null)
  const [geoFeatures, setGeoFeatures] = useState<GeoJSON.Feature<GeoJSON.Geometry>[]>([])
  const [demoParcels, setDemoParcels] = useState<Parcel[]>([])
  const [boundaries, setBoundaries] = useState<BoundaryData>({ state: null, districts: null, taluks: null })
  const boundariesRef = useRef<BoundaryData>(boundaries)
  useEffect(() => {
    boundariesRef.current = boundaries
  }, [boundaries])
  const [baseLayer, setBaseLayer] = useState<'osm' | 'satellite'>('osm')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [satelliteError, setSatelliteError] = useState(false)
  const [zoom, setZoom] = useState<number>(6)
  const [showAdminLayers, setShowAdminLayers] = useState(true)

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
  const [params] = useSearchParams()

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
        setLoadError('Backend API unreachable — showing local DEMO/prototype parcels only.')
        parcels = localParcels
        features = localParcels.map(parcelToFeature)
      }
      if (cancelled) return
      const withLocal = parcels.length ? parcels : localParcels
      setDemoParcels(withLocal)
      setGeoFeatures(features.length ? features : localParcels.map(parcelToFeature))
      setLoading(false)
    }
    loadParcels()
    return () => {
      cancelled = true
    }
  }, [])

  // Load administrative boundaries (real Tamil Nadu state/district/taluk geometry).
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [state, districts, taluks] = await Promise.all([
          api.geoboundaries('state').catch(() => null),
          api.geoboundaries('districts').catch(() => null),
          api.geoboundaries('taluks').catch(() => null),
        ])
        if (cancelled) return
        setBoundaries({
          state,
          districts,
          taluks,
        })
      } catch {
        if (!cancelled) setLoadError('Could not load administrative boundaries.')
      }
    }
    load()
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
      center: [10.6, 78.5],
      zoom: 6,
      zoomControl: false,
    })
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

    map.on('zoomend', () => {
      setZoom(map.getZoom())
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClick(map, e)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus the map on Tamil Nadu once the real state boundary has loaded.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !boundaries.state || !boundaries.state.features?.length) return
    if (fitDoneRef.current) return
    fitDoneRef.current = true
    const b = featureBounds(boundaries.state.features[0])
    map.fitBounds(L.latLngBounds([b[0][1], b[0][0]], [b[1][1], b[1][0]]), { padding: [20, 20], maxZoom: 8 })
  }, [boundaries.state])

  // Apply zoom-dependent visibility to admin boundary layers.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const settle = () => {
      if (stateLayerRef.current && !map.hasLayer(stateLayerRef.current)) map.addLayer(stateLayerRef.current)
      if (districtsLayerRef.current) {
        if (showAdminLayers && zoom >= ADMIN_MIN_ZOOM.districts) {
          if (!map.hasLayer(districtsLayerRef.current)) map.addLayer(districtsLayerRef.current)
        } else if (map.hasLayer(districtsLayerRef.current)) {
          map.removeLayer(districtsLayerRef.current)
        }
      }
      if (taluksLayerRef.current) {
        if (showAdminLayers && zoom >= ADMIN_MIN_ZOOM.taluks) {
          if (!map.hasLayer(taluksLayerRef.current)) map.addLayer(taluksLayerRef.current)
        } else if (map.hasLayer(taluksLayerRef.current)) {
          map.removeLayer(taluksLayerRef.current)
        }
      }
    }
    settle()
  }, [zoom, boundaries, showAdminLayers])

  // Render admin boundary layers from fetched data.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const removeAll = () => {
      if (stateLayerRef.current) map.removeLayer(stateLayerRef.current)
      if (districtsLayerRef.current) map.removeLayer(districtsLayerRef.current)
      if (taluksLayerRef.current) map.removeLayer(taluksLayerRef.current)
      stateLayerRef.current = districtsLayerRef.current = taluksLayerRef.current = null
    }

    if (boundaries.state) {
      removeAll()
      const layer = L.geoJSON(boundaries.state, {
        style: { ...ADMIN_STYLE.state },
      })
      stateLayerRef.current = layer
      map.addLayer(layer)
    }
    if (boundaries.districts) {
      const layer = L.geoJSON(boundaries.districts, {
        style: { ...ADMIN_STYLE.districts },
        onEachFeature: (feature, lyr) => {
          lyr.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stop(e)
            const name = String(feature.properties?.name || feature.properties?.district || 'District')
            const b = featureBounds(feature)
            if (map) map.flyToBounds(L.latLngBounds([b[0][1], b[0][0]], [b[1][1], b[1][0]]), { duration: 0.5, maxZoom: 11 })
            setSelectedParcel(null)
            setLocContext({ state: 'Tamil Nadu', district: name, taluk: null, lat: e.latlng.lat, lng: e.latlng.lng, type: 'district' })
          })
        },
      })
      districtsLayerRef.current = layer
    }
    if (boundaries.taluks) {
      const layer = L.geoJSON(boundaries.taluks, {
        style: { ...ADMIN_STYLE.taluks },
        onEachFeature: (feature, lyr) => {
          lyr.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stop(e)
            const name = String(feature.properties?.name || feature.properties?.taluk || 'Taluk')
            const district = String(feature.properties?.district || '')
            const b = featureBounds(feature)
            if (map) map.flyToBounds(L.latLngBounds([b[0][1], b[0][0]], [b[1][1], b[1][0]]), { duration: 0.5 })
            setSelectedParcel(null)
            setLocContext({ state: 'Tamil Nadu', district: district || null, taluk: name, lat: e.latlng.lat, lng: e.latlng.lng, type: 'taluk' })
          })
        },
      })
      taluksLayerRef.current = layer
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current, boundaries.state, boundaries.districts, boundaries.taluks])

  // Handle base layer switch (OSM / Satellite), with error fallback for satellite.
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
        { maxZoom: 19, attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics' }
      ),
    }
    map.eachLayer((l) => {
      if (l instanceof L.TileLayer) map.removeLayer(l)
    })
    if (baseLayer === 'satellite') setSatelliteError(false)
    const layer = baseLayers[baseLayer]
    layer.addTo(map)
    layer.on('tileerror', () => {
      if (baseLayer === 'satellite') setSatelliteError(true)
    })
  }, [baseLayer])

  function selectParcel(parcel: Parcel, map?: L.Map | null) {
    setLocContext(null)
    setSelectedParcel(parcel)
    if (map && parcel.coordinates.lat) {
      map.flyTo([parcel.coordinates.lat, parcel.coordinates.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
    }
  }

  // Build raster overlay layers (land-use fill is handled by the parcel GeoJSON style;
  // the marker layers, roads & utilities are separate functional layers).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Parcel GeoJSON layer + ULPIN labels + markers, rebuilt whenever features change.
    if (geoJSONRef.current) map.removeLayer(geoJSONRef.current)
    if (labelLayerRef.current) map.removeLayer(labelLayerRef.current)
    Object.values(overlayRefs.current).forEach((l) => l && map.removeLayer(l))

    if (parcelFeatureCollection.features.length === 0) return

    const landUseActive = governanceLayers.find(l => l.id === 'landUse')?.checked ?? false

    const parcelLayer = L.geoJSON(parcelFeatureCollection, {
      style: (feature) => {
        const lu = String(((feature?.properties || {}) as Record<string, unknown>).landUse || '')
        const fill = landUseActive ? getLandUseColor(lu) : '#3b82f6'
        return {
          color: landUseActive ? getLandUseColor(lu) : '#1d4ed8',
          weight: landUseActive ? 1.5 : 2,
          fillColor: fill,
          fillOpacity: landUseActive ? 0.55 : 0.3,
        }
      },
      onEachFeature: (feature, lyr) => {
        const p = (feature.properties || {}) as Record<string, unknown>
        const label = String(p.surveyNumber || '')
        const ulpin = String(p.ulpin || '')
        lyr.bindTooltip(`${label}<br/><small>${ulpin}</small>`, {
          sticky: true,
          direction: 'top',
        })
        lyr.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stop(e)
          const parcel = toParcel(feature as never)
          if (parcel) {
            const c = featureCenter(feature.geometry)
            if (c) parcel.coordinates = c
            selectParcel(parcel, map)
          }
        })
      },
    })
    parcelLayer.addTo(map)
    geoJSONRef.current = parcelLayer

    // ULPIN label markers (real ULPINs, zoom-filtered to reduce clutter).
    const labelLayer = L.layerGroup()
    parcelFeatureCollection.features.forEach((feature) => {
      const props = (feature.properties || {}) as Record<string, unknown>
      const ulpin = String(props.ulpin || '')
      const c = featureCenter(feature.geometry)
      if (!ulpin || !c) return
      L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: 'ls-ulpin-label',
          html: `<div style="background:rgba(29,78,216,0.85);color:#fff;font-size:10px;line-height:16px;font-family:ui-monospace,monospace;padding:0 6px;border-radius:4px;white-space:nowrap;border:1px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);transform:translateX(-50%)">${ulpin}</div>`,
          iconSize: [0, 0],
        }),
        keyboard: false,
        interactive: false,
      }).addTo(labelLayer)
    })
    labelLayerRef.current = labelLayer

    // Helper to add a clickable marker → selects the parcel.
    const buildMarker = (feature: GeoJSON.Feature, markerHtml: string, tooltip: string) => {
      const c = featureCenter(feature.geometry)
      if (!c) return null
      const parcel = toParcel(feature as never)
      const m = L.marker([c.lat, c.lng], { icon: buildDivIcon(markerHtml), riseOnHover: true })
      m.bindTooltip(tooltip, { direction: 'top' })
      m.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stop(e)
        if (parcel) {
          const cc = featureCenter(feature.geometry)
          if (cc) parcel.coordinates = cc
          selectParcel(parcel, map)
        }
      })
      return m
    }

    // Building Permissions layer.
    const buildingGroup = L.layerGroup()
    parcelFeatureCollection.features.forEach((feature) => {
      const props = (feature.properties || {}) as Record<string, unknown>
      const bp = String(props.buildingPermission || 'none')
      const color = bp === 'approved' ? '#16a34a' : bp === 'pending' ? '#f59e0b' : '#94a3b8'
      const m = buildMarker(feature, `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px #0003"></div>`,
        `Building: ${bp === 'approved' ? 'Approved' : bp === 'pending' ? 'Pending' : 'Not Available'} · ${String(props.ulpin || '')}`)
      if (m) buildingGroup.addLayer(m)
    })
    overlayRefs.current.buildingPermissions = buildingGroup

    // Restrictions & Zones layer.
    const restrictionGroup = L.layerGroup()
    parcelFeatureCollection.features.forEach((feature) => {
      const props = (feature.properties || {}) as Record<string, unknown>
      const restr = (props.restrictions as string[]) || []
      if (!restr.length) return
      const m = buildMarker(feature,
        `<div style="width:16px;height:16px;border-radius:2px;background:#7c3aed;border:2px solid #fff;box-shadow:0 0 0 2px #0003;color:#fff;font-size:10px;line-height:12px;text-align:center">R</div>`,
        `Restricted Zone · ${restr.length} restriction${restr.length > 1 ? 's' : ''} · ${String(props.ulpin || '')}`)
      if (m) restrictionGroup.addLayer(m)
    })
    overlayRefs.current.restrictions = restrictionGroup

    // Disputes layer.
    const disputeGroup = L.layerGroup()
    parcelFeatureCollection.features.forEach((feature) => {
      const props = (feature.properties || {}) as Record<string, unknown>
      const ds = String(props.disputeStatus || 'none')
      if (ds !== 'active') return
      const m = buildMarker(feature,
        `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 2px #0003;color:#fff;font-size:9px;line-height:12px;text-align:center">!</div>`,
        `Dispute: active · ${String(props.ulpin || '')}`)
      if (m) disputeGroup.addLayer(m)
    })
    overlayRefs.current.disputes = disputeGroup

    // Roads layer — demo network linking the Tamil Nadu demo clusters.
    const roadGroup = L.layerGroup()
    const clusters: Array<[number, number]> = []
    const tnParcels = parcelFeatureCollection.features.filter((f) => {
      const s = String(((f.properties || {}) as Record<string, unknown>).state || '')
      return s === 'Tamil Nadu'
    })
    tnParcels.forEach((feature) => {
      const c = featureCenter(feature.geometry)
      if (c) clusters.push([c.lat, c.lng])
    })
    if (clusters.length >= 2) {
      const polyline = L.polyline(clusters, {
        color: '#f97316',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 6',
      })
      polyline.bindTooltip('Demo road network (connecting demo parcels) — not real geometry', { direction: 'top' })
      roadGroup.addLayer(polyline)
    }
    overlayRefs.current.roads = roadGroup

    // Utilities layer — indicators per parcel (electricity / water / sewerage).
    const utilityGroup = L.layerGroup()
    parcelFeatureCollection.features.forEach((feature) => {
      const props = (feature.properties || {}) as Record<string, unknown>
      const u = (props.utilities as { electricity?: boolean; water?: boolean; sewerage?: boolean }) || {}
      const parts = [
        u.electricity ? '⚡' : '',
        u.water ? '💧' : '',
        u.sewerage ? '🚰' : '',
      ].filter(Boolean)
      if (!parts.length) return
      const m = buildMarker(feature,
        `<div style="min-width:20px;height:20px;border-radius:4px;background:#0ea5e9;border:2px solid #fff;box-shadow:0 0 0 2px #0003;color:#fff;font-size:12px;line-height:16px;text-align:center">${parts.join('')}</div>`,
        `Utilities: ${parts.join(' ')} · ${String(props.ulpin || '')}`)
      if (m) utilityGroup.addLayer(m)
    })
    overlayRefs.current.utilities = utilityGroup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelFeatureCollection, governanceLayers])

  // Apply layer visibility toggles (parcel bounds, labels, governance, infra).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const parcelOn = coreLayers.find(l => l.id === 'parcelBounds')?.checked ?? true
    if (geoJSONRef.current) {
      if (parcelOn && !map.hasLayer(geoJSONRef.current)) map.addLayer(geoJSONRef.current)
      else if (!parcelOn && map.hasLayer(geoJSONRef.current)) map.removeLayer(geoJSONRef.current)
    }

    const labelsOn = (coreLayers.find(l => l.id === 'ulpin')?.checked ?? true) && zoom >= ULPIN_MIN_ZOOM
    if (labelLayerRef.current) {
      if (labelsOn && !map.hasLayer(labelLayerRef.current)) map.addLayer(labelLayerRef.current)
      else if (!labelsOn && map.hasLayer(labelLayerRef.current)) map.removeLayer(labelLayerRef.current)
    }

    const overlayOn: Record<OverlayKey, boolean> = {
      landUse: governanceLayers.find(l => l.id === 'landUse')?.checked ?? false,
      buildingPermissions: governanceLayers.find(l => l.id === 'buildingPermissions')?.checked ?? false,
      restrictions: governanceLayers.find(l => l.id === 'restrictions')?.checked ?? false,
      disputes: governanceLayers.find(l => l.id === 'disputes')?.checked ?? false,
      roads: infraLayers.find(l => l.id === 'roads')?.checked ?? false,
      utilities: infraLayers.find(l => l.id === 'utilities')?.checked ?? false,
    }
    ;(Object.keys(overlayOn) as OverlayKey[]).forEach((key) => {
      const layer = overlayRefs.current[key]
      if (!layer) return
      if (overlayOn[key] && !map.hasLayer(layer)) map.addLayer(layer)
      else if (!overlayOn[key] && map.hasLayer(layer)) map.removeLayer(layer)
    })
  }, [coreLayers, governanceLayers, infraLayers, zoom, parcelFeatureCollection])

  // Highlight / reset the selected parcel.
  useEffect(() => {
    const map = mapRef.current
    const layer = geoJSONRef.current
    if (!map || !layer) return
    layer.setStyle(() => ({
      color: '#1d4ed8',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.3,
    }))
    if (!selectedParcel) return
    layer.eachLayer((lyr) => {
      const styled = lyr as L.Polyline & { feature?: GeoJSON.Feature }
      const props = (styled.feature && styled.feature.properties ? styled.feature.properties : {}) as Record<string, unknown>
      if (String(props.id) === selectedParcel.id || String(props.ulpin) === selectedParcel.ulpin) {
        styled.setStyle({
          color: '#dc2626',
          weight: 4,
          fillColor: '#ef4444',
          fillOpacity: 0.55,
        })
        styled.bringToFront()
      }
    })
  }, [selectedParcel])

  // Reverse-geocode a click outside any parcel/boundary (Case B):
  // find the district (and taluk) that contains the clicked point.
  function handleMapClick(map: L.Map, e: L.LeafletMouseEvent) {
    const { districts, taluks } = boundariesRef.current
    const lng = e.latlng.lng
    const lat = e.latlng.lat
    let district: string | null = null
    let taluk: string | null = null

    if (districts?.features) {
      for (const f of districts.features) {
        if (geometryContainsPoint(f.geometry, lng, lat)) {
          district = String(f.properties?.district || f.properties?.name || null)
          break
        }
      }
    }
    if (taluks?.features) {
      for (const f of taluks.features) {
        if (geometryContainsPoint(f.geometry, lng, lat)) {
          taluk = String(f.properties?.taluk || f.properties?.name || null)
          if (!district) district = String(f.properties?.district || null) || null
          break
        }
      }
    }
    if (!district && !taluk) {
      // Outside Tamil Nadu — treat as generic location.
      setSelectedParcel(null)
      setLocContext({ state: 'Outside Tamil Nadu', district: null, taluk: null, lat, lng, type: 'location' })
      return
    }
    setSelectedParcel(null)
    setLocContext({ state: 'Tamil Nadu', district, taluk, lat, lng, type: 'location' })
  }

  // Combined search: parcels + admin boundaries (district / taluk / state).
  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim()
    if (!q) return []
    const ql = q.toLowerCase()
    const results: SearchResult[] = []

    const fcs: Array<{ col: GeoJSON.FeatureCollection | null; kind: 'district' | 'taluk' }> = [
      { col: boundaries.districts, kind: 'district' },
      { col: boundaries.taluks, kind: 'taluk' },
    ]
    for (const { col, kind } of fcs) {
      if (!col?.features) continue
      for (const f of col.features) {
        const name = String(kind === 'district' ? f.properties?.district || f.properties?.name : f.properties?.taluk || f.properties?.name || '')
        const district = String(f.properties?.district || '')
        if (name && name.toLowerCase().includes(ql)) {
          if (kind === 'district') results.push({ type: 'district', name, feature: f })
          else results.push({ type: 'taluk', name, district, feature: f })
          if (results.filter(r => r.type !== 'parcel').length >= 6) break
        }
      }
      if (results.filter(r => r.type !== 'parcel').length >= 6) break
    }

    // parcelled matches (deduped against parcel search)
    const parcelMatches = searchParcels(searchQuery).slice(0, 8)
    for (const p of parcelMatches) results.push({ type: 'parcel', parcel: p })

    return results.slice(0, 8)
  }, [searchQuery, boundaries])

  const toggleLayer = useCallback((setter: React.Dispatch<React.SetStateAction<{ id: string; label: string; checked: boolean }[]>>) => {
    return (id: string) => setter((prev) => prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)))
  }, [])

  const handleResultClick = useCallback((result: SearchResult) => {
    setSearchQuery('')
    setShowSearchResults(false)
    const map = mapRef.current
    if (!map) return
    if (result.type === 'parcel') {
      selectParcel(result.parcel, map)
      return
    }
    // Boundary result → zoom to it and show location context.
    const b = featureBounds(result.feature)
    setSelectedParcel(null)
    setLocContext({
      state: 'Tamil Nadu',
      district: result.type === 'district' ? result.name : result.district,
      taluk: result.type === 'taluk' ? result.name : null,
      lat: (b[0][1] + b[1][1]) / 2,
      lng: (b[0][0] + b[1][0]) / 2,
      type: result.type,
    })
    map.flyToBounds(L.latLngBounds([b[0][1], b[0][0]], [b[1][1], b[1][0]]), { duration: 0.6 })
  }, [])

  // Support deep-link: /explorer?parcel=ID selects and focuses a parcel from its profile page.
  const parcelParam = params.get('parcel')
  const initialParcelConsumed = useRef(false)
  useEffect(() => {
    if (initialParcelConsumed.current || !parcelParam) return
    const parcel = getParcelById(parcelParam)
    if (parcel) {
      setLocContext(null)
      setSelectedParcel(parcel)
      handleResultClick({ type: 'parcel', parcel })
    }
    initialParcelConsumed.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelParam, handleResultClick])

  const zoomToParcel = useCallback((parcel: Parcel) => {
    const map = mapRef.current
    if (map && parcel.coordinates.lat) {
      map.flyTo([parcel.coordinates.lat, parcel.coordinates.lng], 14, { duration: 0.6 })
    }
  }, [])

  const landUseActive = governanceLayers.find(l => l.id === 'landUse')?.checked ?? false
  const buildingActive = governanceLayers.find(l => l.id === 'buildingPermissions')?.checked ?? false
  const restrictionActive = governanceLayers.find(l => l.id === 'restrictions')?.checked ?? false
  const disputeActive = governanceLayers.find(l => l.id === 'disputes')?.checked ?? false
  const utilActive = infraLayers.find(l => l.id === 'utilities')?.checked ?? false
  const roadActive = infraLayers.find(l => l.id === 'roads')?.checked ?? false
  const activeGovernanceCount = governanceLayers.filter(l => l.checked).length

  const landUseLabel = selectedParcel?.landUse ? selectedParcel.landUse.charAt(0).toUpperCase() + selectedParcel.landUse.slice(1) : '—'
  const buildingStatusLabel = !selectedParcel ? '' :
    selectedParcel.buildingPermission === 'approved' ? 'Approved'
    : selectedParcel.buildingPermission === 'pending' ? 'Pending'
    : selectedParcel.buildingPermission === 'rejected' ? 'Rejected'
    : 'Not Available'

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
              placeholder="ULPIN, Survey No, Village, District, Taluk..."
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
              {searchResults.map((result, idx) => {
                if (result.type === 'parcel') {
                  const parcel = result.parcel
                  return (
                    <button
                      key={result.type + '-' + parcel.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <p className="text-xs font-mono text-gov-600">{parcel.ulpin}</p>
                      <p className="text-sm text-slate-900 mt-0.5">{parcel.village}, {parcel.district}, {parcel.state}</p>
                      <p className="text-xs text-slate-500">{parcel.ownerName} · {parcel.area} {parcel.areaUnit}</p>
                    </button>
                  )
                }
                return (
                  <button
                    key={result.type + '-' + result.name + '-' + idx}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <span className="text-sm font-medium text-slate-900">{result.name}</span>
                      <span className="text-xs text-slate-500">
                        {' '}· {result.type === 'district' ? 'District' : 'Taluk'}{result.type === 'taluk' && result.district ? ` · ${result.district}` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
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
            {baseLayer === 'satellite' && satelliteError && (
              <p className="mt-2 flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Satellite tiles could not be loaded (provider restriction). Switch to OpenStreetMap.
              </p>
            )}
            {baseLayer === 'satellite' && !satelliteError && (
              <p className="mt-1 text-[10px] text-slate-400">Imagery by Esri World Imagery (may fail if offline).</p>
            )}
          </div>

          {/* Administrative Boundaries */}
          <div>
            <button
              onClick={() => setShowAdminLayers(!showAdminLayers)}
              className="flex items-center gap-1.5 w-full text-left mb-2"
            >
              {showAdminLayers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Boundaries</p>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">REAL</span>
            </button>
            {showAdminLayers && (
              <div className="space-y-1 ml-2">
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-500">
                  <span className="inline-block w-4 border-t-2" style={{ borderColor: ADMIN_STYLE.state.color }} />
                  State — Tamil Nadu
                </div>
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-500">
                  <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: ADMIN_STYLE.districts.color }} />
                  Districts (zoom ≥ {ADMIN_MIN_ZOOM.districts})
                </div>
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-500">
                  <span className="inline-block w-4 border-t-2 border-dotted" style={{ borderColor: ADMIN_STYLE.taluks.color }} />
                  Taluks (zoom ≥ {ADMIN_MIN_ZOOM.taluks})
                </div>
                <p className="text-[9px] text-slate-400 px-3 pt-1">Geometry from public-domain Census 2011 admin boundaries (simplified)</p>
              </div>
            )}
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
                <p className="text-[9px] text-slate-400 px-3 pt-1">ULPIN labels appear at zoom ≥ {ULPIN_MIN_ZOOM} to avoid clutter.</p>
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
                      onChange={() => toggleLayer(setGovernanceLayers)(layer.id)}
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
                      onChange={() => toggleLayer(setInfraLayers)(layer.id)}
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
            Real Tamil Nadu boundaries · {demoParcels.length} demo parcels · OSM + Esri tiles
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

        {/* Current zoom hint */}
        <div className="absolute right-3 bottom-8 z-[500] px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[10px] text-slate-500 shadow">
          Zoom {zoom}
        </div>

        {/* Legend */}
        <div className="absolute left-3 bottom-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-[500] max-w-[210px]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Legend
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 border-t-2" style={{ borderColor: ADMIN_STYLE.state.color }} />
              <span className="text-[10px] text-slate-600">State boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: ADMIN_STYLE.districts.color }} />
              <span className="text-[10px] text-slate-600">District (zoom ≥ {ADMIN_MIN_ZOOM.districts})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 border-t-2 border-dotted" style={{ borderColor: ADMIN_STYLE.taluks.color }} />
              <span className="text-[10px] text-slate-600">Taluk (zoom ≥ {ADMIN_MIN_ZOOM.taluks})</span>
            </div>

            {utilActive && (
              <>
                <div className="my-1 border-t border-slate-200" />
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Utilities</p>
                <div className="text-[10px] text-slate-600">⚡ Electricity · 💧 Water · 🚰 Sewerage</div>
              </>
            )}
            {roadActive && (
              <>
                <div className="my-1 border-t border-slate-200" />
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: '#f97316' }} />
                  <span className="text-[10px] text-slate-600">Demo road network (DEMO)</span>
                </div>
              </>
            )}
            {landUseActive ? (
              <>
                <div className="my-1 border-t border-slate-200" />
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Land Use</p>
                {[
                  { label: 'Residential', color: '#3b82f6' },
                  { label: 'Commercial', color: '#f59e0b' },
                  { label: 'Agricultural', color: '#22c55e' },
                  { label: 'Industrial', color: '#8b5cf6' },
                  { label: 'Institutional', color: '#06b6d4' },
                  { label: 'Forest', color: '#166534' },
                  { label: 'Mixed', color: '#ec4899' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-slate-600">{item.label}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gov-500" />
                <span className="text-[10px] text-slate-600">Demo parcel boundary</span>
              </div>
            )}
            {disputeActive && (
              <>
                <div className="my-1 border-t border-slate-200" />
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Disputes</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[10px] text-slate-600">Active dispute</span>
                </div>
              </>
            )}
            {buildingActive && (
              <>
                <div className="my-1 border-t border-slate-200" />
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Building Permission</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-[10px] text-slate-600">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-slate-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-[10px] text-slate-600">Not available</span>
                </div>
              </>
            )}
            {restrictionActive && (
              <>
                <div className="my-1 border-t border-slate-200" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-purple-600" />
                  <span className="text-[10px] text-slate-600">Restricted zone</span>
                </div>
              </>
            )}
          </div>
          {activeGovernanceCount > 0 && !landUseActive && (
            <p className="text-[9px] text-slate-400 mt-2">
              {activeGovernanceCount} governance layer{activeGovernanceCount > 1 ? 's' : ''} active (demo overlay)
            </p>
          )}
        </div>
      </div>

      {/* Right Panel — selected parcel OR location context */}
      <div
        className={cn(
          'w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0',
          selectedParcel || locContext ? 'block' : 'hidden'
        )}
      >
        {selectedParcel ? (
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
                <InfoRow label="Village" value={selectedParcel.village || '—'} />
                <InfoRow label="Taluk" value={selectedParcel.taluk || '—'} />
                <InfoRow label="District" value={selectedParcel.district || '—'} />
                <InfoRow label="State" value={selectedParcel.state || '—'} />
                <InfoRow label="Coordinates" value={selectedParcel.coordinates ? `${selectedParcel.coordinates.lat.toFixed(4)}, ${selectedParcel.coordinates.lng.toFixed(4)}` : '—'} />
                <InfoRow label="Area" value={`${selectedParcel.area} ${selectedParcel.areaUnit}`} />
                <InfoRow label="Land Use" value={<StatusBadge status={selectedParcel.landUse} />} isReact />
                <InfoRow label="Zoning" value={selectedParcel.zoning || '—'} />
                <InfoRow label="Ownership Status" value={<StatusBadge status={selectedParcel.ownershipStatus} />} isReact />
                <InfoRow label="Owner" value={selectedParcel.ownerName || 'Demo Owner'} />
                <InfoRow label="Patta No" value={selectedParcel.pattaNumber || '—'} />
                {buildingActive && (
                  <InfoRow
                    label="Building Permission"
                    value={<StatusBadge status={selectedParcel.buildingPermission === 'approved' ? 'approved' : selectedParcel.buildingPermission === 'pending' ? 'pending' : 'rejected'} />}
                    isReact
                  />
                )}
                {restrictionActive && (
                  <InfoRow label="Restrictions" value={selectedParcel.restrictions?.length ? `${selectedParcel.restrictions.length} restriction(s)` : 'None'} />
                )}
                {disputeActive && (
                  <InfoRow
                    label="Dispute"
                    value={
                      <StatusBadge status={selectedParcel.disputeStatus === 'active' ? 'active' : 'resolved'} />
                    }
                    isReact
                  />
                )}
              </div>

              <div className="p-4 pt-0">
                {buildingActive && (
                  <p className="flex items-start gap-1.5 text-[11px] text-slate-500 border border-slate-200 rounded-lg p-2.5">
                    <Building2 className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                    Building permission: <strong className="text-slate-700">{buildingStatusLabel}</strong> for this parcel.
                  </p>
                )}
                {disputeActive && selectedParcel.disputeStatus === 'active' && (
                  <p className="flex items-start gap-1.5 text-[11px] text-red-600 border border-red-200 bg-red-50 rounded-lg p-2.5">
                    <Gavel className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Active demo dispute on record for {selectedParcel.ulpin}. (Synthetic demo data.)
                  </p>
                )}
                {restrictionActive && selectedParcel.restrictions?.length > 0 && (
                  <div className="border border-purple-200 bg-purple-50 rounded-lg p-2.5 space-y-1">
                    <p className="flex items-center gap-1.5 text-[11px] text-purple-700 font-medium">
                      <Scale className="w-3.5 h-3.5 flex-shrink-0" />
                      Restrictions &amp; zones (demo)
                    </p>
                    <ul className="text-[11px] text-purple-800 pl-1 space-y-0.5">
                      {selectedParcel.restrictions.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <Link to={`/parcel/${selectedParcel.id}`} className="block">
                <Button variant="primary" size="md" className="w-full">
                  <Home className="w-4 h-4" />
                  View Parcel Profile
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/services?ulpin=${encodeURIComponent(selectedParcel.ulpin)}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    <FileText className="w-4 h-4" />
                    Request Service
                  </Button>
                </Link>
                <Link to={`/land-records?ulpin=${encodeURIComponent(selectedParcel.ulpin)}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Shield className="w-4 h-4" />
                    Land Records
                  </Button>
                </Link>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => zoomToParcel(selectedParcel)}>
                <MapIcon className="w-4 h-4" />
                Zoom to Parcel
              </Button>
            </div>
          </>
        ) : locContext ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Location Context</p>
                <p className="text-xs text-slate-500 mt-0.5">Map click outside a parcel</p>
              </div>
              <button
                onClick={() => setLocContext(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">No demo parcel available for this location</span>
              </div>
              <div className="space-y-2">
                <InfoRow label="State" value={locContext.state} />
                <InfoRow label="District" value={locContext.district || '—'} />
                <InfoRow label="Taluk" value={locContext.taluk || '—'} />
                <InfoRow label="Coordinates" value={`${locContext.lat.toFixed(4)}, ${locContext.lng.toFixed(4)}`} />
                {locContext.type !== 'location' && (
                  <InfoRow label="Selection" value={locContext.type === 'district' ? `District: ${locContext.district}` : `Taluk: ${locContext.taluk}`} />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                Location resolved from real Tamil Nadu administrative boundaries (Census 2011, simplified). Boundary geometry only — no cadastral or ownership data is implied.
              </p>
            </div>
          </>
        ) : null}
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
