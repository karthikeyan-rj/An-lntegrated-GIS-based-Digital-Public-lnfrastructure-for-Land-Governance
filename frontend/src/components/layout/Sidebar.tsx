import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Map, FileText, Scroll, Stamp, AlertTriangle, Landmark,
  MapPin, Building2, Droplets, Trees, Receipt, Users, ClipboardList,
  BarChart3, Brain, Radar, Building, Wifi, Shield, Settings,
  BookOpen, ChevronDown, ChevronRight, LogOut
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'GIS Land Explorer', path: '/explorer', icon: Map },
    ],
  },
  {
    label: 'Land Governance',
    items: [
      { label: 'Parcels', path: '/parcels', icon: Landmark },
      { label: 'Land Records', path: '/land-records', icon: Scroll },
      { label: 'Registration', path: '/registration', icon: Stamp },
      { label: 'Encumbrances', path: '/encumbrance', icon: AlertTriangle },
      { label: 'Disputes', path: '/disputes', icon: FileText },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Master Plans', path: '/planning', icon: MapPin },
      { label: 'Land Use & Zoning', path: '/land-use', icon: Trees },
      { label: 'Building Permissions', path: '/building-permissions', icon: Building2 },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Utilities', path: '/utilities', icon: Droplets },
      { label: 'Property Tax', path: '/property-tax', icon: Receipt },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Citizen Services', path: '/services', icon: Users },
      { label: 'Service Requests', path: '/applications', icon: ClipboardList },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'AI Insights', path: '/ai-insights', icon: Brain },
      { label: 'Change Detection', path: '/change-detection', icon: Radar },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Department Dashboard', path: '/departments', icon: Building },
      { label: 'API & Interoperability', path: '/apis', icon: Wifi },
      { label: 'Audit Logs', path: '/audit', icon: Shield },
      { label: 'Users & Roles', path: '/users', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Technical Standards', path: '/technical-standards', icon: BookOpen },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-navy-950 text-white z-50 flex flex-col transition-transform lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gov-600 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">LandStack</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Integrated Land Governance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_GROUPS.map(group => {
            const isCollapsed = collapsed[group.label] === true
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {group.label}
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {!isCollapsed && group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive(item.path)
                        ? 'bg-gov-600/25 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', isActive(item.path) ? 'text-gov-400' : '')} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gov-600 flex items-center justify-center text-xs font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.department}</p>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-white transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 left-4 z-50 lg:hidden w-12 h-12 rounded-full bg-navy-950 text-white shadow-lg flex items-center justify-center"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>
    </>
  )
}
