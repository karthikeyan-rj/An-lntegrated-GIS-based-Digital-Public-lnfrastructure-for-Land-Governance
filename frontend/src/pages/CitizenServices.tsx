import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, ShieldCheck, Search, ClipboardList,
  RefreshCw, Building2, Map, Trees, Receipt, Award, HelpCircle, X
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ServiceItem {
  id: string
  name: string
  description: string
  icon: React.ElementType
  processingTime: string
  requiredDocs: string[]
  route?: string
}

interface ServiceCategory {
  name: string
  color: string
  bgColor: string
  services: ServiceItem[]
}

const categories: ServiceCategory[] = [
  {
    name: 'Land Records',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    services: [
      {
        id: 'ror',
        name: 'View RoR',
        description: 'Access your Record of Rights containing ownership, survey, and land use details.',
        icon: FileText,
        processingTime: 'Instant',
        requiredDocs: ['Aadhaar Card', 'Land Survey Number'],
        route: '/parcels',
      },
      {
        id: 'download-record',
        name: 'Download Land Record',
        description: 'Download certified copies of land records for official use.',
        icon: Download,
        processingTime: '1-2 business days',
        requiredDocs: ['Aadhaar Card', 'Patta Copy', 'Application Form'],
      },
      {
        id: 'ownership-verify',
        name: 'Ownership Verification',
        description: 'Verify ownership details against government land records database.',
        icon: ShieldCheck,
        processingTime: '3-5 business days',
        requiredDocs: ['Aadhaar Card', 'Sale Deed', 'Patta Certificate'],
      },
    ],
  },
  {
    name: 'Transactions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    services: [
      {
        id: 'reg-status',
        name: 'Registration Status',
        description: 'Check the current status of your property registration application.',
        icon: Search,
        processingTime: 'Instant',
        requiredDocs: ['Document Number', 'Application ID'],
        route: '/registration',
      },
      {
        id: 'encumbrance',
        name: 'Encumbrance Certificate',
        description: 'Obtain a certificate showing all registered transactions on a property.',
        icon: ClipboardList,
        processingTime: '5-7 business days',
        requiredDocs: ['Aadhaar Card', 'Sale Deed Copy', 'Property Tax Receipt'],
      },
      {
        id: 'mutation',
        name: 'Mutation',
        description: 'Apply for mutation of land records after inheritance or transfer.',
        icon: RefreshCw,
        processingTime: '15-30 business days',
        requiredDocs: ['Death Certificate', 'Legal Heir Certificate', 'Old Patta', 'Sale Deed'],
      },
    ],
  },
  {
    name: 'Planning',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    services: [
      {
        id: 'building-permit',
        name: 'Building Permission',
        description: 'Apply for construction or renovation building permission from the planning department.',
        icon: Building2,
        processingTime: '20-45 business days',
        requiredDocs: ['Site Plan', 'Building Plan', 'NOC Fire', 'NOC Environment', 'Ownership Proof'],
        route: '/building-permissions',
      },
      {
        id: 'land-use',
        name: 'Land Use Certificate',
        description: 'Obtain a certificate confirming the current land use classification of a parcel.',
        icon: Map,
        processingTime: '7-10 business days',
        requiredDocs: ['Aadhaar Card', 'Patta Copy', 'Survey Map'],
      },
      {
        id: 'zoning',
        name: 'Zoning Information',
        description: 'Get zoning regulations and permitted uses for a specific parcel.',
        icon: Trees,
        processingTime: 'Instant',
        requiredDocs: ['ULPIN or Survey Number'],
      },
    ],
  },
  {
    name: 'Tax',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    services: [
      {
        id: 'property-tax',
        name: 'Property Tax',
        description: 'View and pay property tax dues for your registered parcels.',
        icon: Receipt,
        processingTime: 'Instant',
        requiredDocs: ['Patta Number', 'Property ID'],
      },
      {
        id: 'tax-cert',
        name: 'Tax Certificate',
        description: 'Download a certificate confirming tax payment status for a property.',
        icon: Award,
        processingTime: '1-2 business days',
        requiredDocs: ['Aadhaar Card', 'Property Tax Receipt'],
      },
    ],
  },
]

export default function CitizenServices() {
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  const handleApply = (service: ServiceItem) => {
    if (service.route) {
      navigate(service.route)
    } else {
      setSelectedService(service)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Citizen Service Center</h1>
        <p className="text-sm text-slate-500 mt-1">Access all land governance services from one place</p>
      </div>

      <div className="bg-gradient-to-r from-gov-600 to-gov-700 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">How it works</h2>
            <p className="text-sm text-white/80 mt-1 max-w-2xl">
              Select a service below to begin. Most services require your Aadhaar Card and property documents.
              Track your application status in real-time from the Service Requests page.
            </p>
          </div>
        </div>
      </div>

      {categories.map(category => (
        <div key={category.name}>
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-2 h-2 rounded-full', category.bgColor)} />
            <h2 className="text-lg font-semibold text-slate-900">{category.name}</h2>
            <Badge variant="slate">{category.services.length} services</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.services.map(service => {
              const Icon = service.icon
              return (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', category.bgColor)}>
                        <Icon className={cn('w-5 h-5', category.color)} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{service.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{service.description}</p>
                      </div>
                    </div>
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-medium">Processing time:</span>
                        <span>{service.processingTime}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Required documents:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.requiredDocs.map(doc => (
                            <span key={doc} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" className="w-full" onClick={() => handleApply(service)}>
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Apply: {selectedService.name}</h3>
              <button onClick={() => setSelectedService(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{selectedService.description}</p>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">ULPIN</p>
                <input type="text" placeholder="Enter ULPIN" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Applicant Name</p>
                <input type="text" placeholder="Full name as per Aadhaar" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Required Documents</p>
                {selectedService.requiredDocs.map(doc => (
                  <div key={doc} className="flex items-center gap-2 py-1.5">
                    <div className="w-4 h-4 rounded border border-slate-300" />
                    <span className="text-sm text-slate-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedService(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => setSelectedService(null)}>Submit Application</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
