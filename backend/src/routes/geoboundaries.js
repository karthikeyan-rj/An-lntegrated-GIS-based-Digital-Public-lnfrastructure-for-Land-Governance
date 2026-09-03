import { Router } from 'express'
import { geoboundariesController } from '../controllers/geoboundariesController.js'

const router = Router()

// GET /api/geoboundaries — list available admin boundary layers
router.get('/', geoboundariesController.geoboundariesIndex)
// GET /api/geoboundaries/:kind — GeoJSON (state | districts | taluks)
router.get('/:kind', geoboundariesController.getBoundary)

export default router
