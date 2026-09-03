import { useEffect, useState, type ReactNode } from 'react'
import { Settings as SettingsIcon, Bell, Shield, KeyRound, Monitor, Info, CheckCircle2, Cpu, Check, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'

interface SettingsState {
  platformName: string
  defaultState: string
  defaultLanguage: string
  timezone: string
  emailNotif: boolean
  smsNotif: boolean
  pushNotif: boolean
  sessionTimeout: string
  passwordPolicy: string
  twoFactor: boolean
  rateLimit: string
  apiVersion: string
  webhookUrl: string
  theme: 'light' | 'dark'
  mapDefaultView: string
  itemsPerPage: string
}

const SETTINGS_KEY = 'landstack_settings'

const defaults: SettingsState = {
  platformName: 'LandStack',
  defaultState: 'Tamil Nadu',
  defaultLanguage: 'English',
  timezone: 'IST (UTC+5:30)',
  emailNotif: true,
  smsNotif: true,
  pushNotif: false,
  sessionTimeout: '30 minutes',
  passwordPolicy: 'Standard (8+ chars)',
  twoFactor: true,
  rateLimit: '1,000 req/min',
  apiVersion: 'v2.0 (current)',
  webhookUrl: 'https://landstack.gov.in/webhooks/notify',
  theme: 'light',
  mapDefaultView: 'State Overview',
  itemsPerPage: '25',
}

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaults
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-gov-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

const fieldContainer = 'grid grid-cols-1 gap-4'

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-600 focus:border-transparent'

const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}

export default function Settings() {
  const [s, setS] = useState<SettingsState>(loadSettings)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gemini, setGemini] = useState<{ configured: boolean; model: string; status: string; message: string } | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(true)
  const [geminiError, setGeminiError] = useState<string | null>(null)

  const patch = (p: Partial<SettingsState>) => setS(prev => ({ ...prev, ...p }))

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await api.aiConfig()
        setGemini({
          configured: !!cfg.configured,
          model: cfg.model || 'gemini-2.0-flash',
          status: cfg.status || (cfg.configured ? 'configured' : 'not_configured'),
          message: cfg.message || '',
        })
      } catch {
        setGeminiError('Sign in to view Gemini configuration, or the backend is offline.')
      }
      setGeminiLoading(false)
    }
    load()
  }, [])

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
      setSaving(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 3000)
    }, 150)
  }

  let geminiBody: ReactNode
  if (geminiLoading) {
    geminiBody = <p className="text-sm text-slate-500">Checking Gemini configuration…</p>
  } else if (geminiError) {
    geminiBody = (
      <div className="flex items-center gap-2 text-amber-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" /> {geminiError}
      </div>
    )
  } else if (gemini) {
    geminiBody = (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${gemini.configured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <p className="text-sm font-medium text-slate-900">
            {gemini.configured ? 'Gemini API key configured' : 'Gemini API key not configured'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Provider</p>
            <p className="text-sm font-medium text-slate-900">{gemini.configured ? 'Gemini (Google AI)' : 'Demo fallback (labeled)'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Model</p>
            <p className="text-sm font-medium font-mono text-slate-900">{gemini.model}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">{gemini.message}</p>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">How to activate a real Gemini key</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Create a key at <span className="font-mono">aistudio.google.com</span> (Gemini API).</li>
            <li>Add it to <span className="font-mono">backend/.env</span> as <span className="font-mono">GEMINI_API_KEY=...</span> (optionally <span className="font-mono">GEMINI_MODEL=gemini-2.0-flash</span>).</li>
            <li>Restart the backend (<span className="font-mono">node index.js</span>). The key is never stored in the frontend or committed to git.</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform configuration, preferences, and security policies</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
          <Info className="w-3.5 h-3.5" /> DEMO / PROTOTYPE DATA
        </div>
      </div>

      <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave() }}>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" /> Settings saved to this device.
          </div>
        )}
        <Card title="Platform Settings" subtitle="Core platform identity and regional defaults" action={<SettingsIcon className="w-4 h-4 text-slate-400" />}>
          <div className={fieldContainer}>
            <TextField label="Platform Name" value={s.platformName} onChange={v => patch({ platformName: v })} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label="Default State" value={s.defaultState} options={['Tamil Nadu', 'Chandigarh', 'Karnataka', 'Maharashtra', 'Delhi']} onChange={v => patch({ defaultState: v })} />
              <SelectField label="Default Language" value={s.defaultLanguage} options={['English', 'தமிழ் (Tamil)', 'हिन्दी (Hindi)', 'ಕನ್ನಡ (Kannada)']} onChange={v => patch({ defaultLanguage: v })} />
              <SelectField label="Timezone" value={s.timezone} options={['IST (UTC+5:30)', 'UTC', 'EST (UTC-5)']} onChange={v => patch({ timezone: v })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </Card>

        <Card title="Notification Settings" subtitle="Configure how platform alerts are delivered" action={<Bell className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Email notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Send alerts and service updates via email</p>
              </div>
              <Toggle enabled={s.emailNotif} onChange={v => patch({ emailNotif: v })} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">SMS notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Send status updates via mobile SMS</p>
              </div>
              <Toggle enabled={s.smsNotif} onChange={v => patch({ smsNotif: v })} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Push notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Deliver real-time in-app notifications to officers</p>
              </div>
              <Toggle enabled={s.pushNotif} onChange={v => patch({ pushNotif: v })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </Card>

        <Card title="Security Settings" subtitle="Session, password, and authentication policies" action={<Shield className="w-4 h-4 text-slate-400" />}>
          <div className={fieldContainer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Session Timeout" value={s.sessionTimeout} options={['15 minutes', '30 minutes', '1 hour', '2 hours', 'Never']} onChange={v => patch({ sessionTimeout: v })} />
              <SelectField label="Password Policy" value={s.passwordPolicy} options={['Standard (8+ chars)', 'Strong (12+ chars, symbols)', 'Very Strong (16+ chars, MFA)']} onChange={v => patch({ passwordPolicy: v })} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-500 mt-0.5">Require OTP verification for all privileged accounts</p>
              </div>
              <Toggle enabled={s.twoFactor} onChange={v => patch({ twoFactor: v })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </Card>

        <Card title="API Settings" subtitle="Rate limiting, versioning, and webhook configuration" action={<KeyRound className="w-4 h-4 text-slate-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Rate Limiting</label>
              <select value={s.rateLimit} onChange={e => patch({ rateLimit: e.target.value })} className={inputCls}>
                <option>1,000 req/min</option>
                <option>500 req/min</option>
                <option>100 req/min</option>
                <option>Unlimited (test)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>API Version</label>
              <select value={s.apiVersion} onChange={e => patch({ apiVersion: e.target.value })} className={inputCls}>
                <option>v2.0 (current)</option>
                <option>v1.8 (legacy)</option>
                <option>v3.0 (beta)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Webhook URL</label>
              <input type="url" value={s.webhookUrl} onChange={e => patch({ webhookUrl: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </Card>

        <Card title="Display Settings" subtitle="Interface and map rendering preferences" action={<Monitor className="w-4 h-4 text-slate-400" />}>
          <div className={fieldContainer}>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Theme</p>
                <p className="text-xs text-slate-500 mt-0.5">Choose between light and dark interface</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={s.theme === 'light' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => patch({ theme: 'light' })}
                >
                  Light
                </Button>
                <Button
                  type="button"
                  variant={s.theme === 'dark' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => patch({ theme: 'dark' })}
                >
                  Dark
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Map Default View" value={s.mapDefaultView} options={['State Overview', 'District Overview', 'Taluk Overview', 'Last Viewed Parcel']} onChange={v => patch({ mapDefaultView: v })} />
              <SelectField label="Items Per Page" value={s.itemsPerPage} options={['25', '50', '100']} onChange={v => patch({ itemsPerPage: v })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </Card>

        <Card title="AI / Gemini Configuration" subtitle="Generative AI provider status and setup for AI-powered land governance" action={<Cpu className="w-4 h-4 text-slate-400" />}>
          <div className="rounded-xl border border-slate-100 p-4">
            {geminiBody}
          </div>
        </Card>
      </form>

      <div className="flex justify-center sm:hidden">
        <Badge variant="amber" className="text-xs"><Info className="w-3.5 h-3.5" /> DEMO / PROTOTYPE DATA</Badge>
      </div>
    </div>
  )
}
