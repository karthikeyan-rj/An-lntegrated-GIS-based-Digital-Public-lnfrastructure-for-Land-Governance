import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'slate'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
  blue: 'bg-gov-50 text-gov-700 border border-gov-200',
  slate: 'bg-slate-100 text-slate-600 border border-slate-200',
}

export function Badge({ variant = 'slate', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    verified: 'green', paid: 'green', approved: 'green', completed: 'green', registered: 'green', success: 'green', digitally_verified: 'green',
    pending: 'amber', under_review: 'amber', document_verification: 'amber', department_review: 'amber', field_verification: 'amber', investigating: 'amber', requires_update: 'amber',
    rejected: 'red', dispute: 'red', disputed: 'red', active: 'red', encumbered: 'red', mortgaged: 'red', overdue: 'red', failure: 'red', high: 'red',
    none: 'slate', clear: 'green', unverified: 'amber', new: 'blue', submitted: 'blue', info: 'blue', resolved: 'green', dismissed: 'slate',
  }
  const variant = map[status] || 'slate'
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <Badge variant={variant}>{label}</Badge>
}
