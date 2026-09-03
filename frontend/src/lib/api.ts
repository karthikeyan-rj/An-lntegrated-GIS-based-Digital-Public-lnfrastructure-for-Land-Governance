/**
 * LandStack API client.
 * Base URL from VITE_API_URL; falls back to same-origin /api (Vite dev proxy).
 * Reads the JWT from localStorage so protected calls work automatically.
 */

const TOKEN_KEY = 'landstack_token'

function baseUrl(): string {
  return import.meta.env.VITE_API_URL || '/api'
}

function authToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = token === undefined ? authToken() : token
  if (t) headers.Authorization = `Bearer ${t}`

  let response: Response
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    throw new ApiError('Unable to reach the LandStack API. Is the backend running on port 4000?', 0)
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined
  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, response.status)
  }
  return data as T
}

export interface AuthUser { id: string; name: string; email: string; role: string; department: string; isDemo?: boolean }
export interface AuthResponse { token: string; user: AuthUser }

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: payload }),
  me: (token: string) => request<{ user: AuthUser }>('/auth/me', { token }),

  // GIS / Parcels
  parcels: (search?: string) =>
    request<GeoJSON.FeatureCollection>(`/parcels${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  parcelById: (id: string) => request<{ parcel: any; governance: any }>(`/parcels/${id}`),
  parcelGovernance: (id: string) => request<any>(`/parcels/${id}/governance`),
  layers: () => request<any>('/layers'),
  // Administrative boundaries (real Tamil Nadu state/district/taluk geometry)
  geoboundariesIndex: () => request<any>('/geoboundaries'),
  geoboundaries: (kind: 'state' | 'districts' | 'taluks') =>
    request<GeoJSON.FeatureCollection & { source?: string; license?: string }>(`/geoboundaries/${kind}`),

  // Governance records
  records: (resource: string, ulpin?: string) =>
    request<any>(`/${resource}${ulpin ? `?ulpin=${encodeURIComponent(ulpin)}` : ''}`),

  // Applications
  applications: (params?: Record<string, string>) =>
    request<{ applications: any[]; count: number }>(`/applications${qs(params)}`),
  applicationById: (id: string) => request<{ application: any }>(`/applications/${id}`),
  createApplication: (body: any) => request<{ application: any; aiReview: any }>('/applications', { method: 'POST', body }),
  updateApplicationStatus: (id: string, status: string, remarks?: string) =>
    request<{ application: any }>(`/applications/${id}/status`, { method: 'PATCH', body: { status, remarks } }),
  approveApplication: (id: string, remarks?: string) =>
    request<{ application: any }>(`/applications/${id}/approve`, { method: 'POST', body: { remarks } }),
  rejectApplication: (id: string, reason?: string) =>
    request<{ application: any }>(`/applications/${id}/reject`, { method: 'POST', body: { reason } }),
  assignApplication: (id: string, body: any) =>
    request<{ application: any }>(`/applications/${id}/assign`, { method: 'POST', body }),
  aiReviewApplication: (id: string) =>
    request<{ aiReview: any; report: any }>(`/applications/${id}/ai-review`, { method: 'POST' }),

  // Analytics
  dashboard: () => request<any>('/analytics/dashboard'),

  // AI
  aiChat: (message: string, context?: any) =>
    request<any>('/ai/chat', { method: 'POST', body: { message, context } }),
  changeDetection: (body: any) => request<any>('/ai/change-detection', { method: 'POST', body }),

  // System
  notifications: () => request<{ notifications: any[]; unread: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  audit: () => request<{ logs: any[]; count: number }>('/audit'),
  departments: () => request<{ departments: any[] }>('/departments'),
  integrations: () => request<any>('/apis'),
  workflows: () => request<{ workflows: any[] }>('/workflows'),
}

function qs(params?: Record<string, string>): string {
  if (!params) return ''
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export default api
