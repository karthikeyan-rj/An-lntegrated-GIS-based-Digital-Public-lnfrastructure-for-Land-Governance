import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import GISExplorer from '@/pages/GISExplorer'
import ParcelProfile from '@/pages/ParcelProfile'
import Parcels from '@/pages/Parcels'
import LandRecords from '@/pages/LandRecords'
import CitizenServices from '@/pages/CitizenServices'
import Applications from '@/pages/Applications'
import AIInsights from '@/pages/AIInsights'
import ChangeDetection from '@/pages/ChangeDetection'
import Integrations from '@/pages/Integrations'
import AuditLogs from '@/pages/AuditLogs'
import UsersRoles from '@/pages/UsersRoles'
import Settings from '@/pages/Settings'
import Notifications from '@/pages/Notifications'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explorer" element={<GISExplorer />} />
            <Route path="/parcel/:id" element={<ParcelProfile />} />

            {/* Land */}
            <Route path="/parcels" element={<Parcels />} />
            <Route path="/land-records" element={<LandRecords />} />

            {/* Services */}
            <Route path="/services" element={<CitizenServices />} />
            <Route path="/applications" element={<Applications />} />

            {/* Intelligence */}
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/change-detection" element={<ChangeDetection />} />

            {/* Administration */}
            <Route path="/apis" element={<Integrations />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/users" element={<UsersRoles />} />
            <Route path="/settings" element={<Settings />} />

            {/* Personal */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
