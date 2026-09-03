import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import parcelRoutes from './routes/parcels.js'
import { parcelController } from './controllers/parcelController.js'

const parcelControllerLayers = (req, res) => parcelController.getLayers(req, res)
import applicationsRoutes from './routes/applications.js'
import analyticsRoutes from './routes/analytics.js'
import aiRoutes from './routes/ai.js'
import systemRoutes from './routes/system.js'
import makeRecordsRouter from './routes/recordsRouter.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: corsWhitelist() }))
  app.use(express.json({ limit: '2mb' }))

  // Health check includes DB status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LandStack API',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    })
  })

  // Auth
  app.use('/api/auth', authRoutes)

  // GIS / Parcels
  app.use('/api/layers', parcelControllerLayers)
  app.use('/api/parcels', parcelRoutes)

  // Applications (citizen + officer workflow)
  app.use('/api/applications', applicationsRoutes)

  // Governance records — each is a section of the Parcel Profile / Land Records
  app.use('/api/land-records', makeRecordsRouter('land-records', 'landRecord'))
  app.use('/api/registrations', makeRecordsRouter('registrations', 'registration'))
  app.use('/api/encumbrances', makeRecordsRouter('encumbrances', 'encumbrance'))
  app.use('/api/building-permissions', makeRecordsRouter('building-permissions', 'buildingPermission'))
  app.use('/api/land-use', makeRecordsRouter('land-use', 'landUse'))
  app.use('/api/property-tax', makeRecordsRouter('property-tax', 'propertyTax'))
  app.use('/api/utilities', makeRecordsRouter('utilities', 'utility'))
  app.use('/api/restrictions', makeRecordsRouter('restrictions', 'restriction'))
  app.use('/api/disputes', makeRecordsRouter('disputes', 'dispute'))

  // Analytics
  app.use('/api/analytics', analyticsRoutes)

  // AI-assistive services
  app.use('/api/ai', aiRoutes)
  app.use('/api/change-detection', (req, res, next) => {
    // Alias: change-detection is a focused AI service
    if (req.method === 'POST') {
      req.url = '/change-detection'
      return aiRoutes(req, res, next)
    }
    res.status(405).json({ message: 'Method not allowed' })
  })

  // System: notifications, audit, departments, integrations (apis), workflows
  app.use('/api', systemRoutes)

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
