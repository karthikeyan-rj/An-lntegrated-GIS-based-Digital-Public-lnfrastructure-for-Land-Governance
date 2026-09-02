import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, KeyRound, Monitor, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select className={inputCls}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextField({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="text" defaultValue={defaultValue} className={inputCls} />
    </div>
  )
}

export default function Settings() {
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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

      <form className="space-y-6" onSubmit={e => e.preventDefault()}>
        <Card title="Platform Settings" subtitle="Core platform identity and regional defaults" action={<SettingsIcon className="w-4 h-4 text-slate-400" />}>
          <div className={fieldContainer}>
            <TextField label="Platform Name" defaultValue="LandStack" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label="Default State" options={['Tamil Nadu', 'Chandigarh', 'Karnataka', 'Maharashtra', 'Delhi']} />
              <SelectField label="Default Language" options={['English', 'தமிழ் (Tamil)', 'हिन्दी (Hindi)', 'ಕನ್ನಡ (Kannada)']} />
              <SelectField label="Timezone" options={['IST (UTC+5:30)', 'UTC', 'EST (UTC-5)']} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save Changes</Button></div>
        </Card>

        <Card title="Notification Settings" subtitle="Configure how platform alerts are delivered" action={<Bell className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Email notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Send alerts and service updates via email</p>
              </div>
              <Toggle enabled={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">SMS notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Send status updates via mobile SMS</p>
              </div>
              <Toggle enabled={smsNotif} onChange={setSmsNotif} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Push notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Deliver real-time in-app notifications to officers</p>
              </div>
              <Toggle enabled={pushNotif} onChange={setPushNotif} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save Changes</Button></div>
        </Card>

        <Card title="Security Settings" subtitle="Session, password, and authentication policies" action={<Shield className="w-4 h-4 text-slate-400" />}>
          <div className={fieldContainer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Session Timeout" options={['15 minutes', '30 minutes', '1 hour', '2 hours', 'Never']} />
              <SelectField label="Password Policy" options={['Standard (8+ chars)', 'Strong (12+ chars, symbols)', 'Very Strong (16+ chars, MFA)']} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-500 mt-0.5">Require OTP verification for all privileged accounts</p>
              </div>
              <Toggle enabled={twoFactor} onChange={setTwoFactor} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save Changes</Button></div>
        </Card>

        <Card title="API Settings" subtitle="Rate limiting, versioning, and webhook configuration" action={<KeyRound className="w-4 h-4 text-slate-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Rate Limiting</label>
              <select className={inputCls}>
                <option>1,000 req/min</option>
                <option>500 req/min</option>
                <option>100 req/min</option>
                <option>Unlimited (test)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>API Version</label>
              <select className={inputCls}>
                <option>v2.0 (current)</option>
                <option>v1.8 (legacy)</option>
                <option>v3.0 (beta)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Webhook URL</label>
              <input type="url" defaultValue="https://landstack.gov.in/webhooks/notify" className={inputCls} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save Changes</Button></div>
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
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Map Default View" options={['State Overview', 'District Overview', 'Taluk Overview', 'Last Viewed Parcel']} />
              <SelectField label="Items Per Page" options={['25', '50', '100']} />
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit">Save Changes</Button></div>
        </Card>
      </form>

      <div className="flex justify-center sm:hidden">
        <Badge variant="amber" className="text-xs"><Info className="w-3.5 h-3.5" /> DEMO / PROTOTYPE DATA</Badge>
      </div>
    </div>
  )
}
