import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Map, Landmark, Scroll, Users as UsersIcon, ClipboardList,
  Brain, Radar, Wifi, Shield, Settings, Bell, User as UserIcon, LogOut,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem { label: string; path: string; icon: React.ComponentType<{ className?: string }> }
interface NavGroup { label: string; items: NavItem[] }

const OFFICER_ROLES: UserRole[] = ['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer']
const isOfficer = (r: UserRole) => OFFICER_ROLES.includes(r)

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isActive = (path: string) => location.pathname === path

  const role = user?.role || 'citizen'

  const groups: NavGroup[] = []
  if (role === 'citizen') {
    groups.push({ label: 'Overview', items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'GIS Explorer', path: '/explorer', icon: Map },
    ]})
    groups.push({ label: 'Services', items: [
      { label: 'Citizen Services', path: '/services', icon: UsersIcon },
      { label: 'My Applications', path: '/applications', icon: ClipboardList },
    ]})
    groups.push({ label: 'Account', items: [
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Profile', path: '/profile', icon: UserIcon },
    ]})
  } else if (isOfficer(role)) {
    groups.push({ label: 'Overview', items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'GIS Explorer', path: '/explorer', icon: Map },
    ]})
    groups.push({ label: 'Land', items: [
      { label: 'Parcels', path: '/parcels', icon: Landmark },
      { label: 'Land Records', path: '/land-records', icon: Scroll },
    ]})
    groups.push({ label: 'Workflow', items: [
      { label: 'Applications', path: '/applications', icon: ClipboardList },
    ]})
    groups.push({ label: 'Intelligence', items: [
      { label: 'AI Insights', path: '/ai-insights', icon: Brain },
      { label: 'Change Detection', path: '/change-detection', icon: Radar },
    ]})
    groups.push({ label: 'Account', items: [
      { label: 'Profile', path: '/profile', icon: UserIcon },
    ]})
  } else {
    // administrator
    groups.push({ label: 'Overview', items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'GIS Explorer', path: '/explorer', icon: Map },
      { label: 'Parcels', path: '/parcels', icon: Landmark },
    ]})
    groups.push({ label: 'Workflow', items: [
      { label: 'Applications', path: '/applications', icon: ClipboardList },
    ]})
    groups.push({ label: 'Administration', items: [
      { label: 'Integrations', path: '/apis', icon: Wifi },
      { label: 'Audit Logs', path: '/audit', icon: Shield },
      { label: 'Users & Roles', path: '/users', icon: UsersIcon },
      { label: 'Settings', path: '/settings', icon: Settings },
    ]})
    groups.push({ label: 'Account', items: [
      { label: 'Profile', path: '/profile', icon: UserIcon },
    ]})
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-navy-950 text-white z-50 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gov-600 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold tracking-tight leading-none">LandStack</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Integrated Land Governance</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {groups.map(group => (
          <div key={group.label}>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{group.label}</p>
            <div className="space-y-0.5 mt-1">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
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
          </div>
        ))}
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
  )
}
