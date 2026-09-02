import { Map, Braces, Lock, Database, Share2, ArrowDown, ChevronDown, Boxes, Cpu, BarChart3, Landmark, FileText, Building2, Receipt, Plug } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface StandardSection {
  id: string
  title: string
  icon: typeof Map
  color: string
  description: string
  standards: { name: string; detail: string }[]
}

const standardsSections: StandardSection[] = [
  {
    id: 'gis',
    title: 'GIS Standards',
    icon: Map,
    color: 'bg-emerald-50 text-emerald-600',
    description: 'Geographic data interchange and spatial referencing standards for all map and parcel data.',
    standards: [
      { name: 'OGC WMS / WFS', detail: 'Web Map and Feature services for publishing spatial data to connected systems' },
      { name: 'GeoJSON', detail: 'Standard encoding of geographic data structures for API payloads' },
      { name: 'EPSG:4326 (WGS 84)', detail: 'Primary coordinate reference system for all global parcel coordinates' },
      { name: 'EPSG:32643 (UTM Zone 43N)', detail: 'Projected CRS used for high-precision area calculations in India' },
    ],
  },
  {
    id: 'api',
    title: 'API Standards',
    icon: Braces,
    color: 'bg-blue-50 text-blue-600',
    description: 'Consistent API design and delivery conventions across the platform and integrations.',
    standards: [
      { name: 'RESTful Design', detail: 'Resource-oriented architecture with predictable URL structure' },
      { name: 'JSON Payloads', detail: 'Lightweight, language-agnostic data interchange format for all endpoints' },
      { name: 'OpenAPI 3.0', detail: 'Machine-readable API documentation for every published endpoint' },
      { name: 'Semantic Versioning', detail: 'MAJOR.MINOR.PATCH versioning with explicit deprecation policies' },
    ],
  },
  {
    id: 'security',
    title: 'Security Standards',
    icon: Lock,
    color: 'bg-rose-50 text-rose-600',
    description: 'Authentication, authorization, and audit controls protecting all system access.',
    standards: [
      { name: 'OAuth 2.0', detail: 'Authorization framework for delegated access to protected resources' },
      { name: 'OpenID Connect', detail: 'Identity layer built on OAuth 2.0 for SSO and user identity' },
      { name: 'RBAC', detail: 'Role-based access control enforcing least-privilege across modules' },
      { name: 'Audit Logging', detail: 'Immutable, tamper-evident audit trail of all sensitive operations' },
    ],
  },
  {
    id: 'data',
    title: 'Data Standards',
    icon: Database,
    color: 'bg-purple-50 text-purple-600',
    description: 'Canonical data models and identifiers for consistent land records.',
    standards: [
      { name: 'ULPIN (Unique Land Parcel ID)', detail: '14-character nationally standard unique identifier for every parcel' },
      { name: 'Common Schema', detail: 'Shared field definitions across all department integrations' },
      { name: 'Metadata Specifications', detail: 'Documented provenance, lineage, and update timestamps per record' },
    ],
  },
  {
    id: 'interop',
    title: 'Interoperability',
    icon: Share2,
    color: 'bg-amber-50 text-amber-600',
    description: 'Mechanisms ensuring seamless exchange between state systems and external departments.',
    standards: [
      { name: 'State Integration Gateway', detail: 'Central hub routing requests to and from state department systems' },
      { name: 'Department APIs', detail: 'Versioned endpoints for each connected department with schema validation' },
      { name: 'Event-driven Sync', detail: 'Webhook and webhook-retry patterns for reliable data propagation' },
    ],
  },
]

function DiagramNode({ label, sub, tone, icon: Icon }: { label: string; sub?: string; tone: string; icon: typeof Landmark }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-3 rounded-xl border ${tone} min-w-[140px]`}>
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
    </div>
  )
}

function Arrow({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${horizontal ? '' : 'py-1'}`}>
      <ArrowDown className={`text-slate-400 ${horizontal ? 'rotate-[-90deg]' : ''}`} />
    </div>
  )
}

export default function TechnicalStandards() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technical Standards & Documentation</h1>
        <p className="text-sm text-slate-500 mt-1">Architecture, standards, and conformance guidance for the LandStack platform</p>
      </div>

      <Card title="System Architecture" subtitle="High-level reference architecture of the Digital Public Infrastructure">
        <div className="flex flex-col items-center">
          <DiagramNode label="CITIZENS" sub="Citizens & Landowners" tone="bg-sky-50 border-sky-200" icon={Landmark} />
          <Arrow />
          <DiagramNode label="Citizen Portal" sub="Public Services Web Portal" tone="bg-cyan-50 border-cyan-200" icon={FileText} />
          <Arrow />
          <DiagramNode label="API Gateway" sub="AuthN · Rate Limit · Routing" tone="bg-indigo-50 border-indigo-200" icon={Plug} />
          <Arrow />
          <DiagramNode label="LANDSTACK CORE" sub="Unified Land Record System" tone="bg-gov-50 border-gov-200" icon={Building2} />

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-2xl">
            <DiagramNode label="GIS Engine" sub="Spatial Processing" tone="bg-emerald-50 border-emerald-200" icon={Map} />
            <DiagramNode label="Workflow" sub="Service Orchestration" tone="bg-amber-50 border-amber-200" icon={Cpu} />
            <DiagramNode label="Analytics" sub="Reporting & Insights" tone="bg-purple-50 border-purple-200" icon={BarChart3} />
          </div>

          <Arrow />
          <DiagramNode label="PARCEL / ULPIN" sub="Canonical Parcel Registry" tone="bg-slate-50 border-slate-300" icon={Boxes} />

          <Arrow />
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full max-w-3xl">
            <Badge className="justify-center py-2 bg-slate-50 text-slate-700 border-slate-200 rounded-xl">RoR</Badge>
            <Badge className="justify-center py-2 bg-slate-50 text-slate-700 border-slate-200 rounded-xl">Registration</Badge>
            <Badge className="justify-center py-2 bg-slate-50 text-slate-700 border-slate-200 rounded-xl">Planning</Badge>
            <Badge className="justify-center py-2 bg-slate-50 text-slate-700 border-slate-200 rounded-xl">Taxation</Badge>
            <Badge className="justify-center py-2 bg-slate-50 text-slate-700 border-slate-200 rounded-xl">Utilities</Badge>
          </div>

          <Arrow />
          <DiagramNode label="State Department Systems" sub="Connected Government APIs" tone="bg-emerald-50 border-emerald-200" icon={Share2} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {standardsSections.map(section => (
          <Card key={section.id} title={section.title} subtitle={section.description}>
            <div className="space-y-3">
              {section.standards.map(standard => (
                <div key={standard.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${section.color}`}>
                    <section.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{standard.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{standard.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Documentation & Versioning" subtitle="Release and conformance artifacts">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-gov-600" />
              <span className="text-sm font-semibold text-slate-900">API Reference</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">OpenAPI 3.0 specification for all published endpoints, with interactive documentation.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gov-600" />
              <span className="text-sm font-semibold text-slate-900">Data Dictionary</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Complete field-level documentation of the canonical parcel, ownership, and transaction schemas.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-gov-600" />
              <span className="text-sm font-semibold text-slate-900">Integration Guide</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Step-by-step guidance for onboarding new state department systems to the gateway.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
