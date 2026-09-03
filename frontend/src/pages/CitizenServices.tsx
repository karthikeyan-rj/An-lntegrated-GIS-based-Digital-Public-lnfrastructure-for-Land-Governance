import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  FileText,
  Scroll,
  PenLine,
  Building2,
  ShieldCheck,
  Search,
  Check,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/lib/api'
import { getParcelByULPIN, searchParcels } from '@/data/parcels'
import type { Parcel } from '@/types'

interface Service {
  name: string
  category: string
  description: string
  icon: typeof FileText
}

const services: Service[] = [
  {
    name: 'Mutation Request',
    category: 'Land Records',
    description: 'Request a change in land ownership records due to sale, inheritance, or gift.',
    icon: PenLine,
  },
  {
    name: 'Ownership Verification',
    category: 'Land Records',
    description: 'Verify the current ownership status and title of a land parcel.',
    icon: ShieldCheck,
  },
  {
    name: 'Land Record Correction',
    category: 'Land Records',
    description: 'Correct errors in existing land records such as survey number or area.',
    icon: Scroll,
  },
  {
    name: 'Encumbrance Certificate',
    category: 'Land Records',
    description: 'Obtain a certificate showing all registered transactions on a land parcel.',
    icon: FileText,
  },
  {
    name: 'Building Permission',
    category: 'Planning',
    description: 'Apply for construction or building permission on a land parcel.',
    icon: Building2,
  },
]

export default function CitizenServices() {
  const [searchParams] = useSearchParams()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [parcelSearchQuery, setParcelSearchQuery] = useState('')
  const [showParcelDropdown, setShowParcelDropdown] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const ulpin = searchParams.get('ulpin')
    if (ulpin) {
      const parcel = getParcelByULPIN(ulpin)
      if (parcel) {
        setSelectedParcel(parcel)
        setParcelSearchQuery(ulpin)
      }
    }
  }, [searchParams])

  const parcelResults = useMemo(() => {
    if (!parcelSearchQuery.trim()) return []
    return searchParcels(parcelSearchQuery).slice(0, 6)
  }, [parcelSearchQuery])

  const handleParcelSelect = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel)
    setParcelSearchQuery(parcel.ulpin)
    setShowParcelDropdown(false)
  }, [])

  const handleRequest = useCallback((service: Service) => {
    setSelectedService(service)
    setSubmitSuccess(null)
    setSubmitError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedService || !selectedParcel) return

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await api.createApplication({
        ulpin: selectedParcel.ulpin,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category,
        notes: notes.trim() || undefined,
      })
      setSubmitSuccess(result.application?.id || 'Application submitted')
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Unable to reach the LandStack API. Please try again later.')
      }
    } finally {
      setSubmitting(false)
    }
  }, [selectedService, selectedParcel, notes])

  const resetForm = useCallback(() => {
    setSelectedService(null)
    setSelectedParcel(null)
    setParcelSearchQuery('')
    setNotes('')
    setSubmitSuccess(null)
    setSubmitError(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Citizen Services</h1>
        <p className="text-sm text-slate-500 mt-1">
          Request land-related services online. Select a service and the relevant parcel to begin.
        </p>
      </div>

      {/* Service Catalog */}
      {!selectedService && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.name}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col hover:border-gov-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleRequest(service)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gov-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-400">{service.category}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-4">{service.description}</p>
                <Button variant="secondary" size="sm" className="self-end">
                  Request
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Request Form */}
      {selectedService && (
        <div className="bg-white border border-slate-200 rounded-lg max-w-2xl">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
                <selectedService.icon className="w-5 h-5 text-gov-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedService.name}</p>
                <p className="text-xs text-slate-400">{selectedService.category}</p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Parcel ULPIN Search */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Parcel ULPIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={parcelSearchQuery}
                  onChange={(e) => {
                    setParcelSearchQuery(e.target.value)
                    setSelectedParcel(null)
                    setShowParcelDropdown(true)
                  }}
                  onFocus={() => setShowParcelDropdown(true)}
                  placeholder="Search by ULPIN, owner, village..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500"
                />
                {parcelSearchQuery && !selectedParcel && (
                  <button
                    onClick={() => {
                      setParcelSearchQuery('')
                      setShowParcelDropdown(false)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showParcelDropdown && parcelResults.length > 0 && (
                <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                  {parcelResults.map((parcel) => (
                    <button
                      key={parcel.id}
                      onClick={() => handleParcelSelect(parcel)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <p className="text-xs font-mono text-gov-600">{parcel.ulpin}</p>
                      <p className="text-sm text-slate-900 mt-0.5">{parcel.ownerName}</p>
                      <p className="text-xs text-slate-500">{parcel.village}, {parcel.district}</p>
                    </button>
                  ))}
                </div>
              )}

              {showParcelDropdown && parcelSearchQuery.trim() && parcelResults.length === 0 && !selectedParcel && (
                <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                  <p className="text-xs text-slate-500">No parcels found matching "{parcelSearchQuery}"</p>
                </div>
              )}
            </div>

            {/* Selected Parcel Info */}
            {selectedParcel && (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Selected Parcel</p>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs font-mono font-bold text-gov-700">{selectedParcel.ulpin}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Owner</span>
                    <span className="text-xs font-medium text-slate-900">{selectedParcel.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Village</span>
                    <span className="text-xs font-medium text-slate-900">{selectedParcel.village}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">District</span>
                    <span className="text-xs font-medium text-slate-900">{selectedParcel.district}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Additional Notes <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide any additional details for your request..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500 resize-none"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Success */}
            {submitSuccess && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Application submitted successfully</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Application ID: {submitSuccess}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/applications">
                    <Button variant="primary" size="sm">
                      <FileText className="w-4 h-4" />
                      Track Application
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Submit Another Request
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          {!submitSuccess && (
            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Back to Services
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedParcel || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
