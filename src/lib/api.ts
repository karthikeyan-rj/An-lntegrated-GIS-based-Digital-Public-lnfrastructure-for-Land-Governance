/**
 * Lightweight API client for the LandStack backend (server/, Express + MongoDB).
 * All calls go through the Vite dev proxy `/api` → http://localhost:4000 in dev,
 * or a same-origin `/api` in production.
 */
const BASE = '/api'

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    // Network failure (backend not running / proxy unreachable).
    throw new ApiError(
      'Unable to reach the LandStack API server. Is the backend running on port 4000?',
      0
    )
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, response.status)
  }
  return data as T
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  isDemo?: boolean
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: payload }),
  me: (token: string) => request<{ user: AuthUser }>('/auth/me', { token }),

  // GIS / Parcels
  parcels: () => request<GeoJSON.FeatureCollection>('/parcels'),
  parcelById: (id: string) => request<{ parcel: any; governance: any }>(`/parcels/${id}`),
  parcelGovernance: (id: string) => request<any>(`/parcels/${id}/governance`),
  layers: () => request<any>('/layers'),
}

export default api
