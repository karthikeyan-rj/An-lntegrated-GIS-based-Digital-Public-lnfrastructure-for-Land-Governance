import { useMemo, useState } from 'react'
import { Users, UserCheck, ShieldCheck, Shield, Search, MoreVertical, UserPlus, Check, X } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { timeAgo } from '@/lib/utils'
import type { UserRole } from '@/types'

const roles: UserRole[] = ['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']

const roleLabels: Record<UserRole, string> = {
  citizen: 'Citizen',
  revenue_officer: 'Revenue Officer',
  registration_officer: 'Registration Officer',
  planning_officer: 'Planning Officer',
  tax_officer: 'Tax Officer',
  administrator: 'Administrator',
}

type Access = 'full' | 'read' | 'none'

const permissions: { name: string; access: Record<UserRole, Access> }[] = [
  { name: 'View Parcels', access: { citizen: 'read', revenue_officer: 'full', registration_officer: 'full', planning_officer: 'read', tax_officer: 'read', administrator: 'full' } },
  { name: 'View RoR', access: { citizen: 'read', revenue_officer: 'full', registration_officer: 'read', planning_officer: 'read', tax_officer: 'read', administrator: 'full' } },
  { name: 'Edit Records', access: { citizen: 'none', revenue_officer: 'full', registration_officer: 'full', planning_officer: 'none', tax_officer: 'none', administrator: 'full' } },
  { name: 'Register Transactions', access: { citizen: 'none', revenue_officer: 'none', registration_officer: 'full', planning_officer: 'none', tax_officer: 'none', administrator: 'full' } },
  { name: 'Approve Building Permits', access: { citizen: 'none', revenue_officer: 'none', registration_officer: 'none', planning_officer: 'full', tax_officer: 'read', administrator: 'full' } },
  { name: 'Manage Tax', access: { citizen: 'read', revenue_officer: 'read', registration_officer: 'none', planning_officer: 'none', tax_officer: 'full', administrator: 'full' } },
  { name: 'View Analytics', access: { citizen: 'none', revenue_officer: 'read', registration_officer: 'read', planning_officer: 'read', tax_officer: 'read', administrator: 'full' } },
  { name: 'Manage Users', access: { citizen: 'none', revenue_officer: 'none', registration_officer: 'none', planning_officer: 'none', tax_officer: 'none', administrator: 'full' } },
  { name: 'System Settings', access: { citizen: 'none', revenue_officer: 'none', registration_officer: 'none', planning_officer: 'none', tax_officer: 'none', administrator: 'full' } },
]

interface UserRow {
  id: string
  name: string
  department: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  lastActive: string
}

const users: UserRow[] = [
  { id: 'u1', name: 'Suresh B', department: 'Revenue Department', role: 'revenue_officer', status: 'active', lastActive: '2025-12-12T10:32:00' },
  { id: 'u2', name: 'Kavitha S', department: 'Revenue Department', role: 'revenue_officer', status: 'active', lastActive: '2025-12-12T10:28:00' },
  { id: 'u3', name: 'Rajesh M', department: 'Town Planning Department', role: 'planning_officer', status: 'active', lastActive: '2025-12-12T10:15:00' },
  { id: 'admin1', name: 'System Admin', department: 'Platform Administration', role: 'administrator', status: 'active', lastActive: '2025-12-12T09:42:00' },
  { id: 'u7', name: 'Priya N', department: 'Registration Department', role: 'registration_officer', status: 'active', lastActive: '2025-12-12T09:00:00' },
  { id: 'u8', name: 'Arun V', department: 'Property Tax Department', role: 'tax_officer', status: 'active', lastActive: '2025-12-11T18:30:00' },
  { id: 'u5', name: 'Amit P', department: 'Town Planning Department', role: 'planning_officer', status: 'suspended', lastActive: '2025-12-12T09:30:00' },
  { id: 'u6', name: 'Lakshmi Devi P', department: 'Citizen Portal', role: 'citizen', status: 'active', lastActive: '2025-12-12T09:15:00' },
  { id: 'u9', name: 'Divya R', department: 'Registration Department', role: 'registration_officer', status: 'inactive', lastActive: '2025-11-28T14:00:00' },
]

function AccessCell({ access }: { access: Access }) {
  if (access === 'full') return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"><Check className="w-3.5 h-3.5" /></span>
  if (access === 'read') return <Badge variant="amber">Read Only</Badge>
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600"><X className="w-3.5 h-3.5" /></span>
}

export default function UsersRoles() {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('')

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(query.toLowerCase()) &&
      (roleFilter === '' || u.role === roleFilter)
    )
  }, [query, roleFilter])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management & Access Control</h1>
          <p className="text-sm text-slate-500 mt-1">Role-based access control (RBAC) across all platform modules</p>
        </div>
        <Button variant="primary"><UserPlus className="w-4 h-4" /> Add User</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="1,247" icon={Users} iconColor="text-blue-600" change="+34 this month" changeType="up" />
        <StatCard title="Active" value={1180} icon={UserCheck} iconColor="text-emerald-600" change="94.6% active rate" changeType="neutral" />
        <StatCard title="Admins" value={5} icon={ShieldCheck} iconColor="text-purple-600" change="2 super admins" changeType="neutral" />
        <StatCard title="Officers" value={89} icon={Shield} iconColor="text-amber-600" change="Across 7 departments" changeType="neutral" />
      </div>

      <Card title="Role Permission Matrix" subtitle="What each role can access across the platform" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Permission</th>
                {roles.map(role => (
                  <th key={role} className="text-center py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{roleLabels[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {permissions.map(perm => (
                <tr key={perm.name} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">{perm.name}</td>
                  {roles.map(role => (
                    <td key={role} className="py-3 px-2 text-center"><AccessCell access={perm.access[role]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Users"
        subtitle={`${filteredUsers.length} users`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-transparent w-40"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as '' | UserRole)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-600"
            >
              <option value="">All roles</option>
              {roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
            </select>
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gov-50 text-gov-700 flex items-center justify-center text-xs font-semibold">
                        {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{user.department}</td>
                  <td className="py-3 px-4"><Badge variant={user.role === 'administrator' ? 'blue' : 'slate'}>{roleLabels[user.role]}</Badge></td>
                  <td className="py-3 px-4">
                    <Badge variant={user.status === 'active' ? 'green' : user.status === 'suspended' ? 'red' : 'amber'}>{user.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">{timeAgo(user.lastActive)}</td>
                  <td className="py-3 px-4">
                    <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
