import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import GISExplorer from '@/pages/GISExplorer'
import ParcelProfile from '@/pages/ParcelProfile'
import LandRecords from '@/pages/LandRecords'
import Registration from '@/pages/Registration'
import Encumbrance from '@/pages/Encumbrance'
import Planning from '@/pages/Planning'
import BuildingPermissions from '@/pages/BuildingPermissions'
import LandUse from '@/pages/LandUse'
import PropertyTax from '@/pages/PropertyTax'
import UtilitiesPage from '@/pages/Utilities'
import Restrictions from '@/pages/Restrictions'
import Disputes from '@/pages/Disputes'
import CitizenServices from '@/pages/CitizenServices'
import ServiceRequests from '@/pages/ServiceRequests'
import Analytics from '@/pages/Analytics'
import AIInsights from '@/pages/AIInsights'
import ChangeDetection from '@/pages/ChangeDetection'
import DepartmentDashboard from '@/pages/DepartmentDashboard'
import APICenter from '@/pages/APICenter'
import AuditLogs from '@/pages/AuditLogs'
import UsersRoles from '@/pages/UsersRoles'
import TechnicalStandards from '@/pages/TechnicalStandards'
import Settings from '@/pages/Settings'

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
            <Route path="/parcels" element={<GISExplorer />} />
            <Route path="/land-records" element={<LandRecords />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/encumbrance" element={<Encumbrance />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/building-permissions" element={<BuildingPermissions />} />
            <Route path="/land-use" element={<LandUse />} />
            <Route path="/property-tax" element={<PropertyTax />} />
            <Route path="/utilities" element={<UtilitiesPage />} />
            <Route path="/restrictions" element={<Restrictions />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/services" element={<CitizenServices />} />
            <Route path="/applications" element={<ServiceRequests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/change-detection" element={<ChangeDetection />} />
            <Route path="/departments" element={<DepartmentDashboard />} />
            <Route path="/apis" element={<APICenter />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/users" element={<UsersRoles />} />
            <Route path="/technical-standards" element={<TechnicalStandards />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
