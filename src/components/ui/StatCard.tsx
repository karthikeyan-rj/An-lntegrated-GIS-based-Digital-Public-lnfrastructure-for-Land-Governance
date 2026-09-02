import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  subtitle?: string
  className?: string
  iconColor?: string
  children?: ReactNode
}

export function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', subtitle, className, iconColor = 'text-gov-600' }: StatCardProps) {
  return (
    <div className={cn('card p-5 flex flex-col gap-1', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          {change && (
            <p className={cn('mt-1 text-xs font-medium', {
              'text-emerald-600': changeType === 'up',
              'text-red-600': changeType === 'down',
              'text-slate-500': changeType === 'neutral',
            })}>
              {change}
            </p>
          )}
        </div>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
