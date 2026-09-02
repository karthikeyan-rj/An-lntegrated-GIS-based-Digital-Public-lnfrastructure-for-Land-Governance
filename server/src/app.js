import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import parcelRoutes from './routes/parcels.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: corsWhitelist() }))
  app.use(express.json())

  // Simple health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'LandStack API' })
  })

  // Auth (real users, MongoDB)
  app.use('/api/auth', authRoutes)

  // GIS / Parcels
  app.use('/api/parcels', parcelRoutes)

  // Layer catalog
  app.get('/api/layers', (_req, res) => {
    res.json({
      baseLayers: [
        { id: 'osm', label: 'OpenStreetMap' },
        { id: 'satellite', label: 'Satellite', source: 'Esri World Imagery' },
      ],
      governance: [
        { id: 'parcelBoundaries', label: 'Parcel Boundaries', demo: true },
        { id: 'landUse', label: 'Land Use / Zoning' },
        { id: 'buildingPermissions', label: 'Building Permissions' },
        { id: 'restrictions', label: 'Restrictions & Environmental Zones' },
        { id: 'disputes', label: 'Disputes' },
      ],
      infrastructure: [
        { id: 'roads', label: 'Roads' },
        { id: 'utilities', label: 'Utilities' },
        { id: 'publicInfrastructure', label: 'Public Infrastructure' },
      ],
    })
  })

  // 404 for unknown API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API route not found' })
  })

  return app
}

function corsWhitelist() {
  const env = process.env.CORS_ORIGINS || 'http://localhost:5173'
  return env.split(',').map((o) => o.trim()).filter(Boolean)
}
