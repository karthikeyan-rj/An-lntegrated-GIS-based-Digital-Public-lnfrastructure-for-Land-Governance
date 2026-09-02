import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import {
  MapPin,
  Link2,
  Shield,
  Rocket,
  ArrowRight,
  FileText,
  UserCheck,
  Landmark,
  Calculator,
  Droplets,
  TreePine,
  Gavel,
  Handshake,
  Database,
  Cpu,
  Workflow,
  Globe,
  ChevronRight,
  ShieldCheck,
  Layers,
  Users,
  AlertTriangle,
  BadgeCheck,
  Boxes,
} from 'lucide-react'

const STATS = [
  { title: 'Total Parcels', value: '12.4M', icon: Database, iconColor: 'text-gov-600' },
  { title: 'Digitized Parcels', value: '10.8M', icon: Cpu, iconColor: 'text-emerald-600' },
  { title: 'Verified Ownership', value: '8.2M', icon: ShieldCheck, iconColor: 'text-blue-600' },
  { title: 'Active Applications', value: '24,567', icon: FileText, iconColor: 'text-amber-600' },
  { title: 'Registered Transactions', value: '1.2M', icon: Handshake, iconColor: 'text-purple-600' },
  { title: 'Disputed Parcels', value: '3,421', icon: AlertTriangle, iconColor: 'text-red-600' },
  { title: 'Integrated Departments', value: '8', icon: Boxes, iconColor: 'text-navy-600' },
]

const STEPS = [
  {
    icon: MapPin,
    title: 'Identify Parcel',
    description: 'Every parcel gets a unique ULPIN identifier, creating a single source of truth across all government systems.',
    color: 'bg-gov-50 text-gov-600 border-gov-200',
  },
  {
    icon: Link2,
    title: 'Integrate Records',
    description: 'All department records linked to one parcel — land records, registration, taxation, planning, and more.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    icon: Shield,
    title: 'Verify & Analyze',
    description: 'AI-powered verification and anomaly detection ensures data integrity and fraud prevention.',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    icon: Rocket,
    title: 'Deliver Services',
    description: 'Seamless citizen services and workflows powered by unified, verified land data.',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
]

const ULPIN_MODULES = [
  { name: 'Land Records', icon: FileText, color: 'bg-gov-50 text-gov-600 border-gov-200' },
  { name: 'Registration', icon: BadgeCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { name: 'Planning', icon: Layers, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { name: 'Building Permissions', icon: Landmark, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { name: 'Encumbrances', icon: Link2, color: 'bg-red-50 text-red-600 border-red-200' },
  { name: 'Taxation', icon: Calculator, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { name: 'Utilities', icon: Droplets, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { name: 'Restrictions', icon: Shield, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { name: 'Disputes', icon: Gavel, color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { name: 'Citizen Services', icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
]

const DEPARTMENTS = [
  { name: 'Revenue', icon: Landmark, connected: true },
  { name: 'Registration', icon: FileText, connected: true },
  { name: 'Municipality', icon: BuildingIcon, connected: true },
  { name: 'Planning', icon: Layers, connected: true },
  { name: 'Taxation', icon: Calculator, connected: true },
  { name: 'Utilities', icon: Droplets, connected: true },
  { name: 'Environment', icon: TreePine, connected: true },
  { name: 'Courts', icon: Gavel, connected: true },
]

function BuildingIcon(props: React.ComponentPropsWithoutRef<typeof Landmark>) {
  return <Landmark {...props} />
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gov-500 flex items-center justify-center shadow-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">LandStack</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="secondary" onClick={() => navigate('/explorer')}>
              Explore Land
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-20 pb-28">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-gov-300 mb-8">
            <Cpu className="w-4 h-4" />
            Digital Public Infrastructure for Land Governance
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
            LANDSTACK
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-navy-200 font-medium">
            One Parcel. One Identity. One Integrated Land Governance Platform.
          </p>
          <p className="mt-4 text-base text-navy-300 max-w-2xl mx-auto leading-relaxed">
            A unified parcel-centric architecture that connects every land-related department,
            digitizes records, and enables seamless citizen services through a single Unique Land
            Parcel Identification Number (ULPIN).
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/explorer')}>
              Explore Land
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
              Access Citizen Services
            </Button>
            <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10" size="lg">
              View Architecture
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Platform Architecture Section */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Unified Parcel-Centric Architecture
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Every module connects through a single ULPIN — the backbone of integrated land governance
            </p>
          </div>

          {/* Architecture Diagram */}
          <div className="relative">
            {/* Center ULPIN Card */}
            <div className="flex justify-center mb-12">
              <div className="relative z-10 bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-2xl px-10 py-8 shadow-xl border border-navy-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gov-500 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">ULPIN</h3>
                    <p className="text-navy-300 text-sm">Unique Land Parcel Identification</p>
                  </div>
                </div>
                <p className="text-navy-200 text-sm text-center mt-2">
                  Single source of truth for every parcel
                </p>
              </div>
            </div>

            {/* Connecting lines visual */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-0.5 bg-navy-200 rounded-full" />
                ))}
                <Workflow className="w-5 h-5 text-navy-400" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-0.5 bg-navy-200 rounded-full" />
                ))}
              </div>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ULPIN_MODULES.map((mod) => {
                const Icon = mod.icon
                return (
                  <div
                    key={mod.name}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${mod.color}`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-semibold text-center leading-tight">{mod.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="py-24 px-6 lg:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Platform at Scale
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              Processing millions of parcels across multiple states
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              From parcel identification to seamless service delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative">
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-0.5 bg-gradient-to-r from-slate-200 to-transparent" />
                  )}

                  <div className="text-center">
                    <div className="relative inline-flex">
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center z-10">
                        {idx + 1}
                      </span>
                      <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${step.color}`}>
                        <Icon className="w-9 h-9" />
                      </div>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interoperability Section */}
      <section className="py-24 px-6 lg:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Interoperable Digital Public Infrastructure
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Connected departments with real-time data synchronization and API integration
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon
              return (
                <div
                  key={dept.name}
                  className="bg-white rounded-xl border border-slate-200 p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-gov-200"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{dept.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">Connected</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-white py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Branding */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gov-500 flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">LandStack</span>
              </div>
              <p className="text-navy-300 text-sm leading-relaxed">
                Integrated GIS-based Digital Public Infrastructure for Land Governance.
                Building transparent, efficient, and citizen-centric land administration systems.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3">
                {['About', 'Documentation', 'API', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-navy-300 text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                DEMO / PROTOTYPE DATA
              </div>
              <p className="text-navy-400 text-xs">
                Problem Statement 26014
              </p>
              <p className="text-navy-500 text-xs">
                &copy; 2025 LandStack. Built for Smart India Hackathon.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
