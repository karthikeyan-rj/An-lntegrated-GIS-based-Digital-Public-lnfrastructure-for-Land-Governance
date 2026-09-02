import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Workflow, Mail, Lock, User, Shield, Building2, Cpu, Zap } from 'lucide-react'
import type { UserRole } from '@/types'

const TABS = [
  { key: 'citizen', label: 'Citizen' },
  { key: 'official', label: 'Government Official' },
  { key: 'admin', label: 'Administrator' },
] as const

const DEMO_ROLES: { label: string; role: UserRole; description: string }[] = [
  { label: 'Citizen', role: 'citizen', description: 'Access land records & services' },
  { label: 'Revenue Officer', role: 'revenue_officer', description: 'Manage revenue & land records' },
  { label: 'Registration Officer', role: 'registration_officer', description: 'Handle registrations & deeds' },
  { label: 'Planning Officer', role: 'planning_officer', description: 'Urban planning & zoning' },
  { label: 'Administrator', role: 'administrator', description: 'Full platform administration' },
]

const FEATURES = [
  { icon: Shield, text: 'Secure parcel-centric identity with ULPIN' },
  { icon: Zap, text: 'Real-time inter-department data sync' },
  { icon: Cpu, text: 'AI-powered verification & analytics' },
  { icon: Building2, text: 'Integrated multi-department workflows' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('citizen')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleDemoLogin = (role: UserRole) => {
    login(role)
    navigate('/dashboard')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'citizen') {
      handleDemoLogin('citizen')
    } else if (activeTab === 'official') {
      handleDemoLogin('revenue_officer')
    } else {
      handleDemoLogin('administrator')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gov-500 flex items-center justify-center shadow-lg">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">LandStack</span>
          </div>
          <p className="text-navy-300 text-sm">Integrated Land Governance Platform</p>
        </div>

        <div className="relative z-10 space-y-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <div key={feat.text} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-gov-400" />
                </div>
                <p className="text-navy-200 text-sm leading-relaxed">{feat.text}</p>
              </div>
            )
          })}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            DEMO / PROTOTYPE DATA
          </div>
          <span className="text-navy-500 text-xs">Problem Statement 26014</span>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gov-500 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LandStack</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to access the land governance platform</p>

          {/* Tab Selector */}
          <div className="mt-6 flex rounded-lg bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Mobile</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>

            <Button type="button" variant="secondary" className="w-full">
              Login with Government ID
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button className="text-gov-600 font-semibold hover:underline">
              Create Citizen Account
            </button>
          </p>

          {/* Demo Login Section */}
          <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gov-600" />
              <h3 className="text-sm font-bold text-slate-900">Quick Demo Access</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Click any role to instantly log in with demo credentials
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ROLES.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo.role)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white text-left transition-all duration-150 hover:border-gov-300 hover:bg-gov-50 hover:shadow-sm group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gov-100 transition-colors">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-gov-600">
                      {demo.label.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{demo.label}</p>
                    <p className="text-xs text-slate-400 truncate">{demo.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
