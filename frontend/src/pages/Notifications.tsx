import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { notifications as mockNotifications } from '@/data/services'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'

export default function Notifications() {
  const { isReal } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await api.notifications()
        if (cancelled) return
        setItems(res.notifications)
        setIsDemo(false)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          setItems(mockNotifications)
          setIsDemo(true)
        } else {
          setItems(mockNotifications)
          setIsDemo(true)
        }
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    if (isReal) {
      try {
        for (const n of items) {
          if (!n.read) await api.markNotificationRead(n._id || n.id)
        }
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Updates on your applications and land-governance activities.</p>
        </div>
        {items.length > 0 && (
          <button onClick={markAllRead} className="inline-flex items-center gap-2 text-sm font-medium text-gov-600 hover:text-gov-700">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {isDemo && (
        <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs">
          Showing local DEMO notifications (backend unavailable).
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="ml-2 text-sm">Loading...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Inbox className="w-10 h-10 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((n: any, idx: number) => {
              const id = n._id || n.id || String(idx)
              const content = n.link ? (
                <Link to={n.link} className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  {buildBody(n, idx)}
                </Link>
              ) : (
                <div className="flex gap-3 px-4 py-3">{buildBody(n, idx)}</div>
              )
              return (
                <div key={id} className={!n.read ? 'bg-gov-50/40' : ''}>
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function buildBody(n: any, idx: number) {
  const severity = n.type === 'error' ? 'red' : n.type === 'warning' ? 'amber' : n.type === 'success' ? 'green' : 'blue'
  return (
    <>
      <div className="w-9 h-9 rounded-lg bg-gov-50 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4 text-gov-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{n.title || n.message?.slice(0, 60)}</p>
          {!n.read && <span className="w-2 h-2 rounded-full bg-gov-500 shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
        <div className="mt-1">
          <StatusBadge status={n.type || (idx % 2 ? 'info' : 'success')} />
        </div>
      </div>
    </>
  )
}
