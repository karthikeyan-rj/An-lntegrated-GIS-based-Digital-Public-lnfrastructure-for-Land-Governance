import { User as Icon, Shield, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/ui/Badge'

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  revenue_officer: 'Revenue Officer',
  registration_officer: 'Registration Officer',
  planning_officer: 'Planning Officer',
  tax_officer: 'Tax Officer',
  administrator: 'Administrator',
}

export default function Profile() {
  const { user, isReal } = useAuth()
  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your account and access information.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 flex items-center gap-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gov-600 text-white flex items-center justify-center text-xl font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.department}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          <Row icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
          <Row icon={<Shield className="w-4 h-4" />} label="Role" valueDisplays={<StatusBadge status={user.role} />} />
          <Row icon={<Icon className="w-4 h-4" />} label="Role Label" value={ROLE_LABELS[user.role] || user.role} />
          <Row icon={<Shield className="w-4 h-4" />} label="Account Type" value={isReal ? 'Real (MongoDB) account' : 'Demo account'} />
        </div>
      </div>

      <div className="px-4 py-3 rounded-lg border border-gov-200 bg-gov-50 text-gov-800 text-sm">
        Your role determines which land-governance actions you can perform. Officers and administrators have elevated access
        through the same parcel-centric workflow.
      </div>
    </div>
  )
}

function Row({ icon, label, value, valueDisplays }: { icon: React.ReactNode; label: string; value?: string; valueDisplays?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-slate-400">{icon}</span>{label}
      </div>
      {valueDisplays ? valueDisplays : <span className="text-sm font-medium text-slate-900">{value}</span>}
    </div>
  )
}
