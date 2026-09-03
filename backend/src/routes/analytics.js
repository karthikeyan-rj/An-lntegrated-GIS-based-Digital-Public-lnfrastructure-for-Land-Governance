import { Router } from 'express'
import { analyticsController } from '../controllers/analyticsController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard', protect, analyticsController.dashboard)
router.get('/parcels-by-landuse', protect, analyticsController.parcelsByLandUse)

export default router
