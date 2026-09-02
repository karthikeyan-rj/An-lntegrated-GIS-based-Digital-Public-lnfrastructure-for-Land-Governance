import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Bell, ChevronDown, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { searchParcels } from '@/data/parcels'
import { cn } from '@/lib/utils'
import { notifications as mockNotifications } from '@/data/services'

export function Topbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchParcels>>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const unreadCount = mockNotifications.filter(n => !n.read).length

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchResults(searchParcels(searchQuery))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const getPageTitle = () => {
    const map: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/explorer': 'GIS Land Explorer',
      '/parcels': 'Parcels',
      '/land-records': 'Land Records',
      '/registration': 'Registration',
      '/encumbrance': 'Encumbrances',
      '/disputes': 'Disputes',
      '/planning': 'Master Plans',
      '/land-use': 'Land Use & Zoning',
      '/building-permissions': 'Building Permissions',
      '/utilities': 'Utilities',
      '/property-tax': 'Property Tax',
      '/services': 'Citizen Services',
      '/applications': 'Service Requests',
      '/analytics': 'Analytics',
      '/ai-insights': 'AI Insights',
      '/change-detection': 'Change Detection',
      '/departments': 'Department Dashboard',
      '/apis': 'API & Interoperability',
      '/audit': 'Audit Logs',
      '/users': 'Users & Roles',
      '/settings': 'Settings',
      '/technical-standards': 'Technical Standards',
    }
    if (location.pathname.startsWith('/parcel/')) return 'Parcel Profile'
    return map[location.pathname] || 'LandStack'
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-slate-900">{getPageTitle()}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search parcels...</span>
            <kbd className="hidden sm:inline text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono">Ctrl+K</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lift border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map(n => (
                    <div key={n.id} className={cn('px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer', !n.read && 'bg-gov-50/30')}>
                      <p className="text-xs font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-full bg-gov-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="font-medium">{user?.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
          <div ref={searchRef} className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ULPIN, Survey Number, Owner, Address, or Village..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <kbd className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { navigate(`/parcel/${p.id}`); setSearchOpen(false); setSearchQuery('') }}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gov-50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-gov-600">ULPIN</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.ulpin}</p>
                      <p className="text-xs text-slate-500 truncate">{p.ownerName} — {p.village}, {p.district}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{p.area} {p.areaUnit}</span>
                        <span className="text-[10px] text-slate-300">|</span>
                        <span className="text-[10px] text-slate-400 capitalize">{p.landUse}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">No parcels found for "{searchQuery}"</p>
              </div>
            )}
            {searchQuery.length < 2 && (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400">Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
